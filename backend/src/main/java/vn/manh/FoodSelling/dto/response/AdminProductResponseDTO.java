package vn.manh.FoodSelling.dto.response;

import java.time.LocalDateTime;

import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.manh.FoodSelling.enums.ProductStatus;

// AdminProductResponseDTO kế thừa từ UserProductResponseDTO, có thêm các trường riêng dành cho admin
@Data
@EqualsAndHashCode(callSuper = true) // Kế thừa các trường từ UserProductResponseDTO
public class AdminProductResponseDTO extends UserProductResponseDTO {
    // Các trường riêng của AdminProductResponseDTO
    private Integer stockQuantity;
    private ProductStatus status;
    private LocalDateTime createdAt;
    private Long categoryId;
}
