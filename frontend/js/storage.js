// Hàm này có nhiệm vụ lấy và lưu dữ liệu vào localStorage - localStorage là nơi lưu trữ dữ liệu tạm thời của trình duyệt có thể coi như là bộ nhớ RAM của trình duyệt 
// Đã sửa lỗi Localhost không thể truy cập
const Storage = {
  /**
   * Lấy giỏ hàng từ localStorage
   */
  getCart() {
    try {
      const cart = localStorage.getItem(CONFIG.CART_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (e) {
      console.error("Lỗi khi đọc giỏ hàng từ localStorage", e);
      return [];
    }
  },

  /**
   * Lưu giỏ hàng vào localStorage
   */
  saveCart(cart) {
    try {
      localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Lỗi khi lưu giỏ hàng vào localStorage", e);
    }
  },

  /**
   * Xóa giỏ hàng khỏi localStorage
   */
  clearCart() {
    localStorage.removeItem(CONFIG.CART_KEY);
  },

  /**
   * Lấy JWT token từ localStorage
   */
  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  },

  /**
   * Lưu thông tin đăng nhập (token & type)
   */
  saveAuth(data) {
    if (data.accessToken) {
      localStorage.setItem(CONFIG.TOKEN_KEY, data.accessToken);
    }
    if (data.tokenType) {
      localStorage.setItem(CONFIG.TOKEN_TYPE_KEY, data.tokenType || "Bearer");
    }
  },

  /**
   * Xóa thông tin đăng nhập
   */
  clearAuth() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.TOKEN_TYPE_KEY);
    localStorage.removeItem(CONFIG.CURRENT_USER_KEY);
  },

  /**
   * Lấy thông tin user hiện tại
   */
  getCurrentUser() {
    try {
      const user = localStorage.getItem(CONFIG.CURRENT_USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error("Lỗi khi đọc user từ localStorage", e);
      return null;
    }
  },

  /**
   * Lưu thông tin user hiện tại
   */
  saveCurrentUser(user) {
    try {
      localStorage.setItem(CONFIG.CURRENT_USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Lỗi khi lưu user vào localStorage", e);
    }
  },

  /**
   * Lấy thông báo từ localStorage
   */
  getNotifications() {
    try {
      const notifs = localStorage.getItem(CONFIG.NOTIFICATIONS_KEY);
      return notifs ? JSON.parse(notifs) : [];
    } catch (e) {
      console.error("Lỗi khi đọc notifications từ localStorage", e);
      return [];
    }
  },

  /**
   * Lưu thông báo vào localStorage
   */
  saveNotifications(notifs) {
    try {
      localStorage.setItem(CONFIG.NOTIFICATIONS_KEY, JSON.stringify(notifs));
    } catch (e) {
      console.error("Lỗi khi lưu notifications vào localStorage", e);
    }
  },

  /**
   * Thêm 1 thông báo mới
   * type: 'info', 'success', 'warning', 'error'
   */
  addNotification(title, message, type = 'info', icon = 'bell') {
    const notifs = this.getNotifications();
    const newNotif = {
      id: Date.now(),
      title,
      message,
      type,
      icon,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifs.unshift(newNotif);
    if (notifs.length > 20) {
      notifs.pop();
    }
    this.saveNotifications(notifs);
    
    // Phát sự kiện để cập nhật giao diện ngay lập tức
    window.dispatchEvent(new Event('notificationsUpdated'));
    return newNotif;
  },

  /**
// Hàm này có nhiệm vụ lấy và lưu dữ liệu vào localStorage - localStorage là nơi lưu trữ dữ liệu tạm thời của trình duyệt có thể coi như là bộ nhớ RAM của trình duyệt 
// Đã sửa lỗi Localhost không thể truy cập
const Storage = {
  /**
   * Lấy giỏ hàng từ localStorage
   */
  getCart() {
    try {
      const cart = localStorage.getItem(CONFIG.CART_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (e) {
      console.error("Lỗi khi đọc giỏ hàng từ localStorage", e);
      return [];
    }
  },

  /**
   * Lưu giỏ hàng vào localStorage
   */
  saveCart(cart) {
    try {
      localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Lỗi khi lưu giỏ hàng vào localStorage", e);
    }
  },

  /**
   * Xóa giỏ hàng khỏi localStorage
   */
  clearCart() {
    localStorage.removeItem(CONFIG.CART_KEY);
  },

  /**
   * Lấy JWT token từ localStorage
   */
  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  },

  /**
   * Lưu thông tin đăng nhập (token & type)
   */
  saveAuth(data) {
    if (data.accessToken) {
      localStorage.setItem(CONFIG.TOKEN_KEY, data.accessToken);
    }
    if (data.tokenType) {
      localStorage.setItem(CONFIG.TOKEN_TYPE_KEY, data.tokenType || "Bearer");
    }
  },

  /**
   * Xóa thông tin đăng nhập
   */
  clearAuth() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.TOKEN_TYPE_KEY);
    localStorage.removeItem(CONFIG.CURRENT_USER_KEY);
  },

  /**
   * Lấy thông tin user hiện tại
   */
  getCurrentUser() {
    try {
      const user = localStorage.getItem(CONFIG.CURRENT_USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error("Lỗi khi đọc user từ localStorage", e);
      return null;
    }
  },

  /**
   * Lưu thông tin user hiện tại
   */
  saveCurrentUser(user) {
    try {
      localStorage.setItem(CONFIG.CURRENT_USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Lỗi khi lưu user vào localStorage", e);
    }
  },

  /**
   * Lấy thông báo từ localStorage
   */
  getNotifications() {
    try {
      const notifs = localStorage.getItem(CONFIG.NOTIFICATIONS_KEY);
      return notifs ? JSON.parse(notifs) : [];
    } catch (e) {
      console.error("Lỗi khi đọc notifications từ localStorage", e);
      return [];
    }
  },

  /**
   * Lưu thông báo vào localStorage
   */
  saveNotifications(notifs) {
    try {
      localStorage.setItem(CONFIG.NOTIFICATIONS_KEY, JSON.stringify(notifs));
    } catch (e) {
      console.error("Lỗi khi lưu notifications vào localStorage", e);
    }
  },

  /**
   * Thêm 1 thông báo mới
   * type: 'info', 'success', 'warning', 'error'
   */
  addNotification(title, message, type = 'info', icon = 'bell') {
    const notifs = this.getNotifications();
    const newNotif = {
      id: Date.now(),
      title,
      message,
      type,
      icon,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifs.unshift(newNotif);
    if (notifs.length > 20) {
      notifs.pop();
    }
    this.saveNotifications(notifs);
    
    // Phát sự kiện để cập nhật giao diện ngay lập tức
    window.dispatchEvent(new Event('notificationsUpdated'));
    return newNotif;
  },

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  getUnreadNotificationCount() {
    return this.getNotifications().filter(n => !n.isRead).length;
  },

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  markNotificationAsRead(id) {
    const notifs = this.getNotifications();
    const notif = notifs.find(n => n.id === id);
    if (notif && !notif.isRead) {
      notif.isRead = true;
      this.saveNotifications(notifs);
      window.dispatchEvent(new Event('notificationsUpdated'));
    }
  },

  /**
   * Đánh dấu tất cả là đã đọc
   */
  markAllNotificationsAsRead() {
    const notifs = this.getNotifications();
    notifs.forEach(n => n.isRead = true);
    this.saveNotifications(notifs);
    window.dispatchEvent(new Event('notificationsUpdated'));
  }
};
