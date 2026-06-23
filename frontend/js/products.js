// Script xử lý Trang sản phẩm (products.html)
let rawAllProducts = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 8;

function renderRatingStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  return '<i class="fa-solid fa-star text-amber-400"></i>'.repeat(safeRating)
    + '<i class="fa-regular fa-star text-amber-400"></i>'.repeat(5 - safeRating);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatRatingValue(rating) {
  return Number(rating || 0).toFixed(1).replace(".0", "");
}

function renderSelectableReviewStars(selectedRating) {
  const selected = Math.max(1, Math.min(5, Number(selectedRating || 5)));
  return Array.from({ length: 5 }, (_, index) => {
    const rating = index + 1;
    const filled = rating <= selected;
    return `
      <button type="button" class="text-xl leading-none transition-transform hover:scale-110 ${filled ? 'text-amber-400' : 'text-slate-300'}" onclick="setSelectedReviewRating(${rating})" aria-label="${rating} sao">
        <i class="${filled ? 'fa-solid' : 'fa-regular'} fa-star"></i>
      </button>
    `;
  }).join("");
}

window.setSelectedReviewRating = (rating) => {
  const input = document.getElementById("review-rating-input");
  const stars = document.getElementById("review-star-selector");
  const value = Math.max(1, Math.min(5, Number(rating || 5)));
  if (input) input.value = value;
  if (stars) stars.innerHTML = renderSelectableReviewStars(value);
};

document.addEventListener("DOMContentLoaded", () => {
  // 1. Khởi chạy bộ lọc và tải dữ liệu ban đầu
  initProductsPage();
});

/**
 * Khởi chạy các chức năng trên trang sản phẩm
 */
async function initProductsPage() {
  const filterSearchInput = document.getElementById("filter-search-input");
  const btnFilterSearch = document.getElementById("btn-filter-search");

  // A. Lắng nghe ô tìm kiếm trong bộ lọc
  if (btnFilterSearch && filterSearchInput) {
    btnFilterSearch.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = 1;
      applyFilters();
    });
    filterSearchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        currentPage = 1;
        applyFilters();
      }
    });
  }

  // B. Lắng nghe sự kiện radio vùng miền
  const regionRadios = document.querySelectorAll("#filter-region-group input[name='regionFilter']");
  regionRadios.forEach(radio => {
    radio.addEventListener("change", async (e) => {
      currentPage = 1;
      const categoryVal = e.target.value;
      await fetchProductsData(categoryVal);
      applyFilters();
    });
  });

  // C. Lắng nghe sự kiện radio khoảng giá
  const priceRadios = document.querySelectorAll("#filter-price-group input[name='priceFilter']");
  priceRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      currentPage = 1;
      applyFilters();
    });
  });


  // E. Lắng nghe sự kiện radio đánh giá
  const ratingRadios = document.querySelectorAll("#filter-rating-group input[name='ratingFilter']");
  ratingRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      currentPage = 1;
      applyFilters();
    });
  });

  // F. Lắng nghe sự kiện sắp xếp toolbar
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      currentPage = 1;
      applyFilters();
    });
  }

  // G. Nút Áp dụng lọc
  const btnApply = document.getElementById("btn-apply-filters");
  if (btnApply) {
    btnApply.addEventListener("click", () => {
      currentPage = 1;
      applyFilters();
    });
  }

  // H. Nút Xóa bộ lọc
  const btnClear = document.getElementById("btn-clear-filters");
  const btnEmptyClear = document.getElementById("btn-empty-clear");
  
  const handleClear = () => {
    if (filterSearchInput) filterSearchInput.value = "";
    
    // Chọn lại radio "Tất cả" vùng miền
    const defaultRegion = document.querySelector("#filter-region-group input[value='all']");
    if (defaultRegion) defaultRegion.checked = true;
    
    // Chọn lại radio "Tất cả" khoảng giá
    const defaultPrice = document.querySelector("#filter-price-group input[value='all']");
    if (defaultPrice) defaultPrice.checked = true;
    
    // Chọn lại radio "Tất cả" đánh giá
    const defaultRating = document.querySelector("#filter-rating-group input[value='all']");
    if (defaultRating) defaultRating.checked = true;
    
    if (sortSelect) sortSelect.value = "featured";
    
    // Xóa các query params trên URL mà không reload trang
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);

    // Xóa ô tìm kiếm trên Header
    const headerSearchInput = document.getElementById("header-search-input");
    if (headerSearchInput) headerSearchInput.value = "";

    currentPage = 1;
    applyFilters();
  };

  if (btnClear) btnClear.addEventListener("click", handleClear);
  if (btnEmptyClear) btnEmptyClear.addEventListener("click", handleClear);

  // Đọc tham số từ URL để áp dụng bộ lọc ban đầu (bao gồm category)
  const categoryParam = UTILS.getQueryParam("category");
  
  // Tải sản phẩm từ API
  await fetchProductsData(categoryParam || "all");

  // Áp dụng các bộ lọc khác từ URL và render
  applyUrlParams();
}

