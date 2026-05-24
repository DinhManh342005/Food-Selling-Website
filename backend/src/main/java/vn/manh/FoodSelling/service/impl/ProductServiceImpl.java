package vn.manh.FoodSelling.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vn.manh.FoodSelling.dto.request.ProductCreateDTO;
import vn.manh.FoodSelling.dto.request.ProductUpdateDTO;
import vn.manh.FoodSelling.dto.response.ProductResponseDTO;
import vn.manh.FoodSelling.entity.Category;
import vn.manh.FoodSelling.entity.Product;
import vn.manh.FoodSelling.entity.ProductImage;
import vn.manh.FoodSelling.enums.ProductStatus;
import vn.manh.FoodSelling.repository.CategoryRepository;
import vn.manh.FoodSelling.repository.ProductRepository;
import vn.manh.FoodSelling.service.ProductService;

@Service
public class ProductServiceImpl implements ProductService {
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    // Lấy danh sách tất cả sản phẩm cho trang admin.
    @Override
    public List<ProductResponseDTO> getAllProducts() {
        return productRepository.findAll().stream()
        .map(this::convertToDTO)
        .collect(Collectors.toList());
    }

    // Lấy danh sách sản phẩm đang bán cho user.
    @Override
    public List<ProductResponseDTO> getAllAvailableProducts() {
        return productRepository.findByStatus(ProductStatus.AVAILABLE).stream()
        .map(this::convertToDTO)
        .collect(Collectors.toList());
    }

    // Lấy chi tiết sản phẩm theo ID.
    @Override
    public ProductResponseDTO getProductById(Long id) {
        Product product = findProductById(id);
        return convertToDTO(product);
    }

    // Admin thêm sản phẩm mới, kèm danh sách ảnh chi tiết nếu có.
    @Override
    @Transactional
    public ProductResponseDTO addProduct(ProductCreateDTO dto) {
        Category category = findCategoryById(dto.getCategoryId());

        Product product = Product.builder()
        .name(dto.getName())
        .description(dto.getDescription())
        .imageUrl(resolveImageUrl(dto.getImageUrl(), dto.getDetailImages()))
        .price(dto.getPrice())
        .stockQuantity(dto.getStockQuantity())
        .status(dto.getStockQuantity() > 0 ? ProductStatus.AVAILABLE : ProductStatus.UNAVAILABLE)
        .category(category)
        .build();
        product.setImages(buildProductImages(dto.getDetailImages(), product));

        Product savedProduct = productRepository.save(product);
        return convertToDTO(savedProduct);
    }

    // Admin cập nhật thông tin sản phẩm và thay thế danh sách ảnh chi tiết.
    @Override
    @Transactional
    public ProductResponseDTO updateProduct(Long id, ProductUpdateDTO dto) {
        Product product = findProductById(id);
        Category category = findCategoryById(dto.getCategoryId());

        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setImageUrl(resolveImageUrl(dto.getImageUrl(), dto.getDetailImages()));
        product.setPrice(dto.getPrice());
        product.setStockQuantity(dto.getStockQuantity());
        product.setStatus(dto.getStatus() != null
                ? dto.getStatus()
                : (dto.getStockQuantity() > 0 ? ProductStatus.AVAILABLE : ProductStatus.UNAVAILABLE));
        product.setCategory(category);

        if (dto.getDetailImages() != null) {
            if (product.getImages() == null) {
                product.setImages(new ArrayList<>());
            }
            product.getImages().clear();
            product.getImages().addAll(buildProductImages(dto.getDetailImages(), product));
        }

        Product savedProduct = productRepository.save(product);
        return convertToDTO(savedProduct);
    }

    // Admin xóa sản phẩm theo ID.
    @Override
    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Khong tim thay san pham voi ID " + id);
        }
        productRepository.deleteById(id);
    }

    private Product findProductById(Long id) {
        return productRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Khong tim thay san pham voi ID " + id));
    }

    private Category findCategoryById(Long id) {
        return categoryRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Khong ton tai Category co id " + id));
    }

    // Chuyển Entity Product sang DTO để trả về client.
    private ProductResponseDTO convertToDTO(Product product) {
        ProductResponseDTO dto = new ProductResponseDTO();
        dto.setProductId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setImageUrl(product.getImageUrl());
        dto.setPrice(product.getPrice());
        dto.setStockQuantity(product.getStockQuantity());
        dto.setStatus(product.getStatus());
        dto.setCategoryId(product.getCategory().getId());

        if (product.getImages() != null) {
            dto.setDetailImages(product.getImages().stream()
            .map(ProductImage::getImageUrl)
            .collect(Collectors.toList()));
        } else {
            dto.setDetailImages(new ArrayList<>());
        }
        return dto;
    }

    // Tạo danh sách ProductImage từ danh sách URL client gửi lên.
    private List<ProductImage> buildProductImages(List<String> imageUrls, Product product) {
        if (imageUrls == null) {
            return new ArrayList<>();
        }
        return imageUrls.stream()
        .filter(imageUrl -> imageUrl != null && !imageUrl.isBlank())
        .map(imageUrl -> ProductImage.builder()
                .imageUrl(imageUrl)
                .isThumbnail(false)
                .product(product)
                .build())
        .collect(Collectors.toList());
    }

    // Nếu không có ảnh đại diện riêng thì dùng ảnh chi tiết đầu tiên làm ảnh chính.
    private String resolveImageUrl(String imageUrl, List<String> detailImages) {
        if (imageUrl != null && !imageUrl.isBlank()) {
            return imageUrl;
        }
        if (detailImages == null) {
            return null;
        }
        return detailImages.stream()
        .filter(url -> url != null && !url.isBlank())
        .findFirst()
        .orElse(null);
    }
}
