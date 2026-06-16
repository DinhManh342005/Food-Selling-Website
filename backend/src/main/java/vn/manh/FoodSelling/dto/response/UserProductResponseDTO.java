package vn.manh.FoodSelling.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.Data;

@Data
public class UserProductResponseDTO {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private BigDecimal price;
    private Double averageRating;
    private List<String> detailImages;
}
