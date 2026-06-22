package vn.manh.FoodSelling.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.request.ChangePasswordRequestDTO;
import vn.manh.FoodSelling.dto.request.UpdateProfileRequestDTO;
import vn.manh.FoodSelling.dto.response.UserResponseDTO;
import vn.manh.FoodSelling.service.UserService;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/profile")
public class UserController {

    private final UserService userService;

    // API: Lấy thông tin cá nhân của bản thân user
    // URL: GET http://localhost:8080/api/v1/profile
    @GetMapping
    public ResponseEntity<UserResponseDTO> getUserProfile(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(userService.getUserProfileByUsername(username));
    }

    // API: Cập nhật thống tin cá nhân của bản thân user
    // URL: PUT http://localhost:8080/api/v1/profile
    @PutMapping
    public ResponseEntity<UserResponseDTO> updateUserProfile(Authentication authentication,
            @Valid @RequestBody UpdateProfileRequestDTO updateProfileRequestDTO) {
        String username = authentication.getName();
        UserResponseDTO userResponseDTO = userService.updateUserProfile(username, updateProfileRequestDTO);
        return ResponseEntity.ok(userResponseDTO);
    }

    // API: Cập nhật mật khảu bản thân user
    // URL: PUT http://localhost:8080/api/v1/profile
    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changeUserPassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequestDTO changePasswordRequestDTO) {
        userService.changeUserPassword(changePasswordRequestDTO);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully!!!"));

    }

}