// Khởi tạo theme ngay lập tức để tránh FOUC (Flash of Unstyled Content)
initTheme();

document.addEventListener("DOMContentLoaded", () => {
  // 1. Tự động tiêm Header và Footer nếu có placeholder
  injectHeaderFooter();

  // Cập nhật icon theme sau khi Header được inject vào DOM
  updateThemeIcon();

  // 1b. Tự động tiêm Cart Drawer và Mobile Menu vào Body nếu chưa tồn tại
  injectCommonComponents();

  // 2. Xử lý Sticky Header và shadow khi cuộn trang
  const header = document.querySelector("header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 10) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });
  }

  // Khởi tạo AOS nếu thư viện đã được load
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 600,
      once: true,
    });
  }

  // 3. Xử lý Trạng thái đăng nhập trên Header
  updateHeaderAuthStatus();

  // 4. Khởi tạo UI thông báo
  if (typeof Storage !== 'undefined' && Storage.getNotifications) {
    updateNotificationsUI();
    window.addEventListener('notificationsUpdated', updateNotificationsUI);
  }

  // 4. Tìm kiếm từ Header
  const searchForm = document.getElementById("header-search-form");
  const searchInput = document.getElementById("header-search-input");
  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const keyword = searchInput.value.trim();
      if (keyword) {
        window.location.href = `products.html?search=${encodeURIComponent(keyword)}`;
      }
    });
  }

  // 5. Ràng buộc các sự kiện nút bấm mở/đóng Cart Drawer
  const cartToggleBtns = document.querySelectorAll(".cart-toggle-btn");
  cartToggleBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      Cart.openCartDrawer();
    });
  });

  // 6. Xử lý mở/đóng Mobile Menu
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  const mobileMenuOverlay = document.getElementById("mobile-menu-overlay");

  if (mobileMenuToggle && mobileMenuOverlay) {
    mobileMenuToggle.addEventListener("click", () => {
      mobileMenuOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
    });

    mobileMenuOverlay.addEventListener("click", (e) => {
      if (e.target === mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }

  // Đóng Cart Drawer khi nhấn Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      Cart.closeCartDrawer();
    }
  });

  // Đóng user dropdown khi click ra ngoài
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("user-dropdown");
    const userBtn = document.getElementById("header-user-btn");
    if (dropdown && userBtn && !userBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("active-dropdown");
    }
  });
});

/**
 * Ràng buộc sự kiện cho nút User
 */
function bindUserBtnEvents() {
  const userBtn = document.getElementById("header-user-btn");
  if (userBtn) {
    userBtn.addEventListener("click", (e) => {
      const token = localStorage.getItem("accessToken") || Storage.getToken();
      if (!token) {
        // Chưa đăng nhập: để chuyển hướng tự nhiên sang pages/auth.html
        return;
      }
      // Đã đăng nhập: vì pages/profile.html chưa tồn tại, ngăn chặn chuyển hướng và toggle dropdown
      e.preventDefault();
      const dropdown = document.getElementById("user-dropdown");
      if (dropdown) {
        dropdown.classList.toggle("active-dropdown");
      }
    });
  }
}

/**
 * Tiêm Header và Footer cho các trang (ngoại trừ admin)
 */
