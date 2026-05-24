package vn.manh.FoodSelling.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import vn.manh.FoodSelling.dto.request.ProductCreateDTO;
import vn.manh.FoodSelling.dto.request.ProductUpdateDTO;
import vn.manh.FoodSelling.dto.response.ProductResponseDTO;
import vn.manh.FoodSelling.service.ProductService;
import vn.manh.FoodSelling.service.StorageService;

// Controller xử lý API sản phẩm cho user và admin.
@RestController
@RequestMapping("/api/v1")
public class ProductController {
    @Autowired
    private ProductService productService;

    @Autowired
    private StorageService storageService;

    // USER API: Lấy toàn bộ sản phẩm đang bán.
    // URL: GET http://localhost:8080/api/v1/products
    @GetMapping("/products")
    public ResponseEntity<List<ProductResponseDTO>> getAllProducts() {
        List<ProductResponseDTO> products = productService.getAllAvailableProducts();
        return ResponseEntity.ok(products);
    }

    // USER API: Lấy chi tiết 1 sản phẩm.
    // URL: GET http://localhost:8080/api/v1/products/{id}
    @GetMapping("/products/{id}")
    public ResponseEntity<ProductResponseDTO> getProductById(@PathVariable Long id) {
        ProductResponseDTO product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    // ADMIN API: Lấy toàn bộ sản phẩm, bao gồm cả sản phẩm không còn bán.
    // URL: GET http://localhost:8080/api/v1/admin/products
    @GetMapping("/admin/products")
    public ResponseEntity<List<ProductResponseDTO>> getAllProductsForAdmin() {
        List<ProductResponseDTO> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    // ADMIN API: Lấy chi tiết 1 sản phẩm theo ID.
    // URL: GET http://localhost:8080/api/v1/admin/products/{id}
    @GetMapping("/admin/products/{id}")
    public ResponseEntity<ProductResponseDTO> getProductByIdForAdmin(@PathVariable Long id) {
        ProductResponseDTO product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    // ADMIN API: Thêm sản phẩm mới.
    // URL: POST http://localhost:8080/api/v1/admin/products
    @PostMapping("/admin/products")
    public ResponseEntity<ProductResponseDTO> addProduct(@Valid @RequestBody ProductCreateDTO productCreateDTO) {
        ProductResponseDTO addedProduct = productService.addProduct(productCreateDTO);
        return new ResponseEntity<>(addedProduct, HttpStatus.CREATED);
    }

    // ADMIN API: Cập nhật sản phẩm.
    // URL: PUT http://localhost:8080/api/v1/admin/products/{id}
    @PutMapping("/admin/products/{id}")
    public ResponseEntity<ProductResponseDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateDTO productUpdateDTO
    ) {
        ProductResponseDTO updatedProduct = productService.updateProduct(id, productUpdateDTO);
        return ResponseEntity.ok(updatedProduct);
    }

    // ADMIN API: Xóa sản phẩm theo ID.
    // URL: DELETE http://localhost:8080/api/v1/admin/products/{id}
    @DeleteMapping("/admin/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // API upload hình ảnh sản phẩm.
    // URL: POST http://localhost:8080/api/v1/products/upload
    @PostMapping("/products/upload")
    public ResponseEntity<String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        String imageUrl = storageService.save(file);
        return ResponseEntity.ok(imageUrl);
    }
}
