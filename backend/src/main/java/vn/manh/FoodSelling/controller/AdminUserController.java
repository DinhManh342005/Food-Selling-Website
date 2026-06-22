package vn.manh.FoodSelling.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.request.UserUpdateRequestDTO;
import vn.manh.FoodSelling.dto.response.UserResponseDTO;
import vn.manh.FoodSelling.service.UserService;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final UserService userService;

    // API: Lấy danh sách người dùng
    // URL: GET
    // http://localhost:8080/api/v1/admin/users
    // (có thể thêm ?page=0&size=10 và có thể sắp xếp &sortBy=id &descending=true
    // hoặc false)
    @GetMapping
    public ResponseEntity<Page<UserResponseDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(userService.getAllUsers(PageRequest.of(page, size)));
    }

    // API: Lấy người dùng theo id
    // URL: GET http://localhost:8080/api/v1/admin/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // API: Cập nhật status hoặc role của người dùng
    // URL: PUT http://localhost:8080/api/v1/admin/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> adminUpdateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequestDTO userUpdateResponseDTO) {
        UserResponseDTO userUpdated = userService.adminUpdateUser(id, userUpdateResponseDTO);
        return ResponseEntity.ok(userUpdated);
    }

}