function injectHeaderFooter() {
  const appHeader = document.getElementById("app-header");
  const pathPrefix = "";
  if (appHeader) {
    appHeader.innerHTML = `
      <!-- MAIN HEADER -->
      <header>
        <div class="main-header">
          <div class="container main-header-content">
            <!-- Logo -->
            <a href="${pathPrefix}index.html" class="flex items-center gap-3 group">
              <div class="relative w-12 h-12 rounded-full border-2 border-brand-700 bg-white flex items-center justify-center overflow-hidden transform group-hover:rotate-6 transition-all duration-300">
                <img src="${pathPrefix}../assets/img/freshbite_logo.png" alt="FreshBite Logo" class="w-full h-full object-cover">
              </div>
              <div class="flex flex-col">
                <span class="text-2xl font-serif italic tracking-widest text-brand-700 leading-none group-hover:text-brand-500 transition-colors">FreshBite</span>
                <span class="text-[8px] text-brand-600 font-bold tracking-widest mt-1.5 uppercase">— Tươi ngon & Đậm đà —</span>
              </div>
            </a>

            <!-- Search Bar -->
            <form id="header-search-form" class="flex-grow max-w-xl hidden md:flex items-center relative">
              <input type="text" id="header-search-input" placeholder="Tìm kiếm đặc sản miền Bắc, Trung, Nam..." class="w-full bg-slate-50 border border-slate-200 rounded-full px-5 py-2.5 pr-12 text-sm focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all outline-none">
              <button type="submit" class="absolute right-4 text-slate-400 hover:text-orange-600 transition-colors">
                <i class="fa-solid fa-magnifying-glass"></i>
              </button>
            </form>

            <!-- Header Actions -->
            <div class="flex items-center gap-5">
              <!-- Favorite Icon -->
              <a href="#" class="p-2 text-slate-600 hover:text-brand-600 transition-colors" title="Yêu thích">
                <i class="fa-regular fa-heart text-xl"></i>
              </a>

              <!-- Notification Icon -->
              <div class="relative group" id="header-notification-wrapper">
                <a href="#" class="p-2 text-slate-600 hover:text-orange-600 transition-colors flex items-center justify-center" title="Thông báo">
                  <i class="fa-regular fa-bell text-xl"></i>
                  <span id="notification-badge" class="absolute top-1.5 right-1.5 bg-orange-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white hidden">0</span>
                </a>
                <div class="absolute right-0 top-full pt-2 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                  <div class="bg-white rounded-xl shadow-xl border border-slate-100 py-2 text-slate-700">
                    <div class="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                      <span class="font-bold text-slate-800 font-semibold">Thông báo mới</span>
                      <a href="#" onclick="if(typeof Storage!=='undefined'){Storage.markAllNotificationsAsRead();} return false;" class="text-xs text-orange-600 hover:underline">Đánh dấu đã đọc</a>
                    </div>
                    <div id="notification-list" class="max-h-64 overflow-y-auto font-normal flex flex-col items-center justify-center py-8">
                      <i class="fa-regular fa-bell-slash text-4xl text-slate-300 mb-3"></i>
                      <p class="text-sm text-slate-500 font-medium">Chưa có thông báo mới</p>
                    </div>
                    <div class="px-4 py-2 text-center border-t border-slate-50">
                      <a href="#" class="text-xs text-slate-500 hover:text-orange-600 font-semibold">Xem tất cả thông báo</a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Cart Button -->
              <a href="#" class="cart-toggle-btn relative p-2 text-slate-600 hover:text-orange-600 transition-colors" title="Giỏ hàng">
                <i class="fa-solid fa-cart-shopping text-xl"></i>
                <span class="cart-badge absolute -top-0.5 -right-0.5 bg-orange-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white hidden">0</span>
              </a>

              <!-- Dark Mode Toggle -->
              <button id="theme-toggle-btn" onclick="toggleTheme()" title="Chuyển giao diện tối/sáng" aria-label="Toggle dark mode">
                <i class="fa-solid fa-moon" id="theme-icon"></i>
              </button>

              <div id="header-auth-section" class="relative">
                <!-- Rendered by JS -->
              </div>

              <button id="mobile-menu-toggle" class="md:hidden text-slate-600 hover:text-orange-600 p-2">
                <i class="fa-solid fa-bars text-xl"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Search Form Row -->
        <div id="mobile-search-row" class="bg-slate-50 border-b p-3 hidden md:hidden">
          <form id="mobile-search-form" class="relative flex items-center w-full">
            <input type="text" id="mobile-search-input" placeholder="Tìm kiếm món ăn..." class="w-full bg-white border border-slate-200 rounded-full px-4 py-2 pr-10 text-sm focus:border-orange-500 outline-none">
            <button type="submit" class="absolute right-3.5 text-slate-400 hover:text-orange-600">
              <i class="fa-solid fa-magnifying-glass"></i>
            </button>
          </form>
        </div>

      </header>
    `;
  }

  const appFooter = document.getElementById("app-footer");
  if (appFooter) {
    appFooter.innerHTML = `
      <footer>
        <div class="container">
          <div class="footer-grid border-b border-slate-200 pb-10">
            <div>
              <div class="flex items-center gap-2 text-slate-800 text-xl mb-4 font-serif italic tracking-widest">
                FreshBite
              </div>
              <p class="text-sm mb-4 leading-relaxed text-slate-600">Chúng tôi tự hào là đơn vị cung cấp đặc sản mang đậm bản sắc và chuẩn mực chất lượng.</p>
              <div class="flex gap-3">
                <a href="#" class="w-8 h-8 rounded-full bg-slate-200 text-slate-650 hover:bg-brand-600 hover:text-white flex items-center justify-center transition-all" title="Facebook"><i class="fa-brands fa-facebook-f text-sm"></i></a>
                <a href="#" class="w-8 h-8 rounded-full bg-slate-200 text-slate-650 hover:bg-brand-600 hover:text-white flex items-center justify-center transition-all" title="Youtube"><i class="fa-brands fa-youtube text-sm"></i></a>
                <a href="#" class="w-8 h-8 rounded-full bg-slate-200 text-slate-650 hover:bg-brand-600 hover:text-white flex items-center justify-center transition-all" title="Tiktok"><i class="fa-brands fa-tiktok text-sm"></i></a>
              </div>
            </div>
            <div>
              <h3 class="footer-title">Khám Phá</h3>
              <ul class="footer-links">
                <li><a href="${pathPrefix}products.html?category=1">Đặc sản Miền Bắc</a></li>
                <li><a href="${pathPrefix}products.html?category=2">Đặc sản Miền Trung</a></li>
                <li><a href="${pathPrefix}products.html?category=3">Đặc sản Miền Nam</a></li>
                <li><a href="${pathPrefix}products.html">Sản phẩm nổi bật</a></li>
              </ul>
            </div>
            <div>
              <h3 class="footer-title">Chính sách</h3>
              <ul class="footer-links">
                <li><a href="#">Chính sách đổi trả</a></li>
                <li><a href="#">Hình thức thanh toán</a></li>
                <li><a href="#">Liên hệ hỗ trợ</a></li>
              </ul>
            </div>
            <div>
              <h3 class="footer-title">Thông Tin Liên Hệ</h3>
              <ul class="footer-links text-sm">
                <li class="flex items-start gap-2 text-slate-400"><i class="fa-solid fa-location-dot mt-1"></i> <span>Đường Tô Hiến Thành, Quận 10, TP. Hồ Chí Minh</span></li>
                <li class="flex items-center gap-2 text-slate-400"><i class="fa-solid fa-phone"></i> <span>1900 6868</span></li>
                <li class="flex items-center gap-2 text-slate-400"><i class="fa-solid fa-envelope"></i> <span>hotro@freshbite.vn</span></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2026 FreshBite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    `;
  }
}

