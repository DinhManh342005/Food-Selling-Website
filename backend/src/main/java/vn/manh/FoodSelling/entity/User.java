package vn.manh.FoodSelling.entity;

import java.time.LocalDate;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.springframework.core.annotation.Order;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.manh.FoodSelling.enums.UserRole;
import vn.manh.FoodSelling.enums.UserStatus;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     @Column(name = "user_id", nullable = false, unique = true)
     private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column( nullable = false)
    private String password;

    @Column(unique = true, length = 50)
    private String email;

    @Column(unique = true, nullable = false, length = 15)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;
 
    // Sử dụng @CreationTimestamp để tự động lưu thời gian tạo của người dùng
    // Trường này sẽ được tự động gán giá trị khi người dùng được tạo và sẽ không thể cập nhật sau đó
    @CreationTimestamp
    @Column(name = "create_at", nullable = false, updatable = false)
    private LocalDate createAt;

    // Lưu thông tin người nhận, mỗi người dùng có thể có nhiều địa chỉ nhận hàng
    // @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // private List<ReceiverInfo> receiverInfos;

    // Mỗi người dùng có một giỏ hàng, và giỏ hàng này sẽ được liên kết với người dùng thông qua trường "user" trong lớp Cart
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Cart cart;

    // Mỗi người dùng có thể có nhiều đơn hàng, và mỗi đơn hàng sẽ được liên kết với người dùng thông qua trường "user" trong lớp Order
    // @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // private List<Order> orders;

    // Mỗi người dùng có thể viết nhiều đánh giá, và mỗi đánh giá sẽ được liên kết với người dùng thông qua trường "user" trong lớp Review
    // @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // private List<Review> reviews;


}
