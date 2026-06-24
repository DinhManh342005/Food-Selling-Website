document.addEventListener("DOMContentLoaded", () => {
  // 1. Khởi tạo DOM cho Chatbox và Floating Buttons
  injectChatboxDOM();

  // 2. Ràng buộc các sự kiện
  bindChatboxEvents();
});

// ==========================================
// 1. INJECT DOM
// ==========================================
function injectChatboxDOM() {
  if (document.getElementById("chatbox-wrapper")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "chatbox-wrapper";
  wrapper.innerHTML = `
    <!-- Floating Action Buttons -->
    <div class="floating-actions">
      <a href="tel:0917274409" class="fab-btn fab-phone" data-tippy-content-fab="Gọi hotline">
        <i class="fa-solid fa-phone"></i>
      </a>
      <a href="https://zalo.me/0917274409" target="_blank" class="fab-btn fab-zalo" data-tippy-content-fab="Chat Zalo">
        <div class="fab-zalo-img font-black italic tracking-tighter">Zalo</div>
      </a>
      <button id="fab-chat-btn" class="fab-btn fab-chat" data-tippy-content-fab="Trợ lý AI Gợi ý món ăn">
        <i class="fa-solid fa-headset"></i>
      </button>
    </div>
 
    <!-- Chatbox Window -->
    <div id="chatbox-window" class="chatbox-window">
      <!-- Header -->
      <div class="chatbox-header">
        <div class="chatbox-header-title">
          <i class="fa-solid fa-wand-magic-sparkles text-amber-300 text-2xl animate-pulse"></i>
          <div>
            <div class="text-base font-bold">Trợ Lý Ẩm Thực AI</div>
            <div class="text-[10px] opacity-90 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-brand-400 animate-ping"></span>Đang hoạt động</div>
          </div>
        </div>
        <button id="chatbox-close-btn" class="chatbox-close">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Body -->
      <div id="chatbox-body" class="chatbox-body">
        <!-- Lời chào đầu tiên -->
        <div class="chat-msg bot animate__animated animate__fadeInUp animate__faster">
          Xin chào! Mình là Trợ lý AI Ẩm Thực. Mình có thể giúp bạn tìm những món ăn phù hợp nhất. Bạn đang muốn thưởng thức hương vị đặc trưng của miền nào, hay thích đồ chua, cay, mặn, ngọt?
        </div>
      </div>

      <!-- Footer (Input) -->
      <form id="chatbox-form" class="chatbox-footer">
        <input type="text" id="chatbox-input" class="chatbox-input" placeholder="Nhập yêu cầu của bạn..." autocomplete="off">
        <button type="submit" id="chatbox-send-btn" class="chatbox-send" disabled>
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(wrapper);

  // Init Tippy for newly injected buttons if tippy is available
  if (window.tippy) {
    const fabBtns = document.querySelectorAll('.fab-btn');
    fabBtns.forEach(btn => {
      const content = btn.getAttribute('data-tippy-content-fab');
      tippy(btn, { 
        content: content,
        placement: 'left', 
        animation: 'scale' 
      });
    });
  }
}

// ==========================================
// 2. EVENTS & LOGIC
// ==========================================
function bindChatboxEvents() {
  const fabBtn = document.getElementById("fab-chat-btn");
  const closeBtn = document.getElementById("chatbox-close-btn");
  const chatWindow = document.getElementById("chatbox-window");
  
  const form = document.getElementById("chatbox-form");
  const input = document.getElementById("chatbox-input");
  const sendBtn = document.getElementById("chatbox-send-btn");

  // Mở / Đóng Chatbox
  fabBtn.addEventListener("click", () => {
    chatWindow.classList.toggle("active");
    if (chatWindow.classList.contains("active")) {
      input.focus();
    }
  });

  closeBtn.addEventListener("click", () => {
    chatWindow.classList.remove("active");
  });

  // Enable/Disable nút Gửi
  input.addEventListener("input", () => {
    sendBtn.disabled = input.value.trim().length === 0;
  });

  // Xử lý Gửi tin nhắn
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // 1. Thêm tin nhắn của User
    appendMessage(text, "user");
    input.value = "";
    sendBtn.disabled = true;

    // 2. Hiển thị Typing Indicator của Bot
    const typingId = showTypingIndicator();

    // 3. Phân tích ngữ nghĩa & Tìm kiếm (Giả lập delay 400-700ms)
    const delay = Math.floor(Math.random() * 300) + 400; // 400 - 700ms
    setTimeout(async () => {
      removeTypingIndicator(typingId);
      await processBotResponse(text);
    }, delay);
  });
}

// ==========================================
// 3. BOT LOGIC (Phân tích & Tìm kiếm)
// ==========================================
async function processBotResponse(userText) {
  const text = userText.toLowerCase();

  // Extract Region
  let targetCategoryId = null;
  if (text.includes("bắc") || text.includes("miền bắc") || text.includes("hà nội")) {
    targetCategoryId = 1;
  } else if (text.includes("trung") || text.includes("miền trung") || text.includes("huế") || text.includes("quảng")) {
    targetCategoryId = 2;
  } else if (text.includes("nam") || text.includes("miền nam") || text.includes("sài gòn") || text.includes("sóc trăng")) {
    targetCategoryId = 3;
  }

  // Extract Flavors
  const flavors = [];
  if (text.includes("cay")) flavors.push("cay");
  if (text.includes("ngọt")) flavors.push("ngọt");
  if (text.includes("mặn")) flavors.push("mặn");
  if (text.includes("chua")) flavors.push("chua");
  if (text.includes("thanh")) flavors.push("thanh");
  if (text.includes("đậm") || text.includes("đậm đà")) flavors.push("đậm");

  // Fetch Products
  let allProducts = [];
  try {
    const raw = await ProductApi.getProducts();
    allProducts = (raw || []).map(p => UTILS.normalizeProduct(p));
  } catch (error) {
    console.warn("Lỗi gọi ProductApi, dùng fallback", error);
    // Fallback cơ bản nếu API chết
    allProducts = (typeof MOCK_PRODUCTS !== 'undefined') ? MOCK_PRODUCTS.map(p => UTILS.normalizeProduct(p)) : [];
  }

  // Filter Products
  let matches = allProducts.filter(p => p.status === 'available');

  if (targetCategoryId) {
    matches = matches.filter(p => p.categoryId === targetCategoryId);
  }

  if (flavors.length > 0) {
    matches = matches.filter(p => {
      const pText = (p.name + " " + p.description).toLowerCase();
      // Nếu có bất kỳ flavor nào khớp trong tên hoặc mô tả
      return flavors.some(f => pText.includes(f));
    });
  }

  // Nếu người dùng không nhập gì liên quan đến miền hay vị, trả về ngẫu nhiên
  if (!targetCategoryId && flavors.length === 0) {
    matches = matches.sort(() => 0.5 - Math.random()).slice(0, 3);
    if (matches.length > 0) {
      appendMessage("Dạ, mình chưa nhận diện rõ yêu cầu của bạn, nhưng đây là một số món ngon nổi bật bạn có thể thử nhé! 👇", "bot");
      appendProductCards(matches);
    } else {
      appendMessage("Hiện tại nhà hàng đang cập nhật thêm thực đơn, bạn quay lại sau nhé.", "bot");
    }
    return;
  }

  // Shuffle and Limit (3 - 5 sản phẩm)
  matches = matches.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 3); // 3 đến 5

  if (matches.length === 0) {
    // Fallback khi không tìm thấy đúng món
    matches = allProducts.filter(p => p.status === 'available').sort(() => 0.5 - Math.random()).slice(0, 3);
    if (matches.length > 0) {
      appendMessage("Rất tiếc mình chưa tìm thấy món ăn chính xác với yêu cầu của bạn. Nhưng bạn có thể tham khảo các món đặc sắc này nhé! 👇", "bot");
      appendProductCards(matches);
    } else {
      appendMessage("Mình chưa tìm thấy món thật khớp, bạn có thể thử chọn miền hoặc hương vị khác nhé.", "bot");
    }
  } else {
    const msgs = [
      "Dựa trên yêu cầu của bạn, mình xin gợi ý những món ngon này nhé! 👇",
      "Tuyệt vời! Đây là những lựa chọn phù hợp nhất dành cho bạn: 👇",
      "Bạn tham khảo qua các món đặc sản dưới đây nhé! Đảm bảo rất ngon miệng. 👇",
      "Mình đã tìm thấy vài món đúng ý bạn rồi đây. Mời bạn xem thử nhé! 👇"
    ];
    const botMsg = msgs[Math.floor(Math.random() * msgs.length)];
    appendMessage(botMsg, "bot");
    appendProductCards(matches);
  }
}

// ==========================================
// 4. UI HELPERS (Render tin nhắn)
// ==========================================
function appendMessage(text, sender) {
  const body = document.getElementById("chatbox-body");
  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-msg ${sender} animate__animated animate__fadeInUp animate__faster`;
  msgDiv.textContent = text;
  
  body.appendChild(msgDiv);
  scrollToBottom();
}

function appendProductCards(products) {
  const body = document.getElementById("chatbox-body");
  
  // Wrapper cho danh sách sản phẩm để animate đồng bộ
  const wrapper = document.createElement("div");
  wrapper.className = "flex flex-col gap-2 animate__animated animate__fadeInUp animate__faster";

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "chat-product-card";
    
    // Ràng buộc sự kiện nút Thêm qua inline data
    card.innerHTML = `
      <img src="${UTILS.getImageUrl(p.imageUrl)}" alt="${p.name}" class="chat-product-img">
      <div class="chat-product-info">
        <div class="chat-product-name" title="${p.name}">${p.name}</div>
        <div class="flex justify-between items-center mt-1">
          <span class="chat-product-price">${UTILS.formatCurrency(p.price)}</span>
          <button onclick="chatboxAddToCart(${p.id})" class="chat-product-add">Thêm</button>
        </div>
      </div>
    `;
    wrapper.appendChild(card);
  });

  body.appendChild(wrapper);
  scrollToBottom();
}

