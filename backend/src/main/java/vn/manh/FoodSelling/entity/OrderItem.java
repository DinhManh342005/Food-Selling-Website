package vn.manh.FoodSelling.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Lớp OrderItem đại diện cho một mục trong đơn hàng, chứa thông tin về sản phẩm, số lượng và giá cả
// Mỗi OrderItem sẽ liên kết với một Order và có thể liên kết với nhiều Product (trong trường hợp combo hoặc gói sản phẩm)
@Entity
@Table(name = "order_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id", nullable = false)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private Integer quantity;

    // Lưu giá sản phẩm tại thời điểm đặt hàng để tránh ảnh hưởng khi giá sản phẩm thay đổi sau này
    @Column(name = "product_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal productPrice;

    // Tổng giá của mục này = productPrice * quantity, lưu để dễ dàng tính toán tổng đơn hàng sau này - được tính tự động dưới DB
    // insertable và updatable = false để chỉ thực hiện tính tổng tiền ở DB, Hibernate sẽ lờ đi việc cố ý insert, update vào cơ sở dữ liệu
    @Column(name = "total_price", nullable = false, precision = 12, scale = 2, insertable = false, updatable = false)
    private BigDecimal totalPrice;

    // Một OrderItem có thể liên kết với một Product cụ thể, nhưng cũng có thể là một phần của combo hoặc gói sản phẩm
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

}
