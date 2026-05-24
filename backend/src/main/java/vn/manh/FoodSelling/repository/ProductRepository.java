package vn.manh.FoodSelling.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.manh.FoodSelling.entity.Product;
import vn.manh.FoodSelling.enums.ProductStatus;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    public List<Product> findByStatus(ProductStatus status);
}
