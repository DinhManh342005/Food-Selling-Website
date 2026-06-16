package vn.manh.FoodSelling.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.Data;

@Data
public class CartResponseDTO {
    private List<CartItemResponseDTO> items;
    private BigDecimal totalPrice; // Tổng giá trị giỏ hàng
}
