package vn.manh.FoodSelling.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.manh.FoodSelling.entity.Product;
import vn.manh.FoodSelling.enums.ProductStatus;

// @Repository - không cần sử dụng Annotation này vì khi kế thừa JpaRepository thì SPB đã tự đki vào Spring Container thành một Bean
public interface ProductRepository extends JpaRepository<Product, Long> {
    // Tìm các sản phẩm đang online (available) để hiện cho khách xem
    public List<Product> findByStatus(ProductStatus status);

    public List<Product> findByNameContainingIgnoreCase(String name);

    public List<Product> findByNameContainingIgnoreCaseAndStatus(String name, ProductStatus status);

    public List<Product> findByCategoryIdAndStatus(Long categoryId, ProductStatus status);

}
