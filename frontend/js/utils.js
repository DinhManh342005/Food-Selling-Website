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
   * Render ngôi sao đánh giá (hỗ trợ nửa sao)
   */
  renderRatingStars(rating) {
    const value = Number(rating || 0);
    const safeRating = Math.max(0, Math.min(5, value));
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = (safeRating - fullStars) >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let html = '<i class="fa-solid fa-star text-amber-400"></i>'.repeat(fullStars);
    if (hasHalfStar) {
      html += '<i class="fa-solid fa-star-half-stroke text-amber-400"></i>';
    }
    html += '<i class="fa-regular fa-star text-amber-400"></i>'.repeat(emptyStars);
    
    return html;
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
let productDetailCarouselImages = [];
let productDetailCarouselIndex = 0;
let productDetailCarouselPointerId = null;
let productDetailCarouselStartX = 0;
let productDetailCarouselStartY = 0;
let productDetailCarouselCurrentX = 0;
let productDetailCarouselViewportWidth = 0;
let productDetailCarouselDragging = false;
let productDetailCarouselHorizontalDrag = false;
let productDetailCarouselResizeTimer = null;
const productDetailPreloadedUrls = new Set();

function optimizeCloudinaryImageUrl(url, width = 1000) {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  if (url.includes("/upload/f_auto") || url.includes("/upload/q_auto") || url.includes("/upload/c_limit")) {
    return url;
  }

  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
}

function normalizeProductDetailImages(product) {
  const rawImages = Array.isArray(product?.images)
    ? [...product.images]
    : (Array.isArray(product?.productImages) ? [...product.productImages] : []);

  if (rawImages.length === 0 && Array.isArray(product?.detailImages)) {
    product.detailImages.forEach((imageUrl) => rawImages.push({ imageUrl }));
  }

  const normalizedImages = rawImages
    .map((image) => {
      const rawUrl = typeof image === "string" ? image : image.imageUrl || image.url || "";
      const imageUrl = optimizeCloudinaryImageUrl(UTILS.getImageUrl(rawUrl));
      return {
        imageId: typeof image === "string" ? null : image.imageId || image.id || null,
        imageUrl,
        isPrimary: typeof image === "string"
          ? rawUrl === product?.imageUrl
          : image.isThumbnail === true || image.thumbnail === true || image.is_thumbnail === true || rawUrl === product?.imageUrl
      };
    })
    .filter((image) => Boolean(String(image.imageUrl || "").trim()));

  const mainImageUrl = product?.imageUrl ? optimizeCloudinaryImageUrl(UTILS.getImageUrl(product.imageUrl)) : "";
  const hasMainImage = normalizedImages.some((image) => image.imageUrl === mainImageUrl);
  if (mainImageUrl && !hasMainImage) {
    normalizedImages.unshift({
      imageId: null,
      imageUrl: mainImageUrl,
      isPrimary: true
    });
  }

  const uniqueImages = [];
  normalizedImages.forEach((image) => {
    if (!uniqueImages.some((item) => item.imageUrl === image.imageUrl)) {
      uniqueImages.push(image);
    }
  });

  uniqueImages.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  return uniqueImages;
}

function preloadProductDetailImages(images) {
  images.forEach((image) => {
    const url = image.imageUrl;
    if (!url || productDetailPreloadedUrls.has(url)) return;

    const preloadImage = new Image();
    preloadImage.decoding = "async";
    preloadImage.src = url;
    productDetailPreloadedUrls.add(url);
  });
}

function preloadAdjacentProductDetailImages() {
  preloadProductDetailImages(productDetailCarouselImages);
}

function resetProductDetailCarouselDrag(shouldSnap = true) {
  if (shouldSnap) {
    updateProductDetailCarouselPosition(0, true);
  }

  productDetailCarouselPointerId = null;
  productDetailCarouselStartX = 0;
  productDetailCarouselStartY = 0;
  productDetailCarouselCurrentX = 0;
  productDetailCarouselViewportWidth = 0;
  productDetailCarouselDragging = false;
  productDetailCarouselHorizontalDrag = false;

  document.getElementById("productDetailCarousel")?.classList.remove("is-dragging");
}

function applyProductDetailEdgeResistance(deltaX) {
  const lastIndex = productDetailCarouselImages.length - 1;
  const isAtFirst = productDetailCarouselIndex === 0;
  const isAtLast = productDetailCarouselIndex === lastIndex;

  if ((isAtFirst && deltaX > 0) || (isAtLast && deltaX < 0)) {
    return deltaX * 0.3;
  }

  return deltaX;
}

function updateProductDetailCarouselPosition(offsetPx = 0, animate = true) {
  const track = document.getElementById("productDetailCarouselTrack");
  const viewport = document.querySelector(".product-detail-carousel__viewport");
  if (!track || !viewport) return;

  const width = productDetailCarouselViewportWidth || viewport.clientWidth;
  track.style.transition = animate ? "transform 280ms ease" : "none";
  track.style.transform = `translate3d(${-(productDetailCarouselIndex * width) + offsetPx}px, 0, 0)`;
}

function updateProductDetailCarouselUi() {
  const counter = document.getElementById("productDetailImageCounter");
  const indicators = document.getElementById("productDetailCarouselIndicators");
  const previousButton = document.getElementById("productDetailPreviousImage");
  const nextButton = document.getElementById("productDetailNextImage");
  const total = productDetailCarouselImages.length;
  const hasMultipleImages = total > 1;

  if (counter) {
    counter.hidden = !hasMultipleImages;
    counter.textContent = `${productDetailCarouselIndex + 1}/${total}`;
  }

  if (previousButton) {
    previousButton.hidden = !hasMultipleImages;
    previousButton.disabled = false;
  }

  if (nextButton) {
    nextButton.hidden = !hasMultipleImages;
    nextButton.disabled = false;
  }

  if (indicators) {
    indicators.hidden = !hasMultipleImages;
    indicators.querySelectorAll("[data-carousel-image-index]").forEach((indicator) => {
      const isActive = Number(indicator.dataset.carouselImageIndex) === productDetailCarouselIndex;
      indicator.classList.toggle("active", isActive);
      indicator.setAttribute("aria-pressed", String(isActive));
    });
  }
}

function renderProductDetailCarousel() {
  const track = document.getElementById("productDetailCarouselTrack");
  const indicators = document.getElementById("productDetailCarouselIndicators");
  if (!track) return;

  const images = productDetailCarouselImages.length > 0
    ? productDetailCarouselImages
    : [{ imageId: null, imageUrl: UTILS.DEFAULT_IMAGE_URL, isPrimary: true }];

  track.innerHTML = images.map((image, index) => `
    <div class="product-detail-carousel__slide">
      <img
        src="${image.imageUrl}"
        alt="Anh san pham ${index + 1}"
        draggable="false"
        decoding="async"
        loading="eager"
        ${index === 0 ? 'fetchpriority="high"' : ""}
      >
    </div>`).join("");

  track.querySelectorAll("img").forEach((image) => {
    image.onerror = () => {
      image.onerror = null;
      image.src = UTILS.DEFAULT_IMAGE_URL;
    };
  });

  if (indicators) {
    indicators.innerHTML = productDetailCarouselImages.length > 1
      ? productDetailCarouselImages.map((image, index) => `
        <button
          type="button"
          class="product-detail-carousel__indicator"
          data-carousel-image-index="${index}"
          aria-label="Xem anh ${index + 1}"
          aria-pressed="false"
        ></button>`).join("")
      : "";
  }

  updateProductDetailCarouselPosition(0, false);
  updateProductDetailCarouselUi();
}

function showPreviousProductDetailImage() {
  const total = productDetailCarouselImages.length;
  if (total <= 1) return;
  productDetailCarouselIndex = (productDetailCarouselIndex - 1 + total) % total;
  updateProductDetailCarouselPosition(0, true);
  updateProductDetailCarouselUi();
  preloadAdjacentProductDetailImages();
}

function showNextProductDetailImage() {
  const total = productDetailCarouselImages.length;
  if (total <= 1) return;
  productDetailCarouselIndex = (productDetailCarouselIndex + 1) % total;
  updateProductDetailCarouselPosition(0, true);
  updateProductDetailCarouselUi();
  preloadAdjacentProductDetailImages();
}

function handleProductDetailPointerDown(event) {
  if (event.target.closest("button")) return;
  if (productDetailCarouselImages.length <= 1) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;

  const viewport = document.querySelector(".product-detail-carousel__viewport");
  const carousel = document.getElementById("productDetailCarousel");
  if (!viewport || !carousel) return;

  productDetailCarouselPointerId = event.pointerId;
  productDetailCarouselStartX = event.clientX;
  productDetailCarouselStartY = event.clientY;
  productDetailCarouselCurrentX = 0;
  productDetailCarouselViewportWidth = viewport.clientWidth;
  productDetailCarouselDragging = true;
  productDetailCarouselHorizontalDrag = false;
  carousel.classList.add("is-dragging");
  updateProductDetailCarouselPosition(0, false);
  carousel.setPointerCapture?.(event.pointerId);
}

function handleProductDetailPointerMove(event) {
  if (!productDetailCarouselDragging || productDetailCarouselPointerId !== event.pointerId) return;

  const deltaX = event.clientX - productDetailCarouselStartX;
  const deltaY = event.clientY - productDetailCarouselStartY;

  if (!productDetailCarouselHorizontalDrag) {
    if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;

    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      productDetailCarouselHorizontalDrag = true;
    } else {
      resetProductDetailCarouselDrag(false);
      return;
    }
  }

  if (productDetailCarouselHorizontalDrag && event.cancelable) {
    event.preventDefault();
  }

  productDetailCarouselCurrentX = applyProductDetailEdgeResistance(deltaX);
  updateProductDetailCarouselPosition(productDetailCarouselCurrentX, false);
}

