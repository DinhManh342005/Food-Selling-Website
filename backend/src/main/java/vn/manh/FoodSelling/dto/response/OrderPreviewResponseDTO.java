package vn.manh.FoodSelling.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.Builder;
import lombok.Data;

// DTO đơn hàng để xem trước - chưa thực sự mua hàng (có thể hủy, thay đổi)
@Data
@Builder
public class OrderPreviewResponseDTO {
    private BigDecimal totalAmount; // Tổng tiền tạm tính của cả đơn hàng
    private List<OrderPreviewItemDTO> orderItems;
}
