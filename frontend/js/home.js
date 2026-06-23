// Script xử lý Trang chủ (index.html)
let allProducts = [];

function renderHomeRatingStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  return '<i class="fa-solid fa-star text-amber-400"></i>'.repeat(safeRating)
    + '<i class="fa-regular fa-star text-amber-400"></i>'.repeat(5 - safeRating);
}

function escapeHomeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatHomeRatingValue(rating) {
  return Number(rating || 0).toFixed(1).replace(".0", "");
}

function renderHomeSelectableReviewStars(selectedRating) {
  const selected = Math.max(1, Math.min(5, Number(selectedRating || 5)));
  return Array.from({ length: 5 }, (_, index) => {
    const rating = index + 1;
    const filled = rating <= selected;
    return `
      <button type="button" class="text-xl leading-none transition-transform hover:scale-110 ${filled ? 'text-amber-400' : 'text-slate-300'}" onclick="setHomeSelectedReviewRating(${rating})" aria-label="${rating} sao">
        <i class="${filled ? 'fa-solid' : 'fa-regular'} fa-star"></i>
      </button>
    `;
  }).join("");
}

window.setHomeSelectedReviewRating = (rating) => {
  const input = document.getElementById("home-review-rating-input");
  const stars = document.getElementById("home-review-star-selector");
  const value = Math.max(1, Math.min(5, Number(rating || 5)));
  if (input) input.value = value;
  if (stars) stars.innerHTML = renderHomeSelectableReviewStars(value);
};

document.addEventListener("DOMContentLoaded", () => {
  // Khởi tạo AOS
  AOS.init({
    duration: 800,
    once: true,
    offset: 100
  });

  // 1. Tự động chạy Vòng Xoay Món Ăn sau mỗi 4 giây (Circular Carousel)
  initCircularCarousel();

  // 2. Tải danh sách sản phẩm từ ProductApi
  loadFeaturedProducts();
});

const HERO_ITEMS = [
  {
    name: "Chả Mực",
    region: "Miền Bắc",
    rating: 5,
    categoryId: 1,
    imageUrl: "https://chamuchalong.com/wp-content/uploads/2024/08/419512207_772232031610613_5630187679851394559_n.jpg"
  },
  {
    name: "Trâu Gác Bếp",
    region: "Miền Bắc",
    rating: 5,
    categoryId: 1,
    imageUrl: "https://cdn.tgdd.vn/Files/2019/09/18/1199538/cach-an-thit-trau-gac-bep-dung-chuan-ngon-tuyet-voi-3-760x367.jpg"
  },
  {
    name: "Tỏi Lý Sơn",
    region: "Miền Trung",
    rating: 5,
    categoryId: 2,
    imageUrl: "https://product.hstatic.net/1000178034/product/toi-ly-son-dori-it-tep-500g-5v_a6fb8290d2354cb8a77a4ff12379a8c7.jpg"
  },
  {
    name: "Mực Rim Me",
    region: "Miền Trung",
    rating: 5,
    categoryId: 2,
    imageUrl: "https://vigift.vn/wp-content/uploads/2021/12/muc-rim-me-dac-san-da-nang-lam-qua-3.png"
  },
  {
    name: "Hạt Điều",
    region: "Miền Nam",
    rating: 5,
    categoryId: 3,
    imageUrl: "https://cerafoods.com/wp-content/uploads/2023/09/hat-dieu-rang-muoi-binh-phuoc-500g-2.jpg"
  }
];

let carouselInterval = null;
let carouselIndex = 0;