/**
 * Gọi API nạp sản phẩm
 * Nếu categoryVal === "all", gọi API lấy tất cả sản phẩm
 * Nếu có categoryId cụ thể, gọi ProductApi.getProductsByCategory(categoryId)
 */
async function fetchProductsData(categoryVal = "all") {
  try {
    let rawData = [];
    
    if (categoryVal === "all") {
      // Vì UserProductResponseDTO không có categoryId trả về (hoặc nếu BE đã update),
      // nên gọi cả 3 nếu hệ thống yêu cầu hoặc BE đã hỗ trợ getProducts() trả về đủ
      const [northRaw, centralRaw, southRaw] = await Promise.all([
        ProductApi.getProductsByCategory(1),
        ProductApi.getProductsByCategory(2),
        ProductApi.getProductsByCategory(3)
      ]);
      const northProducts = (northRaw || []).map(p => UTILS.normalizeProduct({ ...p, categoryId: 1 }));
      const centralProducts = (centralRaw || []).map(p => UTILS.normalizeProduct({ ...p, categoryId: 2 }));
      const southProducts = (southRaw || []).map(p => UTILS.normalizeProduct({ ...p, categoryId: 3 }));
      rawData = [...northProducts, ...centralProducts, ...southProducts];
    } else {
      const categoryId = Number(categoryVal);
      const res = await ProductApi.getProductsByCategory(categoryId);
      rawData = (res || []).map(p => UTILS.normalizeProduct({ ...p, categoryId }));
    }

    rawAllProducts = rawData;
    filteredProducts = [...rawAllProducts];
  } catch (error) {
    console.error("Lỗi nạp sản phẩm trang products:", error);
    UTILS.showToast("Không thể tải danh sách sản phẩm.", "danger");
  }
}

/**
 * Đọc tham số từ URL
 */
function applyUrlParams() {
  const categoryParam = UTILS.getQueryParam("category");
  const searchParam = UTILS.getQueryParam("search");
  const sortParam = UTILS.getQueryParam("sort");

  // Vùng miền
  if (categoryParam) {
    const regionRadio = document.querySelector(`#filter-region-group input[value="${categoryParam}"]`);
    if (regionRadio) {
      regionRadio.checked = true;
    }
  }

  // Sắp xếp
  const sortSelect = document.getElementById("sort-select");
  if (sortParam && sortSelect) {
    sortSelect.value = sortParam;
  }

  // Tìm kiếm
  const headerSearchInput = document.getElementById("header-search-input");
  const filterSearchInput = document.getElementById("filter-search-input");
  if (searchParam) {
    if (headerSearchInput) headerSearchInput.value = searchParam;
    if (filterSearchInput) filterSearchInput.value = searchParam;
  }

  applyFilters();
}

/**
 * Thực thi các bộ lọc (Vùng miền, Giá, Từ khóa tìm kiếm, Đánh giá, Sắp xếp)
 */
