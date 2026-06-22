package vn.manh.FoodSelling.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.manh.FoodSelling.enums.OrderStatus;

// DTO thực sự gửi cho be khi người dùng đặt hàng thành công
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponseDTO {
    private Long id;
    private LocalDateTime orderDate;
    private BigDecimal totalAmount;
    private OrderStatus status; // pending, confirmed, delivering, completed, cancelled
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;
    private String note;
    private List<OrderPreviewItemDTO> orderItems;
}
