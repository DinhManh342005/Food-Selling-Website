package vn.manh.FoodSelling.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import vn.manh.FoodSelling.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    Optional<Review> findByProductIdAndUserId(Long productId, Long userId);

    @Query("select coalesce(avg(r.rating), 0) from Review r where r.product.id = :productId")
    Double findAverageRatingByProductId(Long productId);
}
