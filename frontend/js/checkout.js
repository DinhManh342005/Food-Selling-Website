// Script xử lý trang Thanh toán (checkout.html)
document.addEventListener("DOMContentLoaded", () => {
  // Yêu cầu đăng nhập trước khi checkout
  const currentUser = Storage.getCurrentUser();
  const token = Storage.getToken();

  if (!currentUser || !token) {
    UTILS.showToast("Vui lòng đăng nhập để tiến hành thanh toán.", "warning");
    setTimeout(() => {
      window.location.href = "auth.html";
    }, 1500);
    return;
  }

  // Tải thông tin người dùng lên form
  loadUserInfo(currentUser);

  // Lấy dữ liệu giỏ hàng (sử dụng API Cart)
  loadCheckoutData();

  // Khởi tạo các sự kiện
  initCheckoutEvents();
});

function loadUserInfo(user) {
  const nameInput = document.getElementById("checkout-name");
  const phoneInput = document.getElementById("checkout-phone");
  const emailInput = document.getElementById("checkout-email");

  if (nameInput) nameInput.value = user.fullName || "";
  if (phoneInput) phoneInput.value = user.phone || "";
  if (emailInput) emailInput.value = user.email || "";

  // Tải địa chỉ nếu có lưu trước đó
  const savedAddress = JSON.parse(localStorage.getItem("userAddress"));
  if (savedAddress) {
    const prov = document.getElementById("checkout-province");
    const dist = document.getElementById("checkout-district");
    const ward = document.getElementById("checkout-ward");
    const detail = document.getElementById("checkout-address");

    if (prov) prov.value = savedAddress.province || "";
    if (dist) dist.value = savedAddress.district || "";
    if (ward) ward.value = savedAddress.ward || "";
    if (detail) detail.value = savedAddress.addressDetail || "";
  }
}

async function loadCheckoutData() {
  const listContainer = document.getElementById("checkout-items-list");
  const subtotalEl = document.getElementById("checkout-subtotal");
  const shippingEl = document.getElementById("checkout-shipping");
  const totalEl = document.getElementById("checkout-total");
  const btnSubmit = document.getElementById("btn-submit-order");

  if (!listContainer) return;

  try {
    // Ưu tiên dùng API Cart nếu đã login
    const cartItems = await CartApi.getCart();

    if (!cartItems || cartItems.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-6">
          <p class="text-slate-500 mb-4">Giỏ hàng của bạn đang trống</p>
          <a href="index.html" class="btn btn-outline px-6 py-2">Tiếp tục mua hàng</a>
        </div>
      `;
      if (btnSubmit) btnSubmit.disabled = true;
      return;
    }

    let subtotal = 0;
    let html = "";

    cartItems.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      html += `
        <div class="flex gap-4 py-3 border-b border-slate-100 last:border-0">
          <div class="w-16 h-16 rounded bg-slate-50 border border-slate-200 overflow-hidden shrink-0 relative">
            <img src="${UTILS.getImageUrl(item.imageUrl)}" alt="${item.productName}" class="w-full h-full object-cover">
            <span class="absolute -top-2 -right-2 w-5 h-5 bg-slate-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">${item.quantity}</span>
          </div>
          <div class="flex-grow flex flex-col justify-center">
            <h4 class="text-sm font-bold text-slate-800 line-clamp-1">${item.productName}</h4>
            <div class="flex justify-between items-center mt-1">
              <span class="text-xs text-slate-500">${UTILS.formatCurrency(item.price)}</span>
              <span class="text-sm font-bold text-slate-800">${UTILS.formatCurrency(itemTotal)}</span>
            </div>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    const shippingFee = subtotal > 0 ? 30000 : 0; // Phí ship cố định 30k
    const total = subtotal + shippingFee;

    if (subtotalEl) subtotalEl.textContent = UTILS.formatCurrency(subtotal);
    if (shippingEl) shippingEl.textContent = UTILS.formatCurrency(shippingFee);
    if (totalEl) totalEl.textContent = UTILS.formatCurrency(total);

  } catch (error) {
    console.error("Lỗi khi tải giỏ hàng thanh toán:", error);
    UTILS.showToast("Không thể tải thông tin giỏ hàng.", "error");
  }
}

function initCheckoutEvents() {
  const form = document.getElementById("checkout-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleServerCheckout();
    });
  }

  // Nút áp dụng mã giảm giá (Chưa có API, chỉ mockup)
  const btnApplyCoupon = document.getElementById("btn-apply-coupon");
  if (btnApplyCoupon) {
    btnApplyCoupon.addEventListener("click", () => {
      const input = document.getElementById("coupon-input");
      if (input && input.value.trim() !== "") {
        UTILS.showToast("Mã giảm giá không hợp lệ hoặc đã hết hạn", "warning");
      }
    });
  }
}

/**
 * Xử lý thanh toán sử dụng API thực tế
 */
async function handleServerCheckout() {
  const btnSubmit = document.getElementById("btn-submit-order");
  const originalText = btnSubmit.innerHTML;

  // Thu thập dữ liệu
  const receiverName = document.getElementById("checkout-name").value.trim();
  const receiverPhone = document.getElementById("checkout-phone").value.trim();
  
  // Nối địa chỉ
  const prov = document.getElementById("checkout-province").value.trim();
  const dist = document.getElementById("checkout-district").value.trim();
  const ward = document.getElementById("checkout-ward").value.trim();
  const detail = document.getElementById("checkout-address").value.trim();
  const fullAddress = `${detail}, ${ward}, ${dist}, ${prov}`.replace(/^[,\s]+|[,\s]+$/g, '');
  
  const note = document.getElementById("checkout-note") ? document.getElementById("checkout-note").value.trim() : "";
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || "COD";

  // Validate
  if (!receiverName || !receiverPhone || !fullAddress) {
    UTILS.showToast("Vui lòng điền đầy đủ thông tin giao hàng.", "warning");
    return;
  }

  try {
    // Loading state
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang xử lý...`;

    // Gọi API Checkout
    const response = await OrderApi.checkout(receiverName, receiverPhone, fullAddress, note);

    // Thành công
    UTILS.showToast("Đặt hàng thành công!", "success");
    
    // Xóa giỏ hàng local vì API đã clear server cart
    localStorage.removeItem("cart");

    // Lấy ID trả về từ API (response.id là Long)
    const orderId = response.id;
    
    // Redirect sang trang tracking với param
    setTimeout(() => {
      window.location.href = `tracking.html?orderCode=ORD-${orderId}`;
    }, 1500);

  } catch (error) {
    console.error("Lỗi đặt hàng:", error);
    UTILS.showToast(error.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.", "error");
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = originalText;
  }
}
