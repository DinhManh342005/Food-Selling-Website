package vn.manh.FoodSelling.service;

import vn.manh.FoodSelling.dto.request.OrderRequestDTO;
import vn.manh.FoodSelling.dto.response.OrderPreviewResponseDTO;
import vn.manh.FoodSelling.dto.response.OrderResponseDTO;

public interface OrderService {
    public OrderPreviewResponseDTO getCheckoutPreview();

    public OrderResponseDTO checkout(OrderRequestDTO orderRequestDTO);

    
}
