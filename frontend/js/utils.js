const UTILS = {
  DEFAULT_IMAGE_URL: "https://placehold.co/400x300?text=No+Image",

  /**
   * Định dạng tiền tệ VND
   */
  formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(value);
  },

  /**
   * Lấy đường dẫn hình ảnh đầy đủ
   */
  getImageUrl(imageUrl) {
    const value = String(imageUrl || "").trim();
    if (!value || value === "null" || value === "undefined") return this.DEFAULT_IMAGE_URL;
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
    return `${CONFIG.IMAGE_BASE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
  },

  imageFallbackAttr() {
    return `this.onerror=null;this.src='${this.DEFAULT_IMAGE_URL}'`;
  },

  /**
   * Lấy tên vùng miền theo categoryId
   */
  getCategoryName(categoryId) {
    const id = Number(categoryId);
    if (id === 1) return "Miền Bắc";
    if (id === 2) return "Miền Trung";
    if (id === 3) return "Miền Nam";
    return "Đặc Sản Việt";
  },

  /**
   * Lấy class CSS màu sắc tương ứng vùng miền
   */
  getCategoryColorClass(categoryId) {
    const id = Number(categoryId);
    if (id === 1) return "badge-region-north";
    if (id === 2) return "badge-region-central";
    if (id === 3) return "badge-region-south";
    return "bg-slate-100 text-slate-800";
  },

  /**
   * Chuẩn hóa đối tượng sản phẩm từ API
   */
  normalizeProduct(product) {
    if (!product) return null;
    return {
      id: product.id || product.productId,
      productId: product.productId || product.id,
      name: product.name || "",
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      price: Number(product.price || 0),
      stockQuantity: Number(product.stockQuantity || 0),
      status: product.status || "available",
      averageRating: Number(product.averageRating || 0),
      createdAt: product.createdAt || "",
      categoryId: product.categoryId || null,
      detailImages: product.detailImages || []
    };
  },

  /**
   * Hiển thị thông báo Toast dùng SweetAlert2
   * @param {string} message 
   * @param {'success'|'warning'|'danger'|'error'|'info'} type 
   */
  showToast(message, type = "success") {
    if (type === "danger") type = "error";
    
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'mt-20' // Đẩy popup xuống 5rem (80px) để không che phần header
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: type,
      title: message
    });
  },

  /**
   * Hiển thị Modal Confirm bằng SweetAlert2
   */
  async confirm(title, text = "", icon = "warning") {
    const result = await Swal.fire({
      title: title,
      text: text,
      icon: icon,
      showCancelButton: true,
      confirmButtonColor: '#16a34a', // brand green
      cancelButtonColor: '#d33',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    });
    return result.isConfirmed;
  },

  /**
   * Định dạng ngày giờ bằng Day.js
   */
  formatDate(dateStr, format = "DD/MM/YYYY HH:mm") {
    if (!dateStr) return "--";
    return dayjs(dateStr).format(format);
  },

  /**
   * Lấy giá trị tham số trên Query String URL
   */
  getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
};
