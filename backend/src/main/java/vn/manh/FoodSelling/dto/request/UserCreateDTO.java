package vn.manh.FoodSelling.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import vn.manh.FoodSelling.enums.UserRole;
import vn.manh.FoodSelling.enums.UserStatus;

@Data
public class UserCreateDTO {
    @NotBlank(message = "Full name is not blank")
    private String fullName;

    @NotBlank(message = "Password is not blank")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @Email(message = "Email is invalid")
    private String email;

    @NotBlank(message = "Phone is not blank")
    private String phone;

    private UserStatus status;

    private UserRole role;
}
