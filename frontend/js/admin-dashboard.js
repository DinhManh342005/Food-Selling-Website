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

  // Revenue Time Filter
  const revenueFilter = document.getElementById("revenue-time-filter");
  if (revenueFilter) {
    revenueFilter.addEventListener("change", (e) => {
      const days = parseInt(e.target.value, 10);
      renderRevenueChart(globalValidOrders, days);
    });
  }

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
    const safeProducts = Array.isArray(products) ? products : [];
    const totalProducts = safeProducts.length;
    const activeProducts = safeProducts.filter(p => p.status === 'available').length;
    const lowStockProducts = safeProducts.filter(p => p.stockQuantity < 10);

    // 2. Lấy orders từ Admin API
    let orders = [];
    try {
      const resOrders = await AdminOrderApi.getOrders();
      orders = Array.isArray(resOrders) ? resOrders : [];
    } catch (e) {
      console.warn("Không thể tải orders từ API:", e);
    }
    const totalOrders = orders.length;
    // Doanh thu tính tất cả đơn hàng trừ đơn đã hủy
    const validOrders = orders.filter(o => {
      const status = String(o.status || "").toLowerCase();
      return status !== "cancelled";
    });
    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // 3. Lấy users từ API thực tế
    let totalUsers = 0;
    try {
      const userPage = await AdminUserApi.getAllUsers(0, 1);
      if (userPage) {
        totalUsers = userPage.totalElements || (userPage.content && userPage.content.length) || userPage.length || 0;
      }
    } catch (e) {
      console.warn("Không thể tải users từ API:", e);
    }

    // Cập nhật lên UI (Safely update if elements exist)
    const elRevenue = document.getElementById("stat-revenue");
    if (elRevenue) elRevenue.textContent = UTILS.formatCurrency(totalRevenue);

    const elOrders = document.getElementById("stat-total-orders");
    if (elOrders) elOrders.textContent = totalOrders;

    const elTotalProducts = document.getElementById("stat-total-products");
    if (elTotalProducts) elTotalProducts.textContent = totalProducts;

    const elAvailableProducts = document.getElementById("stat-available-products");
    if (elAvailableProducts) elAvailableProducts.textContent = activeProducts;

    const elOutStock = document.getElementById("stat-out-stock");
    if (elOutStock) elOutStock.textContent = lowStockProducts.length;

    // Vẽ biểu đồ Chart.js
    globalValidOrders = validOrders;
    renderRevenueChart(validOrders, 7);
    
    // Vẽ biểu đồ Vùng miền
    renderRegionChart(validOrders, safeProducts);

    // Render Recent Orders
    renderRecentOrders(orders);

    // Render Low Stock
    renderLowStock(lowStockProducts);

  } catch (error) {
    console.error("Lỗi khi tải dữ liệu dashboard:", error);
    UTILS.showToast("Lỗi tải thống kê hệ thống", "error");
  }
}

let globalRevenueChart = null;
let globalRegionChart = null;
let globalValidOrders = [];

/**
 * Render Biểu đồ doanh thu bằng Chart.js
 */
function renderRevenueChart(completedOrders, days = 7) {
  const chartContainer = document.getElementById("revenue-chart");
  const chartTitle = document.getElementById("revenue-chart-title");
  if (!chartContainer) return;

  if (chartTitle) chartTitle.textContent = `Doanh thu ${days} ngày qua`;

  // Xóa css-chart cũ và tạo canvas
  chartContainer.innerHTML = '<canvas id="revenueCanvas" class="w-full h-full"></canvas>';
  const ctx = document.getElementById('revenueCanvas').getContext('2d');

  if (globalRevenueChart) {
    globalRevenueChart.destroy();
  }

  // Lấy mảng days ngày gần nhất
  const dateLabels = [];
  const revenueData = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
    dateLabels.push(dateStr);

    const dIso = d.toISOString().split('T')[0];
    const dailyRev = completedOrders.filter(o => {
      // BE trả orderDate dạng ISO string
      const orderDateStr = String(o.orderDate || "");
      return orderDateStr.startsWith(dIso);
    }).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    revenueData.push(dailyRev);
  }

  globalRevenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dateLabels,
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
 * Render Biểu đồ tỷ lệ mua hàng theo vùng miền (Dựa trên Danh mục sản phẩm)
 */
function renderRegionChart(validOrders, allProducts = []) {
  const chartContainer = document.getElementById("regionCanvas");
  if (!chartContainer) return;

  const ctx = chartContainer.getContext('2d');
  if (globalRegionChart) {
    globalRegionChart.destroy();
  }

  // Tạo map productId -> categoryId từ danh sách sản phẩm thực tế
  const productCategoryMap = {};
  allProducts.forEach(p => {
    productCategoryMap[p.id] = p.categoryId;
  });

  // categoryId: 1 = Miền Bắc, 2 = Miền Trung, 3 = Miền Nam
  let north = 0, central = 0, south = 0;
  
  // Tính tổng số lượng sản phẩm bán ra theo từng vùng miền
  validOrders.forEach(o => {
    const items = o.orderItems || [];
    items.forEach(item => {
      const quantity = Number(item.quantity || 1);
      
      // Lấy categoryId từ productCategoryMap (tra cứu chéo), nếu không có thì fallback sang 0
      const catId = Number(productCategoryMap[item.productId] || 0);

      if (catId === 1) {
        north += quantity;
      } else if (catId === 2) {
        central += quantity;
      } else if (catId === 3) {
        south += quantity;
      } else {
        // Phân tích fallback từ tên sản phẩm
        const pName = String(item.productName || "").toLowerCase();
        if (pName.includes("bắc") || pName.includes("hà nội") || pName.includes("cốm")) north += quantity;
        else if (pName.includes("trung") || pName.includes("huế") || pName.includes("đà nẵng") || pName.includes("mì quảng")) central += quantity;
        else south += quantity; // Mặc định Nam
      }
    });
  });

  // Hiển thị dữ liệu mẫu nếu chưa có đơn hàng nào có sản phẩm
  if (north === 0 && central === 0 && south === 0) {
    north = 35; central = 20; south = 45;
  }

  globalRegionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Miền Bắc', 'Miền Trung', 'Miền Nam'],
      datasets: [{
        data: [north, central, south],
        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, padding: 15, font: { size: 11, family: "'Roboto', sans-serif" } }
        }
      },
      cutout: '70%'
    }
  });
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
