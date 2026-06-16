package vn.manh.FoodSelling.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.request.ProductCreateDTO;
import vn.manh.FoodSelling.dto.response.AdminProductResponseDTO;
import vn.manh.FoodSelling.dto.response.UserProductResponseDTO;
import vn.manh.FoodSelling.entity.Product;
import vn.manh.FoodSelling.entity.ProductImage;
import vn.manh.FoodSelling.enums.ProductStatus;
import vn.manh.FoodSelling.repository.CategoryRepository;
import vn.manh.FoodSelling.repository.ProductRepository;
import vn.manh.FoodSelling.service.ProductService;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    
    private final ProductRepository productRepository;
    
    private final CategoryRepository categoryRepository;

    // ================================
    // I. CÁC HÀM DÀNH CHO ADMIN
    // ================================

    // Hàm Helper để convert Product sang AdminProductResponseDTO tương tác với
    // Admin
    // Optional là kiểu dữ liệu trả về - mục đích: dữ liệu có thể null
    private AdminProductResponseDTO convertToDTO_Admin(Product product) {
        if (product != null) {
            AdminProductResponseDTO dto = new AdminProductResponseDTO();
            dto.setId(product.getId());
            dto.setName(product.getName());
            dto.setDescription(product.getDescription());
            dto.setImageUrl(product.getImageUrl());
            dto.setPrice(product.getPrice());
            dto.setStockQuantity(product.getStockQuantity());
            dto.setStatus(product.getStatus());
            dto.setCategoryId(product.getCategory().getId());

            // Chuyển đổi danh sách ProductImage sang danh sách imageUrl
            // Sử dụng stream để chuyển đổi
            if (product.getImages() != null) {
                dto.setDetailImages(product.getImages().stream()
                        .map(ProductImage::getImageUrl)
                        .collect(Collectors.toList()));
            } else {
                dto.setDetailImages(new ArrayList<>());
            }
            return dto;
        }
        return null;
    }

    // 1. Lấy danh sách sản phẩm hiển thị ra
    @Override
    public List<AdminProductResponseDTO> getAllProducts() {
        List<Product> products = productRepository.findAll();
        // Chuyển dữ liệu Product sang ProductResponseDTO bằng stream().map()
        return products.stream().map(this::convertToDTO_Admin).collect(Collectors.toList());
    }

    // 2. get Product theo id
    // Optional là kiểu dữ liệu trả về - mục đích: dữ liệu có thể null
    @Override
    public AdminProductResponseDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID " + id));
        return convertToDTO_Admin(product);
    }

    // 3. Admin thêm sản phẩm mới (Có dùng @Transactional để bảo đảm an toàn dữ liệu
    // khi lưu nhiều bảng)
    @Override
    @Transactional
    public AdminProductResponseDTO addProduct(ProductCreateDTO dto) {
        Product p = Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                // .imageUrl(dto.getImageUrl())
                .price(dto.getPrice())
                .stockQuantity(dto.getStockQuantity())
                .status(dto.getStockQuantity() > 0 ? ProductStatus.available : ProductStatus.unavailable)
                .category(categoryRepository.findById(dto.getCategoryId())
                        .orElseThrow(() -> new RuntimeException("Không tồn tại Category có id " + dto.getCategoryId())))
                .build();

        Product savedProduct = productRepository.save(p);
        return convertToDTO_Admin(savedProduct);
    }

    // 4. Tim kiếm theo name
    @Override
    public List<AdminProductResponseDTO> searchProductByName(String name) { // AdminProductResponseDTO getProductByName(String name) {
        List<Product> products = productRepository.findByNameContainingIgnoreCase(name);    // Tìm kiếm tất cả sản phẩm có tên chứa chuỗi name, không phân biệt hoa thường
        return products.stream().map(this::convertToDTO_Admin).collect(Collectors.toList());
    }

    // 5. Cập nhật sản phẩm - update thông tin sản phẩm
    @Override
    @Transactional
    public AdminProductResponseDTO updateProduct(Long id, ProductCreateDTO dto) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID " + id));

        existingProduct.setName(dto.getName());
        existingProduct.setDescription(dto.getDescription());
        // existingProduct.setImageUrl(dto.getImageUrl());
        existingProduct.setPrice(dto.getPrice());
        existingProduct.setStockQuantity(dto.getStockQuantity());
        existingProduct.setStatus(dto.getStockQuantity() > 0 ? ProductStatus.available : ProductStatus.unavailable);
        existingProduct.setCategory(categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tồn tại Category có id " + dto.getCategoryId())));

        Product updatedProduct = productRepository.save(existingProduct);
        return convertToDTO_Admin(updatedProduct);
    }

    // 6. Xóa sản phẩm
    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID " + id));

        // Không được xóa hoàn toàn sản phẩm, mà chuyển sang xóa mềm (unavailable) để giữ lịch sử doanh thu
        if(product.getOrderItems() != null && !product.getOrderItems().isEmpty()) {
                product.setStatus(ProductStatus.unavailable);
                productRepository.save(product);
        }        

        // Xóa hoàn toàn sản phẩm (do chưa từng có ai mua) - và các quan hệ liên quan
        productRepository.delete(product);
    }

    // 7. Cập nhật trang thái sản phẩm (available/unavailable) - dùng trong trường hợp admin muốn tạm thời ẩn sản phẩm mà không muốn xóa
    @Override
    @Transactional
    public void updateProductStatus(Long id, String status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID " + id));
        try {
            ProductStatus newStatus = ProductStatus.valueOf(status);
            product.setStatus(newStatus);
            productRepository.save(product);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ. Vui lòng sử dụng 'available' hoặc 'unavailable'.");
        }
    }



    // ================================
    // II. CÁC HÀM DÀNH CHO USER
    // ================================

    // Hàm Helper để convert Product sang UserProductResponseDTO tương tác với User
    private UserProductResponseDTO convertToDTO_User(Product product) {
        if (product != null) {
            UserProductResponseDTO dto = new UserProductResponseDTO();
            dto.setId(product.getId());
            dto.setName(product.getName());
            dto.setDescription(product.getDescription());
            dto.setImageUrl(product.getImageUrl());
            dto.setPrice(product.getPrice());
            dto.setAverageRating(product.getAverageRating());

            // Chuyển đổi danh sách ProductImage sang danh sách imageUrl
            if (product.getImages() != null) {
                dto.setDetailImages(product.getImages().stream()
                        .map(ProductImage::getImageUrl)
                        .collect(Collectors.toList()));
            } else {
                dto.setDetailImages(new ArrayList<>());
            }
            return dto;
        }
        return null;
    }

    // 1. Lấy danh sách sản phẩm - chỉ lấy hàng có sẵn trong kho (available)
    @Override
    public List<UserProductResponseDTO> getAllAvailableProducts() {
        List<Product> products = productRepository.findByStatus(ProductStatus.available);
        return products.stream().map(this::convertToDTO_User).collect(Collectors.toList());
    }

    // 2. Tìm kiếm sản phẩm theo tên (available)
    @Override
    public List<UserProductResponseDTO> searchAvailableProductByName(String name) {
        List<Product> products = productRepository.findByNameContainingIgnoreCaseAndStatus(name, ProductStatus.available);
        return products.stream().map(this::convertToDTO_User).collect(Collectors.toList());
    }

    // 3. Lấy sản phẩm theo categoryId (available)
    @Override
    public List<UserProductResponseDTO> getAvailableProductsByCategoryId(Long categoryId) {
        List<Product> products = productRepository.findByCategoryIdAndStatus(categoryId, ProductStatus.available);
        return products.stream().map(this::convertToDTO_User).collect(Collectors.toList());
    }

    //4. Lấy chi tiết sản phẩm (available)
    public UserProductResponseDTO getAvailableProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID " + id));
        if (product.getStatus() != ProductStatus.available) {
            throw new RuntimeException("Sản phẩm không có sẵn");
        }
        return convertToDTO_User(product);
    }


}
