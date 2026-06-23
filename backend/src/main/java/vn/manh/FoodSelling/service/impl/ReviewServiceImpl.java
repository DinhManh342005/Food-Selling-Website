package vn.manh.FoodSelling.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.request.ReviewRequestDTO;
import vn.manh.FoodSelling.dto.response.ReviewResponseDTO;
import vn.manh.FoodSelling.entity.Product;
import vn.manh.FoodSelling.entity.Review;
import vn.manh.FoodSelling.entity.User;
import vn.manh.FoodSelling.enums.OrderStatus;
import vn.manh.FoodSelling.exception.BadRequestException;
import vn.manh.FoodSelling.exception.ResourceNotFoundException;
import vn.manh.FoodSelling.repository.OrderRepository;
import vn.manh.FoodSelling.repository.ProductRepository;
import vn.manh.FoodSelling.repository.ReviewRepository;
import vn.manh.FoodSelling.repository.UserRepository;
import vn.manh.FoodSelling.service.ReviewService;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public List<ReviewResponseDTO> getReviewsByProduct(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReviewResponseDTO saveReview(ReviewRequestDTO requestDTO) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Product product = productRepository.findById(requestDTO.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + requestDTO.getProductId()));

        long completedPurchaseCount = orderRepository.countPurchasedProductInStatus(
                user.getId(),
                product.getId(),
                OrderStatus.completed);
        if (completedPurchaseCount == 0) {
            throw new BadRequestException("Bạn chỉ có thể đánh giá món ăn khi đã có đơn hàng hoàn thành");
        }

        Review review = reviewRepository.findByProductIdAndUserId(product.getId(), user.getId())
                .orElseGet(() -> Review.builder()
                        .product(product)
                        .user(user)
                        .build());

        review.setRating(requestDTO.getRating());
        review.setComment(normalizeComment(requestDTO.getComment()));

        Review savedReview = reviewRepository.save(review);
        product.setAverageRating(roundAverage(reviewRepository.findAverageRatingByProductId(product.getId())));
        productRepository.save(product);

        return convertToDTO(savedReview);
    }

    private ReviewResponseDTO convertToDTO(Review review) {
        ReviewResponseDTO dto = new ReviewResponseDTO();
        dto.setId(review.getId());
        dto.setProductId(review.getProduct().getId());
        dto.setUsername(review.getUser().getUsername());
        dto.setFullName(review.getUser().getFullName());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        return dto;
    }

    private String normalizeComment(String comment) {
        if (comment == null || comment.trim().isEmpty()) {
            return null;
        }
        return comment.trim();
    }

    private double roundAverage(Double averageRating) {
        double value = averageRating == null ? 0.0 : averageRating;
        return Math.round(value * 100.0) / 100.0;
    }
}
