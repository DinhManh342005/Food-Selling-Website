package vn.manh.FoodSelling.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import vn.manh.FoodSelling.dto.request.ProductCreateDTO;
import vn.manh.FoodSelling.dto.response.ProductResponseDTO;
import vn.manh.FoodSelling.service.ProductService;
import vn.manh.FoodSelling.service.StorageService;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;



// Controller cho upload hình anh cho Product
@RestController
@RequestMapping("/api/v1")
public class ProductController {

    @Autowired
    private ProductService productService;
    
    // USER API: Lấy toàn bộ sản phẩm đang bán
    // URL: GET http://localhost:8080/api/v1/products
    @GetMapping("/products")
    public ResponseEntity<List<ProductResponseDTO>> getAllProducts() {
        List<ProductResponseDTO> products = productService.getAllAvailableProducts();
        return ResponseEntity.ok(products);
    }

    // USER API: Lấy chi tiết 1 sản phẩm
    // URL: GET http://localhost:8080/api/v1/products/{id}
    @GetMapping("/products/{id}")
    public ResponseEntity<ProductResponseDTO> getProductById(@PathVariable Long id) {
        ProductResponseDTO product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }
    
    // ADMIN API: Thêm 1 sản phẩm

    // URL: POST http://localhost:8080/api/v1/admin/products
    @PostMapping("/admin/products")
    public ResponseEntity<ProductResponseDTO> addProduct(@Valid @RequestBody ProductCreateDTO productCreateDTO) {
        ProductResponseDTO addedproduct = productService.addProduct(productCreateDTO);
        return new ResponseEntity<>(addedproduct, HttpStatus.CREATED);
    }
    

    // Image upload
    @Autowired
    private StorageService storageService;

    // USER API: Upload hình anh cho Product
    // URL: POST http://localhost:8080/api/v1/products/upload - chưa test
    @PostMapping("/products/upload")
    public ResponseEntity<?> upload(@RequestParam("file")
    MultipartFile file) throws IOException {
        String imageUrl =
                storageService.save(file);

        return ResponseEntity.ok(imageUrl);
    }
}