package vn.manh.FoodSelling.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.manh.FoodSelling.entity.Product;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>{
    // Tìm các sản phẩm đang online (available) để hiện cho khách xem
    public List<Product> findByStatus(String status);
}
