const container = document.getElementById("container");
const registerButton = document.getElementById("signUp");
const loginButton = document.getElementById("signIn");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const API_BASE_URL = "http://localhost:8080/api";

registerButton.addEventListener("click", function () {
  container.classList.add("right-panel-active");
});

loginButton.addEventListener("click", function () {
  container.classList.remove("right-panel-active");
});

// LOGIN
loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("Vui lòng nhập email và mật khẩu");
    return;
  }

  try {
    const data = await login(email, password);

    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("fullName", data.fullName);
    localStorage.setItem("email", data.email);
    localStorage.setItem("role", data.role);

    redirectByRole(data.role);
  } catch (error) {
    console.error("Login error:", error);
    alert(error.message || "Đăng nhập thất bại");
  }
});

// REGISTER
registerForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const fullName = document.getElementById("registerFullName").value.trim();
  const phone = document.getElementById("registerPhone").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  const confirmPassword = document
    .getElementById("registerConfirmPassword")
    .value.trim();

  if (!fullName || !phone || !email || !password || !confirmPassword) {
    alert("Vui lòng nhập đầy đủ thông tin đăng ký");
    return;
  }

  if (password !== confirmPassword) {
    alert("Mật khẩu nhập lại không khớp");
    return;
  }

  try {
    await register(fullName, phone, email, password);

    alert("Đăng ký thành công. Vui lòng đăng nhập.");

    registerForm.reset();
    container.classList.remove("right-panel-active");
  } catch (error) {
    console.error("Register error:", error);
    alert(error.message || "Đăng ký thất bại");
  }
});

// API LOGIN
async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: password,
    }),
  });

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error("Backend không trả về JSON hợp lệ");
  }

  if (!response.ok) {
    throw new Error(data.message || "Email hoặc mật khẩu không đúng");
  }

  return data;
}

// API REGISTER
async function register(fullName, phone, email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName: fullName,
      phone: phone,
      email: email,
      password: password,
    }),
  });

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Đăng ký thất bại");
  }

  return data;
}

// REDIRECT BY ROLE
function redirectByRole(role) {
  if (!role) {
    alert("Không xác định được quyền tài khoản");
    return;
  }

  const normalizedRole = role.toUpperCase();

  if (normalizedRole === "ADMIN" || normalizedRole === "ROLE_ADMIN") {
    window.location.href = "../admin/dashboard.html";
    return;
  }

  if (normalizedRole === "USER" || normalizedRole === "ROLE_USER") {
    window.location.href = "../index.html";
    return;
  }

  alert("Tài khoản không có quyền hợp lệ");
}
