(function () {
  const API_BUTTON_ID = "product-ai-assistant-button";
  const API_RESULT_ID = "product-ai-assistant-result";

  function getAiEndpoint() {
    if (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) {
      return CONFIG.API_BASE_URL.replace(/\/api\/v1\/?$/, "/api") + "/ai/product-info";
    }
    return "http://127.0.0.1:8080/api/ai/product-info";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderMarkdown(markdown) {
    const lines = escapeHtml(markdown).split(/\r?\n/);
    return lines.map((line) => {
      const text = line
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>");

      if (text.startsWith("### ")) return `<h4>${text.slice(4)}</h4>`;
      if (text.startsWith("## ")) return `<h3>${text.slice(3)}</h3>`;
      if (text.startsWith("# ")) return `<h3>${text.slice(2)}</h3>`;
      if (/^\d+\.\s+/.test(text)) return `<p class="ai-assistant-list-item">${text}</p>`;
      if (text.startsWith("- ")) return `<p class="ai-assistant-list-item">${text.slice(2)}</p>`;
      return text.trim() ? `<p>${text}</p>` : "";
    }).join("");
  }

  async function fetchProductInfo(productName, button, result) {
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>AI đang khám phá...</span>';
    result.classList.remove("hidden");
    result.innerHTML = '<div class="ai-assistant-loading">Đang tạo nội dung văn hóa ẩm thực...</div>';

    try {
      const response = await fetch(getAiEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName })
      });

      if (!response.ok) {
        let message = "Không thể lấy nội dung AI.";
        try {
          const errorData = await response.json();
          message = errorData.detail || errorData.message || message;
        } catch (_) {}
        throw new Error(message);
      }

      const data = await response.json();
      result.innerHTML = renderMarkdown(data.markdown || "");
    } catch (error) {
      result.innerHTML = `<div class="ai-assistant-error">${escapeHtml(error.message || "Không thể lấy nội dung AI.")}</div>`;
    } finally {
      button.disabled = false;
      button.innerHTML = '<i class="fa-solid fa-sparkles"></i><span>Khám phá đặc sản bằng AI</span>';
    }
  }

  function attachAssistant() {
    const modalContent = document.getElementById("modal-detail-content");
    if (!modalContent || document.getElementById(API_BUTTON_ID)) return;

    const title = modalContent.querySelector("h2");
    const detailColumn = title ? title.closest(".flex.flex-col") : null;
    if (!title || !detailColumn) return;

    const host = document.createElement("div");
    host.className = "ai-assistant-panel";
    host.innerHTML = `
      <button type="button" id="${API_BUTTON_ID}" class="ai-assistant-button">
        <i class="fa-solid fa-sparkles"></i>
        <span>Khám phá đặc sản bằng AI</span>
      </button>
      <div id="${API_RESULT_ID}" class="ai-assistant-result hidden"></div>
    `;

    const firstSection = detailColumn.querySelector(".space-y-2");
    if (firstSection) {
      firstSection.insertAdjacentElement("afterend", host);
    } else {
      detailColumn.prepend(host);
    }

    const button = document.getElementById(API_BUTTON_ID);
    const result = document.getElementById(API_RESULT_ID);
    button.addEventListener("click", () => fetchProductInfo(title.textContent.trim(), button, result));
  }

  document.addEventListener("DOMContentLoaded", () => {
    attachAssistant();
    const modalContent = document.getElementById("modal-detail-content");
    if (!modalContent) return;

    const observer = new MutationObserver(() => attachAssistant());
    observer.observe(modalContent, { childList: true, subtree: true });
  });
})();
