// Script xử lý Trang cá nhân (profile.html)
document.addEventListener("DOMContentLoaded", async () => {

  // 1. Kiểm tra đăng nhập – sửa: dùng Storage.getToken() thay vì getAccessToken()
  const currentUser = Storage.getCurrentUser();
  const token = Storage.getToken();

  if (!currentUser || !token) {
    UTILS.showToast("Bạn cần đăng nhập để truy cập trang này.", "warning");
    setTimeout(() => {
      window.location.href = "auth.html"; // Sửa: đúng URL auth page
    }, 1500);
    return;
  }

  // Hiển thị nội dung khi đã pass check
  const mainContainer = document.getElementById("profile-main-container");
  if (mainContainer) mainContainer.classList.remove("hidden");

  // Initialize
  initProfile(currentUser);
  initTabs();
  initForms(currentUser);

  // Check URL parameter for auto-switching tabs
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  if (tabParam) {
    const tabBtn = document.querySelector(`.profile-sidebar-item[data-target="tab-${tabParam}"]`);
    if (tabBtn) {
      tabBtn.click();
    }
  }

  // --- Functions ---

  function initProfile(user) {
    // Cập nhật thông tin sidebar
    const fullnameEl = document.getElementById("sidebar-fullname");
    const emailEl = document.getElementById("sidebar-email");
    const avatarEl = document.getElementById("sidebar-avatar");

    if (fullnameEl) fullnameEl.textContent = user.fullName || "Người dùng";
    if (emailEl) emailEl.textContent = user.email || "";
    if (avatarEl && user.fullName) {
      avatarEl.textContent = user.fullName.charAt(0).toUpperCase();
    }

    // Điền form thông tin cá nhân
    const usernameInput = document.getElementById("info-username");
    const fullNameInput = document.getElementById("info-fullName");
    const emailInput = document.getElementById("info-email");
    const phoneInput = document.getElementById("info-phone");

    if (usernameInput) usernameInput.value = user.username || "";
    if (fullNameInput) fullNameInput.value = user.fullName || "";
    if (emailInput) emailInput.value = user.email || "";
    if (phoneInput) phoneInput.value = user.phone || "";

    // Điền form địa chỉ nếu có
    const addr = JSON.parse(localStorage.getItem("userAddress"));
    if (addr) {
      const addrProvince = document.getElementById("addr-province");
      const addrDistrict = document.getElementById("addr-district");
      const addrWard = document.getElementById("addr-ward");
      const addrDetail = document.getElementById("addr-detail");
      if (addrProvince) addrProvince.value = addr.province || "";
      if (addrDistrict) addrDistrict.value = addr.district || "";
      if (addrWard) addrWard.value = addr.ward || "";
      if (addrDetail) addrDetail.value = addr.addressDetail || "";
    }

    // Render orders – dùng API khi đã login
    renderUserOrders();
  }

  function initTabs() {
    const navButtons = document.querySelectorAll(".profile-sidebar-item[data-target]");
    const tabContents = document.querySelectorAll(".profile-tab-content");

    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        // Remove active class from all buttons
        navButtons.forEach(b => b.classList.remove("active"));
        // Add active class to clicked
        btn.classList.add("active");

        // Hide all contents
        tabContents.forEach(content => {
          content.classList.remove("block");
          content.classList.add("hidden");
        });

        // Show target content
        const targetId = btn.getAttribute("data-target");
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.classList.remove("hidden");
          targetContent.classList.add("block");
        }
      });
    });

    // Logout
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        Auth.logout();
      });
    }
  }

  function initForms(user) {
    // 1. Form thông tin cá nhân
    const infoForm = document.getElementById("profile-info-form");
    if (infoForm) {
      infoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const fullNameInput = document.getElementById("info-fullName");
        const emailInput = document.getElementById("info-email");
        const phoneInput = document.getElementById("info-phone");

        // Cập nhật user data
        if (fullNameInput) user.fullName = fullNameInput.value.trim();
        if (emailInput) user.email = emailInput.value.trim();
        if (phoneInput) user.phone = phoneInput.value.trim();

        Storage.saveCurrentUser(user);
        
        // Cập nhật sidebar
        const sidebarFullname = document.getElementById("sidebar-fullname");
        const sidebarEmail = document.getElementById("sidebar-email");
        const sidebarAvatar = document.getElementById("sidebar-avatar");

        if (sidebarFullname) sidebarFullname.textContent = user.fullName;
        if (sidebarEmail) sidebarEmail.textContent = user.email;
        if (sidebarAvatar && user.fullName) sidebarAvatar.textContent = user.fullName.charAt(0).toUpperCase();

        UTILS.showToast("Cập nhật thông tin thành công.", "success");
      });
    }

    // 2. Form địa chỉ
    const addrForm = document.getElementById("profile-address-form");
    if (addrForm) {
      addrForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const addressData = {
          province: (document.getElementById("addr-province")?.value || "").trim(),
          district: (document.getElementById("addr-district")?.value || "").trim(),
          ward: (document.getElementById("addr-ward")?.value || "").trim(),
          addressDetail: (document.getElementById("addr-detail")?.value || "").trim()
        };
        localStorage.setItem("userAddress", JSON.stringify(addressData));
        UTILS.showToast("Cập nhật địa chỉ nhận hàng thành công.", "success");
      });
    }

    // 3. Form đổi mật khẩu
    const passForm = document.getElementById("profile-password-form");
    if (passForm) {
      passForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputs = passForm.querySelectorAll("input[type='password']");
        const newPass = inputs[1].value;
        const confirmPass = inputs[2].value;

        if (newPass !== confirmPass) {
          UTILS.showToast("Mật khẩu mới không khớp.", "error");
          return;
        }

        UTILS.showToast("Chức năng sẽ hoạt động sau khi kết nối backend.", "info");
        passForm.reset();
      });
    }
  }

  /**
   * Render lịch sử đơn hàng – dùng OrderApi khi đã login
   */
  async function renderUserOrders() {
    const ordersListContainer = document.getElementById("orders-list-container");
    const emptyState = document.getElementById("orders-empty-state");
    
    if (!ordersListContainer || !emptyState) return;

    let userOrders = [];

    try {
      // Gọi API lấy lịch sử đơn hàng của user đang login
      const apiOrders = await OrderApi.getHistory();
      userOrders = (apiOrders || []).map(o => normalizeApiOrder(o));
    } catch (e) {
      console.warn("Không thể lấy orders từ API:", e);
      // Fallback: đọc từ localStorage
      const localOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      const user = Storage.getCurrentUser();
      if (user) {
        userOrders = localOrders.filter(o => 
          o.customerInfo && 
          (o.customerInfo.email === user.email || o.customerInfo.phone === user.phone)
        );
      }
    }

    // Sắp xếp mới nhất lên đầu
    userOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (userOrders.length === 0) {
      ordersListContainer.classList.add("hidden");
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    ordersListContainer.classList.remove("hidden");

    // Status map khớp BE OrderStatus (lowercase)
    const statusMap = {
      "pending": { text: "CHỜ XÁC NHẬN", class: "pending" },
      "confirmed": { text: "ĐÃ XÁC NHẬN", class: "confirmed" },
      "delivering": { text: "ĐANG GIAO HÀNG", class: "delivering" },
      "completed": { text: "ĐÃ GIAO HÀNG", class: "completed" },
      "cancelled": { text: "ĐÃ HỦY", class: "cancelled" }
    };

    let html = "";
    userOrders.forEach(order => {
      const d = new Date(order.createdAt);
      const dateStr = d.toLocaleDateString("vi-VN");
      const st = statusMap[order.status] || { text: order.status, class: "pending" };

      // Tạo chuỗi tên sản phẩm rút gọn
      const itemsPreview = (order.items || []).map(i => `${i.name} (x${i.quantity})`).join(", ");
      const orderId = order.orderId || order.orderCode || order.id;

      html += `
        <div class="border border-slate-200 rounded-xl overflow-hidden hover:border-brand-300 transition-colors">
          <!-- Order Header -->
          <div class="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
            <div>
              <span class="text-xs font-bold text-slate-500 uppercase">Mã đơn: #${orderId}</span>
              <p class="text-sm font-semibold text-slate-800 mt-1">Đặt ngày ${dateStr}</p>
            </div>
            <div class="status-badge ${st.class}">
              ${st.text}
            </div>
          </div>
          
          <!-- Order Body -->
          <div class="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div class="flex-grow">
              <p class="text-sm text-slate-600 line-clamp-2 mb-2">${itemsPreview || "Không có chi tiết sản phẩm"}</p>
              <div class="flex items-baseline gap-2">
                <span class="text-xs text-slate-500">Tổng thanh toán:</span>
                <span class="font-bold text-brand-600 text-lg">${UTILS.formatCurrency(order.total)}</span>
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0">
              <button data-order-id="${order.id}" class="btn-view-order btn btn-primary flex-1 sm:flex-none text-center px-4 py-2 text-sm font-semibold w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white">Chi tiết</button>
            </div>
          </div>
        </div>
      `;
    });

    ordersListContainer.innerHTML = html;

    // Gắn event cho các nút Chi tiết
    ordersListContainer.querySelectorAll(".btn-view-order").forEach(btn => {
      btn.addEventListener("click", () => openOrderDetailsModal(btn.dataset.orderId));
    });
  }

  // ===== XỬ LÝ MODAL CHI TIẾT ĐƠN HÀNG =====
  const orderModal = document.getElementById("order-detail-modal");
  const btnCloseModal1 = document.getElementById("btn-close-order-modal");
  const btnCloseModal2 = document.getElementById("btn-close-order-footer");

  function closeOrderDetailsModal() {
    if (orderModal) orderModal.classList.add("hidden");
    if (orderModal) orderModal.classList.remove("flex");
  }

  if (btnCloseModal1) btnCloseModal1.addEventListener("click", closeOrderDetailsModal);
  if (btnCloseModal2) btnCloseModal2.addEventListener("click", closeOrderDetailsModal);
  if (orderModal) {
    orderModal.addEventListener("click", (e) => {
      if (e.target === orderModal) closeOrderDetailsModal();
    });
  }

  async function openOrderDetailsModal(orderId) {
    try {
      // 1. Gọi API lấy chi tiết đơn hàng
      const order = await OrderApi.getById(orderId);
      if (!order) {
        UTILS.showToast("Không tìm thấy thông tin đơn hàng.", "error");
        return;
      }

      // 2. Điền thông tin vào Modal
      document.getElementById("modal-order-id").textContent = `#ORD-${order.id}`;
      
      // Ngày đặt
      const d = new Date(order.orderDate);
      document.getElementById("modal-order-date").textContent = 
        d.toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}) + " " + d.toLocaleDateString("vi-VN");

      // Trạng thái
      const statusMap = {
        "pending": { text: "CHỜ XÁC NHẬN", class: "pending" },
        "confirmed": { text: "ĐÃ XÁC NHẬN", class: "confirmed" },
        "delivering": { text: "ĐANG GIAO HÀNG", class: "delivering" },
        "completed": { text: "ĐÃ GIAO HÀNG", class: "completed" },
        "cancelled": { text: "ĐÃ HỦY", class: "cancelled" }
      };
      const st = statusMap[String(order.status).toLowerCase()] || { text: order.status, class: "pending" };
      const statusEl = document.getElementById("modal-order-status");
      statusEl.className = `status-badge ${st.class}`;
      statusEl.textContent = st.text;

      // Thông tin giao hàng
      document.getElementById("modal-receiver-name").textContent = order.receiverName || "--";
      document.getElementById("modal-receiver-phone").textContent = order.receiverPhone || "--";
      document.getElementById("modal-receiver-address").textContent = order.receiverAddress || "--";
      document.getElementById("modal-order-note").textContent = order.note || "Không có ghi chú";

      // Sản phẩm
      const itemsTbody = document.getElementById("modal-order-items");
      let itemsHtml = "";
      let subtotal = 0;
      
      if (order.orderItems && order.orderItems.length > 0) {
        order.orderItems.forEach(item => {
          const itemTotal = item.productPrice * item.quantity;
          subtotal += itemTotal;
          itemsHtml += `
            <tr class="border-b border-slate-50 text-sm">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <img src="${UTILS.getImageUrl(item.productImageUrl)}" alt="${item.productName}" class="w-10 h-10 object-cover rounded border border-slate-200" onerror="${UTILS.imageFallbackAttr()}">
                  <span class="font-medium text-slate-800">${item.productName}</span>
                </div>
              </td>
              <td class="py-3 px-4 text-center text-slate-600">${item.quantity}</td>
              <td class="py-3 px-4 text-right text-slate-600">${UTILS.formatCurrency(item.productPrice)}</td>
              <td class="py-3 px-4 text-right font-medium text-slate-800">${UTILS.formatCurrency(itemTotal)}</td>
            </tr>
          `;
        });
      } else {
        itemsHtml = `<tr><td colspan="4" class="py-4 text-center text-slate-500">Không có sản phẩm nào.</td></tr>`;
      }
      itemsTbody.innerHTML = itemsHtml;

      // Tổng tiền
      const total = Number(order.totalAmount || 0);
      const shipping = Math.max(total - subtotal, 0); // Tạm tính phí vận chuyển
      
      document.getElementById("modal-subtotal").textContent = UTILS.formatCurrency(subtotal);
      document.getElementById("modal-shipping").textContent = UTILS.formatCurrency(shipping);
      document.getElementById("modal-total").textContent = UTILS.formatCurrency(total);

      // 3. Hiển thị Modal
      if (orderModal) {
        orderModal.classList.remove("hidden");
        orderModal.classList.add("flex");
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
      UTILS.showToast(error.message || "Không thể xem chi tiết đơn hàng.", "error");
    }
  }

  /**
   * Chuẩn hóa OrderResponseDTO từ BE sang format profile page cần
   */
  function normalizeApiOrder(order) {
    return {
      id: order.id,
      orderId: order.id,
      orderCode: `ORD-${order.id}`,
      status: String(order.status || "pending").toLowerCase(),
      createdAt: order.orderDate || new Date().toISOString(),
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
});
