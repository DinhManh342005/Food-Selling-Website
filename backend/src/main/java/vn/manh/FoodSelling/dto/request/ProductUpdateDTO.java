package vn.manh.FoodSelling.dto.request;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import vn.manh.FoodSelling.enums.ProductStatus;

// DTO dùng khi admin cập nhật sản phẩm.
@Data
public class ProductUpdateDTO {
    @NotBlank(message = "Product name is not blank")
    private String name;

    private String description;

    private String imageUrl;

    @NotNull(message = "Product price is not null")
    @Min(value = 0, message = "Product price must be greater than 0")
    private BigDecimal price;

    @NotNull(message = "Product stock quantity is not null")
    @Min(value = 0, message = "Product stock quantity must be greater than 0")
    private Integer stockQuantity;

    @NotNull(message = "Product category id is must be chosen")
    private Long categoryId;

    private ProductStatus status;

    private List<String> detailImages;
}
