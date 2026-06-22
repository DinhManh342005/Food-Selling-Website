package vn.manh.FoodSelling.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.request.OrderRequestDTO;
import vn.manh.FoodSelling.dto.response.AdminOrderResponseDTO;
import vn.manh.FoodSelling.dto.response.OrderPreviewItemDTO;
import vn.manh.FoodSelling.dto.response.OrderPreviewResponseDTO;
import vn.manh.FoodSelling.dto.response.OrderResponseDTO;
import vn.manh.FoodSelling.entity.Cart;
import vn.manh.FoodSelling.entity.CartItem;
import vn.manh.FoodSelling.entity.Order;
import vn.manh.FoodSelling.entity.OrderItem;
import vn.manh.FoodSelling.entity.Product;
import vn.manh.FoodSelling.entity.User;
import vn.manh.FoodSelling.enums.OrderStatus;
import vn.manh.FoodSelling.enums.ProductStatus;
import vn.manh.FoodSelling.repository.CartRepository;
import vn.manh.FoodSelling.repository.OrderRepository;
import vn.manh.FoodSelling.repository.ProductRepository;
import vn.manh.FoodSelling.repository.UserRepository;
import vn.manh.FoodSelling.service.CartService;
import vn.manh.FoodSelling.service.OrderService;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final UserRepository userRepository;

    private final OrderRepository orderRepository;

    private final CartRepository cartRepository;

    private final ProductRepository productRepository;

    private final ModelMapper modelMapper;

    private final CartService cartService;

    // ==================================================
    // DÀNH CHO USER - ORDER
    // ==================================================
    // XEM TRƯỚC ĐƠN HÀNG: không ghi DB, không trừ kho, chỉ tính toán và kiểm tra số
    // lượng trong kho
    @Override
    public OrderPreviewResponseDTO getCheckoutPreview() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!!"));

        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Giỏ hàng không tồn tại"));

        List<CartItem> cartItems = cart.getCartItems();

        if (cartItems == null || cartItems.isEmpty()) {
            throw new RuntimeException("Giỏ hàng trống, không có gì để xem trước");
        }

        List<OrderPreviewItemDTO> previewItems = new ArrayList<>();

        // Quét qua giỏ hàng để gom dữ liệu xem trước
        for (CartItem item : cartItems) {
            Product product = item.getProduct();

            // Validate sớm: Nếu trong khi đang xem trước mà có người khác đặt hàng thì sẽ
            // báo lỗi luôn
            if (item.getQuantity() > product.getStockQuantity()) {
                throw new RuntimeException("Sản phẩm " + product.getName() + " không còn đủ số lượng trong kho");
            }

            previewItems.add(OrderPreviewItemDTO.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .productPrice(product.getPrice())
                    .totalPrice(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .quantity(item.getQuantity())
                    .productImageUrl(product.getImageUrl())
                    .build());
        }

        return OrderPreviewResponseDTO.builder()
                .totalAmount(cart.getTotalPrice()) // Lấy tổng tiền tính được từ giỏ hàng
                .orderItems(previewItems)
                .build();

    }

    // THỰC SỰ ĐẶT HÀNG: Ghi vào DB, trừ tồn kho thực tế, dọn sạch giỏ hàng -- bước
    // tạo đơn hàng
    @Override
    @Transactional
    public OrderResponseDTO checkout(OrderRequestDTO dto) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!!"));

        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Giỏ hàng không tồn tại"));

        List<CartItem> cartItems = cart.getCartItems();
        if (cartItems == null || cartItems.isEmpty()) {
            throw new RuntimeException("Giỏ hàng trống !!!");
        }

        Order order = Order.builder()
                .user(user)
                .receiverName(dto.getReceiverName())
                .receiverPhone(dto.getReceiverPhone())
                .receiverAddress(dto.getReceiverAddress())
                .note(dto.getNote())
                .status(OrderStatus.pending)
                .orderDate(LocalDateTime.now())
                .totalAmount(cart.getTotalPrice())
                .build();

        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem item : cartItems) {
            Product product = item.getProduct();

            if (product.getStockQuantity() < item.getQuantity()) {
                throw new RuntimeException("Sản phẩm " + product.getName() + " không đủ số lượng trong kho");
            }

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(item.getQuantity())
                    .productPrice(product.getPrice())
                    .totalPrice(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .build();

            orderItems.add(orderItem);
            // Trừ đi số lượng sản phẩm trong kho
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            if (product.getStockQuantity() == 0) {
                product.setStatus(ProductStatus.unavailable);
            }
            productRepository.save(product);
        }

        order.setOrderItems(orderItems);
        Order savedOrder = orderRepository.save(order);

        // Kích hoạt dọn dẹp mồ côi mảng con trên RAM để hibernate tự động dọn DB
        cartService.clearCart();
        cartRepository.save(cart);

        // Chuyển đổi Order Entity sang OrderResponseDTO
        OrderResponseDTO response = modelMapper.map(savedOrder, OrderResponseDTO.class);
        // response.setReceiverAddress(savedOrder.getReceiverAddress()); // do tên field
        // ở entity và dto mismatch

        // Tự động map orderItems -> orderItemResponses để trả về cho FE
        if (orderItems != null && !orderItems.isEmpty()) {
            List<OrderPreviewItemDTO> orderItemsDTO = orderItems.stream().map(item -> OrderPreviewItemDTO.builder()
                    .productId(item.getProduct().getId())
                    .productName(item.getProduct().getName())
                    .productImageUrl(item.getProduct().getImageUrl())
                    .quantity(item.getQuantity())
                    .productPrice(item.getProductPrice())
                    .totalPrice(item.getTotalPrice())
                    .build()).collect(Collectors.toList());
            response.setOrderItems(orderItemsDTO); // Bơm mảng items vào DTO
        }
        return response;
    }

    // Lấy danh sách đơn hàng của User
    @Override
    @Transactional
    public List<OrderResponseDTO> getOrdersHistory() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        // Lấy tất cả order của user, sắp xếp giảm dần theo ID (mới nhất trước)
        List<Order> orders = orderRepository.findByUserOrderByOrderDateDesc(user);

        if (orders.isEmpty()) {
            return new ArrayList<>();
        }

        return orders.stream().map(order -> {
            OrderResponseDTO orderDTO = modelMapper.map(order, OrderResponseDTO.class);

            List<OrderPreviewItemDTO> itemDTOs = order.getOrderItems().stream().map(item -> {
                OrderPreviewItemDTO itemDTO = modelMapper.map(item, OrderPreviewItemDTO.class);

                itemDTO.setProductId(item.getProduct().getId());
                itemDTO.setProductName(item.getProduct().getName());
                itemDTO.setProductImageUrl(item.getProduct().getImageUrl());

                // Nếu TotalPrice là null thì tính lại từ ProductPrice * Quantity
                // Do khi vừa save có thể TotalPrice có thể bị null
                if (itemDTO.getTotalPrice() == null && itemDTO.getProductPrice() != null
                        && itemDTO.getQuantity() != null) {
                    itemDTO.setTotalPrice(
                            itemDTO.getProductPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())));
                }

                return itemDTO;

            }).toList();

            orderDTO.setOrderItems(itemDTOs);

            return orderDTO;

        }).toList();

    }

    // Lấy chi tiết đơn hàng của User
    @Override
    @Transactional
    public OrderResponseDTO getMyOrderById(Long orderId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order không tồn tại"));

        if (!order.getUser().equals(user)) {
            throw new RuntimeException("Bạn không có quyền xem đơn hàng này");
        }

        OrderResponseDTO orderDTO = modelMapper.map(order, OrderResponseDTO.class);

        List<OrderPreviewItemDTO> itemDTOs = order.getOrderItems().stream().map(item -> {
            OrderPreviewItemDTO itemDTO = modelMapper.map(item, OrderPreviewItemDTO.class);

            itemDTO.setProductId(item.getProduct().getId());
            itemDTO.setProductName(item.getProduct().getName());
            itemDTO.setProductImageUrl(item.getProduct().getImageUrl());

            if (itemDTO.getTotalPrice() == null && itemDTO.getProductPrice() != null
                    && itemDTO.getQuantity() != null) {
                itemDTO.setTotalPrice(itemDTO.getProductPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())));
            }

            return itemDTO;

        }).toList();

        orderDTO.setOrderItems(itemDTOs);

        return orderDTO;
    }

    // ==================================================
    // DÀNH CHO ADMIN - ORDER
    // ==================================================

    // Lấy tất cả các order (mới nhất trước)
    @Override
    @Transactional
    public List<AdminOrderResponseDTO> getAllOrdersForAdmin() {
        List<Order> orders = orderRepository.findAllByOrderByOrderDateDesc();

        return orders.stream().map(order -> {
            AdminOrderResponseDTO adminOrderDTO = modelMapper.map(order, AdminOrderResponseDTO.class);

            User user = order.getUser();
            if (user != null) {
                adminOrderDTO.setUserId(user.getId());
                adminOrderDTO.setUsername(user.getUsername());
                adminOrderDTO.setFullName(user.getFullName());
                adminOrderDTO.setEmail(user.getEmail());
            }

            List<OrderPreviewItemDTO> itemDTOs = order.getOrderItems().stream().map(item -> {
                OrderPreviewItemDTO itemDTO = modelMapper.map(item, OrderPreviewItemDTO.class);

                itemDTO.setProductId(item.getProduct().getId());
                itemDTO.setProductName(item.getProduct().getName());
                itemDTO.setProductImageUrl(item.getProduct().getImageUrl());

                if (itemDTO.getTotalPrice() == null && itemDTO.getProductPrice() != null
                        && itemDTO.getQuantity() != null) {
                    itemDTO.setTotalPrice(
                            itemDTO.getProductPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())));
                }

                return itemDTO;

            }).toList();

            adminOrderDTO.setOrderItems(itemDTOs);

            return adminOrderDTO;

        }).toList();
    }

    // Lấy chi tiết 1 order
    @Override
    @Transactional
    public AdminOrderResponseDTO getOrderByIdForAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order không tồn tại"));

        AdminOrderResponseDTO adminOrderDTO = modelMapper.map(order, AdminOrderResponseDTO.class);

        // Lấy thông tin user
        User user = order.getUser();
        adminOrderDTO.setUserId(user.getId());
        adminOrderDTO.setUsername(user.getUsername());
        adminOrderDTO.setFullName(user.getFullName());
        adminOrderDTO.setEmail(user.getEmail());

        // Lấy danh sách OrderItems cho Order cần xem
        List<OrderPreviewItemDTO> itemDTOs = order.getOrderItems().stream().map(item -> {
            OrderPreviewItemDTO itemDTO = modelMapper.map(item, OrderPreviewItemDTO.class);

            // Lấy thông tin product từ orderItem
            itemDTO.setProductId(item.getProduct().getId());
            itemDTO.setProductName(item.getProduct().getName());
            itemDTO.setProductImageUrl(item.getProduct().getImageUrl());

            if (itemDTO.getTotalPrice() == null && itemDTO.getProductPrice() != null
                    && itemDTO.getQuantity() != null) {
                itemDTO.setTotalPrice(itemDTO.getProductPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())));
            }

            return itemDTO;

        }).toList();

        adminOrderDTO.setOrderItems(itemDTOs);

        return adminOrderDTO;

    }

    // Cập nhật trạng thái order
    @Override
    @Transactional
    public AdminOrderResponseDTO updateOrderStatusForAdmin(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order không tồn tại"));

        if (status == null || status.trim().isEmpty()) {
            throw new RuntimeException("Trạng thái không được để trống");
        }

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(status.trim());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ");
        }

        order.setStatus(newStatus);
        orderRepository.save(order);

        return getOrderByIdForAdmin(orderId);

    }

}