/**
 * Tiêm các thành phần dùng chung (Cart Drawer, Mobile Drawer, Toast Container) vào DOM
 */
function injectCommonComponents() {
  const pathPrefix = "";
  if (!document.getElementById("cart-drawer-overlay") && !window.location.pathname.includes("admin-")) {
    const cartOverlay = document.createElement("div");
    cartOverlay.id = "cart-drawer-overlay";
    cartOverlay.className = "cart-drawer-overlay";
    cartOverlay.onclick = () => Cart.closeCartDrawer();

    cartOverlay.innerHTML = `
      <div class="cart-drawer" onclick="event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i class="fa-solid fa-cart-shopping text-brand-600"></i>
            Giỏ Hàng Của Bạn
          </h3>
          <button onclick="Cart.closeCartDrawer()" class="text-slate-400 hover:text-slate-600 p-2">
            <i class="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        <!-- Body -->
        <div id="cart-items-wrapper" class="flex-grow overflow-y-auto bg-slate-50">
          <!-- Rendered by Cart.renderCartDrawer() -->
        </div>
        <!-- Footer -->
        <div class="p-4 border-t border-slate-100 bg-white">
          <div class="flex justify-between items-center mb-4">
            <span class="text-sm font-semibold text-slate-600">Tổng cộng:</span>
            <span id="cart-total-amount" class="text-xl font-bold text-brand-600">0đ</span>
          </div>
          <a href="${pathPrefix}checkout.html" id="cart-checkout-btn" class="btn btn-primary w-full py-3 text-center font-bold">Thanh Toán Ngay</a>
        </div>
      </div>
    `;
    document.body.appendChild(cartOverlay);
  }

  if (!document.getElementById("mobile-menu-overlay") && !window.location.pathname.includes("admin-")) {
    const menuOverlay = document.createElement("div");
    menuOverlay.id = "mobile-menu-overlay";
    menuOverlay.className = "mobile-menu-overlay";

    const user = Storage.getCurrentUser();
    const isAdmin = user && user.role === "admin";

    menuOverlay.innerHTML = `
      <div class="mobile-menu" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between border-b pb-4">
          <h2 class="text-xl font-bold font-serif italic tracking-widest text-slate-800">FreshBite</h2>
          <button onclick="document.getElementById('mobile-menu-overlay').classList.remove('active'); document.body.style.overflow = ''" class="text-slate-400 hover:text-slate-600 p-2">
            <i class="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        <ul class="mobile-menu-links mt-4">
          <li><a href="${pathPrefix}index.html"><i class="fa-solid fa-house w-6 text-center text-slate-400"></i> Trang Chủ</a></li>
          <li><a href="${pathPrefix}products.html"><i class="fa-solid fa-box w-6 text-center text-slate-400"></i> Sản Phẩm</a></li>
          <li><a href="${pathPrefix}products.html?category=1"><i class="fa-solid fa-map-location w-6 text-center text-slate-400"></i> Miền Bắc</a></li>
          <li><a href="${pathPrefix}products.html?category=2"><i class="fa-solid fa-map-location w-6 text-center text-slate-400"></i> Miền Trung</a></li>
          <li><a href="${pathPrefix}products.html?category=3"><i class="fa-solid fa-map-location w-6 text-center text-slate-400"></i> Miền Nam</a></li>
          ${isAdmin ? `<li><a href="${pathPrefix}admin-dashboard.html" class="text-brand-600 font-bold"><i class="fa-solid fa-chart-pie w-6 text-center"></i> Trang Quản Trị</a></li>` : ""}
        </ul>
        <div class="mt-auto border-t pt-4" id="mobile-auth-section">
          <!-- Trạng thái đăng nhập mobile -->
        </div>
      </div>
    `;
    document.body.appendChild(menuOverlay);
  }
}

