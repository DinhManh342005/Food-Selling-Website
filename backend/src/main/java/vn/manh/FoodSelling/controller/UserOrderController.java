package vn.manh.FoodSelling.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.request.OrderRequestDTO;
import vn.manh.FoodSelling.dto.response.OrderPreviewResponseDTO;
import vn.manh.FoodSelling.dto.response.OrderResponseDTO;
import vn.manh.FoodSelling.service.OrderService;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/orders")
public class UserOrderController {
    private final OrderService orderService;

    // Xem trước thông tin đơn hàng khi bấm từ giỏ hàng sang trang thanh toán
    // URL: GET http://localhost:8080/api/v1/user/orders/previews
    @GetMapping("/previews")
    public ResponseEntity<OrderPreviewResponseDTO> getCheckoutPreview() {
        return ResponseEntity.ok(orderService.getCheckoutPreview());
    }

    // API thực sự đặt hàng (Bấm xác nhận ở Form nhập tên, sđt, địa chỉ)
    // URL: POST http://localhost:8080/api/v1/user/orders/checkout
    @PostMapping("/checkout")
    public ResponseEntity<OrderResponseDTO> checkout(@Valid @RequestBody OrderRequestDTO orderRequestDTO) {
        OrderResponseDTO response = orderService.checkout(orderRequestDTO);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Xem lịch sử các đơn hàng mà ta đã đặt
    // URL: GET http://localhost:8080/api/v1/user/orders
    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getOrdersHistory() {
        return ResponseEntity.ok(orderService.getOrdersHistory());
    }

    // Xem chi tiết 1 đơn hàng theo ID
    // URL: GET http://localhost:8080/api/v1/user/orders/{orderId}
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponseDTO> getMyOrderById(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getMyOrderById(orderId));
    }

}
