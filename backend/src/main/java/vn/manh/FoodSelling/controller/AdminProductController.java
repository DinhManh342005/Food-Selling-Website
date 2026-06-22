package vn.manh.FoodSelling.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.request.ProductCreateDTO;
import vn.manh.FoodSelling.dto.response.AdminProductResponseDTO;
import vn.manh.FoodSelling.dto.response.ImageUploadResponse;
import vn.manh.FoodSelling.service.ProductService;
import vn.manh.FoodSelling.service.StorageService;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/admin/products")
public class AdminProductController {

    private final ProductService productService;
    private final StorageService storageService;

    @GetMapping
    public ResponseEntity<List<AdminProductResponseDTO>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminProductResponseDTO> getProductById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                productService.getProductById(id)
        );
    }

    @PostMapping
    public ResponseEntity<AdminProductResponseDTO> addProduct(
            @Valid @RequestBody ProductCreateDTO productCreateDTO
    ) {
        AdminProductResponseDTO addedProduct =
                productService.addProduct(productCreateDTO);

        return new ResponseEntity<>(
                addedProduct,
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminProductResponseDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductCreateDTO productCreateDTO
    ) {
        return ResponseEntity.ok(
                productService.updateProduct(id, productCreateDTO)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id
    ) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<AdminProductResponseDTO>> searchProducts(
            @RequestParam String name
    ) {
        return ResponseEntity.ok(
                productService.searchProductByName(name)
        );
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateProductStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        productService.updateProductStatus(id, status);
        return ResponseEntity.ok().build();
    }

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ImageUploadResponse> uploadProductImage(
            @RequestParam("file") MultipartFile file
    ) throws IOException {

        ImageUploadResponse result = storageService.save(file);

        return ResponseEntity.ok(result);
    }
}

