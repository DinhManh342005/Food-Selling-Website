// Script xử lý Trang theo dõi đơn hàng (tracking.html)
document.addEventListener("DOMContentLoaded", () => {
  
  // Elements
  const searchForm = document.getElementById("tracking-search-form");
  const inputEl = document.getElementById("order-id-input");
  
  // Initialize
  bindTrackingSearch();

  // 1. Tự động kiểm tra nếu có mã đơn hàng truyền trên URL
  const urlOrderCode = UTILS.getQueryParam("orderCode");
  if (urlOrderCode && inputEl) {
    inputEl.value = urlOrderCode.toUpperCase();
    findAndRenderOrder(urlOrderCode.toUpperCase());
  }

  function bindTrackingSearch() {
    if (searchForm && inputEl) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const code = inputEl.value.trim().toUpperCase();
        if (code) {
          // Update URL without reloading
          const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?orderCode=${encodeURIComponent(code)}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
          
          findAndRenderOrder(code);
        }
      });
    }
  }

  async function findAndRenderOrder(orderCode) {
    const emptyState = document.getElementById("tracking-empty");
    const resultCard = document.getElementById("tracking-result-card");
    
    if (!emptyState || !resultCard) return;

    const order = await findOrder(orderCode);

    if (!order) {
      // Not found
      emptyState.classList.remove("hidden");
      resultCard.classList.add("hidden");
    } else {
      // Found
      emptyState.classList.add("hidden");
      resultCard.classList.remove("hidden");
      
      renderOrderTracking(order);
      renderOrderTimeline(order.status, order.createdAt);
    }
  }

  /**
   * Tìm đơn hàng: ưu tiên API nếu đã login, fallback localStorage
   */
  async function findOrder(orderCode) {
    const isLoggedIn = !!Storage.getToken();

    // Trích xuất orderId số từ orderCode (vd: "ORD-123" → 123)
    const numericId = orderCode.replace(/^ORD-/i, "");

    if (isLoggedIn) {
      try {
        // Thử lấy theo ID từ API
        if (!isNaN(numericId)) {
          const order = await OrderApi.getById(numericId);
          if (order) {
            return normalizeApiOrder(order, orderCode);
          }
        }

        // Nếu không tìm được theo ID, lấy tất cả orders và tìm
        const allOrders = await OrderApi.getHistory();
        const found = (allOrders || []).find(o => String(o.id) === String(numericId));
        if (found) {
          return normalizeApiOrder(found, orderCode);
        }
      } catch (e) {
        console.warn("Không thể lấy đơn hàng từ API, thử localStorage:", e);
      }
    }

    // Fallback: tìm trong localStorage (cho guest hoặc khi API lỗi)
    return findOrderFromLocalStorage(orderCode);
  }

  /**
   * Chuẩn hóa OrderResponseDTO từ BE sang format tracking page cần
   * BE OrderResponseDTO: { id, orderDate, totalAmount, status, receiverName, 
   *   receiverPhone, receiverAddress, note, orderItems[] }
   */
  function normalizeApiOrder(order, orderCode) {
    return {
      orderCode: orderCode,
      status: String(order.status || "pending").toLowerCase(),
      createdAt: order.orderDate || new Date().toISOString(),
      customerInfo: {
        fullName: order.receiverName || "--",
        phone: order.receiverPhone || "--",
        address: order.receiverAddress || "--",
      },
      paymentMethod: "COD",
      total: Number(order.totalAmount || 0),
      items: (order.orderItems || []).map(item => ({
        productId: item.productId,
        name: item.productName || "Sản phẩm",
        imageUrl: item.productImageUrl,
        quantity: Number(item.quantity || 0),
        price: Number(item.productPrice || 0)
      }))
    };
  }

  function findOrderFromLocalStorage(orderCode) {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    return orders.find(o => o.orderCode === orderCode);
  }

  function renderOrderTracking(order) {
    // Basic Info
    document.getElementById("result-order-id").textContent = order.orderCode;
    
    // Status Badge – khớp BE OrderStatus enum (lowercase)
    const badgeEl = document.getElementById("result-status-badge");
    badgeEl.className = "status-badge"; // Reset classes
    
    let statusText = "ĐANG XỬ LÝ";
    const statusMap = {
      "pending": { text: "CHỜ XÁC NHẬN", class: "pending" },
      "confirmed": { text: "ĐÃ XÁC NHẬN", class: "confirmed" },
      "delivering": { text: "ĐANG GIAO HÀNG", class: "delivering" },
      "completed": { text: "ĐÃ GIAO HÀNG", class: "completed" },
      "cancelled": { text: "ĐÃ HỦY", class: "cancelled" }
    };

    const normalizedStatus = String(order.status || "pending").toLowerCase();

    if (statusMap[normalizedStatus]) {
      statusText = statusMap[normalizedStatus].text;
      badgeEl.classList.add(statusMap[normalizedStatus].class);
    } else {
      badgeEl.classList.add("pending");
    }
    badgeEl.textContent = statusText;

    // Date
    document.getElementById("result-date").textContent = UTILS.formatDate(order.createdAt, "DD/MM/YYYY HH:mm");

    // Customer
    const info = order.customerInfo || {};
    document.getElementById("result-customer").textContent = info.fullName || "--";
    document.getElementById("result-phone").textContent = info.phone || "--";
    document.getElementById("result-address").textContent = info.address || "--";

    // Payment Method
    const pmMap = {
      "COD": "Thanh toán khi nhận hàng",
      "BANK": "Chuyển khoản ngân hàng",
      "WALLET": "Ví điện tử"
    };
    document.getElementById("result-payment").textContent = pmMap[order.paymentMethod] || order.paymentMethod;

    // Total
    document.getElementById("result-total").textContent = UTILS.formatCurrency(order.total);

    // Items
    const itemsTbody = document.getElementById("result-items");
    let itemsHtml = "";
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        itemsHtml += `
          <tr class="border-b border-slate-50 text-sm">
            <td class="py-3 px-2">
              <div class="flex items-center gap-3">
                <img src="${UTILS.getImageUrl(item.imageUrl)}" alt="${item.name}" class="w-10 h-10 object-cover rounded border border-slate-200" onerror="${UTILS.imageFallbackAttr()}">
                <span class="font-medium text-slate-800">${item.name}</span>
              </div>
            </td>
            <td class="py-3 px-2 text-center text-slate-600">${item.quantity}</td>
            <td class="py-3 px-2 text-right text-slate-600">${UTILS.formatCurrency(item.price)}</td>
            <td class="py-3 px-2 text-right font-medium text-slate-800">${UTILS.formatCurrency(item.price * item.quantity)}</td>
          </tr>
        `;
      });
    } else {
      itemsHtml = `<tr><td colspan="4" class="py-4 text-center text-slate-500">Không có sản phẩm nào.</td></tr>`;
    }
    itemsTbody.innerHTML = itemsHtml;
  }

  /**
   * Timeline steps khớp BE OrderStatus enum (4 bước):
   * pending → confirmed → delivering → completed
   */
  function renderOrderTimeline(currentStatus, createdAt) {
    const container = document.querySelector(".tracking-timeline");
    if (!container) return;

    const normalizedStatus = String(currentStatus || "pending").toLowerCase();

    if (normalizedStatus === "cancelled") {
      container.innerHTML = `
        <div class="tracking-step cancelled">
          <div class="tracking-icon">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-800">Đơn hàng đã hủy</h4>
            <p class="text-xs text-slate-500 mt-1">Đơn hàng của bạn đã bị hủy và sẽ không được giao.</p>
          </div>
        </div>
      `;
      return;
    }

    // 4 bước khớp BE OrderStatus: pending → confirmed → delivering → completed
    const stepsData = [
      { id: "pending", title: "Đã đặt hàng", desc: "Đơn hàng đã được tiếp nhận", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
      { id: "confirmed", title: "Đã xác nhận", desc: "Cửa hàng đã xác nhận đơn hàng", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
      { id: "delivering", title: "Đang giao hàng", desc: "Đơn vị vận chuyển đang giao", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
      { id: "completed", title: "Hoàn thành", desc: "Đã giao thành công", icon: "M5 13l4 4L19 7" }
    ];

    const statusOrder = ["pending", "confirmed", "delivering", "completed"];
    const currentIndex = statusOrder.indexOf(normalizedStatus);
    
    let html = "";
    
    stepsData.forEach((step, index) => {
      let stateClass = "";
      if (index < currentIndex) {
        stateClass = "completed"; // Past
      } else if (index === currentIndex) {
        stateClass = "current"; // Active
      } else {
        stateClass = "upcoming"; // Future
      }

      let timeText = "";
      if (index === 0 && createdAt) {
        const d = new Date(createdAt);
        timeText = d.toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}) + " " + d.toLocaleDateString("vi-VN");
      } else if (index <= currentIndex && createdAt) {
        const d = new Date(createdAt);
        d.setHours(d.getHours() + index * 2);
        timeText = d.toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}) + " " + d.toLocaleDateString("vi-VN");
      }

      html += `
        <div class="tracking-step ${stateClass}">
          <div class="tracking-icon">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${step.icon}"></path></svg>
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-800">${step.title}</h4>
            <p class="text-xs text-slate-500 mt-1">${step.desc}</p>
            ${timeText ? `<p class="text-[10px] text-slate-400 mt-1 font-medium">${timeText}</p>` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }
});
