package vn.manh.FoodSelling.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.Data;
import vn.manh.FoodSelling.enums.ProductStatus;

@Data
public class ProductResponseDTO {
    private Long productId;
    private String name;
    private String description;
    private String imageUrl;
    private BigDecimal price;
    private Integer stockQuantity;
    private ProductStatus status;
    private Long categoryId;
    private List<String> detailImages;
}
