package vn.manh.FoodSelling.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vn.manh.FoodSelling.dto.request.ProductCreateDTO;
import vn.manh.FoodSelling.dto.response.ProductResponseDTO;
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

    // 1. Lấy danh sách sản phẩm hiển thị ra
    @Override
    public List<ProductResponseDTO> getAllProducts() {
        List<Product> products = productRepository.findAll();
        // Chuyển dữ liệu Product sang ProductResponseDTO bằng stream().map()
        return products.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // 2. Lấy danh sách sản phẩm - chỉ lấy hàng có sẵn trong kho (available)
    @Override
    public List<ProductResponseDTO> getAllAvailableProducts() {
        List<Product> products = productRepository.findByStatus(ProductStatus.available);
        return products.stream().map(this::convertToDTO).collect(Collectors.toList());  
    }

    // get Product theo id
    // Optional là kiểu dữ liệu trả về - mục đích: dữ liệu có thể null
    @Override
    public ProductResponseDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
        . orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID " + id));
        return convertToDTO(product);
    }


    // 3. Admin thêm sản phẩm mới (Có dùng @Transactional để bảo đảm an toàn dữ liệu khi lưu nhiều bảng)
    @Override
    @Transactional
    public ProductResponseDTO addProduct(ProductCreateDTO dto) {
        Product p = Product.builder()
        .name(dto.getName())
        .description(dto.getDescription())
        //.imageUrl(dto.getImageUrl())
        .price(dto.getPrice())
        .stockQuantity(dto.getStockQuantity())
        .status(dto.getStockQuantity() > 0 ?  ProductStatus.available : ProductStatus.unavailable) 
        .category(categoryRepository.findById(dto.getCategoryId()).orElseThrow(() ->  new RuntimeException("Không tồn tại Category có id " + dto.getCategoryId())))
        .build();

        Product savedProduct = productRepository.save(p);
        return convertToDTO(savedProduct);
    

    }


    // Hàm Helper để convert Product sang ProductResponseDTO để chuyển về cho client
    // Optional là kiểu dữ liệu trả về - mục đích: dữ liệu có thể null
    private ProductResponseDTO convertToDTO(Product product) {
        if (product != null) {
            ProductResponseDTO dto = new ProductResponseDTO();
            dto.setProductId(product.getId());
            dto.setName(product.getName());
            dto.setDescription(product.getDescription());
            dto.setImageUrl(product.getImageUrl());
            dto.setPrice(product.getPrice());
            dto.setStockQuantity(product.getStockQuantity());
            dto.setStatus(product.getStatus());
            dto.setCategoryId(product.getCategory().getId());
           
            // Chuyển đổi danh sách ProductImage sang danh sách imageUrl
            // Sử dụng stream để chuyển đổi
            if(product.getImages() != null){
                dto.setDetailImages(product.getImages().stream()
                .map(ProductImage :: getImageUrl)
                .collect(Collectors.toList()));
            }else {
                dto.setDetailImages(new ArrayList<>());
            }
            return dto;
        }
        return null;
    }


}
