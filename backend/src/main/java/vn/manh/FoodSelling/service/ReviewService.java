package vn.manh.FoodSelling.service;

import java.util.List;

import vn.manh.FoodSelling.dto.request.ReviewRequestDTO;
import vn.manh.FoodSelling.dto.response.ReviewResponseDTO;

public interface ReviewService {
    List<ReviewResponseDTO> getReviewsByProduct(Long productId);

    ReviewResponseDTO saveReview(ReviewRequestDTO requestDTO);
}
