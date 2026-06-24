const ApiClient = {
  /**
   * Phương thức gọi fetch API – KHÔNG còn fallback sang Mock Data.
   * Khi BE offline sẽ throw error rõ ràng.
   */
  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;

    // Tự động gắn Authorization Header nếu có token
    const token = Storage.getToken();
    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Nếu body là FormData thì không đặt Content-Type (trình duyệt tự điền boundary)
    if (options.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const fetchOptions = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, fetchOptions);

      // Xử lý mã trạng thái 204 No Content
      if (response.status === 204) {
        return null;
      }

      if (!response.ok) {
        let errMsg = `Lỗi API: ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData.detail) {
            // Xử lý Spring ProblemDetail (500, 404, RuntimeException)
            errMsg = errData.detail;
          } else if (typeof errData === 'object' && !errData.message && Object.keys(errData).length > 0) {
            // Xử lý Spring Validation Error Map (400 Bad Request)
            const errors = Object.values(errData);
            if (typeof errors[0] === 'string') {
              errMsg = errors.join('\n');
            }
          } else if (errData.message) {
            errMsg = errData.message;
          }
        } catch (_) { }
        throw new Error(errMsg);
      }

      // Một số endpoint trả về plain text (vd: register trả về "Đăng ký thành công")
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      // Bắt lỗi kết nối mạng / sập server – throw rõ ràng, KHÔNG fallback mock
      if (error instanceof TypeError && (error.message.includes("failed to fetch") || error.message.includes("NetworkError") || error.message.includes("Failed to fetch"))) {
        throw new Error("Không thể kết nối đến máy chủ Backend (localhost:8080). Vui lòng đảm bảo Spring Boot đang chạy.");
      }
      throw error;
    }
  }
};

/**
 * API Gọi sản phẩm cho người dùng
 */
const ProductApi = {
  async getProducts() {
    const products = await ApiClient.request("/products");
    return Array.isArray(products) ? products.sort((a, b) => (a.description || "").localeCompare(b.description || "")) : products;
  },
  async searchProductsByName(name) {
    const products = await ApiClient.request(`/products/search?name=${encodeURIComponent(name)}`);
    return Array.isArray(products) ? products.sort((a, b) => (a.description || "").localeCompare(b.description || "")) : products;
  },
  async getProductsByCategory(categoryId) {
    const products = await ApiClient.request(`/products/category/${categoryId}`);
    return Array.isArray(products) ? products.sort((a, b) => (a.description || "").localeCompare(b.description || "")) : products;
  },
  getProductById(id) {
    return ApiClient.request(`/products/${id}`);
  }
};

/**
 * API Đánh giá sản phẩm
 */
const ReviewApi = {
  getByProduct(productId) {
    return ApiClient.request(`/reviews/product/${productId}`);
  },
  save(productId, rating, comment = "") {
    return ApiClient.request("/reviews", {
      method: "POST",
      body: JSON.stringify({ productId, rating, comment })
    });
  }
};

/**
 * API Xác thực tài khoản
 */
const AuthApi = {
  login(username, password) {
    return ApiClient.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
  },
  register(payload) {
    return ApiClient.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};

/**
 * API Admin quản lý sản phẩm
 */
const AdminProductApi = {
  async getProducts() {
    const products = await ApiClient.request("/admin/products");
    return Array.isArray(products) ? products.sort((a, b) => (a.description || "").localeCompare(b.description || "")) : products;
  },
  getProductById(id) {
    return ApiClient.request(`/admin/products/${id}`);
  },
  async searchProducts(name) {
    const products = await ApiClient.request(`/admin/products/search?name=${encodeURIComponent(name)}`);
    return Array.isArray(products) ? products.sort((a, b) => (a.description || "").localeCompare(b.description || "")) : products;
  },
  createProduct(payload) {
    return ApiClient.request("/admin/products", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  updateProduct(id, payload) {
    return ApiClient.request(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  deleteProduct(id) {
    return ApiClient.request(`/admin/products/${id}`, {
      method: "DELETE"
    });
  },
  uploadProductImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    // headers để trống, trình duyệt tự điền multipart boundary
    return ApiClient.request("/admin/products/upload", {
      method: "POST",
      body: formData,
      headers: {}
    });
  },
  // BE dùng PUT (không phải PATCH)
  updateProductStatus(id, status) {
    return ApiClient.request(`/admin/products/${id}/status?status=${encodeURIComponent(status)}`, {
      method: "PUT"
    });
  }
};

/**
 * API Giỏ hàng (Server-side, yêu cầu đăng nhập)
 */
const CartApi = {
  getCart() {
    return ApiClient.request("/carts");
  },
  addItem(productId, quantity = 1) {
    return ApiClient.request(`/carts/add?productId=${productId}&quantity=${quantity}`, {
      method: "POST"
    });
  },
  updateItem(cartItemId, action) {
    // action: "increase" | "decrease"
    return ApiClient.request(`/carts/update/${cartItemId}?action=${action}`, {
      method: "PUT"
    });
  },
  removeItem(cartItemId) {
    return ApiClient.request(`/carts/remove/${cartItemId}`, {
      method: "DELETE"
    });
  },
  clearCart() {
    return ApiClient.request("/carts/clear", {
      method: "DELETE"
    });
  }
};

/**
 * API Đơn hàng người dùng
 */
const OrderApi = {
  getCheckoutPreview() {
    return ApiClient.request("/orders/previews");
  },
  checkout(receiverName, receiverPhone, receiverAddress, note = "") {
    return ApiClient.request("/orders/checkout", {
      method: "POST",
      body: JSON.stringify({ receiverName, receiverPhone, receiverAddress, note })
    });
  },
  getHistory() {
    return ApiClient.request("/orders");
  },
  getById(orderId) {
    return ApiClient.request(`/orders/${orderId}`);
  },
  markAsReceived(orderId) {
    return ApiClient.request(`/orders/${orderId}/receive`, {
      method: "PUT"
    });
  },
  cancelOrder(orderId) {
    return ApiClient.request(`/orders/${orderId}/cancel`, {
      method: "PUT"
    });
  }
};

/**
 * API Admin quản lý đơn hàng
 */
const AdminOrderApi = {
  getOrders() {
    return ApiClient.request("/admin/orders");
  },
  getOrderById(orderId) {
    return ApiClient.request(`/admin/orders/${orderId}`);
  },
  updateStatus(orderId, status) {
    return ApiClient.request(`/admin/orders/${orderId}/status?status=${encodeURIComponent(status)}`, {
      method: "PUT"
    });
  }
};

/**
 * API Người dùng (Thông tin cá nhân & Đổi mật khẩu)
 */
const UserApi = {
  getProfile() {
    return ApiClient.request("/profile");
  },
  updateProfile(payload) {
    return ApiClient.request("/profile", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  changePassword(oldPassword, newPassword, confirmPassword) {
    return ApiClient.request("/profile/password", {
      method: "PUT",
      body: JSON.stringify({ oldPassword, newPassword, confirmPassword })
    });
  }
};

/**
 * API Admin quản lý người dùng
 */
const AdminUserApi = {
  getAllUsers(page = 0, size = 100) {
    return ApiClient.request(`/admin/users?page=${page}&size=${size}`);
  },
  getUserById(id) {
    return ApiClient.request(`/admin/users/${id}`);
  },
  updateUser(id, payload) {
    return ApiClient.request(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  }
};

