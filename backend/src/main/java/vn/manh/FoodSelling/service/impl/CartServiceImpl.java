package vn.manh.FoodSelling.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.response.CartItemResponseDTO;
import vn.manh.FoodSelling.dto.response.CartResponseDTO;
import vn.manh.FoodSelling.entity.Cart;
import vn.manh.FoodSelling.entity.CartItem;
import vn.manh.FoodSelling.entity.Product;
import vn.manh.FoodSelling.entity.User;
import vn.manh.FoodSelling.enums.ProductStatus;
import vn.manh.FoodSelling.exception.BadRequestException;
import vn.manh.FoodSelling.exception.ResourceNotFoundException;
import vn.manh.FoodSelling.repository.CartItemRepository;
import vn.manh.FoodSelling.repository.CartRepository;
import vn.manh.FoodSelling.repository.ProductRepository;
import vn.manh.FoodSelling.repository.UserRepository;
import vn.manh.FoodSelling.service.CartService;

// CartServiceImpl là lớp triển khai các phương thức của CartService để xử lý logic liên quan đến giỏ hàng
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;

    private final UserRepository userRepository;

    private final ProductRepository productRepository;

    private final CartItemRepository cartItemRepository;

    // Hàm Helper Mấu chốt: Tự động bốc User từ JWT Token đang gọi API
    // SecurityContextHolder là một lớp tiện ích trong Spring Security,
    // nó lưu trữ thông tin về người dùng đã được xác thực trong suốt quá trình xử
    // lý yêu cầu.
    public User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    // Chuyển đổi từ Cart Entity sang CartResponseDTO để trả về cho client
    private CartResponseDTO convertToCartResponseDTO(Cart cart) {

        CartResponseDTO cartResponseDTO = new CartResponseDTO();
        // cartResponseDTO.setCartId(cart.getId()); // Nếu muốn trả về cartId
        cartResponseDTO.setTotalPrice(cart.getTotalPrice());

        // Chuyển đổi từng CartItem trong Cart sang CartItemResponseDTO
        List<CartItemResponseDTO> itemDTOs = new ArrayList<>();
        for (CartItem item : cart.getCartItems()) {
            CartItemResponseDTO itemDTO = new CartItemResponseDTO();
            itemDTO.setCartItemId(item.getId());
            itemDTO.setProductId(item.getProduct().getId());
            itemDTO.setProductName(item.getProduct().getName());
            itemDTO.setProductImageUrl(item.getProduct().getImageUrl());
            itemDTO.setQuantity(item.getQuantity());
            itemDTO.setUnitPrice(item.getUnitPrice());
            itemDTO.setTotalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            itemDTOs.add(itemDTO);
        }
        cartResponseDTO.setItems(itemDTOs);

        return cartResponseDTO;
    }

    // Lấy giỏ hàng của user hiện tại, nếu chưa có thì tạo mới và lưu vào database
    @Transactional
    public Cart getOrCreateCartForUser(User user) {
        return cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    newCart.setTotalPrice(BigDecimal.ZERO);
                    newCart.setCartItems(new ArrayList<>());
                    return cartRepository.save(newCart);
                });
    }

    // Cập nhật lại totalPrice của Cart sau mỗi lần thêm/sửa/xóa item trong giỏ hàng
    public void recalculateCartTotalPrice(Cart cart) {

        // Cách 1: Dùng vòng lặp thông thường
        // BigDecimal totalPrice = BigDecimal.ZERO;
        // for (CartItem item : cart.getCartItems()) {
        // totalPrice =
        // totalPrice.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        // }
        // cart.setTotalPrice(totalPrice);
        // return totalPrice;

        // Cách 2: Dùng Stream API để tính tổng giá trị giỏ hàng
        // reduce là một phương thức trong Stream API dùng để gộp tất cả các phần tử của
        // stream thành một giá trị duy nhất, trong trường hợp này là tổng giá trị giỏ
        // hàng.
        // reduce nhận vào một giá trị khởi tạo (ở đây là BigDecimal.ZERO) và một
        // BinaryOperator (ở đây là BigDecimal :: add) để thực hiện phép cộng dồn tất cả
        // các giá trị totalPrice của từng CartItem lại với nhau.
        BigDecimal totalPrice = cart.getCartItems().stream().map(CartItem::getTotalPrice).reduce(BigDecimal.ZERO,
                BigDecimal::add);
        cart.setTotalPrice(totalPrice);

    }

    // Lấy giỏ hàng của user hiện tại, nếu chưa có thì tạo mới và trả về dưới dạng
    // CartResponseDTO
    @Override
    public CartResponseDTO getCart() {
        User user = getAuthenticatedUser();
        Cart cart = getOrCreateCartForUser(user);
        // Chuyển đổi từ Cart sang CartResponseDTO
        return convertToCartResponseDTO(cart);
    }

    @Override
    @Transactional
    public CartResponseDTO addItemToCart(Long productId, Integer quantity) {
        User user = getAuthenticatedUser();
        Cart cart = getOrCreateCartForUser(user);

        // Kiểm tra sản phẩm có tồn tại?
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại. ID: " + productId));

        // Kiểm tra trạng thái bán
        if (product.getStatus() == ProductStatus.unavailable) {
            throw new BadRequestException("Sản phẩm hiện không có sẵn để bán: " + product.getName());
        }

        // Kiểm tra sản phẩm đã tồn tại trong giỏ hàng chưa?
        // filter để tìm CartItem có productId trùng với productId được truyền vào, nếu
        // tìm thấy thì trả về CartItem đó, nếu không tìm thấy thì trả về null.
        CartItem cartItem = cart.getCartItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst().orElse(null);

        Integer newQuantity = (cartItem != null) ? cartItem.getQuantity() + quantity : quantity;

        // Kiểm tra hàng tồn kho có đủ không?
        if (newQuantity > product.getStockQuantity()) {
            throw new BadRequestException(
                    "Vượt quá số lượng tồn kho của sản phẩm. Sản phẩm: " + product.getName() + ", chỉ còn : "
                            + product.getStockQuantity());
        }

        // Thêm item vào cart
        if (cartItem != null) {
            cartItem.setQuantity(newQuantity);
            cartItem.setTotalPrice(cartItem.getUnitPrice().multiply(BigDecimal.valueOf(newQuantity)));
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .unitPrice(product.getPrice())
                    .quantity(quantity)
                    .totalPrice(product.getPrice().multiply(BigDecimal.valueOf(quantity)))
                    .build();

            cart.getCartItems().add(newItem);
        }

        // Tự động tính lại tổng tiền giỏ hàng và lưu vào database
        recalculateCartTotalPrice(cart);
        Cart savedCart = cartRepository.saveAndFlush(cart);
        return convertToCartResponseDTO(savedCart);
    }

    @Override
    @Transactional // Dùng @Transactional để bảo đảm an toàn dữ liệu khi lưu nhiều bảng
    public CartResponseDTO updateItemQuantity(Long cartItemId, String action) {
        User user = getAuthenticatedUser();
        Cart cart = getOrCreateCartForUser(user);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại trong giỏ hàng"));

        // Kiểm tra xem user này có quyền sửa đổi CartItem nay không?
        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new AccessDeniedException("Bạn không có quyền sửa đổi món ăn này trong giỏ hàng!!");
        }

        Integer newQuantity = 0;
        if (action.equalsIgnoreCase("increase")) {
            newQuantity = cartItem.getQuantity() + 1;
            if (newQuantity > cartItem.getProduct().getStockQuantity()) {
                throw new BadRequestException("Vượt quá số lượng tồn kho của sản phẩm. Sản phẩm "
                        + cartItem.getProduct().getName() + " Chỉ còn : "
                        + cartItem.getProduct().getStockQuantity());
            }
        } else if (action.equalsIgnoreCase("decrease")) {
            newQuantity = cartItem.getQuantity() - 1;
        }
        cartItem.setQuantity(newQuantity);

        // Nếu số lượng về 0 thì xóa hẳn Item khỏi Cart
        if (newQuantity <= 0) {
            cart.getCartItems().remove(cartItem);
            cartItem.setCart(null);
            cartItemRepository.delete(cartItem);
        } else {
            cartItem.setTotalPrice(cartItem.getUnitPrice().multiply(BigDecimal.valueOf(newQuantity)));
        }

        recalculateCartTotalPrice(cart);
        return convertToCartResponseDTO(cartRepository.save(cart));
    }

    @Override
    @Transactional
    public CartResponseDTO removeItemFromCart(Long cartItemId) {
        User user = getAuthenticatedUser();
        Cart cart = getOrCreateCartForUser(user);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Món ăn không tồn tại trong giỏ hàng"));

        // Check is user has permission to delete this item?
        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new AccessDeniedException("You don't have permission to delete this item");
        }

        // Delete in memory and database
        // Dùng removeIf để chắc chắn đói tượng bị xóa khỏi RAM (bằng id) - trong trường
        // hợp không có hashcode, equals sử dụng id
        cart.getCartItems().removeIf(item -> item.getId().equals(cartItemId));
        cartItem.setCart(null); // Xóa luôn Cart của CartItem - liên kết 2 chiều

        cartItemRepository.delete(cartItem);

        recalculateCartTotalPrice(cart);
        return convertToCartResponseDTO(cartRepository.save(cart));

    }

    @Override
    @Transactional
    public void clearCart() {
        User user = getAuthenticatedUser();
        Cart cart = getOrCreateCartForUser(user);
        cart.getCartItems().clear();
        cart.setTotalPrice(BigDecimal.ZERO);
        cartRepository.save(cart);
    }

}
