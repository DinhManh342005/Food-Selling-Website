package vn.manh.FoodSelling.dto.request;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

// DTO dùng khi admin tạo hoặc cập nhật sản phẩm
@Data
public class ProductCreateDTO {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Giá sản phẩm không được để trống")
    @DecimalMin(
            value = "0.0",
            inclusive = true,
            message = "Giá sản phẩm phải lớn hơn hoặc bằng 0"
    )
    private BigDecimal price;

    @NotNull(message = "Số lượng tồn kho không được để trống")
    @jakarta.validation.constraints.Min(
            value = 0,
            message = "Số lượng tồn kho phải lớn hơn hoặc bằng 0"
    )
    private Integer stockQuantity;

    @NotNull(message = "Phải chọn danh mục sản phẩm")
    private Long categoryId;

    // URL HTTPS do Cloudinary trả về, dùng để hiển thị ảnh chính
    private String imageUrl;

    // Mã Cloudinary dùng để xóa hoặc thay ảnh chính
    private String imagePublicId;

    // Danh sách URL các ảnh chi tiết
    private List<String> detailImages = new ArrayList<>();

    private List<String> detailImagePublicIds = new ArrayList<>();




    // Mẫu JSON gửi từ admin để tạo sản phẩm mới:
    // "categoryId": 1,
    // "description": "Bánh cuốn nóng nhân thịt ăn cùng chả quế truyền thống.",
    // "detailImages": [],
    // "imageUrl": null,
    // "name": "Bánh Cuốn Thanh Trì",
    // "price": 45000.00,
    // "productId": 5,
    // "status": "available",
    // "stockQuantity": 60

}
