// Script xử lý Trang Quản lý Người dùng (admin-users.html)
document.addEventListener("DOMContentLoaded", () => {

  if (!requireAdmin()) return;

  // Sidebar toggle
  const btnOpenSidebar = document.getElementById("btn-open-sidebar");
  const btnCloseSidebar = document.getElementById("btn-close-sidebar");
  const sidebar = document.getElementById("admin-sidebar");
  if (btnOpenSidebar && sidebar) btnOpenSidebar.addEventListener("click", () => sidebar.classList.add("open"));
  if (btnCloseSidebar && sidebar) btnCloseSidebar.addEventListener("click", () => sidebar.classList.remove("open"));

  // Header Name
  const currentUser = Storage.getCurrentUser();
  if (currentUser) {
    const nameEl = document.getElementById("header-admin-name");
    if (nameEl) nameEl.textContent = currentUser.fullName || currentUser.username;
  }

  // Logout
  const btnLogout = document.getElementById("btn-admin-logout");
  if (btnLogout) btnLogout.addEventListener("click", () => Auth.logout());

  // Load Mock Data
  let allUsers = [];
  if (!localStorage.getItem("adminMockUsers")) {
    if (typeof MOCK_USERS !== "undefined") {
      localStorage.setItem("adminMockUsers", JSON.stringify(MOCK_USERS));
    } else {
      localStorage.setItem("adminMockUsers", JSON.stringify([currentUser]));
    }
  }
  allUsers = JSON.parse(localStorage.getItem("adminMockUsers"));

  bindToolbarEvents();
  applyFiltersAndRender();

  // ==========================================
  // Xử lý bộ lọc
  // ==========================================
  function bindToolbarEvents() {
    const searchInput = document.getElementById("filter-search");
    const roleSelect = document.getElementById("filter-role");
    const statusSelect = document.getElementById("filter-status");
    const btnRefresh = document.getElementById("btn-refresh");

    if (searchInput) searchInput.addEventListener("input", applyFiltersAndRender);
    if (roleSelect) roleSelect.addEventListener("change", applyFiltersAndRender);
    if (statusSelect) statusSelect.addEventListener("change", applyFiltersAndRender);
    
    if (btnRefresh) {
      btnRefresh.addEventListener("click", () => {
        if(searchInput) searchInput.value = "";
        if(roleSelect) roleSelect.value = "";
        if(statusSelect) statusSelect.value = "";
        allUsers = JSON.parse(localStorage.getItem("adminMockUsers"));
        applyFiltersAndRender();
      });
    }
  }

  function applyFiltersAndRender() {
    const searchTerm = (document.getElementById("filter-search")?.value || "").toLowerCase();
    const roleVal = document.getElementById("filter-role")?.value || "";
    const statusVal = document.getElementById("filter-status")?.value || "";

    let filtered = allUsers;

    if (searchTerm) {
      filtered = filtered.filter(u => 
        (u.fullName || "").toLowerCase().includes(searchTerm) ||
        (u.username || "").toLowerCase().includes(searchTerm) ||
        (u.email || "").toLowerCase().includes(searchTerm)
      );
    }
    if (roleVal) {
      filtered = filtered.filter(u => u.role === roleVal);
    }
    if (statusVal) {
      filtered = filtered.filter(u => u.status === statusVal);
    }

    renderTable(filtered);
  }

  // ==========================================
  // Render Bảng Người dùng
  // ==========================================
  function renderTable(users) {
    const tbody = document.getElementById("admin-users-body");
    const stats = document.getElementById("table-stats");
    
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-500 font-medium">Không tìm thấy người dùng nào.</td></tr>`;
      if (stats) stats.textContent = "Đang hiển thị 0 người dùng";
      return;
    }

    let html = "";
    users.forEach(u => {
      const roleBadge = u.role === "admin" 
        ? `<span class="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[10px] font-bold">ADMIN</span>`
        : `<span class="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-[10px] font-bold">USER</span>`;
      
      const statusBadge = u.status === "Active"
        ? `<span class="bg-brand-100 text-brand-700 px-2 py-1 rounded-full text-[10px] font-bold">Hoạt động</span>`
        : `<span class="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-[10px] font-bold">Đã khóa</span>`;

      const formattedDate = UTILS.formatDate(u.createdAt, "DD/MM/YYYY");

      html += `
        <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
          <td class="py-3 px-4 font-bold text-slate-700">#${u.id}</td>
          <td class="py-3 px-4 font-medium text-slate-800">${u.fullName}</td>
          <td class="py-3 px-4 text-slate-600 text-sm">
            <div class="font-semibold">${u.username}</div>
            <div class="text-xs text-slate-400">${u.email}</div>
          </td>
          <td class="py-3 px-4 text-center">${roleBadge}</td>
          <td class="py-3 px-4 text-center">${statusBadge}</td>
          <td class="py-3 px-4 text-center text-slate-500 text-sm">${formattedDate}</td>
          <td class="py-3 px-4 text-center space-x-2">
            <button onclick="viewUserDetails(${u.id})" data-tippy-content="Xem chi tiết" class="w-8 h-8 rounded bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button onclick="toggleRole(${u.id})" data-tippy-content="Đổi quyền" class="w-8 h-8 rounded bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-colors">
              <i class="fa-solid fa-user-shield"></i>
            </button>
            <button onclick="toggleLock(${u.id}, '${u.status}')" data-tippy-content="${u.status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa'}" class="w-8 h-8 rounded bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors">
              <i class="fa-solid ${u.status === 'Active' ? 'fa-lock' : 'fa-unlock'}"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    if (stats) stats.textContent = `Đang hiển thị ${users.length} người dùng`;

    if (window.tippy) {
      tippy('[data-tippy-content]', { placement: 'top', animation: 'scale' });
    }
  }

  // ==========================================
  // Actions
  // ==========================================
  window.viewUserDetails = (id) => {
    const user = allUsers.find(u => u.id === id);
    if (!user) return;

    // Tìm lịch sử mua hàng của user qua localStorage.orders
    const allOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    const userOrders = allOrders.filter(o => o.customerInfo && o.customerInfo.phone === user.phone);

    let ordersHtml = `<p class="text-slate-500 text-sm">Chưa có đơn hàng nào.</p>`;
    if (userOrders.length > 0) {
      ordersHtml = userOrders.map(o => `
        <div class="flex justify-between items-center border-b border-slate-100 py-2">
          <div>
            <p class="font-bold text-sm text-slate-700">${o.orderCode}</p>
            <p class="text-[10px] text-slate-500">${UTILS.formatDate(o.createdAt, "DD/MM/YYYY HH:mm")}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-brand-600 text-sm">${UTILS.formatCurrency(o.total)}</p>
            <p class="text-[10px] font-bold text-slate-600">${o.status}</p>
          </div>
        </div>
      `).join('');
    }

    Swal.fire({
      title: `Thông tin User #${user.id}`,
      html: `
        <div class="text-left space-y-4">
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p><strong>Họ tên:</strong> ${user.fullName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>SĐT:</strong> ${user.phone}</p>
            <p><strong>Trạng thái:</strong> ${user.status}</p>
          </div>
          <div>
            <h4 class="font-bold text-slate-800 mb-2">Lịch sử đơn hàng:</h4>
            <div class="max-h-48 overflow-y-auto pr-2">
              ${ordersHtml}
            </div>
          </div>
        </div>
      `,
      confirmButtonText: 'Đóng',
      confirmButtonColor: '#16a34a'
    });
  };

  window.toggleRole = async (id) => {
    const user = allUsers.find(u => u.id === id);
    if (!user) return;

    if (user.username === 'admin') {
      UTILS.showToast("Không thể thay đổi quyền của super admin!", "error");
      return;
    }

    const isConfirmed = await UTILS.confirm("Thay đổi phân quyền?", `Đổi quyền của ${user.fullName} thành ${user.role === 'ADMIN' ? 'USER' : 'ADMIN'}`);
    if (isConfirmed) {
      user.role = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
      localStorage.setItem("adminMockUsers", JSON.stringify(allUsers));
      UTILS.showToast("Cập nhật quyền thành công", "success");
      applyFiltersAndRender();
    }
  };

  window.toggleLock = async (id, currentStatus) => {
    const user = allUsers.find(u => u.id === id);
    if (!user) return;

    if (user.username === 'admin') {
      UTILS.showToast("Không thể khóa super admin!", "error");
      return;
    }

    const nextStatus = currentStatus === 'Active' ? 'Locked' : 'Active';
    const actionName = currentStatus === 'Active' ? 'Khóa' : 'Mở khóa';

    const isConfirmed = await UTILS.confirm(`Xác nhận ${actionName}?`, `Bạn muốn ${actionName} tài khoản ${user.fullName}?`);
    if (isConfirmed) {
      user.status = nextStatus;
      localStorage.setItem("adminMockUsers", JSON.stringify(allUsers));
      UTILS.showToast(`Đã ${actionName} tài khoản`, "success");
      applyFiltersAndRender();
    }
  };

});

function requireAdmin() {
  const currentUser = Storage.getCurrentUser();
  const token = Storage.getToken();
  if (!currentUser || !token || currentUser.role !== 'admin') {
    UTILS.showToast("Bạn không có quyền truy cập trang này.", "error");
    window.location.href = "auth.html";
    return false;
  }
  return true;
}
