package vn.manh.FoodSelling.service;

import vn.manh.FoodSelling.dto.request.OrderRequestDTO;
import vn.manh.FoodSelling.dto.response.AdminOrderResponseDTO;
import vn.manh.FoodSelling.dto.response.OrderPreviewResponseDTO;
import vn.manh.FoodSelling.dto.response.OrderResponseDTO;

import java.util.List;

public interface OrderService {

    // USER
    public OrderPreviewResponseDTO getCheckoutPreview();

    public OrderResponseDTO checkout(OrderRequestDTO orderRequestDTO);

    public List<OrderResponseDTO> getOrdersHistory();

    public OrderResponseDTO getMyOrderById(Long orderId);

    // Xác nhận đã nhận hàng (chuyển trạng thái sang completed)
    public OrderResponseDTO markOrderAsReceived(Long orderId);

    // Hủy đơn hàng (chỉ cho phép khi đơn hàng đang pending)
    public OrderResponseDTO cancelOrder(Long orderId);

    // ADMIN
    public List<AdminOrderResponseDTO> getAllOrdersForAdmin();

    public AdminOrderResponseDTO getOrderByIdForAdmin(Long orderId);

    public AdminOrderResponseDTO updateOrderStatusForAdmin(Long orderId, String status);

}
