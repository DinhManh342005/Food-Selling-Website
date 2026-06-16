package vn.manh.FoodSelling.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.manh.FoodSelling.dto.response.UserProductResponseDTO;
import vn.manh.FoodSelling.service.ProductService;


@RestController
@RequestMapping("api/v1/products")
public class UserProductController {

    // Tạo contructor tương tự với Field Injection @Autowired
    private final ProductService productService;
    
    public UserProductController(ProductService productService) {
        this.productService = productService;
    }

    // USER API: Lấy toàn bộ sản phẩm đang bán
    // URL: GET http://localhost:8080/api/v1/products
    @GetMapping()
     public ResponseEntity<List<UserProductResponseDTO>> getAllAvailableProducts() {
        List<UserProductResponseDTO> products = productService.getAllAvailableProducts();
        return ResponseEntity.ok(products);
    }

    // USER API: Tìm kiếm sản phẩm theo tên
    // URL: GET http://localhost:8080/api/v1/products/search?name=xxx
    @GetMapping("/search")
    public ResponseEntity<List<UserProductResponseDTO>> searchAvailableProductByName(@RequestParam String name) {
        List<UserProductResponseDTO> products = productService.searchAvailableProductByName(name);
        return ResponseEntity.ok(products);
    }

    // USER API: Lấy sản phẩm theo categoryId
    // URL: GET http://localhost:8080/api/v1/products/category/{categoryId}
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<UserProductResponseDTO>> getAvailableProductsByCategoryId(@PathVariable Long categoryId) {
        List<UserProductResponseDTO> products = productService.getAvailableProductsByCategoryId(categoryId);
        return ResponseEntity.ok(products);
    }

    
    // USER API: Lấy chi tiết sản phẩm
    // URL: GET http://localhost:8080/api/v1/products/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserProductResponseDTO> getAvailableProductById(@PathVariable Long id) {
        UserProductResponseDTO product = productService.getAvailableProductById(id);
        return ResponseEntity.ok(product);
    }
    

}
