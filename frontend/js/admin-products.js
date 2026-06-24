// Script xử lý Trang Quản lý Sản phẩm (admin-products.html)
document.addEventListener("DOMContentLoaded", async () => {

  // 1. Kiểm tra quyền Admin
  if (!requireAdmin()) return;

  // 2. UI Elements
  const btnOpenSidebar = document.getElementById("btn-open-sidebar");
  const btnCloseSidebar = document.getElementById("btn-close-sidebar");
  const sidebar = document.getElementById("admin-sidebar");
  const btnLogout = document.getElementById("btn-admin-logout");

  const searchInput = document.getElementById("filter-search");
  const categorySelect = document.getElementById("filter-category");
  const stockSelect = document.getElementById("filter-stock");
  const statusSelect = document.getElementById("filter-status");
  const btnRefresh = document.getElementById("btn-refresh");

  const btnAddProduct = document.getElementById("btn-add-product");
  const modal = document.getElementById("product-modal");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const btnCancelModal = document.getElementById("btn-cancel-modal");
  const productForm = document.getElementById("product-form");
  const modalTitle = document.getElementById("modal-title");
  
  // View modal
  const viewModal = document.getElementById("view-product-modal");
  const btnCloseViewModal = document.getElementById("btn-close-view-modal");
  const btnCloseViewFooter = document.getElementById("btn-close-view-footer");
  
  const productImagesInput = document.getElementById("form-image-file");
  const imageUploadTrigger = document.getElementById("imageUploadTrigger");
  const productImagePreviewList = document.getElementById("productImagePreviewList");
  const productImageCount = document.getElementById("productImageCount");
  const productImageError = document.getElementById("productImageError");
  const btnSaveModal = document.getElementById("btn-save-modal");

  // State
  let allProducts = [];
  let currentEditId = null;
  let productImageState = [];

  // 3. Bind Events
  if (btnOpenSidebar && sidebar) btnOpenSidebar.addEventListener("click", () => sidebar.classList.add("open"));
  if (btnCloseSidebar && sidebar) btnCloseSidebar.addEventListener("click", () => sidebar.classList.remove("open"));
  if (btnLogout) btnLogout.addEventListener("click", () => Auth.logout());

  // Header Admin Name
  const currentUser = Storage.getCurrentUser();
  if (currentUser) {
    const nameEl = document.getElementById("header-admin-name");
    if (nameEl) nameEl.textContent = currentUser.fullName || currentUser.username || "Admin";
  }

  // Filter Events
  const filters = [searchInput, categorySelect, stockSelect, statusSelect];
  filters.forEach(el => {
    if (el) el.addEventListener("input", applyFiltersAndRender);
  });
  if (categorySelect) categorySelect.addEventListener("change", applyFiltersAndRender);
  if (stockSelect) stockSelect.addEventListener("change", applyFiltersAndRender);
  if (statusSelect) statusSelect.addEventListener("change", applyFiltersAndRender);
  if (btnRefresh) btnRefresh.addEventListener("click", refreshProducts);

  // Modal Events
  if (btnAddProduct) btnAddProduct.addEventListener("click", () => openModal());
  if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
  if (btnCancelModal) btnCancelModal.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
  if (viewModal) {
    viewModal.addEventListener("click", (e) => {
      if (e.target === viewModal) closeViewModal();
    });
  }
  if (btnCloseViewModal) btnCloseViewModal.addEventListener("click", closeViewModal);
  if (btnCloseViewFooter) btnCloseViewFooter.addEventListener("click", closeViewModal);

  if (productForm) productForm.addEventListener("submit", handleFormSubmit);
  if (btnSaveModal) {
    btnSaveModal.addEventListener("click", () => {
      if (productForm && productForm.reportValidity()) {
        productForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    });
  }

  // Image Upload Events
  if (imageUploadTrigger && productImagesInput) {
    imageUploadTrigger.addEventListener("click", () => productImagesInput.click());
  }
  if (productImagesInput) {
    productImagesInput.addEventListener("change", handleProductImagesSelected);
  }
  if (productImagePreviewList) {
    productImagePreviewList.addEventListener("click", handleProductImageAction);
  }

  // 4. Initial Load
  await loadProducts();


  // --- FUNCTIONS ---

  async function loadProducts() {
    const tbody = document.getElementById("products-table-body");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>`;
    }

    try {
      // Gọi API thực tế
      const rawProducts = await AdminProductApi.getProducts();
      allProducts = rawProducts || [];
      applyFiltersAndRender();
    } catch (error) {
      console.error("Lỗi tải danh sách sản phẩm:", error);
      UTILS.showToast(error.message || "Không thể tải danh sách sản phẩm.", "error");
      allProducts = [];
      applyFiltersAndRender();
    }
  }

  async function refreshProducts() {
    if (searchInput) searchInput.value = "";
    if (categorySelect) categorySelect.value = "";
    if (stockSelect) stockSelect.value = "";
    if (statusSelect) statusSelect.value = "";
    await loadProducts();
  }

  function applyFiltersAndRender() {
    const searchTerm = (searchInput?.value || "").toLowerCase();
    const catVal = categorySelect?.value || "";
    const stockVal = stockSelect?.value || "";
    const statusVal = statusSelect?.value || "";

    let filtered = [...allProducts];

    // Search
    if (searchTerm) {
      filtered = filtered.filter(p => 
        (p.name && p.name.toLowerCase().includes(searchTerm)) || 
        (p.id && String(p.id).includes(searchTerm))
      );
    }

    // Category
    if (catVal) {
      filtered = filtered.filter(p => String(p.categoryId) === catVal);
    }

    // Stock
    if (stockVal) {
      if (stockVal === "out") {
        filtered = filtered.filter(p => p.stockQuantity <= 0);
      } else if (stockVal === "low") {
        filtered = filtered.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 10);
      } else if (stockVal === "in") {
        filtered = filtered.filter(p => p.stockQuantity > 10);
      }
    }

    // Status
    if (statusVal) {
      filtered = filtered.filter(p => p.status === statusVal);
    }

    // Sort: newest first
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    renderTable(filtered);
  }

  function renderTable(products) {
    const tbody = document.getElementById("products-table-body");
    const stats = document.getElementById("table-stats");
    if (!tbody) return;

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-slate-500 font-medium">Không tìm thấy sản phẩm nào.</td></tr>`;
      if (stats) stats.textContent = "Đang hiển thị 0 sản phẩm";
      return;
    }

    let html = "";
    products.forEach(p => {
      const isAvailable = p.status === "available";
      const statusBadge = isAvailable 
        ? `<span class="badge badge-green text-[10px]">Đang bán</span>` 
        : `<span class="badge badge-red text-[10px]">Ngừng bán</span>`;
      
      const categoryName = UTILS.getCategoryName(p.categoryId);
      
      let stockClass = "text-slate-600 font-medium";
      if (p.stockQuantity <= 0) stockClass = "text-rose-600 font-bold";
      else if (p.stockQuantity <= 10) stockClass = "text-yellow-600 font-bold";

      const displayImg = p.imageUrl || (p.detailImages && p.detailImages.length > 0 ? p.detailImages[0] : "");

      html += `
        <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer product-row" data-id="${p.id}">
          <td class="py-3 px-4 text-slate-500 text-sm">#${p.id}</td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <img src="${UTILS.getImageUrl(displayImg)}" alt="${p.name}" class="w-10 h-10 rounded object-cover border border-slate-200" onerror="${UTILS.imageFallbackAttr()}">
              <span class="font-bold text-slate-700 truncate max-w-[200px]" title="${p.name}">${p.name}</span>
            </div>
          </td>
          <td class="py-3 px-4 text-slate-600 text-sm">${categoryName}</td>
          <td class="py-3 px-4 text-right font-bold text-brand-600">${UTILS.formatCurrency(p.price)}</td>
          <td class="py-3 px-4 text-center ${stockClass}">${p.stockQuantity}</td>
          <td class="py-3 px-4 text-center text-amber-500 text-sm font-semibold"><i class="fa-solid fa-star mr-1"></i>${p.averageRating > 0 ? Number(p.averageRating).toFixed(1) : "Chưa có"}</td>
          <td class="py-3 px-4 text-center text-slate-500 text-xs">${p.createdAt ? UTILS.formatDate(p.createdAt, "DD/MM/YYYY") : "N/A"}</td>
          <td class="py-3 px-4 text-center">${statusBadge}</td>
          <td class="py-3 px-4 text-center">
            <div class="flex items-center justify-center gap-2">
              <button type="button" data-tippy-content="Chỉnh sửa" class="btn-edit w-8 h-8 rounded bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors" data-id="${p.id}">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button type="button" data-tippy-content="${isAvailable ? 'Ngừng bán' : 'Mở bán lại'}" class="btn-toggle-status w-8 h-8 rounded ${isAvailable ? 'bg-orange-50 text-orange-600 hover:bg-orange-600' : 'bg-brand-50 text-brand-600 hover:bg-brand-600'} hover:text-white transition-colors" data-id="${p.id}" data-status="${isAvailable ? 'unavailable' : 'available'}">
                <i class="fa-solid ${isAvailable ? 'fa-eye-slash' : 'fa-eye'}"></i>
              </button>
              <button type="button" data-tippy-content="Xóa" class="btn-delete w-8 h-8 rounded bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors" data-id="${p.id}">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    if (stats) stats.textContent = `Đang hiển thị ${products.length} sản phẩm`;

    // Re-bind tooltips & buttons
    if (window.tippy) tippy("[data-tippy-content]", { placement: "top", animation: "scale" });

    tbody.querySelectorAll(".product-row").forEach(row => {
      row.addEventListener("click", () => openViewModal(row.dataset.id));
    });
    tbody.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openModal(btn.dataset.id);
      });
    });
    tbody.querySelectorAll(".btn-toggle-status").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleStatus(btn.dataset.id, btn.dataset.status);
      });
    });
    tbody.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        confirmDelete(btn.dataset.id);
      });
    });
  }

  // Handle Form Submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById("btn-save-modal");
    const originalBtnContent = btnSubmit ? btnSubmit.innerHTML : "Lưu lại";

    try {
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang xử lý...';
      }

      // Lấy dữ liệu cơ bản
      const name = document.getElementById("form-name").value.trim();
      const price = Number(document.getElementById("form-price").value);
      const categoryId = Number(document.getElementById("form-categoryId").value);
      const stockQuantity = Number(document.getElementById("form-stockQuantity").value);
      const description = document.getElementById("form-description").value.trim();

      // Validate
      if (!name || isNaN(price) || isNaN(categoryId) || isNaN(stockQuantity)) {
        throw new Error("Vui lòng điền đầy đủ các thông tin bắt buộc (tên, giá, danh mục, số lượng).");
      }

      if (!currentEditId && productImageState.length === 0) {
        throw new Error("Vui lòng chọn ít nhất 1 ảnh sản phẩm.");
      }

      for (const image of productImageState) {
        if (image.source === "new" && image.file) {
          const uploadRes = await AdminProductApi.uploadProductImage(image.file);
          image.url = typeof uploadRes === "string" ? uploadRes : uploadRes.imageUrl || uploadRes.url || "";
          image.publicId = typeof uploadRes === "string" ? "" : uploadRes.publicId || uploadRes.imagePublicId || "";
          image.source = "existing";
          image.file = null;
          if (!image.url) throw new Error("Không thể tải lên ảnh sản phẩm.");
        }
      }

      ensureOnePrimaryImage();
      const primaryImage = productImageState.find(image => image.isPrimary) || productImageState[0] || null;
      const finalImageUrl = primaryImage ? primaryImage.url : "";
      const finalImagePublicId = primaryImage ? primaryImage.publicId || "" : "";

      const payload = {
        name,
        price,
        categoryId,
        stockQuantity,
        description,
        imageUrl: finalImageUrl,
        imagePublicId: finalImagePublicId,
        detailImages: productImageState.map(image => image.url).filter(Boolean),
        detailImagePublicIds: productImageState.map(image => image.publicId || "")
      };

      if (currentEditId) {
        // Mode UPDATE
        await AdminProductApi.updateProduct(currentEditId, payload);
        UTILS.showToast("Cập nhật sản phẩm thành công.", "success");
      } else {
        // Mode CREATE
        await AdminProductApi.createProduct(payload);
        UTILS.showToast("Thêm sản phẩm mới thành công.", "success");
      }

      closeModal();
      await loadProducts(); // Reload table

    } catch (error) {
      console.error("Lỗi submit form:", error);
      UTILS.showToast(error.message || "Có lỗi xảy ra khi lưu sản phẩm.", "error");
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnContent;
      }
    }
  }

  // Toggle Status API
  async function toggleStatus(id, newStatus) {
    try {
      await AdminProductApi.updateProductStatus(id, newStatus);
      UTILS.showToast(`Đã ${newStatus === 'available' ? 'mở bán' : 'ngừng bán'} sản phẩm.`, "success");
      await loadProducts();
    } catch (error) {
      console.error("Lỗi đổi trạng thái:", error);
      UTILS.showToast(error.message || "Không thể cập nhật trạng thái sản phẩm.", "error");
    }
  }

  // Delete API
  async function confirmDelete(id) {
    const p = allProducts.find(x => String(x.id) === String(id));
    if (!p) return;

    Swal.fire({
      title: "Xác nhận xóa?",
      html: `Bạn có chắc muốn xóa sản phẩm <br><b>${p.name}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await AdminProductApi.deleteProduct(id);
          UTILS.showToast("Đã xóa sản phẩm.", "success");
          await loadProducts();
        } catch (error) {
          console.error("Lỗi xóa sản phẩm:", error);
          UTILS.showToast(error.message || "Không thể xóa sản phẩm.", "error");
        }
      }
    });
  }

  // Modal UI Logic
  function openModal(id = null) {
    currentEditId = id;
    resetProductImageState();
    if (modalTitle) modalTitle.textContent = id ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới";

    if (id) {
      const p = allProducts.find(x => String(x.id) === String(id));
      if (p) {
        document.getElementById("form-name").value = p.name;
        document.getElementById("form-price").value = p.price;
        document.getElementById("form-categoryId").value = p.categoryId;
        document.getElementById("form-stockQuantity").value = p.stockQuantity;
        document.getElementById("form-description").value = p.description || "";
        hydrateProductImageState(p);
      }
    } else {
      if (productForm) productForm.reset();
      renderProductImagePreviews();
    }

    if (modal) modal.classList.add("active");
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
    if (productForm) productForm.reset();
    currentEditId = null;
    resetProductImageState();
  }

  function resetProductImageState() {
    productImageState.forEach(image => {
      if (image.objectUrl) URL.revokeObjectURL(image.objectUrl);
    });
    productImageState = [];
    if (productImagesInput) productImagesInput.value = "";
    clearProductImageError();
    renderProductImagePreviews();
  }

  function hydrateProductImageState(product) {
    const urls = Array.isArray(product.detailImages) && product.detailImages.length > 0
      ? product.detailImages
      : (product.imageUrl ? [product.imageUrl] : []);
    const publicIds = Array.isArray(product.detailImagePublicIds) ? product.detailImagePublicIds : [];

    productImageState = urls.filter(Boolean).map((url, index) => ({
      id: `existing-${index}-${url}`,
      source: "existing",
      file: null,
      imageId: null,
      publicId: publicIds[index] || (url === product.imageUrl ? product.imagePublicId || "" : ""),
      url,
      name: getImageNameFromUrl(url),
      isPrimary: url === product.imageUrl,
      objectUrl: null
    }));
    ensureOnePrimaryImage();
    renderProductImagePreviews();
  }

  function handleProductImagesSelected(event) {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      const validationMessage = validateProductImageFile(file);
      if (validationMessage) {
        showProductImageError(validationMessage);
        continue;
      }
      if (productImageState.length >= 6) {
        showProductImageError("Chỉ được chọn tối đa 6 ảnh.");
        break;
      }
      if (isDuplicateProductImage(file)) {
        showProductImageError("Ảnh này đã được chọn.");
        continue;
      }
      productImageState.push({
        id: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        source: "new",
        file,
        imageId: null,
        publicId: "",
        url: "",
        name: file.name,
        isPrimary: !productImageState.some(image => image.isPrimary),
        objectUrl: URL.createObjectURL(file)
      });
    }
    ensureOnePrimaryImage();
    renderProductImagePreviews();
    event.target.value = "";
  }

  function validateProductImageFile(file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) return "Chỉ hỗ trợ JPG, PNG hoặc WebP.";
    if (file.size > 5 * 1024 * 1024) return "ỗi ảnh không được quá 5 MB.";
    return "";
  }

  function isDuplicateProductImage(file) {
    return productImageState.some(image => image.file
      && image.file.name === file.name
      && image.file.size === file.size
      && image.file.lastModified === file.lastModified);
  }

  function handleProductImageAction(event) {
    const button = event.target.closest("button[data-image-action]");
    const card = event.target.closest(".product-image-card");
    if (!card) return;
    const imageId = card.dataset.imageKey;
    if (button?.dataset.imageAction === "delete") {
      removeProductImage(imageId);
      return;
    }
    if (button?.dataset.imageAction === "primary" || !button) {
      setPrimaryProductImage(imageId);
    }
  }

  function setPrimaryProductImage(imageId) {
    productImageState = productImageState.map(image => ({ ...image, isPrimary: image.id === imageId }));
    renderProductImagePreviews();
  }

  function removeProductImage(imageId) {
    const image = productImageState.find(item => item.id === imageId);
    if (!image) return;
    if (image.objectUrl) URL.revokeObjectURL(image.objectUrl);
    productImageState = productImageState.filter(item => item.id !== imageId);
    ensureOnePrimaryImage();
    renderProductImagePreviews();
  }

  function ensureOnePrimaryImage() {
    if (productImageState.length === 0) return;
    if (!productImageState.some(image => image.isPrimary)) {
      productImageState[0].isPrimary = true;
    }
    let foundPrimary = false;
    productImageState.forEach(image => {
      if (image.isPrimary && !foundPrimary) {
        foundPrimary = true;
      } else if (image.isPrimary) {
        image.isPrimary = false;
      }
    });
  }

  function renderProductImagePreviews() {
    if (productImageCount) productImageCount.textContent = `${productImageState.length}/6 anh`;
    if (!productImagePreviewList) return;
    if (productImageState.length === 0) {
      productImagePreviewList.innerHTML = "";
      return;
    }
    productImagePreviewList.innerHTML = productImageState.map(image => {
      const src = image.objectUrl || UTILS.getImageUrl(image.url);
      const badge = image.isPrimary ? "Ảnh chính" : "Ảnh phụ";
      return `
        <div class="product-image-card ${image.isPrimary ? "is-primary" : ""}" data-image-key="${image.id}">
          <div class="product-image-card__preview">
            <img src="${src}" alt="Ảnh sản phẩm">
            <span class="product-image-badge">${badge}</span>
            <div class="product-image-card__actions">
              <button type="button" class="product-image-action set-primary ${image.isPrimary ? "is-active" : ""}" data-image-action="primary" title="Đặt làm ảnh chính" aria-label="Đặt làm ảnh chính">
                <i class="fa-solid fa-star"></i>
              </button>
              <button type="button" class="product-image-action delete-image" data-image-action="delete" title="Xoá ảnh" aria-label="Xoá ảnh">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="product-image-card__name" title="${escapeHtml(image.name)}">${escapeHtml(image.name)}</div>
        </div>`;
    }).join("");
  }

  function showProductImageError(message) {
    if (productImageError) {
      productImageError.textContent = message;
      productImageError.hidden = false;
    }
    if (window.UTILS?.showToast) UTILS.showToast(message, "warning");
  }

  function clearProductImageError() {
    if (productImageError) {
      productImageError.textContent = "";
      productImageError.hidden = true;
    }
  }

  function getImageNameFromUrl(url) {
    try {
      return decodeURIComponent(String(url).split("/").pop().split("?")[0]) || "image";
    } catch (_) {
      return "image";
    }
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[char]));
  }
  function openViewModal(id) {
    const p = allProducts.find(x => String(x.id) === String(id));
    if (!p) return;

    const content = document.getElementById("view-product-content");
    if (!content) return;

    const categoryName = UTILS.getCategoryName(p.categoryId);
    const displayImg = p.imageUrl || (p.detailImages && p.detailImages.length > 0 ? p.detailImages[0] : "");
    const statusBadge = p.status === "available" 
      ? `<span class="badge badge-green">Đang bán</span>` 
      : `<span class="badge badge-red">Ngừng bán</span>`;

    content.innerHTML = `
      <div class="flex flex-col md:flex-row gap-6">
        <div class="w-full md:w-1/3">
          <div class="aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
            <img src="${UTILS.getImageUrl(displayImg)}" alt="${p.name}" class="w-full h-full object-contain" onerror="${UTILS.imageFallbackAttr()}">
          </div>
        </div>
        <div class="w-full md:w-2/3 space-y-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-800">${p.name}</h2>
            <div class="flex items-center gap-3 mt-2">
              <span class="text-sm font-semibold text-slate-500">ID: #${p.id}</span>
              ${statusBadge}
            </div>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p class="text-xs text-slate-500 font-semibold mb-1">Giá bán</p>
              <p class="text-lg font-bold text-brand-600">${UTILS.formatCurrency(p.price)}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-semibold mb-1">Tồn kho</p>
              <p class="text-lg font-bold text-slate-800">${p.stockQuantity}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-semibold mb-1">Danh mục</p>
              <p class="text-sm font-semibold text-slate-700">${categoryName}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-semibold mb-1">Đánh giá trung bình</p>
              <p class="text-sm font-semibold text-amber-500"><i class="fa-solid fa-star mr-1"></i>${p.averageRating > 0 ? Number(p.averageRating).toFixed(1) : "Chưa có"}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-semibold mb-1">Ngày tạo</p>
              <p class="text-sm font-semibold text-slate-700">${p.createdAt ? UTILS.formatDate(p.createdAt, "DD/MM/YYYY HH:mm") : "N/A"}</p>
            </div>
          </div>

          <div>
            <p class="text-xs text-slate-500 font-semibold mb-2">Mô tả chi tiết</p>
            <p class="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[100px] whitespace-pre-wrap">${p.description || "Chưa có mô tả."}</p>
          </div>
        </div>
      </div>
    `;

    if (viewModal) {
      viewModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeViewModal() {
    if (viewModal) {
      viewModal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  // Security Check
  function requireAdmin() {
    const currentUser = Storage.getCurrentUser();
    const token = Storage.getToken();

    if (!currentUser || !token || currentUser.role !== 'admin') {
      UTILS.showToast("Bạn không có quyền truy cập trang này.", "error");
      window.location.href = "auth.html";
      return false;
    }
    return true;
  }
});
