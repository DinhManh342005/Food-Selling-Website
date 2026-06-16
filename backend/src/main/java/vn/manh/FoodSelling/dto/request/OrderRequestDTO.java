package vn.manh.FoodSelling.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;


// dto để nhận dữ liệu tạo order
@Data
public class OrderRequestDTO {
    @NotNull(message = "Receiver name is not null")
    private String receiverName;     // Họ tên người nhận

    @NotNull(message = "Receiver phone is not null")
    private String receiverPhone;    // Số điện thoại nhận hàng

    @NotNull(message = "Shipping address is not null")
    private String receiverAddress;  // Địa chỉ giao tại Hà Nội
    
    private String note;
}