function initCircularCarousel() {
  const ring = document.getElementById("carousel-ring");
  const dotsContainer = document.getElementById("carousel-dots");
  if (!ring) return;

  // 1. Tạo các item món ăn xung quanh vòng tròn
  ring.innerHTML = "";
  HERO_ITEMS.forEach((item, k) => {
    const el = document.createElement("div");
    el.className = "carousel-item" + (k === 0 ? " active" : "");
    el.setAttribute("data-index", k);
    el.innerHTML = `<img src="${item.imageUrl}" alt="${item.name}">`;

    // Đặt vị trí ban đầu theo hệ tọa độ góc sử dụng biến CSS --translate-dist
    el.style.transform = `rotate(${k * 72}deg) translate(var(--translate-dist)) rotate(${-k * 72}deg)`;

    // Click vào item để xoay
    el.addEventListener("click", () => {
      selectCarouselItem(k);
    });

    ring.appendChild(el);
  });

  // 2. Tạo các chấm indicator
  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    HERO_ITEMS.forEach((_, k) => {
      const dot = document.createElement("div");
      dot.className = "carousel-dot" + (k === 0 ? " active" : "");
      dot.addEventListener("click", () => {
        selectCarouselItem(k);
      });
      dotsContainer.appendChild(dot);
    });
  }

  // 3. Khởi động vòng xoay ở vị trí đầu tiên
  updateCarouselUI(0);
  startCarouselTimer();
}

function selectCarouselItem(index) {
  stopCarouselTimer();
  carouselIndex = index;
  updateCarouselUI(index);
  startCarouselTimer();
}

function updateCarouselUI(index) {
  const ring = document.getElementById("carousel-ring");
  const items = document.querySelectorAll(".carousel-item");
  const dots = document.querySelectorAll(".carousel-dot");
  const activeImg = document.getElementById("carousel-active-img");
  const infoCard = document.getElementById("carousel-info-card");

  const infoTitle = document.getElementById("carousel-info-title");
  const infoTag = document.getElementById("carousel-info-tag");
  const infoRating = document.getElementById("carousel-info-rating");

  if (!ring) return;

  // Xoay vòng ring ngoài và counter-rotate các item con để giữ ảnh thẳng đứng
  ring.style.transform = `rotate(${-index * 72}deg)`;
  items.forEach((item, k) => {
    item.classList.toggle("active", k === index);
    item.style.transform = `rotate(${k * 72}deg) translate(var(--translate-dist)) rotate(${-k * 72 + index * 72}deg)`;
  });

  // Cập nhật dots
  dots.forEach((dot, k) => {
    dot.classList.toggle("active", k === index);
  });

  // Hiệu ứng transition đĩa lớn trung tâm & thẻ thông tin
  if (activeImg) {
    activeImg.classList.remove("opacity-100", "scale-100");
    activeImg.classList.add("opacity-0", "scale-90");
  }

  if (infoCard) {
    infoCard.classList.remove("visible");
    infoCard.classList.add("hidden-card");
  }

  setTimeout(() => {
    const itemData = HERO_ITEMS[index];

    // Cập nhật đĩa lớn
    if (activeImg) {
      activeImg.src = itemData.imageUrl;
      activeImg.onload = () => {
        activeImg.classList.remove("opacity-0", "scale-90");
        activeImg.classList.add("opacity-100", "scale-100");
      };
    }

    // Cập nhật thẻ thông tin
    if (infoTitle) infoTitle.textContent = itemData.name;
    if (infoTag) {
      infoTag.textContent = itemData.region;
      // Đổi class màu vùng miền
      infoTag.className = "info-tag badge text-[10px] inline-block mb-1.5 ";
      if (itemData.categoryId === 1) {
        infoTag.classList.add("badge-region-north");
      } else if (itemData.categoryId === 2) {
        infoTag.classList.add("badge-region-central");
      } else {
        infoTag.classList.add("badge-region-south");
      }
    }
    if (infoRating) {
      infoRating.innerHTML = UTILS.renderRatingStars(itemData.rating);
    }

    // Hiện thẻ thông tin lên
    if (infoCard) {
      infoCard.classList.remove("hidden-card");
      infoCard.classList.add("visible");
    }
  }, 300);
}

function startCarouselTimer() {
  carouselInterval = setInterval(() => {
    carouselIndex = (carouselIndex + 1) % HERO_ITEMS.length;
    updateCarouselUI(carouselIndex);
  }, 4000);
}

function stopCarouselTimer() {
  if (carouselInterval) {
    clearInterval(carouselInterval);
    carouselInterval = null;
  }
}

