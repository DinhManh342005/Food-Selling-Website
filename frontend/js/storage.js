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
  }
};