function applyFilters() {
  let tempProducts = [...rawAllProducts];

  // 1. Lọc theo từ khóa tìm kiếm (URL search query hoặc ô nhập tại sidebar)
  const searchQuery = UTILS.getQueryParam("search");
  const filterSearchInput = document.getElementById("filter-search-input");
  let keyword = "";
  if (filterSearchInput && filterSearchInput.value.trim() !== "") {
    keyword = filterSearchInput.value.toLowerCase().trim();
  } else if (searchQuery) {
    keyword = searchQuery.toLowerCase().trim();
  }

  if (keyword) {
    tempProducts = tempProducts.filter(p => 
      p.name.toLowerCase().includes(keyword) || 
      p.description.toLowerCase().includes(keyword)
    );
  }

  // 2. Lọc theo Radio vùng miền (Client-side redundant if already fetched, but keep for safety)
  const selectedRegionRadio = document.querySelector("#filter-region-group input[name='regionFilter']:checked");
  if (selectedRegionRadio && selectedRegionRadio.value !== "all") {
    const selectedId = Number(selectedRegionRadio.value);
    tempProducts = tempProducts.filter(p => p.categoryId === selectedId);
  }

  // 3. Lọc theo khoảng giá radio
  const selectedPriceRadio = document.querySelector("#filter-price-group input[name='priceFilter']:checked");
  if (selectedPriceRadio && selectedPriceRadio.value !== "all") {
    const val = selectedPriceRadio.value;
    if (val === "under-100") {
      tempProducts = tempProducts.filter(p => p.price < 100000);
    } else if (val === "100-300") {
      tempProducts = tempProducts.filter(p => p.price >= 100000 && p.price <= 300000);
    } else if (val === "300-500") {
      tempProducts = tempProducts.filter(p => p.price >= 300000 && p.price <= 500000);
    } else if (val === "over-500") {
      tempProducts = tempProducts.filter(p => p.price > 500000);
    }
  }


  // 5. Lọc theo đánh giá
  const selectedRatingRadio = document.querySelector("#filter-rating-group input[name='ratingFilter']:checked");
  if (selectedRatingRadio && selectedRatingRadio.value !== "all") {
    const minRating = Number(selectedRatingRadio.value);
    tempProducts = tempProducts.filter(p => p.averageRating >= minRating);
  }

  // 6. Sắp xếp
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    const sortVal = sortSelect.value;
    if (sortVal === "price-asc") {
      tempProducts.sort((a, b) => a.price - b.price);
    } else if (sortVal === "price-desc") {
      tempProducts.sort((a, b) => b.price - a.price);
    } else if (sortVal === "rating") {
      tempProducts.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sortVal === "newest") {
      tempProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  filteredProducts = tempProducts;

  // 7. Cập nhật phân trang và hiển thị
  updatePagination(filteredProducts);
}

/**
 * Cập nhật giao diện đếm số lượng sản phẩm và phân trang
 */
function updatePagination(list) {
  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  if (currentPage < 1) {
    currentPage = 1;
  }
  
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
  
  // Cập nhật text đếm
  const countStart = document.getElementById("count-start");
  const countEnd = document.getElementById("count-end");
  const countTotal = document.getElementById("count-total");
  const countDisplay = document.getElementById("product-count"); // Nếu có
  
  if (countStart) countStart.textContent = totalItems === 0 ? 0 : startIdx + 1;
  if (countEnd) countEnd.textContent = endIdx;
  if (countTotal) countTotal.textContent = totalItems;
  if (countDisplay) countDisplay.textContent = totalItems;

  const emptyState = document.getElementById("products-empty");
  const gridWrapper = document.getElementById("products-grid");

  if (totalItems === 0) {
    if (emptyState) emptyState.classList.remove("hidden");
    if (gridWrapper) gridWrapper.innerHTML = "";
  } else {
    if (emptyState) emptyState.classList.add("hidden");
    // Render danh sách sản phẩm của trang
    const paginatedList = list.slice(startIdx, endIdx);
    renderProductsList(paginatedList);
  }

  // Render thanh điều khiển phân trang
  renderPaginationControls(totalPages);
}

/**
 * Kết xuất các nút bấm phân trang
 */
function renderPaginationControls(totalPages) {
  const container = document.getElementById("pagination-container");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  
  // Nút Prev
  html += `
    <button onclick="changePage(${currentPage - 1})" class="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : ''}" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fa-solid fa-chevron-left text-xs"></i>
    </button>
  `;

  // Các nút số trang
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button onclick="changePage(${i})" class="w-8 h-8 rounded-lg border text-xs font-bold transition-all ${currentPage === i ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/20' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}">
        ${i}
      </button>
    `;
  }

  // Nút Next
  html += `
    <button onclick="changePage(${currentPage + 1})" class="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : ''}" ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fa-solid fa-chevron-right text-xs"></i>
    </button>
  `;

  container.innerHTML = html;
}

/**
 * Chuyển đổi trang hiện tại
 */
window.changePage = (page) => {
  currentPage = page;
  // Cuộn mượt lên trên phần danh sách sản phẩm
  const target = document.getElementById("products-grid-wrapper");
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  applyFilters();
};

/**
 * Render sản phẩm ra lưới
 */
function renderProductsList(list) {
  const container = document.getElementById("products-grid");
  if (!container) return;

  let html = "";
  list.forEach(product => {
    const colorClass = UTILS.getCategoryColorClass(product.categoryId);
    const categoryName = UTILS.getCategoryName(product.categoryId);
    const ratingStars = '<i class="fa-solid fa-star text-amber-400"></i>'.repeat(Math.round(product.averageRating)) + '<i class="fa-regular fa-star text-amber-400"></i>'.repeat(5 - Math.round(product.averageRating));

    html += `
      <div class="product-card card cursor-pointer" onclick="openProductDetailModal(${product.id})">
        <!-- Badge vùng miền & Ảnh -->
        <div class="img-wrapper relative overflow-hidden aspect-video">
          <span class="absolute top-3.5 left-3.5 z-10 badge ${colorClass} shadow-sm">${categoryName}</span>
          <img src="${UTILS.getImageUrl(product.imageUrl)}" alt="${product.name}" class="w-full h-full object-cover" loading="lazy">
        </div>
        
        <!-- Thông tin chi tiết -->
        <div class="p-4 flex-grow flex flex-col justify-between space-y-3">
          <div class="space-y-1">
            <div class="flex items-center text-amber-400 text-xs font-bold gap-0.5">
              <span>${ratingStars}</span>
              <span class="text-slate-400 font-medium text-[10px] ml-1">(${product.averageRating})</span>
            </div>
            <h3 class="font-bold text-slate-800 text-sm hover:text-brand-600 transition-colors line-clamp-2" title="${product.name}">
              ${product.name}
            </h3>
            <p class="text-xs text-slate-400 line-clamp-2">${product.description || ""}</p>
          </div>
          
          <div class="flex justify-between items-center pt-2">
            <span class="text-brand-600 font-bold text-sm md:text-base">${UTILS.formatCurrency(product.price)}</span>
            <button onclick="event.stopPropagation(); handleProductsAddToCart(${product.id})" class="quick-add-btn w-8 h-8 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white flex items-center justify-center shadow-sm transition-all" title="Thêm vào giỏ">
              <i class="fa-solid fa-cart-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Xử lý thêm vào giỏ hàng trực tiếp từ Card
 */
window.handleProductsAddToCart = (productId) => {
  const product = rawAllProducts.find(p => p.id === productId);
  if (product) {
    Cart.addToCart(product, 1);
    
    // Thêm animate.css vào badge giỏ hàng
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.classList.remove('animate__animated', 'animate__rubberBand');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('animate__animated', 'animate__rubberBand');
    }
  }
};

/**
 * Mở modal xem chi tiết sản phẩm trên trang Danh sách sản phẩm
 * UserProductResponseDTO không có stockQuantity → ẩn thông tin kho
 */
window.openProductDetailModal = (productId) => {
  const product = rawAllProducts.find(p => p.id === productId);
  if (!product) return;

  let modal = document.getElementById("product-detail-modal");
  
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "product-detail-modal";
    modal.className = "modal-overlay";
    modal.onclick = () => closeProductDetailModal();
    modal.innerHTML = `
      <div class="modal-container p-6 max-w-2xl relative" onclick="event.stopPropagation()">
        <button onclick="closeProductDetailModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 p-1">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6" id="modal-detail-content">
          <!-- Loaded dynamically -->
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const modalContent = document.getElementById("modal-detail-content");
  const colorClass = UTILS.getCategoryColorClass(product.categoryId);
  const categoryName = UTILS.getCategoryName(product.categoryId);
  const ratingStars = '<i class="fa-solid fa-star text-amber-400"></i>'.repeat(Math.round(product.averageRating)) + '<i class="fa-regular fa-star text-amber-400"></i>'.repeat(5 - Math.round(product.averageRating));

  modalContent.innerHTML = `
    <!-- Left: Image -->
    <div class="gallery-main relative border rounded-xl overflow-hidden aspect-square flex items-center justify-center bg-slate-50">
      <img src="${UTILS.getImageUrl(product.imageUrl)}" alt="${product.name}" class="w-full h-full object-cover">
    </div>

    <!-- Right: Details -->
    <div class="flex flex-col justify-between space-y-4">
      <div class="space-y-2">
        <span class="badge ${colorClass} inline-flex">${categoryName}</span>
        <h2 class="text-xl md:text-2xl font-bold text-slate-800 leading-tight">${product.name}</h2>
        
        <div class="flex items-center text-amber-400 text-sm font-bold gap-0.5">
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
            <button onclick="decrementProductsModalQty()" class="px-3 py-1 hover:bg-slate-50 font-bold text-slate-500 text-sm">-</button>
            <input type="number" id="products-modal-qty-input" value="1" min="1" max="99" class="w-12 text-center text-sm font-bold text-slate-700 bg-transparent" readonly>
            <button onclick="incrementProductsModalQty(99)" class="px-3 py-1 hover:bg-slate-50 font-bold text-slate-500 text-sm">+</button>
          </div>
        </div>

        <div class="flex gap-3 pt-1">
          <button onclick="addProductsModalToCart(${product.id})" class="btn btn-primary w-full py-3 text-sm font-bold shadow-md shadow-brand-600/20">
            <i class="fa-solid fa-cart-arrow-down mr-2"></i>THÊM VÀO GIỎ HÀNG
          </button>
        </div>
      </div>

      <div class="space-y-3 pt-4 border-t">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800">Đánh giá món ăn</h3>
          <span id="reviews-count" class="text-[11px] font-semibold text-slate-400">Đang tải...</span>
        </div>
        <div id="review-form-wrapper"></div>
        <div id="product-reviews-list" class="space-y-3 max-h-56 overflow-y-auto pr-1">
          <div class="text-xs text-slate-400">Đang tải đánh giá...</div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
  renderReviewForm(product.id);
  loadProductReviews(product.id);
};

function renderReviewForm(productId) {
  const wrapper = document.getElementById("review-form-wrapper");
  if (!wrapper) return;

  if (!Storage.getToken()) {
    wrapper.innerHTML = `<div class="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">Đăng nhập để gửi đánh giá cho món ăn này.</div>`;
    return;
  }

  wrapper.innerHTML = `
    <form id="product-review-form" class="space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <input type="hidden" id="review-rating-input" value="5">
          <div id="review-star-selector" class="flex items-center gap-1">${renderSelectableReviewStars(5)}</div>
          <span class="text-[11px] font-semibold text-slate-400">Chọn số sao</span>
        </div>
        <button type="submit" class="btn btn-primary px-4 py-2 text-xs font-bold">Gửi đánh giá</button>
      </div>
      <textarea id="review-comment-input" rows="2" maxlength="1000" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:ring-orange-500 focus:border-orange-500" placeholder="Chia sẻ cảm nhận của bạn..."></textarea>
    </form>
  `;

  const form = document.getElementById("product-review-form");
  if (form) form.addEventListener("submit", (event) => submitProductReview(event, productId));
}

async function loadProductReviews(productId) {
  const list = document.getElementById("product-reviews-list");
  const count = document.getElementById("reviews-count");
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
      const reviewerName = escapeHtml(review.fullName || review.username || "Người dùng");
      const comment = escapeHtml(review.comment || "");
      const dateText = review.createdAt ? UTILS.formatDate(review.createdAt, "DD/MM/YYYY") : "";
      return `
        <div class="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-xs font-bold text-slate-700">${reviewerName}</div>
              <div class="text-[11px] text-slate-400">${escapeHtml(dateText)}</div>
            </div>
            <div class="text-xs whitespace-nowrap">${renderRatingStars(review.rating)}</div>
          </div>
          ${comment ? `<p class="text-xs text-slate-600 mt-2 leading-relaxed">${comment}</p>` : ""}
        </div>
      `;
    }).join("");
  } catch (error) {
    console.error("Lỗi tải đánh giá:", error);
    if (count) count.textContent = "0 đánh giá";
    list.innerHTML = `<div class="text-xs text-red-500">Không thể tải đánh giá.</div>`;
  }
}

