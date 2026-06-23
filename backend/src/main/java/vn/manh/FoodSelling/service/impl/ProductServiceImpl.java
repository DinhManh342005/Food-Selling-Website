package vn.manh.FoodSelling.service.impl;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.request.ProductCreateDTO;
import vn.manh.FoodSelling.dto.response.AdminProductResponseDTO;
import vn.manh.FoodSelling.dto.response.UserProductResponseDTO;
import vn.manh.FoodSelling.entity.Category;
import vn.manh.FoodSelling.entity.Product;
import vn.manh.FoodSelling.entity.ProductImage;
import vn.manh.FoodSelling.enums.ProductStatus;
import vn.manh.FoodSelling.exception.BadRequestException;
import vn.manh.FoodSelling.exception.ResourceNotFoundException;
import vn.manh.FoodSelling.repository.CategoryRepository;
import vn.manh.FoodSelling.repository.ProductRepository;
import vn.manh.FoodSelling.service.ProductService;
import vn.manh.FoodSelling.service.StorageService;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StorageService storageService;

    private AdminProductResponseDTO convertToDTO_Admin(Product product) {
        if (product == null) {
            return null;
        }

        AdminProductResponseDTO dto = new AdminProductResponseDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setImageUrl(product.getImageUrl());
        dto.setImagePublicId(product.getImagePublicId());
        dto.setPrice(product.getPrice());
        dto.setStockQuantity(product.getStockQuantity());
        dto.setStatus(product.getStatus());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setCategoryId(product.getCategory().getId());
        dto.setDetailImages(toDetailImageUrls(product));
        return dto;
    }

    @Override
    public List<AdminProductResponseDTO> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::convertToDTO_Admin)
                .collect(Collectors.toList());
    }

    @Override
    public AdminProductResponseDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID " + id));
        return convertToDTO_Admin(product);
    }

    @Override
    @Transactional
    public AdminProductResponseDTO addProduct(ProductCreateDTO dto) {
        validateMainImage(dto);

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tồn tại Category có id " + dto.getCategoryId()));

        Product product = Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .imageUrl(normalizeBlank(dto.getImageUrl()))
                .imagePublicId(normalizeBlank(dto.getImagePublicId()))
                .price(dto.getPrice())
                .stockQuantity(dto.getStockQuantity())
                .status(dto.getStockQuantity() > 0 ? ProductStatus.available : ProductStatus.unavailable)
                .category(category)
                .build();

        Product savedProduct = productRepository.save(product);
        return convertToDTO_Admin(savedProduct);
    }

    @Override
    public List<AdminProductResponseDTO> searchProductByName(String name) {
        return productRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(this::convertToDTO_Admin)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminProductResponseDTO updateProduct(Long id, ProductCreateDTO dto) {
        validateMainImage(dto); // Ảnh không được để trống khi update

        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID " + id));

        String oldPublicId = existingProduct.getImagePublicId();

        existingProduct.setName(dto.getName());
        existingProduct.setDescription(dto.getDescription());
        existingProduct.setImageUrl(dto.getImageUrl());
        existingProduct.setImagePublicId(normalizeBlank(dto.getImagePublicId()));
        existingProduct.setPrice(dto.getPrice());
        existingProduct.setStockQuantity(dto.getStockQuantity());
        existingProduct.setStatus(dto.getStockQuantity() > 0 ? ProductStatus.available : ProductStatus.unavailable);
        existingProduct.setCategory(categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tồn tại Category có id " + dto.getCategoryId())));

        Product updatedProduct = productRepository.save(existingProduct);
        deleteOldImageIfChanged(oldPublicId, dto.getImagePublicId());
        return convertToDTO_Admin(updatedProduct);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID " + id));

        if (product.getOrderItems() != null && !product.getOrderItems().isEmpty()) {
            product.setStatus(ProductStatus.unavailable);
            productRepository.save(product);
            return;
        }

        productRepository.delete(product);
        deleteCloudinaryImage(product.getImagePublicId());
    }

    @Override
    @Transactional
    public void updateProductStatus(Long id, String status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID " + id));
        try {
            ProductStatus newStatus = ProductStatus.valueOf(status);
            product.setStatus(newStatus);
            productRepository.save(product);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái không hợp lệ. Vui lòng sử dụng 'available' hoặc 'unavailable'.");
        }
    }

    private UserProductResponseDTO convertToDTO_User(Product product) {
        if (product == null) {
            return null;
        }

        UserProductResponseDTO dto = new UserProductResponseDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setImageUrl(product.getImageUrl());
        dto.setPrice(product.getPrice());
        dto.setAverageRating(product.getAverageRating());
        dto.setDetailImages(toDetailImageUrls(product));
        return dto;
    }

    @Override
    public List<UserProductResponseDTO> getAllAvailableProducts() {
        return productRepository.findByStatus(ProductStatus.available)
                .stream()
                .map(this::convertToDTO_User)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserProductResponseDTO> searchAvailableProductByName(String name) {
        return productRepository.findByNameContainingIgnoreCaseAndStatus(name, ProductStatus.available)
                .stream()
                .map(this::convertToDTO_User)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserProductResponseDTO> getAvailableProductsByCategoryId(Long categoryId) {
        return productRepository.findByCategoryIdAndStatus(categoryId, ProductStatus.available)
                .stream()
                .map(this::convertToDTO_User)
                .collect(Collectors.toList());
    }

    @Override
    public UserProductResponseDTO getAvailableProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID " + id));
        if (product.getStatus() != ProductStatus.available) {
            throw new BadRequestException("Sản phẩm không có sẵn");
        }
        return convertToDTO_User(product);
    }

    private List<String> toDetailImageUrls(Product product) {
        if (product.getImages() == null) {
            return new ArrayList<>();
        }
        return product.getImages()
                .stream()
                .map(ProductImage::getImageUrl)
                .collect(Collectors.toList());
    }

    private void validateMainImage(ProductCreateDTO dto) {
        if (isBlank(dto.getImageUrl())) {
            throw new IllegalArgumentException("Ảnh đại diện sản phẩm không được để trống");
        }
    }

    private void deleteOldImageIfChanged(String oldPublicId, String newPublicId) {
        if (!isBlank(oldPublicId) && !Objects.equals(oldPublicId, newPublicId)) {
            deleteCloudinaryImage(oldPublicId);
        }
    }

    private void deleteCloudinaryImage(String publicId) {
        if (isBlank(publicId)) {
            return;
        }
        try {
            storageService.delete(publicId);
        } catch (IOException e) {
            throw new RuntimeException("Không thể xóa ảnh trên Cloudinary", e);
        }
    }

    private String normalizeBlank(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
