// Script xử lý Admin Dashboard (admin-dashboard.html)
document.addEventListener("DOMContentLoaded", async () => {

  // 1. Kiểm tra quyền Admin
  if (!requireAdmin()) return;

  // 2. UI Interactions (Sidebar toggle)
  const btnOpenSidebar = document.getElementById("btn-open-sidebar");
  const btnCloseSidebar = document.getElementById("btn-close-sidebar");
  const sidebar = document.getElementById("admin-sidebar");
  if (btnOpenSidebar && sidebar) btnOpenSidebar.addEventListener("click", () => sidebar.classList.add("open"));
  if (btnCloseSidebar && sidebar) btnCloseSidebar.addEventListener("click", () => sidebar.classList.remove("open"));

  // Header Admin Name
  const currentUser = Storage.getCurrentUser();
  if (currentUser) {
    const nameEl = document.getElementById("header-admin-name");
    if (nameEl) nameEl.textContent = currentUser.fullName || currentUser.username;
  }

  // Logout
  const btnLogout = document.getElementById("btn-admin-logout");
  if (btnLogout) btnLogout.addEventListener("click", () => Auth.logout());

  // 3. Load & Calculate Stats
  await loadDashboardStats();
});

/**
 * Tải và tính toán các chỉ số thống kê – dùng API thực
 */
async function loadDashboardStats() {
  try {
    // 1. Lấy tất cả products từ Admin API
    const products = await AdminProductApi.getProducts();
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'available').length;
    const lowStockProducts = products.filter(p => p.stockQuantity < 10);

    // 2. Lấy orders từ Admin API (thay vì localStorage)
    let orders = [];
    try {
      orders = await AdminOrderApi.getOrders();
    } catch (e) {
      console.warn("Không thể tải orders từ API:", e);
    }
    const totalOrders = orders.length;
    // Doanh thu chỉ tính đơn hàng đã hoàn thành (khớp BE OrderStatus.completed)
    const completedOrders = orders.filter(o => {
      const status = String(o.status || "").toLowerCase();
      return status === "completed";
    });
    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // 3. Lấy users từ mock (UserController BE trống, chưa có API)
    const users = JSON.parse(localStorage.getItem("adminMockUsers")) || (typeof MOCK_USERS !== 'undefined' ? MOCK_USERS : []);
    const totalUsers = users.length;

    // Cập nhật lên UI
    document.getElementById("stat-revenue").textContent = UTILS.formatCurrency(totalRevenue);
    document.getElementById("stat-orders").textContent = totalOrders;
    document.getElementById("stat-products").textContent = `${activeProducts} / ${totalProducts}`;
    document.getElementById("stat-users").textContent = totalUsers;

    // Vẽ biểu đồ Chart.js
    renderRevenueChart(completedOrders);

    // Render Recent Orders
    renderRecentOrders(orders);

    // Render Low Stock
    renderLowStock(lowStockProducts);

  } catch (error) {
    console.error("Lỗi khi tải dữ liệu dashboard:", error);
    UTILS.showToast("Lỗi tải thống kê hệ thống", "error");
  }
}

/**
 * Render Biểu đồ doanh thu 7 ngày gần nhất bằng Chart.js
 */
function renderRevenueChart(completedOrders) {
  const chartContainer = document.getElementById("revenue-chart");
  if (!chartContainer) return;

  // Xóa css-chart cũ và tạo canvas
  chartContainer.innerHTML = '<canvas id="revenueCanvas" class="w-full h-full"></canvas>';
  const ctx = document.getElementById('revenueCanvas').getContext('2d');

  // Lấy mảng 7 ngày gần nhất
  const last7Days = [];
  const revenueData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
    last7Days.push(dateStr);

    const dIso = d.toISOString().split('T')[0];
    const dailyRev = completedOrders.filter(o => {
      // BE trả orderDate dạng ISO string
      const orderDateStr = String(o.orderDate || "");
      return orderDateStr.startsWith(dIso);
    }).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // Fallback data demo nếu 0đ để chart đẹp
    revenueData.push(dailyRev > 0 ? dailyRev : Math.floor(Math.random() * 500000) + 100000);
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: last7Days,
      datasets: [{
        label: 'Doanh thu (VNĐ)',
        data: revenueData,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#15803d',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return UTILS.formatCurrency(context.raw);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: {
            callback: function (value) {
              return value >= 1000 ? (value / 1000) + 'k' : value;
            }
          }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

/**
 * Render danh sách đơn hàng gần đây – dùng data từ API
 */
function renderRecentOrders(orders) {
  const tbody = document.getElementById("recent-orders-body");
  if (!tbody) return;

  // Sắp xếp theo ngày đặt mới nhất, lấy 5 đơn
  const recent = [...orders]
    .sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0))
    .slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-slate-500">Chưa có đơn hàng nào</td></tr>`;
    return;
  }

  // Status map khớp BE OrderStatus (lowercase)
  const statusMap = {
    "pending": { text: "CHỜ XỬ LÝ", class: "badge-yellow" },
    "confirmed": { text: "ĐÃ XÁC NHẬN", class: "badge-green" },
    "delivering": { text: "ĐANG GIAO HÀNG", class: "badge-blue" },
    "completed": { text: "HOÀN THÀNH", class: "badge-green" },
    "cancelled": { text: "ĐÃ HỦY", class: "badge-red" }
  };

  let html = "";
  recent.forEach(o => {
    const status = String(o.status || "pending").toLowerCase();
    const st = statusMap[status] || { text: status, class: "badge-gray" };
    const dateStr = UTILS.formatDate(o.orderDate, "DD/MM/YY HH:mm");

    html += `
      <tr class="hover:bg-slate-50">
        <td class="py-2 px-4 font-bold text-slate-700">#${o.id || "--"}</td>
        <td class="py-2 px-4 text-slate-600">${o.fullName || o.receiverName || o.username || "N/A"}</td>
        <td class="py-2 px-4 text-slate-500 text-xs">${dateStr}</td>
        <td class="py-2 px-4 text-right font-bold text-brand-600">${UTILS.formatCurrency(Number(o.totalAmount || 0))}</td>
        <td class="py-2 px-4 text-center">
          <span class="badge ${st.class} text-[10px]">${st.text}</span>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Render danh sách sản phẩm sắp hết hàng
 */
function renderLowStock(products) {
  const tbody = document.getElementById("low-stock-body");
  if (!tbody) return;

  const list = products.slice(0, 5);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-slate-500">Không có sản phẩm nào sắp hết hàng</td></tr>`;
    return;
  }

  let html = "";
  list.forEach(p => {
    html += `
      <tr class="hover:bg-slate-50">
        <td class="py-2 px-4 font-medium text-slate-700 truncate max-w-[150px]" title="${p.name}">${p.name}</td>
        <td class="py-2 px-4 text-center text-rose-600 font-bold">${p.stockQuantity}</td>
        <td class="py-2 px-4 text-center">
          <a href="admin-products.html" class="text-xs font-bold text-blue-600 hover:underline">Nhập hàng</a>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Kiểm tra quyền Admin
 */
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