async function submitProductReview(event, productId) {
  event.preventDefault();
  const ratingInput = document.getElementById("review-rating-input");
  const commentInput = document.getElementById("review-comment-input");
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

    const latestProduct = await ProductApi.getProductById(productId);
    const normalizedProduct = UTILS.normalizeProduct(latestProduct);
    const productIndex = rawAllProducts.findIndex(p => p.id === productId);
    if (normalizedProduct && productIndex >= 0) {
      rawAllProducts[productIndex] = {
        ...rawAllProducts[productIndex],
        averageRating: normalizedProduct.averageRating
      };
      const filteredIndex = filteredProducts.findIndex(p => p.id === productId);
      if (filteredIndex >= 0) filteredProducts[filteredIndex].averageRating = normalizedProduct.averageRating;
    }

    await loadProductReviews(productId);
    applyFilters();
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

window.closeProductDetailModal = () => {
  const modal = document.getElementById("product-detail-modal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
};

window.decrementProductsModalQty = () => {
  const input = document.getElementById("products-modal-qty-input");
  if (input && Number(input.value) > 1) {
    input.value = Number(input.value) - 1;
  }
};

window.incrementProductsModalQty = (maxStock) => {
  const input = document.getElementById("products-modal-qty-input");
  if (input && Number(input.value) < maxStock) {
    input.value = Number(input.value) + 1;
  }
};

window.addProductsModalToCart = (productId) => {
  const product = rawAllProducts.find(p => p.id === productId);
  const qtyInput = document.getElementById("products-modal-qty-input");
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
    
    closeProductDetailModal();
  }
};
