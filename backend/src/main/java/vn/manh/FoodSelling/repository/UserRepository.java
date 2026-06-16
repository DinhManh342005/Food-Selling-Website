package vn.manh.FoodSelling.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.manh.FoodSelling.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
        public Optional<User> findByUsername(String username);

        public boolean existsByUsername(String username);

        public boolean existsByEmail(String email);

}
