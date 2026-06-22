// Script xử lý Trang Quản lý Đơn hàng (admin-orders.html)
document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAdmin()) return;

  const btnOpenSidebar = document.getElementById("btn-open-sidebar");
  const btnCloseSidebar = document.getElementById("btn-close-sidebar");
  const sidebar = document.getElementById("admin-sidebar");
  const btnLogout = document.getElementById("btn-admin-logout");
  const searchInput = document.getElementById("filter-search");
  const statusSelect = document.getElementById("filter-status");
  const paymentSelect = document.getElementById("filter-payment");
  const btnRefresh = document.getElementById("btn-refresh");
  const modal = document.getElementById("order-modal");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const btnSaveStatus = document.getElementById("btn-save-status");

  let allOrders = [];
  let selectedOrder = null;
  let calendar = null;

  // Status map khớp BE OrderStatus enum (lowercase)
  const statusMap = {
    pending: { text: "CHỜ XỬ LÝ", class: "bg-yellow-100 text-yellow-800" },
    confirmed: { text: "ĐÃ XÁC NHẬN", class: "bg-brand-100 text-brand-800" },
    delivering: { text: "ĐANG GIAO HÀNG", class: "bg-blue-100 text-blue-800" },
    completed: { text: "HOÀN THÀNH", class: "bg-brand-100 text-brand-800" },
    cancelled: { text: "ĐÃ HỦY", class: "bg-rose-100 text-rose-800" }
  };

  if (btnOpenSidebar && sidebar) btnOpenSidebar.addEventListener("click", () => sidebar.classList.add("open"));
  if (btnCloseSidebar && sidebar) btnCloseSidebar.addEventListener("click", () => sidebar.classList.remove("open"));
  if (btnLogout) btnLogout.addEventListener("click", () => Auth.logout());

  const currentUser = Storage.getCurrentUser();
  if (currentUser) {
    const nameEl = document.getElementById("header-admin-name");
    if (nameEl) nameEl.textContent = currentUser.fullName || currentUser.username || "Admin";
  }

  injectCalendarDOM();
  bindEvents();
  await loadOrders();

  function bindEvents() {
    if (searchInput) searchInput.addEventListener("input", applyFiltersAndRender);
    if (statusSelect) statusSelect.addEventListener("change", applyFiltersAndRender);
    if (paymentSelect) paymentSelect.addEventListener("change", applyFiltersAndRender);
    if (btnRefresh) btnRefresh.addEventListener("click", refreshOrders);
    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
      });
    }
    if (btnSaveStatus) btnSaveStatus.addEventListener("click", saveSelectedOrderStatus);
  }

  async function refreshOrders() {
    if (searchInput) searchInput.value = "";
    if (statusSelect) statusSelect.value = "";
    if (paymentSelect) paymentSelect.value = "";
    await loadOrders();
  }

  async function loadOrders() {
    const tbody = document.getElementById("orders-table-body");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>`;
    }

    try {
      const rawOrders = await AdminOrderApi.getOrders();
      allOrders = (rawOrders || []).map(normalizeAdminOrder);
      applyFiltersAndRender();
      renderCalendar(allOrders);
    } catch (error) {
      console.error("Lỗi tải danh sách đơn hàng:", error);
      UTILS.showToast(error.message || "Không thể tải danh sách đơn hàng.", "error");
      allOrders = [];
      applyFiltersAndRender();
      renderCalendar(allOrders);
    }
  }

  /**
   * Chuẩn hóa AdminOrderResponseDTO từ BE:
   * { id, orderDate, totalAmount, status, userId, username, fullName, email,
   *   receiverName, receiverPhone, receiverAddress, note, orderItems[] }
   */
  function normalizeAdminOrder(order) {
    const items = order.orderItems || [];
    return {
      id: order.id,
      code: `#${order.id || "--"}`,
      orderDate: order.orderDate || "",
      totalAmount: Number(order.totalAmount ?? 0),
      status: String(order.status || "pending").toLowerCase(),
      // BE AdminOrderResponseDTO không có paymentMethod, mặc định COD
      paymentMethod: "COD",
      customerName: order.fullName || order.receiverName || order.username || "N/A",
      customerPhone: order.receiverPhone || "N/A",
      customerEmail: order.email || "N/A",
      receiverAddress: order.receiverAddress || "N/A",
      note: order.note || "",
      items: items.map(item => ({
        productId: item.productId,
        name: item.productName || "Sản phẩm",
        imageUrl: item.productImageUrl,
        quantity: Number(item.quantity || 0),
        price: Number(item.productPrice ?? 0),
        totalPrice: Number(item.totalPrice ?? (Number(item.productPrice ?? 0) * Number(item.quantity || 0)))
      }))
    };
  }

  function applyFiltersAndRender() {
    const searchTerm = (searchInput?.value || "").toLowerCase();
    const statusVal = (statusSelect?.value || "").toLowerCase();
    const paymentVal = paymentSelect?.value || "";

    let filtered = allOrders;
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.code.toLowerCase().includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm) ||
        order.customerPhone.toLowerCase().includes(searchTerm)
      );
    }
    if (statusVal) {
      filtered = filtered.filter(order => order.status === statusVal);
    }
    if (paymentVal) {
      filtered = filtered.filter(order => order.paymentMethod === paymentVal);
    }

    renderTable(filtered);
  }


  function renderTable(orders) {
    const tbody = document.getElementById("orders-table-body");
    const stats = document.getElementById("table-stats");
    if (!tbody) return;

    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-500 font-medium">Không tìm thấy đơn hàng nào.</td></tr>`;
      if (stats) stats.textContent = "Đang hiển thị 0 đơn hàng";
      return;
    }

    tbody.innerHTML = orders.map(order => {
      const st = statusMap[order.status] || { text: order.status, class: "bg-slate-100 text-slate-800" };
      return `
        <tr class="hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100" data-order-id="${order.id}">
          <td class="py-3 px-4 font-bold text-slate-700">${order.code}</td>
          <td class="py-3 px-4 font-medium text-slate-800 truncate max-w-[150px]" title="${order.customerName}">${order.customerName}</td>
          <td class="py-3 px-4 text-slate-600">${order.customerPhone}</td>
          <td class="py-3 px-4 text-slate-500 text-xs">${UTILS.formatDate(order.orderDate, "DD/MM/YYYY <br/> HH:mm")}</td>
          <td class="py-3 px-4 text-right font-bold text-brand-600">${UTILS.formatCurrency(order.totalAmount)}</td>
          <td class="py-3 px-4 text-center text-slate-600 font-medium">${order.paymentMethod}</td>
          <td class="py-3 px-4 text-center">
            <span class="px-2 py-1 rounded-full text-[10px] font-bold ${st.class}">${st.text}</span>
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll("tr[data-order-id]").forEach(row => {
      row.addEventListener("click", () => openOrderModal(row.dataset.orderId));
    });

    if (stats) stats.textContent = `Đang hiển thị ${orders.length} đơn hàng`;
    if (window.tippy) tippy("[data-tippy-content]", { placement: "top", animation: "scale" });
  }

  function openOrderModal(orderId) {
    selectedOrder = allOrders.find(order => String(order.id) === String(orderId));
    if (!selectedOrder || !modal) return;

    document.getElementById("modal-order-code").textContent = selectedOrder.code;
    document.getElementById("modal-customer-name").textContent = selectedOrder.customerName;
    document.getElementById("modal-customer-phone").textContent = selectedOrder.customerPhone;
    document.getElementById("modal-customer-address").textContent = selectedOrder.receiverAddress;
    document.getElementById("modal-customer-note").textContent = selectedOrder.note || "--";
    document.getElementById("modal-payment-method").textContent = selectedOrder.paymentMethod;

    const statusInput = document.getElementById("modal-status-select");
    if (statusInput) statusInput.value = selectedOrder.status;

    renderModalItems(selectedOrder);
    modal.classList.add("active");
  }

  function closeModal() {
    if (modal) modal.classList.remove("active");
    selectedOrder = null;
  }

  function renderModalItems(order) {
    const tbody = document.getElementById("modal-items-list");
    if (!tbody) return;

    tbody.innerHTML = order.items.map(item => `
      <tr>
        <td class="py-3 px-3">
          <div class="flex items-center gap-3">
            <img src="${UTILS.getImageUrl(item.imageUrl)}" alt="${item.name}" class="w-12 h-12 rounded object-cover border border-slate-200" onerror="${UTILS.imageFallbackAttr()}">
            <span class="font-semibold text-slate-800">${item.name}</span>
          </div>
        </td>
        <td class="py-3 px-3 text-center">${item.quantity}</td>
        <td class="py-3 px-3 text-right">${UTILS.formatCurrency(item.price)}</td>
        <td class="py-3 px-3 text-right font-semibold">${UTILS.formatCurrency(item.totalPrice)}</td>
      </tr>
    `).join("");

    const subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const shipping = Math.max(order.totalAmount - subtotal, 0);
    document.getElementById("modal-subtotal").textContent = UTILS.formatCurrency(subtotal);
    document.getElementById("modal-shipping").textContent = UTILS.formatCurrency(shipping);
    document.getElementById("modal-discount").textContent = UTILS.formatCurrency(0);
    document.getElementById("modal-total").textContent = UTILS.formatCurrency(order.totalAmount);
  }

  async function saveSelectedOrderStatus() {
    if (!selectedOrder) return;

    const status = document.getElementById("modal-status-select")?.value;
    if (!status) return;

    try {
      const updatedOrder = await AdminOrderApi.updateStatus(selectedOrder.id, status);
      const normalized = normalizeAdminOrder(updatedOrder);
      allOrders = allOrders.map(order => String(order.id) === String(normalized.id) ? normalized : order);
      selectedOrder = normalized;
      applyFiltersAndRender();
      renderCalendar(allOrders);
      openOrderModal(normalized.id);
      UTILS.showToast("Cập nhật trạng thái đơn hàng thành công.", "success");
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
      UTILS.showToast(error.message || "Không thể cập nhật trạng thái đơn hàng.", "error");
    }
  }

  function injectCalendarDOM() {
    const tableContainer = document.querySelector(".bg-white.rounded-xl.border");
    if (!tableContainer || document.getElementById("calendar-container")) return;

    const calCard = document.createElement("div");
    calCard.className = "bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6";
    calCard.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-slate-800 text-lg"><i class="fa-regular fa-calendar-days text-brand-600 mr-2"></i>Lịch giao hàng</h3>
      </div>
      <div id="calendar-container" class="w-full min-h-[400px]"></div>
      
      <!-- Lớp giải thích màu sắc (Legend) -->
      <div class="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500 justify-center">
        <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-yellow-500"></span> Chờ xử lý</div>
        <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500"></span> Đã xác nhận</div>
        <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Đang giao hàng</div>
        <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500"></span> Hoàn thành</div>
        <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-red-500"></span> Đã hủy</div>
      </div>
    `;
    tableContainer.parentNode.insertBefore(calCard, tableContainer);
  }

  function renderCalendar(orders) {
    const calEl = document.getElementById("calendar-container");
    if (!calEl || !window.FullCalendar) return;

    if (calendar) {
      calendar.destroy();
      calendar = null;
    }

    const events = orders
      .filter(order => order.orderDate)
      .map(order => ({
        id: order.id,
        title: `${order.code} - ${order.customerName}`,
        start: String(order.orderDate).split("T")[0],
        color: getStatusColor(order.status),
        extendedProps: {
          customerName: order.customerName,
          status: statusMap[order.status]?.text || order.status,
          total: UTILS.formatCurrency(order.totalAmount)
        }
      }));

    calendar = new FullCalendar.Calendar(calEl, {
      initialView: "dayGridMonth",
      height: 650,
      dayMaxEvents: 3, // display at most 3 event rows, 4th line will be '+n more' if it overflows
      locale: "vi",
      buttonText: {
        today: "Hôm nay",
        month: "Tháng",
        week: "Tuần"
      },
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek"
      },
      events,
      eventClick(info) {
        openOrderModal(info.event.id);
      }
    });

    calendar.render();
  }

  // Màu sắc khớp BE OrderStatus enum (lowercase)
  function getStatusColor(status) {
    if (status === "pending") return "#eab308";
    if (status === "confirmed") return "#10b981";
    if (status === "delivering") return "#3b82f6";
    if (status === "completed") return "#22c55e";
    if (status === "cancelled") return "#ef4444";
    return "#64748b";
  }
});

function requireAdmin() {
  const currentUser = Storage.getCurrentUser();
  const token = Storage.getToken();
  if (!currentUser || !token || currentUser.role !== "admin") {
    UTILS.showToast("Bạn không có quyền truy cập trang này.", "error");
    window.location.href = "auth.html";
    return false;
  }
  return true;
}
