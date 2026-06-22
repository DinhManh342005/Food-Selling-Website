const Auth = {
  /**
   * Đăng ký tài khoản mới
   */
  async register(username, password, fullName, email, phone) {
    try {
      const payload = { username, password, fullName, email, phone };
      const user = await AuthApi.register(payload);
      UTILS.showToast("Đăng ký tài khoản thành công! Hãy đăng nhập ngay.", "success");
      setTimeout(() => {
        // Chuyển sang khung đăng nhập thay vì chuyển trang
        togglePanel(false);
      }, 1500);
      return user;
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      UTILS.showToast(error.message || "Đăng ký thất bại, vui lòng thử lại.", "danger");
      throw error;
    }
  },

  /**
   * Đăng nhập hệ thống
   */
  async login(username, password) {
    try {
      const authData = await AuthApi.login(username, password);
      // Lưu token vào localStorage
      Storage.saveAuth({
        accessToken: authData.accessToken,
        tokenType: authData.tokenType || "Bearer"
      });

      // Parse JWT payload to extract user info (since API only returns token)
      let role = "user";
      let decodedUsername = username;
      try {
        const payloadBase64 = authData.accessToken.split('.')[1];
        // Decode base64 (handle URL-safe base64 encoding)
        const decodedJson = JSON.parse(decodeURIComponent(escape(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')))));
        decodedUsername = decodedJson.sub || username;
        if (decodedJson.role) {
          role = decodedJson.role;
        } else if (decodedUsername.toLowerCase().includes('admin')) {
          role = "admin";
        }
      } catch (e) {
        console.warn("Không thể giải mã token:", e);
        if (username.toLowerCase().includes('admin')) {
          role = "admin";
        }
      }

      // Create a user object to save locally
      const user = {
        username: decodedUsername,
        fullName: decodedUsername,
        role: role
      };

      // Lưu thông tin người dùng hiện tại
      Storage.saveCurrentUser(user);

      UTILS.showToast(`Chào mừng ${user.fullName} đã quay trở lại!`, "success");

      // Chuyển hướng theo vai trò (Role)
      setTimeout(() => {
        if (user.role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else {
          // Quay lại trang trước đó hoặc trang chủ
          const redirect = UTILS.getQueryParam("redirect");
          window.location.href = redirect ? decodeURIComponent(redirect) : "index.html";
        }
      }, 1200);

      return authData;
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      UTILS.showToast(error.message || "Tài khoản hoặc mật khẩu không chính xác.", "danger");
      throw error;
    }
  },

  /**
   * Đăng xuất khỏi hệ thống
   */
  logout() {
    Storage.clearAuth();
    UTILS.showToast("Đã đăng xuất tài khoản thành công.", "info");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  },

  /**
   * Kiểm tra người dùng đã đăng nhập chưa
   */
  isLoggedIn() {
    return !!Storage.getToken();
  },

  /**
   * Kiểm tra xem người dùng hiện tại có phải là Admin không
   */
  isAdmin() {
    const user = Storage.getCurrentUser();
    return user && user.role === "admin";
  },

  /**
   * Yêu cầu quyền đăng nhập (Redirect nếu chưa đăng nhập)
   */
  requireAuth(requiredRole = "user") {
    if (!this.isLoggedIn()) {
      UTILS.showToast("Vui lòng đăng nhập để thực hiện chức năng này.", "warning");
      const currentUrl = encodeURIComponent(window.location.href);
      window.location.href = `auth.html?redirect=${currentUrl}`;
      return false;
    }

    if (requiredRole === "admin" && !this.isAdmin()) {
      UTILS.showToast("Bạn không có quyền truy cập trang quản trị.", "danger");
      window.location.href = "index.html";
      return false;
    }

    return true;
  }
};

// Hàm chuyển đổi Panel đăng nhập / đăng ký
function togglePanel(isRegister) {
  const container = document.getElementById("auth-container");
  if (!container) return;
  if (isRegister) {
    container.classList.add("right-panel-active");
    history.replaceState(null, "", "?action=register" + getRedirectParamString());
  } else {
    container.classList.remove("right-panel-active");
    history.replaceState(null, "", "?action=login" + getRedirectParamString());
  }
  clearAllErrors();
}

function getRedirectParamString() {
  const redirect = UTILS.getQueryParam("redirect");
  return redirect ? `&redirect=${encodeURIComponent(redirect)}` : "";
}

// Hàm hiển thị lỗi dưới ô input
function showError(input, errorId, message) {
  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }
  if (input) {
    input.classList.add("border-rose-500", "focus:ring-rose-500/20");
    input.classList.remove("focus:border-brand-500", "focus:ring-brand-500/20");
  }
}

// Hàm xóa lỗi của ô input
function clearError(input, errorId) {
  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }
  if (input) {
    input.classList.remove("border-rose-500", "focus:ring-rose-500/20");
    input.classList.add("focus:border-brand-500", "focus:ring-brand-500/20");
  }
}

function clearAllErrors() {
  const errorMsgs = document.querySelectorAll(".text-rose-500");
  errorMsgs.forEach(el => el.classList.add("hidden"));
  const inputs = document.querySelectorAll("input");
  inputs.forEach(input => {
    input.classList.remove("border-rose-500", "focus:ring-rose-500/20");
    input.classList.add("focus:border-brand-500", "focus:ring-brand-500/20");
  });
}

// Khởi chạy các sự kiện xác thực và chuyển đổi giao diện
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("auth-container");
  if (!container) return; // Chỉ chạy trên auth.html

  // 1. Kiểm tra Action mặc định từ URL
  const action = UTILS.getQueryParam("action");
  if (action === "register") {
    container.classList.add("right-panel-active");
  } else {
    container.classList.remove("right-panel-active");
  }

  // 2. Ràng buộc các nút chuyển đổi view (Desktop)
  const signUpBtn = document.getElementById("signUpBtn");
  const signInBtn = document.getElementById("signInBtn");
  if (signUpBtn && signInBtn) {
    signUpBtn.addEventListener("click", () => togglePanel(true));
    signInBtn.addEventListener("click", () => togglePanel(false));
  }

  // Ràng buộc nút chuyển đổi cho Mobile
  const toggleViewBtns = document.querySelectorAll(".toggle-view-btn");
  toggleViewBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const isActive = container.classList.contains("right-panel-active");
      togglePanel(!isActive);
    });
  });

  // 3. Ẩn/Hiện Mật Khẩu
  const togglePassBtn = document.getElementById("toggle-password");
  const toggleConfirmPassBtn = document.getElementById("toggle-confirmPassword");
  const toggleLoginPassBtn = document.getElementById("toggle-login-password");

  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const loginPasswordInput = document.getElementById("login-password");

  if (togglePassBtn && passwordInput) {
    togglePassBtn.addEventListener("click", () => {
      const isPass = passwordInput.type === "password";
      passwordInput.type = isPass ? "text" : "password";
      togglePassBtn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash text-sm"></i>' : '<i class="fa-regular fa-eye text-sm"></i>';
    });
  }

  if (toggleConfirmPassBtn && confirmPasswordInput) {
    toggleConfirmPassBtn.addEventListener("click", () => {
      const isPass = confirmPasswordInput.type === "password";
      confirmPasswordInput.type = isPass ? "text" : "password";
      toggleConfirmPassBtn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash text-sm"></i>' : '<i class="fa-regular fa-eye text-sm"></i>';
    });
  }

  if (toggleLoginPassBtn && loginPasswordInput) {
    toggleLoginPassBtn.addEventListener("click", () => {
      const isPass = loginPasswordInput.type === "password";
      loginPasswordInput.type = isPass ? "text" : "password";
      toggleLoginPassBtn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash text-sm"></i>' : '<i class="fa-regular fa-eye text-sm"></i>';
    });
  }

  // 4. Xử lý xóa trạng thái lỗi khi người dùng gõ
  const fullNameInput = document.getElementById("fullName");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const termsCheckbox = document.getElementById("terms");

  const loginUsernameInput = document.getElementById("login-username");

  if (fullNameInput) fullNameInput.addEventListener("input", () => clearError(fullNameInput, "fullName-error"));
  if (usernameInput) usernameInput.addEventListener("input", () => clearError(usernameInput, "username-error"));
  if (emailInput) emailInput.addEventListener("input", () => clearError(emailInput, "email-error"));
  if (phoneInput) phoneInput.addEventListener("input", () => clearError(phoneInput, "phone-error"));
  if (passwordInput) passwordInput.addEventListener("input", () => clearError(passwordInput, "password-error"));
  if (confirmPasswordInput) confirmPasswordInput.addEventListener("input", () => clearError(confirmPasswordInput, "confirmPassword-error"));
  if (termsCheckbox) {
    termsCheckbox.addEventListener("change", () => {
      if (termsCheckbox.checked) clearError(null, "terms-error");
    });
  }

  if (loginUsernameInput) loginUsernameInput.addEventListener("input", () => clearError(loginUsernameInput, "login-username-error"));
  if (loginPasswordInput) loginPasswordInput.addEventListener("input", () => clearError(loginPasswordInput, "login-password-error"));

  // 5. Submit Form Đăng Ký
  const registerForm = document.getElementById("site-register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      let isValid = true;

      // Validate Họ và tên
      const fullName = fullNameInput.value.trim();
      if (!fullName) {
        showError(fullNameInput, "fullName-error", "Họ và tên không được để trống");
        isValid = false;
      }

      // Validate Tên đăng nhập
      const username = usernameInput.value.trim();
      if (!username) {
        showError(usernameInput, "username-error", "Tên đăng nhập không được để trống");
        isValid = false;
      } else if (username.length < 4) {
        showError(usernameInput, "username-error", "Tên đăng nhập phải chứa ít nhất 4 ký tự");
        isValid = false;
      }

      // Validate Email
      const email = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        showError(emailInput, "email-error", "Email không đúng định dạng");
        isValid = false;
      }

      // Validate Số điện thoại
      const phone = phoneInput.value.trim();
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (phone && !phoneRegex.test(phone)) {
        showError(phoneInput, "phone-error", "Số điện thoại không hợp lệ (Việt Nam)");
        isValid = false;
      }

      // Validate Mật khẩu
      const password = passwordInput.value;
      if (!password) {
        showError(passwordInput, "password-error", "Mật khẩu không được để trống");
        isValid = false;
      } else if (password.length < 6) {
        showError(passwordInput, "password-error", "Mật khẩu phải tối thiểu từ 6 ký tự");
        isValid = false;
      }

      // Validate Nhập lại mật khẩu
      const confirmPassword = confirmPasswordInput.value;
      if (!confirmPassword) {
        showError(confirmPasswordInput, "confirmPassword-error", "Vui lòng xác nhận lại mật khẩu");
        isValid = false;
      } else if (confirmPassword !== password) {
        showError(confirmPasswordInput, "confirmPassword-error", "Mật khẩu nhập lại không khớp");
        isValid = false;
      }

      // Validate Điều khoản
      if (!termsCheckbox.checked) {
        showError(null, "terms-error", "Bạn phải đồng ý với điều khoản dịch vụ");
        isValid = false;
      }

      if (!isValid) return;

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "ĐANG ĐĂNG KÝ...";

      try {
        await Auth.register(username, password, fullName, email, phone);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // 6. Submit Form Đăng Nhập
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      let isValid = true;

      const username = loginUsernameInput.value.trim();
      if (!username) {
        showError(loginUsernameInput, "login-username-error", "Vui lòng nhập tên đăng nhập");
        isValid = false;
      }

      const password = loginPasswordInput.value;
      if (!password) {
        showError(loginPasswordInput, "login-password-error", "Vui lòng nhập mật khẩu");
        isValid = false;
      }

      if (!isValid) return;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "ĐANG ĐĂNG NHẬP...";

      try {
        await Auth.login(username, password);

      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
});
