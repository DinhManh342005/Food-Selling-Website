package vn.manh.FoodSelling.dto.request;

import lombok.Data;
import vn.manh.FoodSelling.enums.UserRole;
import vn.manh.FoodSelling.enums.UserStatus;

@Data
public class UserUpdateRequestDTO {
    private UserStatus status;
    private UserRole role;
}
