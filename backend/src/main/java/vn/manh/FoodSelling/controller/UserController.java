package vn.manh.FoodSelling.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.manh.FoodSelling.dto.request.UserCreateDTO;
import vn.manh.FoodSelling.dto.request.UserUpdateDTO;
import vn.manh.FoodSelling.dto.response.UserResponseDTO;
import vn.manh.FoodSelling.service.UserService;

// Controller xử lý CRUD user cho admin.
@RestController
@RequestMapping("/api/v1/admin/users")
public class UserController {
    @Autowired
    private UserService userService;

    // ADMIN API: Lấy toàn bộ user.
    // URL: GET http://localhost:8080/api/v1/admin/users
    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // ADMIN API: Lấy chi tiết user theo ID.
    // URL: GET http://localhost:8080/api/v1/admin/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        UserResponseDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    // ADMIN API: Thêm user mới.
    // URL: POST http://localhost:8080/api/v1/admin/users
    @PostMapping
    public ResponseEntity<UserResponseDTO> addUser(@Valid @RequestBody UserCreateDTO userCreateDTO) {
        UserResponseDTO addedUser = userService.addUser(userCreateDTO);
        return new ResponseEntity<>(addedUser, HttpStatus.CREATED);
    }

    // ADMIN API: Cập nhật user.
    // URL: PUT http://localhost:8080/api/v1/admin/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateDTO userUpdateDTO
    ) {
        UserResponseDTO updatedUser = userService.updateUser(id, userUpdateDTO);
        return ResponseEntity.ok(updatedUser);
    }

    // ADMIN API: Xóa user theo ID.
    // URL: DELETE http://localhost:8080/api/v1/admin/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
