package vn.manh.FoodSelling.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.manh.FoodSelling.entity.Cart;
import vn.manh.FoodSelling.entity.User;

public interface CartRepository extends JpaRepository<Cart, Long> {
    public Optional<Cart> findByUser(User user);
}