/**
 * Tải sản phẩm từ API – dùng API category riêng vì UserProductResponseDTO
 * không trả về categoryId. Gắn categoryId thủ công cho mỗi batch.
 */
async function loadFeaturedProducts() {
  const northWrapper = document.getElementById("swiper-wrapper-north");
  if (!northWrapper) return;

  try {
    // Gọi song song 3 category APIs + all products cho best sellers
    const [northRaw, centralRaw, southRaw, allRaw] = await Promise.all([
      ProductApi.getProductsByCategory(1),
      ProductApi.getProductsByCategory(2),
      ProductApi.getProductsByCategory(3),
      ProductApi.getProducts()
    ]);

    // Gắn categoryId thủ công vì UserProductResponseDTO không có field này
    const northProducts = (northRaw || []).map(p => UTILS.normalizeProduct({ ...p, categoryId: 1 }));
    const centralProducts = (centralRaw || []).map(p => UTILS.normalizeProduct({ ...p, categoryId: 2 }));
    const southProducts = (southRaw || []).map(p => UTILS.normalizeProduct({ ...p, categoryId: 3 }));

    // All products cho best sellers (không cần categoryId)
    allProducts = (allRaw || []).map(p => UTILS.normalizeProduct(p));

    // Merge category products vào allProducts (với categoryId) cho modal sử dụng
    const mergedWithCategory = [...northProducts, ...centralProducts, ...southProducts];
    // Cập nhật allProducts: nếu sản phẩm có trong mergedWithCategory thì gán categoryId
    allProducts = allProducts.map(p => {
      const withCat = mergedWithCategory.find(m => m.id === p.id);
      return withCat ? { ...p, categoryId: withCat.categoryId } : p;
    });

    // Lọc "Đặc Sản Được Yêu Thích Nhất": sắp xếp theo đánh giá giảm dần và lọc trên 4.7 sao
    const bestSellers = [...allProducts]
      .sort((a, b) => b.averageRating - a.averageRating)
      .filter(p => p.averageRating >= 4.7)
      .slice(0, 8);

    // Kết xuất vào các phần tương ứng
    renderSectionSwiper("swiper-wrapper-north", northProducts);
    renderSectionSwiper("swiper-wrapper-central", centralProducts);
    renderSectionSwiper("swiper-wrapper-south", southProducts);
    renderSectionSwiper("swiper-wrapper-bestsellers", bestSellers);

    // Khởi tạo Swiper sliders
    initHomeSwipers();

  } catch (error) {
    console.error("Lỗi khi tải sản phẩm trang chủ:", error);
    const sections = ["north", "central", "south", "bestsellers"];
    sections.forEach(s => {
      const el = document.getElementById(`swiper-wrapper-${s}`);
      if (el) {
        el.innerHTML = `
          <div class="swiper-slide text-center py-6 text-slate-500 font-semibold">
            Không thể tải sản phẩm. <button onclick="loadFeaturedProducts()" class="text-brand-600 underline">Thử lại</button>
          </div>
        `;
      }
    });
  }
}

/**
 * Kết xuất sản phẩm ra một phần Swiper cụ thể
 */
