package vn.manh.FoodSelling.dto.request;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

// DTO for create product
// This form will be used by admin to create new product
@Data
public class ProductCreateDTO {
    // Validation - check data that is sent from client
    // @NotBlank used to check if the product name is not blank
    @NotBlank(message = "Product name is not blank")
    private String name;
    
    private String description;

    // @NotNull used to check if the product price is not null
    // @Min used to check if the product price is greater than 0
    @NotNull(message = "Product price is not null")
    @Min(value = 0, message = "Product price must be greater than 0")
    private BigDecimal price;

    @NotNull(message = "Product stock quantity is not null")
    @Min(value = 0, message = "Product stock quantity must be greater than 0")  
    private Integer stockQuantity;
    
    @NotNull(message = "Product category id is must be chosen")
    private Long categoryId;
   
    // @NotBlank(message = "Product detail images is not blank")
    private List<String> detailImages;

// {
//     "categoryId": 1,
//     "description": "Bánh cuốn nóng nhân thịt ăn cùng chả quế truyền thống.",
//     "detailImages": [],
//     "imageUrl": null,
//     "name": "Bánh Cuốn Thanh Trì",
//     "price": 45000.00,
//     "productId": 5,
//     "status": "available",
//     "stockQuantity": 60
// }

}
