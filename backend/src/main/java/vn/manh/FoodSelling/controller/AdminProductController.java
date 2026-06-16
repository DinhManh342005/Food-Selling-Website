package vn.manh.FoodSelling.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.request.ProductCreateDTO;
import vn.manh.FoodSelling.dto.response.AdminProductResponseDTO;
import vn.manh.FoodSelling.service.ProductService;
import vn.manh.FoodSelling.service.StorageService;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;


// Controller này sẽ xử lý các API liên quan đến Product, bao gồm cả API cho Admin
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/admin")
public class AdminProductController {

    // Dependency Injection -đây là Field Injection
    // @Autowired để tự động tiêm ProductService vào controller, giúp chúng ta có thể gọi các phương thức của service để xử lý logic nghiệp vụ liên quan đến sản phẩm
    private final ProductService productService;
    
    // USER API: Lấy toàn bộ sản phẩm đang bán
    // URL: GET http://localhost:8080/api/v1/admin/products
    @GetMapping("/products")
    public ResponseEntity<List<AdminProductResponseDTO>> getAllProducts() {
        List<AdminProductResponseDTO> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    // USER API: Lấy chi tiết 1 sản phẩm
    // URL: GET http://localhost:8080/api/v1/admin/products/{id}
    @GetMapping("/products/{id}")
    public ResponseEntity<AdminProductResponseDTO> getProductById(@PathVariable Long id) {
        AdminProductResponseDTO product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }
    
    // Sử dụng @Valid để kích hoạt validation cho ProductCreateDTO, giúp đảm bảo dữ liệu đầu vào hợp lệ trước khi được xử lý trong service. 
    // Nếu dữ liệu không hợp lệ, Spring sẽ tự động trả về lỗi 400 Bad Request với thông tin chi tiết về lỗi.
    // ADMIN API: Thêm 1 sản phẩm
    // URL: POST http://localhost:8080/api/v1/admin/products
    @PostMapping("/products")
    public ResponseEntity<AdminProductResponseDTO> addProduct(@Valid @RequestBody ProductCreateDTO productCreateDTO) {
        AdminProductResponseDTO addedproduct = productService.addProduct(productCreateDTO);
        return new ResponseEntity<>(addedproduct, HttpStatus.CREATED);
    }
    
    // ADMIN API: Cập nhật 1 sản phẩm
    // URL: PUT http://localhost:8080/api/v1/admin/products/{id}
    @PutMapping("/products/{id}")
    public ResponseEntity<AdminProductResponseDTO> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductCreateDTO productCreateDTO) {
        AdminProductResponseDTO updatedProduct = productService.updateProduct(id, productCreateDTO);
        return ResponseEntity.ok(updatedProduct);
    }

    // ADMIN API: Xóa 1 sản phẩm
    // URL: DELETE http://localhost:8080/api/v1/admin/products/{id}
    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
    
    // ADMIN API: Tìm kiếm sản phẩm theo tên
    // URL: GET http://localhost:8080/api/v1/admin/products/search?name
    @GetMapping("/products/search")
    public ResponseEntity<List<AdminProductResponseDTO>> getProductByName(@RequestParam String name) {
        List<AdminProductResponseDTO> products = productService.searchProductByName(name);
        return ResponseEntity.ok(products   );
    }



    // ADMIN API: Cập nhật trạng thái (status) sản phẩm
    // URL: PUT http://localhost:8080/api/v1/admin/products/{id}/status
    // @RequestParam String status sẽ lấy giá trị status từ query parameter, ví dụ: http://localhost:8080/api/v1/admin/products/1/status?status=available
    // hay chính là lấy ra một THAM SỐ
    // @PathVariable sẽ lấy ra một BIẾN từ đường dẫn URL, ví dụ: http://localhost:8080/api/v1/admin/products/1/status thì id sẽ là 1
    @PutMapping("/products/{id}/status")
    public ResponseEntity<Void> updateProductStatus(@PathVariable Long id, @RequestParam String status) {
        productService.updateProductStatus(id, status);
        return ResponseEntity.ok().build();
    }

    // Image upload
    private StorageService storageService;  // Đã tự tiêm phụ thuộc qua RequiredArgsConstructor
    // USER API: Upload hình anh cho Product
    // URL: POST http://localhost:8080/api/v1/admin/products/upload - chưa test
    @PostMapping("/products/upload")
    public ResponseEntity<?> upload(@RequestParam("file")
    MultipartFile file) throws IOException {
        String imageUrl =
                storageService.save(file);

        return ResponseEntity.ok(imageUrl);
    }
}