function updateHeaderAuthStatus() {
  const authSection = document.getElementById("header-auth-section");
  const mobileAuthSection = document.getElementById("mobile-auth-section");
  const user = Storage.getCurrentUser();
  const token = localStorage.getItem("accessToken") || Storage.getToken();
  const pathPrefix = "";

  if (token && user) {
    const isAdmin = user.role === "admin";
    const displayName = user.fullName || user.username;

    if (authSection) {
      authSection.innerHTML = `
        <div class="relative group" id="user-menu-container">
          <a href="${pathPrefix}profile.html" id="header-user-btn" class="p-2 text-slate-600 hover:text-orange-600 transition-colors flex items-center justify-center" title="Tài khoản">
            <i class="fa-solid fa-user text-xl text-orange-600 animate__animated animate__fadeIn"></i>
          </a>
          <div id="user-dropdown" class="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
            <div class="bg-white rounded-lg shadow-lg border border-slate-100 py-1 text-slate-700 font-medium text-sm">
              <a href="${pathPrefix}profile.html" class="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50">
                <i class="fa-regular fa-id-card w-4 text-center text-slate-400"></i> Thông tin cá nhân
              </a>
              <a href="${pathPrefix}profile.html?tab=orders" class="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50">
                <i class="fa-solid fa-box w-4 text-center text-slate-400"></i> Đơn hàng của tôi
              </a>
              ${isAdmin ? `
              <a href="${pathPrefix}admin-dashboard.html" class="flex items-center gap-2 px-4 py-2.5 text-orange-600 font-semibold hover:bg-orange-50">
                <i class="fa-solid fa-chart-line w-4 text-center"></i> Quản trị hệ thống
              </a>` : ""}
              <hr class="border-slate-100 my-1">
              <button onclick="Auth.logout()" class="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-rose-50 text-rose-600 font-semibold">
                <i class="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i> Đăng xuất
              </button>
            </div>
          </div>
        </div>
      `;
      bindUserBtnEvents();
    }

    if (mobileAuthSection) {
      mobileAuthSection.innerHTML = `
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center font-bold">
            ${displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 class="font-bold text-slate-800 text-sm">${displayName}</h4>
            <p class="text-xs text-slate-500">${user.email || "Khách hàng"}</p>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <a href="${pathPrefix}profile.html" class="btn btn-outline py-2 text-center text-sm font-semibold">Tài khoản</a>
          <button onclick="Auth.logout()" class="btn btn-danger py-2 text-center text-sm font-semibold">Đăng xuất</button>
        </div>
      `;
    }
  } else {
    if (authSection) {
      authSection.innerHTML = `
        <a href="${pathPrefix}auth.html?action=login" id="header-user-btn" class="p-2 text-slate-600 hover:text-orange-600 transition-colors flex items-center justify-center" title="Đăng nhập / Đăng ký">
          <i class="fa-regular fa-user text-xl"></i>
        </a>
      `;
      bindUserBtnEvents();
    }

    if (mobileAuthSection) {
      mobileAuthSection.innerHTML = `
        <div class="flex flex-col gap-2">
          <a href="${pathPrefix}auth.html?action=login" class="btn btn-outline py-2 text-center text-sm font-semibold">Đăng Nhập</a>
          <a href="${pathPrefix}auth.html?action=register" class="btn btn-primary py-2 text-center text-sm font-semibold">Đăng Ký</a>
        </div>
      `;
    }
  }
}

