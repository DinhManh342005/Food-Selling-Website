package vn.manh.FoodSelling.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequestDTO {
    private String fullName;

    @Email(message = "Email should be valid format")
    private String email;

    @Size(min = 10, max = 10, message = "Phone number must have 10 digits")
    @Pattern(regexp = "^$|[0-9]{10}", message = "Phone number must be 10 digits")
    private String phoneNumber;
}
