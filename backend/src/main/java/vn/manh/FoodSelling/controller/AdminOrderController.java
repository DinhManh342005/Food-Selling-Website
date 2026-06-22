package vn.manh.FoodSelling.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.response.AdminOrderResponseDTO;
import vn.manh.FoodSelling.service.OrderService;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {

    private final OrderService orderService;

    // ADMIN API: Lấy toàn bộ đơn hàng (có thể phân trang và sắp xếp theo ngày đặt)
    // URL: GET http://localhost:8080/api/v1/admin/orders
    @GetMapping
    public ResponseEntity<List<AdminOrderResponseDTO>> getAllOrder() {
        return ResponseEntity.ok(orderService.getAllOrdersForAdmin());
    }

    // ADMIN API: Lấy chi tiết 1 đơn hàng
    // URL: GET http://localhost:8080/api/v1/admin/orders/{orderId}
    @GetMapping("/{orderId}")
    public ResponseEntity<AdminOrderResponseDTO> getOrderByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrderByIdForAdmin(orderId));
    }

    // ADMIN API: Cập nhật trạng thái đơn hàng (ví dụ: pending -> processing ->
    // shipped -> delivered)
    // URL: PUT http://localhost:8080/api/v1/admin/orders/{orderId}/status
    @PutMapping("/{orderId}/status")
    public ResponseEntity<AdminOrderResponseDTO> updateOrderStatus(@PathVariable Long orderId,
            @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateOrderStatusForAdmin(orderId, status));
    }

}