function handleProductDetailPointerEnd(event) {
  if (!productDetailCarouselDragging || productDetailCarouselPointerId !== event.pointerId) return;

  const deltaX = event.clientX - productDetailCarouselStartX;
  const deltaY = event.clientY - productDetailCarouselStartY;
  const shouldChangeSlide = productDetailCarouselHorizontalDrag
    && Math.abs(deltaX) >= 45
    && Math.abs(deltaX) > Math.abs(deltaY) * 1.2;

  if (shouldChangeSlide) {
    if (deltaX < 0 && productDetailCarouselIndex < productDetailCarouselImages.length - 1) {
      productDetailCarouselIndex += 1;
    } else if (deltaX > 0 && productDetailCarouselIndex > 0) {
      productDetailCarouselIndex -= 1;
    }
  }

  updateProductDetailCarouselPosition(0, true);
  updateProductDetailCarouselUi();
  preloadAdjacentProductDetailImages();
  resetProductDetailCarouselDrag(false);
}

function handleProductDetailPointerCancel() {
  resetProductDetailCarouselDrag(true);
}

function bindProductDetailCarouselEvents() {
  const carousel = document.getElementById("productDetailCarousel");
  const indicators = document.getElementById("productDetailCarouselIndicators");
  const previousButton = document.getElementById("productDetailPreviousImage");
  const nextButton = document.getElementById("productDetailNextImage");
  if (!carousel || carousel.dataset.swipeInitialized === "true") return;

  carousel.dataset.swipeInitialized = "true";
  carousel.addEventListener("pointerdown", handleProductDetailPointerDown);
  carousel.addEventListener("pointermove", handleProductDetailPointerMove, { passive: false });
  carousel.addEventListener("pointerup", handleProductDetailPointerEnd);
  carousel.addEventListener("pointercancel", handleProductDetailPointerCancel);
  carousel.addEventListener("lostpointercapture", handleProductDetailPointerCancel);

  previousButton?.addEventListener("click", showPreviousProductDetailImage);
  nextButton?.addEventListener("click", showNextProductDetailImage);
  indicators?.addEventListener("click", (event) => {
    const indicator = event.target.closest("[data-carousel-image-index]");
    if (!indicator) return;

    const index = Number(indicator.dataset.carouselImageIndex);
    if (!Number.isInteger(index) || index < 0 || index >= productDetailCarouselImages.length) return;

    productDetailCarouselIndex = index;
    updateProductDetailCarouselPosition(0, true);
    updateProductDetailCarouselUi();
    preloadAdjacentProductDetailImages();
  });
}

function setProductDetailCarouselProduct(product) {
  productDetailCarouselImages = normalizeProductDetailImages(product);
  productDetailCarouselIndex = 0;
  resetProductDetailCarouselDrag(false);
  renderProductDetailCarousel();
  bindProductDetailCarouselEvents();
  preloadAdjacentProductDetailImages();
}

function resetProductDetailCarousel() {
  resetProductDetailCarouselDrag(false);
}

document.addEventListener("keydown", (event) => {
  const activeModal = document.querySelector("#product-detail-modal.active");
  if (!activeModal || productDetailCarouselImages.length <= 1) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showPreviousProductDetailImage();
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    showNextProductDetailImage();
  }
});

window.addEventListener("resize", () => {
  window.clearTimeout(productDetailCarouselResizeTimer);
  productDetailCarouselResizeTimer = window.setTimeout(() => {
    updateProductDetailCarouselPosition(0, false);
  }, 120);
});

window.ProductDetailCarousel = {
  setProduct: setProductDetailCarouselProduct,
  reset: resetProductDetailCarousel
};
