package vn.manh.FoodSelling.dto.response;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class CartItemResponseDTO {
    private Long cartItemId;
    private Long productId;
    private String productName;
    private String productImageUrl;
    private Integer quantity;
    private BigDecimal unitPrice; 
    private BigDecimal totalPrice; // price * quantity
}
