package vn.manh.FoodSelling.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.manh.FoodSelling.enums.ProductStatus;

@Entity
@Getter
@Setter
@Table(name = "products")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id", nullable = false, unique = true)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    private String imageUrl; // Ảnh đại diện chính

    // Dùng Decimal vì price cần precision, Double bị floating point error
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    // Dùng @Builder.Default sử dụng đẻ gán default value cho field
    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    // @Enumerated để sử dụng Enum trong database
    @Enumerated(EnumType.STRING) // Nên sử dụng STRING
    @Column(nullable = false)
    private ProductStatus status; // Sử dụng kiểu enum ProductStatus

    // Danh sách các ảnh phụ
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ProductImage> images;

    // @ManyToOne luôn là nơi giữ FK
    // Khi gọi sản phẩm thì sẽ không tự động load category, chỉ khi nào gọi
    // getCategory() mới load (LAZY)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // @CreationTimestamp để tự động lưu thời gian tạo của sản phẩm
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    // hoặc private LocalDateTime createAt = LocalDateTime.now();

    // Quan hệ với OrderItem và CartItem để biết sản phẩm này đã được đặt trong đơn
    // hàng nào và có trong giỏ hàng nào
    @OneToMany(mappedBy = "product",cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems;

    // Quan hệ với CartItem để biết sản phẩm này có trong giỏ hàng nào
    @OneToMany(mappedBy = "product",cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<CartItem> cartItems;

    // Danh sách đánh giá của sản phẩm
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Review> reviews;

    @Column(name = "average_rating", columnDefinition = "DOUBLE(3,2) DEFAULT 0.0")
    private double averageRating;

}
