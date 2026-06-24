/**
 * Cart module – quản lý giỏ hàng.
 *
 * Khi người dùng đã đăng nhập (có JWT token), giỏ hàng được
 * đồng bộ với Backend qua CartApi (/api/v1/carts).
 * Khi chưa đăng nhập, giỏ hàng được lưu trong localStorage.
 *
 * cartItemId (từ BE) khác productId:
 *   - productId: ID sản phẩm
 *   - cartItemId: ID dòng trong bảng cart_items (dùng để update/remove)
 */
const Cart = {
  /**
   * Trả về true nếu user đang đăng nhập (có token)
   */
  _isLoggedIn() {
    return !!Storage.getToken();
  },

  // ─────────────────────────────────────────────
  // THÊM SẢN PHẨM VÀO GIỎ
  // ─────────────────────────────────────────────
  /**
   * Thêm sản phẩm vào giỏ hàng
   * @param {object} product - đối tượng sản phẩm (đã normalize)
   * @param {number} quantity
   */
  async addToCart(product, quantity = 1) {
    const normProduct = UTILS.normalizeProduct(product);
    if (!normProduct) return;

    if (this._isLoggedIn()) {
      // ── Server-side cart ──
      try {
        await CartApi.addItem(normProduct.id, quantity);
        UTILS.showToast(`Đã thêm "${normProduct.name}" vào giỏ hàng!`, "success");
        if (typeof Storage !== 'undefined' && Storage.addNotification) {
          Storage.addNotification(
            "Đã thêm vào giỏ hàng",
            `Bạn vừa thêm ${quantity} x ${normProduct.name} vào giỏ hàng.`,
            "success",
            "cart"
          );
        }
        await this._syncAndRender();
      } catch (error) {
        console.error("Lỗi thêm vào giỏ (server):", error);
        UTILS.showToast(error.message || "Không thể thêm sản phẩm vào giỏ.", "error");
      }
    } else {
      // ── Local cart ──
      let cart = Storage.getCart();
      const existingItem = cart.find(item => item.id === normProduct.id);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.push({ ...normProduct, quantity });
      }
      Storage.saveCart(cart);
      this.updateCartBadge();
      this.renderCartDrawer();
      UTILS.showToast(`Đã thêm "${normProduct.name}" vào giỏ hàng!`, "success");
      if (typeof Storage !== 'undefined' && Storage.addNotification) {
        Storage.addNotification(
          "Đã thêm vào giỏ hàng",
          `Bạn vừa thêm ${quantity} x ${normProduct.name} vào giỏ hàng.`,
          "success",
          "cart"
        );
      }
    }
  },

  // ─────────────────────────────────────────────
  // XÓA SẢN PHẨM
  // ─────────────────────────────────────────────
  /**
   * Xóa sản phẩm khỏi giỏ hàng
   * @param {number} itemKey - cartItemId (server) hoặc productId (local)
   */
  async removeFromCart(itemKey) {
    if (this._isLoggedIn()) {
      try {
        await CartApi.removeItem(itemKey);
        UTILS.showToast("Đã xóa sản phẩm khỏi giỏ hàng.", "info");
        await this._syncAndRender();
      } catch (error) {
        console.error("Lỗi xóa sản phẩm (server):", error);
        UTILS.showToast(error.message || "Không thể xóa sản phẩm.", "error");
      }
    } else {
      let cart = Storage.getCart();
      const item = cart.find(i => i.id === itemKey);
      cart = cart.filter(i => i.id !== itemKey);
      Storage.saveCart(cart);
      this.updateCartBadge();
      this.renderCartDrawer();
      if (item) UTILS.showToast(`Đã xóa "${item.name}" khỏi giỏ hàng.`, "info");
    }
  },

  // ─────────────────────────────────────────────
  // TĂNG / GIẢM SỐ LƯỢNG
  // ─────────────────────────────────────────────
  /**
   * Tăng số lượng
   * @param {number} itemKey - cartItemId (server) hoặc productId (local)
   */
  async increaseCartItem(itemKey) {
    if (this._isLoggedIn()) {
      try {
        await CartApi.updateItem(itemKey, "increase");
        await this._syncAndRender();
      } catch (error) {
        console.error("Lỗi tăng số lượng:", error);
      }
    } else {
      let cart = Storage.getCart();
      const item = cart.find(i => i.id === itemKey);
      if (item) {
        item.quantity += 1;
        Storage.saveCart(cart);
        this.updateCartBadge();
        this.renderCartDrawer();
      }
    }
  },

  /**
   * Giảm số lượng (nếu = 1 thì xóa hẳn)
   * @param {number} itemKey - cartItemId (server) hoặc productId (local)
   */
  async decreaseCartItem(itemKey) {
    if (this._isLoggedIn()) {
      try {
        await CartApi.updateItem(itemKey, "decrease");
        await this._syncAndRender();
      } catch (error) {
        console.error("Lỗi giảm số lượng:", error);
      }
    } else {
      let cart = Storage.getCart();
      const item = cart.find(i => i.id === itemKey);
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
          Storage.saveCart(cart);
        } else {
          await this.removeFromCart(itemKey);
          return;
        }
        this.updateCartBadge();
        this.renderCartDrawer();
      }
    }
  },

  // ─────────────────────────────────────────────
  // TỔNG TIỀN
  // ─────────────────────────────────────────────
  getCartTotal() {
    const cart = Storage.getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  // ─────────────────────────────────────────────
  // SYNC VỚI SERVER (chỉ khi đã login)
  // ─────────────────────────────────────────────
  /**
   * Lấy cart từ server, cập nhật localStorage và re-render drawer
   */
  async _syncAndRender() {
    try {
      const serverCart = await CartApi.getCart();
      this._saveServerCartToLocal(serverCart);
    } catch (e) {
      console.warn("Không thể đồng bộ cart từ server:", e);
    }
    this.updateCartBadge();
    this.renderCartDrawer();
  },

  /**
   * Chuyển CartResponseDTO (server) sang format localStorage
   * CartItemResponseDTO: { cartItemId, productId, productName, productImageUrl, quantity, unitPrice, totalPrice }
   */
  _saveServerCartToLocal(serverCart) {
    if (!serverCart || !Array.isArray(serverCart.items)) return;
    // Lưu ở định dạng nội bộ để renderCartDrawer() đọc được
    // Ta dùng cartItemId làm key trong localStorage (thay vì productId)
    // để sau này removeFromCart/updateItem đúng cartItemId
    const localItems = serverCart.items.map(item => ({
      id: item.cartItemId,        // ← dùng cartItemId để gọi API remove/update
      productId: item.productId,
      name: item.productName,
      imageUrl: item.productImageUrl,
      price: Number(item.unitPrice),
      quantity: item.quantity
    }));
    Storage.saveCart(localItems);
  },

  /**
   * Load cart từ server khi trang khởi động (nếu đã login)
   */
  async loadCart() {
    if (this._isLoggedIn()) {
      try {
        const serverCart = await CartApi.getCart();
        this._saveServerCartToLocal(serverCart);
      } catch (e) {
        console.warn("Không thể tải cart từ server:", e);
      }
    }
    this.updateCartBadge();
    this.renderCartDrawer();
  },

  // ─────────────────────────────────────────────
  // DRAWER
  // ─────────────────────────────────────────────
  openCartDrawer() {
    const drawerOverlay = document.getElementById("cart-drawer-overlay");
    if (drawerOverlay) {
      drawerOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
      this.renderCartDrawer();
    }
  },

  closeCartDrawer() {
    const drawerOverlay = document.getElementById("cart-drawer-overlay");
    if (drawerOverlay) {
      drawerOverlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  },

  updateCartBadge() {
    const cart = Storage.getCart();
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll(".cart-badge");
    badges.forEach(badge => {
      badge.textContent = totalQty;
      if (totalQty > 0) {
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    });
  },

  renderCartDrawer() {
    const cartItemsWrapper = document.getElementById("cart-items-wrapper");
    const cartTotalAmount = document.getElementById("cart-total-amount");
    const cartCheckoutBtn = document.getElementById("cart-checkout-btn");

    if (!cartItemsWrapper) return;

    const cart = Storage.getCart();

    if (cart.length === 0) {
      cartItemsWrapper.innerHTML = `
        <div class="flex flex-col items-center justify-center h-64 text-slate-400">
          <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          <p class="text-sm font-medium">Giỏ hàng của bạn đang trống.</p>
          <button onclick="Cart.closeCartDrawer()" class="mt-4 text-orange-600 font-semibold hover:underline">Tiếp tục mua sắm</button>
        </div>
      `;
      if (cartTotalAmount) cartTotalAmount.textContent = UTILS.formatCurrency(0);
      if (cartCheckoutBtn) cartCheckoutBtn.classList.add("pointer-events-none", "opacity-50");
      return;
    }

    if (cartCheckoutBtn) cartCheckoutBtn.classList.remove("pointer-events-none", "opacity-50");

    let html = "";
    // item.id ở đây là cartItemId (server) hoặc productId (local)
    cart.forEach(item => {
      html += `
        <div class="flex items-center gap-3 p-4 border-b border-slate-100">

          <div class="flex-grow min-w-0">
            <div class="flex justify-between items-start gap-1">
              <h4 class="text-sm font-semibold text-slate-800 truncate" title="${item.name}">${item.name}</h4>
              <button onclick="Cart.removeFromCart(${item.id})" class="text-slate-400 hover:text-rose-500 flex-shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
            <p class="text-xs text-orange-600 font-semibold mt-0.5">${UTILS.formatCurrency(item.price)}</p>
            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center border border-slate-200 rounded-md">
                <button onclick="Cart.decreaseCartItem(${item.id})" class="px-2 py-0.5 hover:bg-slate-50 text-slate-500 font-semibold">-</button>
                <span class="px-3 py-0.5 text-xs font-semibold text-slate-700">${item.quantity}</span>
                <button onclick="Cart.increaseCartItem(${item.id})" class="px-2 py-0.5 hover:bg-slate-50 text-slate-500 font-semibold">+</button>
              </div>
              <span class="text-xs font-semibold text-slate-700">${UTILS.formatCurrency(item.price * item.quantity)}</span>
            </div>
          </div>
        </div>
      `;
    });

    cartItemsWrapper.innerHTML = html;
    if (cartTotalAmount) {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      cartTotalAmount.textContent = UTILS.formatCurrency(total);
    }
  }
};

// Khởi chạy: tải cart từ server nếu đã login, hoặc đọc localStorage
document.addEventListener("DOMContentLoaded", () => {
  Cart.loadCart();
});
