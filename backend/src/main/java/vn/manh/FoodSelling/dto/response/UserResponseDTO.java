package vn.manh.FoodSelling.dto.response;

import java.time.LocalDate;

import lombok.Data;
import vn.manh.FoodSelling.enums.UserRole;
import vn.manh.FoodSelling.enums.UserStatus;

@Data
public class UserResponseDTO {
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private UserStatus status;
    private UserRole role;
    private LocalDate createAt;
}
