package vn.manh.FoodSelling.service;

import java.util.List;

import vn.manh.FoodSelling.dto.request.ProductCreateDTO;
import vn.manh.FoodSelling.dto.response.AdminProductResponseDTO;
import vn.manh.FoodSelling.dto.response.UserProductResponseDTO;

public interface ProductService {
    // Các hàm dành cho Admin
    public List<AdminProductResponseDTO> getAllProducts();

    public AdminProductResponseDTO getProductById(Long id);

    public List<AdminProductResponseDTO> searchProductByName(String name); // AdminProductResponseDTO
                                                                           // getProductByName(String name);

    public AdminProductResponseDTO addProduct(ProductCreateDTO dto);

    public AdminProductResponseDTO updateProduct(Long id, ProductCreateDTO dto);

    public void deleteProduct(Long id);

    public void updateProductStatus(Long id, String status);

    // Các hàm dành cho User
    public List<UserProductResponseDTO> getAllAvailableProducts();

    public List<UserProductResponseDTO> searchAvailableProductByName(String name);

    public List<UserProductResponseDTO> getAvailableProductsByCategoryId(Long categoryId);

    public UserProductResponseDTO getAvailableProductById(Long id);

}