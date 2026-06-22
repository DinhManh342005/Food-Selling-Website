package vn.manh.FoodSelling.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.manh.FoodSelling.enums.OrderStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrderResponseDTO {

    private Long id;
    private LocalDateTime orderDate;
    private BigDecimal totalAmount;
    private OrderStatus status;

    private Long userId;
    private String username;
    private String fullName;
    private String email;

    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;
    private String note;

    private List<OrderPreviewItemDTO> orderItems;
}