// Export hàm ra global để nút trong thẻ HTML có thể gọi
window.chatboxAddToCart = async function(productId) {
  let allProducts = [];
  try {
    allProducts = (await ProductApi.getProducts() || []).map(p => UTILS.normalizeProduct(p));
  } catch (err) {
    allProducts = (typeof MOCK_PRODUCTS !== 'undefined') ? MOCK_PRODUCTS.map(p => UTILS.normalizeProduct(p)) : [];
  }

  const product = allProducts.find(p => p.id === productId);
  if (product) {
    // Tận dụng class Cart có sẵn trên toàn hệ thống
    if (typeof Cart !== 'undefined' && Cart.addToCart) {
      Cart.addToCart(product, 1);
    } else {
      // Fallback nếu trang không có file cart.js
      let cart = JSON.parse(localStorage.getItem("foodstore_cart") || "[]");
      const exist = cart.find(i => i.id === product.id);
      if (exist) {
        exist.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem("foodstore_cart", JSON.stringify(cart));
      UTILS.showToast(`Đã thêm ${product.name} vào giỏ`, "success");
    }
  }
};

let typingCounter = 0;
function showTypingIndicator() {
  const body = document.getElementById("chatbox-body");
  const id = "typing-" + (++typingCounter);
  
  const indicator = document.createElement("div");
  indicator.id = id;
  indicator.className = "typing-indicator animate__animated animate__fadeIn animate__faster";
  indicator.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;
  
  body.appendChild(indicator);
  scrollToBottom();
  return id;
}

function removeTypingIndicator(id) {
  const indicator = document.getElementById(id);
  if (indicator) {
    indicator.remove();
  }
}

function scrollToBottom() {
  const body = document.getElementById("chatbox-body");
  if (body) {
    body.scrollTop = body.scrollHeight;
  }
}
