package vn.manh.FoodSelling.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

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

// Thông tin người nhận hàng, có thể có nhiều địa chỉ giao hàng cho 1 user
// Mỗi địa chỉ giao hàng sẽ có tên người nhận, số điện thoại, địa chỉ cụ thể và có thể đánh dấu là mặc định
@Entity
@Table(name = "receiver_info")
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class ReceiverInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "receiver_info_id", nullable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "receiver_name", nullable = false, length = 100)
    private String receiverName;

    @Column(name = "receiver_phone", length = 10, nullable = false, unique = true)
    private String receiverPhone;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault;

    @Column(nullable = false, length = 255)
    private String address;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;



}
