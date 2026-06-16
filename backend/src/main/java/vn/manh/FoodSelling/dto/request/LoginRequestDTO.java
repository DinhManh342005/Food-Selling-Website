package vn.manh.FoodSelling.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


// DTO này sẽ được sử dụng để nhận dữ liệu đăng nhập từ client (ví dụ: username và password).
@Data // Tự động sinh ra các hàm Getter, Setter, toString, equals, hashCode
@NoArgsConstructor // Tự động sinh ra Constructor không tham số (Bắt buộc phải có để Spring giải mã JSON)
@AllArgsConstructor // Tự động sinh ra Constructor có đầy đủ tham số
public class LoginRequestDTO {
    @NotNull(message = "Username is not null")
    @Size(min = 4, max = 20, message = "Username must be between 4 and 20 characters")
    private String username;

    @NotNull(message = "Password is not null")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;
}