function updateNotificationsUI() {
  const badge = document.getElementById("notification-badge");
  const list = document.getElementById("notification-list");
  if (!badge || !list || typeof Storage === 'undefined' || !Storage.getNotifications) return;

  const unreadCount = Storage.getUnreadNotificationCount();
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  const notifs = Storage.getNotifications();
  if (notifs.length === 0) {
    list.innerHTML = `
      <div class="flex flex-col items-center justify-center py-8">
        <i class="fa-regular fa-bell-slash text-4xl text-slate-300 mb-3"></i>
        <p class="text-sm text-slate-500 font-medium">Chưa có thông báo mới</p>
      </div>
    `;
    list.classList.remove("block");
    list.classList.add("flex");
  } else {
    list.classList.remove("flex", "flex-col", "items-center", "justify-center", "py-8");
    list.classList.add("block");
    list.innerHTML = notifs.map(n => {
      let iconHtml = '';
      if (n.icon === 'cart' || n.type === 'success') {
        iconHtml = '<div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">🛒</div>';
      } else if (n.icon === 'box' || n.type === 'info') {
        iconHtml = '<div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">📦</div>';
      } else {
        iconHtml = '<div class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">🔔</div>';
      }
      
      const unreadDot = n.isRead ? '' : '<div class="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0"></div>';
      const bgClass = n.isRead ? '' : 'bg-orange-50/30';
      
      return `
        <a href="#" onclick="if(typeof Storage !== 'undefined'){Storage.markNotificationAsRead(${n.id});} return false;" class="flex gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-b-0 ${bgClass}">
          ${iconHtml}
          <div class="flex-grow">
            <p class="text-xs font-semibold text-slate-800">${n.title}</p>
            <p class="text-[10px] text-slate-500 mt-0.5 line-clamp-2">${n.message}</p>
            <p class="text-[9px] text-slate-400 mt-1">${new Date(n.createdAt).toLocaleString('vi-VN')}</p>
          </div>
          ${unreadDot}
        </a>
      `;
    }).join('');
  }
}

/**
 * Khởi tạo theme từ localStorage khi trang load
 * Gọi trước DOMContentLoaded để tránh FOUC
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeIcon();
}

/**
 * Chuyển đổi giữa light / dark mode
 */
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
}

/**
 * Cập nhật icon của nút toggle theo theme hiện tại
 */
function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;

  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
  } else {
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
  }
}
