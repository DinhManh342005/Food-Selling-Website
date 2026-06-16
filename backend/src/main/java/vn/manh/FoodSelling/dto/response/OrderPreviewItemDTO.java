package vn.manh.FoodSelling.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPreviewItemDTO {
    private Long productId;
    private String productName;
    private String productImageUrl;
    private Integer quantity;
    private BigDecimal productPrice; // Giá chốt lúc mua
    private BigDecimal totalPrice;   // Cột Generated tính toán từ DB
}
