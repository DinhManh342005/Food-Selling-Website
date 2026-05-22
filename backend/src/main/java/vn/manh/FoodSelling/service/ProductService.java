package vn.manh.FoodSelling.service;

import java.util.List;

import vn.manh.FoodSelling.dto.request.ProductCreateDTO;
import vn.manh.FoodSelling.dto.response.ProductResponseDTO;

public interface ProductService {
    public List<ProductResponseDTO> getAllProducts();

    public List<ProductResponseDTO> getAllAvailableProducts();

    public ProductResponseDTO getProductById(Long id);

    public ProductResponseDTO addProduct(ProductCreateDTO dto);
}
