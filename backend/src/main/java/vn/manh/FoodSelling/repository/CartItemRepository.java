package vn.manh.FoodSelling.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.manh.FoodSelling.entity.CartItem;


public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    // Tìm tất cả CartItem theo cartId để hiển thị giỏ hàng
    public List<CartItem> findByCartId(Long cartId);

    // Tìm CartItem theo cartId và productId để kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng chưa
    public Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);

}