function renderSectionSwiper(wrapperId, productsList) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  if (productsList.length === 0) {
    wrapper.innerHTML = `
      <div class="swiper-slide text-center py-8 text-slate-400 font-medium">
        Hiện tại chưa có món ăn nào trong danh mục này.
      </div>
    `;
    return;
  }

  let html = "";
  productsList.forEach((product) => {
    const colorClass = UTILS.getCategoryColorClass(product.categoryId);
    const categoryName = UTILS.getCategoryName(product.categoryId);
    const ratingStars = UTILS.renderRatingStars(product.averageRating);

    html += `
      <div class="swiper-slide">
        <div class="product-card card cursor-pointer h-full flex flex-col justify-between" onclick="openProductModal(${product.id})">
          <!-- Badge vùng miền & Ảnh -->
          <div class="img-wrapper relative overflow-hidden aspect-video">
            <span class="absolute top-3.5 left-3.5 z-10 badge ${colorClass} shadow-sm">${categoryName}</span>
            <img src="${UTILS.getImageUrl(product.imageUrl)}" alt="${product.name}" class="w-full h-full object-cover" loading="lazy">
          </div>
          
          <!-- Thông tin chi tiết -->
          <div class="p-4 flex-grow flex flex-col justify-between space-y-3">
            <div class="space-y-1">
              <div class="flex items-center text-xs font-bold gap-0.5">
                ${ratingStars}
                <span class="text-slate-400 font-medium text-[10px] ml-1">(${product.averageRating})</span>
              </div>
              <h3 class="font-bold text-slate-800 text-sm hover:text-brand-600 transition-colors line-clamp-2" title="${product.name}">
                ${product.name}
              </h3>
              <p class="text-xs text-slate-400 line-clamp-2">${product.description || ""}</p>
            </div>
            
            <div class="flex justify-between items-center pt-2">
              <span class="text-brand-600 font-bold text-sm md:text-base">${UTILS.formatCurrency(product.price)}</span>
              <button onclick="event.stopPropagation(); handleQuickAddToCart(${product.id}, this)" data-tippy-content="Thêm vào giỏ hàng" class="quick-add-btn w-8 h-8 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white flex items-center justify-center shadow-sm transition-all" title="Thêm vào giỏ">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  wrapper.innerHTML = html;
}

/**
 * Khởi tạo các slider Swiper
 */
function initHomeSwipers() {
  document.querySelectorAll('.products-swiper').forEach(el => {
    const section = el.closest('section');
    new Swiper(el, {
      slidesPerView: 1,
      spaceBetween: 16,
      navigation: {
        nextEl: section.querySelector('.swiper-button-next'),
        prevEl: section.querySelector('.swiper-button-prev'),
      },
      breakpoints: {
        480: { slidesPerView: 2, spaceBetween: 16 },
        768: { slidesPerView: 3, spaceBetween: 20 },
        1024: { slidesPerView: 4, spaceBetween: 24 },
        1280: { slidesPerView: 5, spaceBetween: 24 },
      }
    });
  });

  // Khởi tạo Swiper cho phần "Vì sao chọn chúng tôi"
  const chooseSwiperEl = document.querySelector('.choose-swiper');
  if (chooseSwiperEl) {
    const section = chooseSwiperEl.closest('section');
    new Swiper(chooseSwiperEl, {
      slidesPerView: 1,
      spaceBetween: 16,
      loop: true,
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: section.querySelector('.swiper-button-next'),
        prevEl: section.querySelector('.swiper-button-prev'),
      },
      breakpoints: {
        480: { slidesPerView: 2, spaceBetween: 16 },
        768: { slidesPerView: 3, spaceBetween: 20 },
        1024: { slidesPerView: 4, spaceBetween: 24 },
      }
    });
  }

  // Khởi tạo tooltip Tippy
  tippy('[data-tippy-content]', {
    placement: 'top',
    animation: 'scale',
  });
}

/**
 * Xử lý thêm nhanh sản phẩm vào giỏ
 */
function handleQuickAddToCart(productId, btnElement) {
  const product = allProducts.find(p => p.id === productId);
  if (product) {
    Cart.addToCart(product, 1);

    // Thêm animate.css vào badge giỏ hàng
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.classList.remove('animate__animated', 'animate__rubberBand');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('animate__animated', 'animate__rubberBand');
    }

    // Animate the button itself
    btnElement.classList.add('animate__animated', 'animate__bounceIn');
    setTimeout(() => {
      btnElement.classList.remove('animate__animated', 'animate__bounceIn');
    }, 1000);
  }
}

/**
 * Mở modal xem chi tiết sản phẩm
 * UserProductResponseDTO không có stockQuantity, ẩn thông tin kho
 */
function openProductModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById("product-detail-modal");
  const modalContent = document.getElementById("modal-detail-content");

  if (!modal || !modalContent) return;

  const colorClass = UTILS.getCategoryColorClass(product.categoryId);
  const categoryName = UTILS.getCategoryName(product.categoryId);
  const ratingStars = UTILS.renderRatingStars(product.averageRating);

  modalContent.innerHTML = `
    <!-- Left side: Image -->
    <div class="gallery-main relative border rounded-xl overflow-hidden aspect-square flex items-center justify-center bg-slate-50">
      <img src="${UTILS.getImageUrl(product.imageUrl)}" alt="${product.name}" class="w-full h-full object-cover">
    </div>

    <!-- Right side: Details -->
    <div class="flex flex-col justify-between space-y-4">
      <div class="space-y-2">
        <span class="badge ${colorClass} inline-flex">${categoryName}</span>
        <h2 class="text-xl md:text-2xl font-bold text-slate-800 leading-tight">${product.name}</h2>
        
        <div class="flex items-center text-xs font-bold gap-0.5">
          ${ratingStars}
          <span class="text-slate-400 font-medium text-xs ml-2">(${product.averageRating} đánh giá)</span>
        </div>

        <div class="text-2xl font-extrabold text-brand-600 mt-2">${UTILS.formatCurrency(product.price)}</div>
        
        <p class="text-sm text-slate-500 leading-relaxed pt-2 border-t">${product.description || "Chưa có mô tả chi tiết."}</p>
      </div>

      <!-- Quantity & Add to Cart -->
      <div class="space-y-3 pt-4 border-t">
        <div class="flex items-center gap-3">
          <span class="text-xs font-bold text-slate-600">Số lượng:</span>
          <div class="flex items-center border border-slate-200 rounded-lg">
            <button onclick="decrementModalQty()" class="px-3 py-1 hover:bg-slate-50 font-bold text-slate-500 text-sm">-</button>
            <input type="number" id="modal-qty-input" value="1" min="1" max="99" class="w-12 text-center text-sm font-bold text-slate-700 bg-transparent" readonly>
            <button onclick="incrementModalQty(99)" class="px-3 py-1 hover:bg-slate-50 font-bold text-slate-500 text-sm">+</button>
          </div>
        </div>

        <div class="flex gap-3 pt-1">
          <button onclick="addModalProductToCart(${product.id})" class="btn btn-primary w-full py-3 text-sm font-bold shadow-md">
            <i class="fa-solid fa-cart-arrow-down mr-2"></i>THÊM VÀO GIỎ HÀNG
          </button>
        </div>
      </div>

      <div class="space-y-3 pt-4 border-t">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800">Đánh giá món ăn</h3>
          <span id="home-reviews-count" class="text-[11px] font-semibold text-slate-400">Đang tải...</span>
        </div>
        <div id="home-review-form-wrapper"></div>
        <div id="home-product-reviews-list" class="space-y-3 max-h-56 overflow-y-auto pr-1">
          <div class="text-xs text-slate-400">Đang tải đánh giá...</div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
  renderHomeReviewForm(product.id);
  loadHomeProductReviews(product.id);
}

function renderHomeReviewForm(productId) {
  const wrapper = document.getElementById("home-review-form-wrapper");
  if (!wrapper) return;

  if (!Storage.getToken()) {
    wrapper.innerHTML = `<div class="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">Đăng nhập để gửi đánh giá cho món ăn này.</div>`;
    return;
  }

  wrapper.innerHTML = `
    <form id="home-product-review-form" class="space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <input type="hidden" id="home-review-rating-input" value="5">
          <div id="home-review-star-selector" class="flex items-center gap-1">${renderHomeSelectableReviewStars(5)}</div>
          <span class="text-[11px] font-semibold text-slate-400">Chọn số sao</span>
        </div>
        <button type="submit" class="btn btn-primary px-4 py-2 text-xs font-bold">Gửi đánh giá</button>
      </div>
      <textarea id="home-review-comment-input" rows="2" maxlength="1000" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:ring-orange-500 focus:border-orange-500" placeholder="Chia sẻ cảm nhận của bạn..."></textarea>
    </form>
  `;

  const form = document.getElementById("home-product-review-form");
  if (form) form.addEventListener("submit", (event) => submitHomeProductReview(event, productId));
}

async function loadHomeProductReviews(productId) {
  const list = document.getElementById("home-product-reviews-list");
  const count = document.getElementById("home-reviews-count");
  if (!list) return;

  try {
    const reviews = await ReviewApi.getByProduct(productId);
    const safeReviews = Array.isArray(reviews) ? reviews : [];
    if (count) count.textContent = `${safeReviews.length} đánh giá`;
    if (safeReviews.length === 0) {
      list.innerHTML = `<div class="text-xs text-slate-400">Chưa có đánh giá nào.</div>`;
      return;
    }
    list.innerHTML = safeReviews.map(review => {
      const reviewerName = escapeHomeHtml(review.fullName || review.username || "Người dùng");
      const comment = escapeHomeHtml(review.comment || "");
      const dateText = review.createdAt ? UTILS.formatDate(review.createdAt, "DD/MM/YYYY") : "";
      return `
        <div class="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-xs font-bold text-slate-700">${reviewerName}</div>
              <div class="text-[11px] text-slate-400">${escapeHomeHtml(dateText)}</div>
            </div>
            <div class="text-xs whitespace-nowrap">${renderHomeRatingStars(review.rating)}</div>
          </div>
          ${comment ? `
            <div class="mt-2 ${comment.length > 150 || comment.split('\\n').length > 3 ? 'cursor-pointer' : ''}" onclick="const p = this.querySelector('p'); if(p && this.querySelector('button')) { p.classList.toggle('line-clamp-3'); const b = this.querySelector('button'); if(b) b.textContent = p.classList.contains('line-clamp-3') ? 'Xem thêm' : 'Thu gọn'; }">
              <p class="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-3 transition-all duration-300">${comment}</p>
              ${comment.length > 150 || comment.split('\\n').length > 3 ? `<button type="button" class="text-brand-600 text-[10px] font-bold mt-1 hover:underline pointer-events-none">Xem thêm</button>` : ''}
            </div>
          ` : ""}
        </div>
      `;
    }).join("");
  } catch (error) {
    console.error("Lỗi tải đánh giá:", error);
    if (count) count.textContent = "0 đánh giá";
    list.innerHTML = `<div class="text-xs text-red-500">Không thể tải đánh giá.</div>`;
  }
}

async function submitHomeProductReview(event, productId) {
  event.preventDefault();
  const ratingInput = document.getElementById("home-review-rating-input");
  const commentInput = document.getElementById("home-review-comment-input");
  const submitButton = event.target.querySelector("button[type='submit']");
  const rating = Number(ratingInput ? ratingInput.value : 5);
  const comment = commentInput ? commentInput.value.trim() : "";

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Đang gửi...";
    }
    await ReviewApi.save(productId, rating, comment);
    UTILS.showToast("Đã lưu đánh giá của bạn.", "success");
    await loadHomeProductReviews(productId);
    await loadFeaturedProducts();
  } catch (error) {
    console.error("Lỗi gửi đánh giá:", error);
    UTILS.showToast(error.message || "Không thể gửi đánh giá.", "danger");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Gửi đánh giá";
    }
  }
}

function closeProductModal() {
  const modal = document.getElementById("product-detail-modal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

window.decrementModalQty = () => {
  const input = document.getElementById("modal-qty-input");
  if (input && Number(input.value) > 1) {
    input.value = Number(input.value) - 1;
  }
};

window.incrementModalQty = (maxStock) => {
  const input = document.getElementById("modal-qty-input");
  if (input && Number(input.value) < maxStock) {
    input.value = Number(input.value) + 1;
  }
};

window.addModalProductToCart = (productId) => {
  const product = allProducts.find(p => p.id === productId);
  const qtyInput = document.getElementById("modal-qty-input");
  if (product && qtyInput) {
    const qty = Number(qtyInput.value);
    Cart.addToCart(product, qty);

    // Animate cart badge
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.classList.remove('animate__animated', 'animate__rubberBand');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('animate__animated', 'animate__rubberBand');
    }

    closeProductModal();
  }
};
