package vn.manh.FoodSelling.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequestDTO {

    @NotBlank(message = "Old password is required")
    @Size(min = 6, max = 100, message = "Old password must be between 6 and 100 characters long")
    private String oldPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 6, max = 100, message = "New password must be between 6 and 100 characters long")
    // @Pattern(regexp =
    // "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
    // message = "Password must be at least 8 characters long and contain at least
    // one lowercase letter, one uppercase letter, one digit, and one special
    // character") - trường hợp sau này nếu cần bảo mật hơn
    private String newPassword;

    @NotBlank(message = "Confirm password is required")
    @Size(min = 6, max = 100, message = "Confirm password must be between 6 and 100 characters long")
    private String confirmPassword;
}
