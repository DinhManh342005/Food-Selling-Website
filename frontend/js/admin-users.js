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

  bindToolbarEvents();
  loadUsers();

  async function loadUsers() {
    const tbody = document.getElementById("users-table-body");
    if (tbody && allUsers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-500 font-medium">Đang tải dữ liệu...</td></tr>`;
    }
    try {
      const response = await AdminUserApi.getAllUsers(0, 1000);
      allUsers = response.content || [];
      // Chuẩn hóa phone
      allUsers.forEach(u => {
        u.phone = u.phoneNumber;
      });
      applyFiltersAndRender();
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng từ API:", error);
      UTILS.showToast(error.message || "Không thể tải danh sách người dùng.", "danger");
    }
  }

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
        loadUsers();
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
      filtered = filtered.filter(u => String(u.role).toLowerCase() === roleVal.toLowerCase());
    }
    if (statusVal) {
      filtered = filtered.filter(u => {
        const uStatus = String(u.status).toLowerCase();
        const fStatus = statusVal.toLowerCase();
        if (fStatus === 'active') return uStatus === 'active';
        if (fStatus === 'locked' || fStatus === 'inactive') return uStatus === 'inactive' || uStatus === 'locked';
        return uStatus === fStatus;
      });
    }

    renderTable(filtered);
  }

  // ==========================================
  // Render Bảng Người dùng
  // ==========================================
  function renderTable(users) {
    const tbody = document.getElementById("users-table-body"); // Sửa: đúng ID trong HTML
    const stats = document.getElementById("table-stats");
    
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-500 font-medium">Không tìm thấy người dùng nào.</td></tr>`;
      if (stats) stats.textContent = "Đang hiển thị 0 người dùng";
      return;
    }

    let html = "";
    users.forEach(u => {
      const uRole = String(u.role).toUpperCase();
      const roleBadge = uRole === "ADMIN" 
        ? `<span class="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[10px] font-bold">ADMIN</span>`
        : `<span class="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-[10px] font-bold">USER</span>`;
      
      const uStatus = String(u.status).toUpperCase();
      const statusBadge = uStatus === "ACTIVE"
        ? `<span class="bg-brand-100 text-brand-700 px-2 py-1 rounded-full text-[10px] font-bold">Hoạt động</span>`
        : `<span class="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-[10px] font-bold">Đã khóa</span>`;

      html += `
        <tr onclick="viewUserDetails(${u.id})" class="hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer">
          <td class="py-3 px-4 text-center font-bold text-slate-700">#${u.id}</td>
          <td class="py-3 px-4 font-medium text-slate-800">${u.fullName || '--'}</td>
          <td class="py-3 px-4 font-semibold text-slate-700 text-sm">${u.username}</td>
          <td class="py-3 px-4 text-slate-600 text-sm">${u.email || '--'}</td>
          <td class="py-3 px-4 text-slate-600 text-sm">${u.phone || '--'}</td>
          <td class="py-3 px-4 text-center">${roleBadge}</td>
          <td class="py-3 px-4 text-center">${statusBadge}</td>
          <td class="py-3 px-4 text-center space-x-2">

            <button onclick="event.stopPropagation(); toggleRole(${u.id})" data-tippy-content="Đổi quyền" class="w-8 h-8 rounded bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-colors">
              <i class="fa-solid fa-user-shield"></i>
            </button>
            <button onclick="event.stopPropagation(); toggleLock(${u.id}, '${u.status}')" data-tippy-content="${uStatus === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}" class="w-8 h-8 rounded bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors">
              <i class="fa-solid ${uStatus === 'ACTIVE' ? 'fa-lock' : 'fa-unlock'}"></i>
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



    Swal.fire({
      title: `Thông tin User #${user.id}`,
      html: `
        <div class="text-left space-y-4">
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p><strong>Username:</strong> ${user.username || '--'}</p>
            <p><strong>Họ tên:</strong> ${user.fullName || '--'}</p>
            <p><strong>Email:</strong> ${user.email || '--'}</p>
            <p><strong>SĐT:</strong> ${user.phone || '--'}</p>
            <p><strong>Vai trò (Role):</strong> ${String(user.role).toUpperCase()}</p>
            <p><strong>Trạng thái:</strong> ${String(user.status).toUpperCase()}</p>
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

    const currentRole = String(user.role).toLowerCase();
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';

    const isConfirmed = await UTILS.confirm(
      "Thay đổi phân quyền?", 
      `Đổi quyền của ${user.fullName || user.username} thành ${nextRole.toUpperCase()}`
    );
    
    if (isConfirmed) {
      try {
        await AdminUserApi.updateUser(id, { role: nextRole });
        user.role = nextRole;
        UTILS.showToast("Cập nhật quyền thành công", "success");
        applyFiltersAndRender();
      } catch (error) {
        console.error("Lỗi đổi quyền user:", error);
        UTILS.showToast(error.message || "Không thể cập nhật phân quyền.", "danger");
      }
    }
  };

  window.toggleLock = async (id, currentStatus) => {
    const user = allUsers.find(u => u.id === id);
    if (!user) return;

    if (user.username === 'admin') {
      UTILS.showToast("Không thể khóa super admin!", "error");
      return;
    }

    const isCurrentActive = String(currentStatus).toLowerCase() === 'active';
    const nextStatus = isCurrentActive ? 'inactive' : 'active';
    const actionName = isCurrentActive ? 'Khóa' : 'Mở khóa';

    const isConfirmed = await UTILS.confirm(
      `Xác nhận ${actionName}?`, 
      `Bạn muốn ${actionName} tài khoản ${user.fullName || user.username}?`
    );
    
    if (isConfirmed) {
      try {
        await AdminUserApi.updateUser(id, { status: nextStatus });
        user.status = nextStatus;
        UTILS.showToast(`Đã ${actionName} tài khoản thành công`, "success");
        applyFiltersAndRender();
      } catch (error) {
        console.error("Lỗi thay đổi trạng thái user:", error);
        UTILS.showToast(error.message || `Không thể ${actionName} tài khoản.`, "danger");
      }
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
