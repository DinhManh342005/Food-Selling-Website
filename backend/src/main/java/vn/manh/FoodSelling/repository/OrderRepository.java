package vn.manh.FoodSelling.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.manh.FoodSelling.entity.Order;
import vn.manh.FoodSelling.entity.User;
import vn.manh.FoodSelling.enums.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Lấy danh sách Order của user, sắp xếp giảm dần theo OrderDate (mới nhất
    // trước)
    List<Order> findByUserOrderByOrderDateDesc(User user);

    List<Order> findAllByOrderByOrderDateDesc();

    List<Order> findByStatusOrderByOrderDateDesc(OrderStatus status);

    @Query("""
            select count(oi)
            from OrderItem oi
            where oi.order.user.id = :userId
              and oi.product.id = :productId
              and oi.order.status = :status
            """)
    long countPurchasedProductInStatus(
            @Param("userId") Long userId,
            @Param("productId") Long productId,
            @Param("status") OrderStatus status);

}
