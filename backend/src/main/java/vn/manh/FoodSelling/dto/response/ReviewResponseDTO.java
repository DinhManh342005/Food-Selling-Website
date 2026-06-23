package vn.manh.FoodSelling.dto.response;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ReviewResponseDTO {
    private Long id;
    private Long productId;
    private String username;
    private String fullName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
