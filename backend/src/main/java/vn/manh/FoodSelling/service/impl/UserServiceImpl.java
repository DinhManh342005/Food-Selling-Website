package vn.manh.FoodSelling.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vn.manh.FoodSelling.dto.request.UserCreateDTO;
import vn.manh.FoodSelling.dto.request.UserUpdateDTO;
import vn.manh.FoodSelling.dto.response.UserResponseDTO;
import vn.manh.FoodSelling.entity.User;
import vn.manh.FoodSelling.enums.UserRole;
import vn.manh.FoodSelling.enums.UserStatus;
import vn.manh.FoodSelling.repository.UserRepository;
import vn.manh.FoodSelling.service.UserService;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserRepository userRepository;

    // Lấy danh sách tất cả user cho trang admin.
    @Override
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream()
        .map(this::convertToDTO)
        .collect(Collectors.toList());
    }

    // Lấy chi tiết user theo ID.
    @Override
    public UserResponseDTO getUserById(Long id) {
        User user = findUserById(id);
        return convertToDTO(user);
    }

    // Admin thêm user mới. Mặc định role là CUSTOMER và status là ACTIVE.
    @Override
    @Transactional
    public UserResponseDTO addUser(UserCreateDTO dto) {
        validateUniqueEmail(dto.getEmail(), null);
        validateUniquePhone(dto.getPhone(), null);

        User user = User.builder()
        .fullName(dto.getFullName())
        .password(dto.getPassword())
        .email(dto.getEmail())
        .phone(dto.getPhone())
        .status(dto.getStatus() != null ? dto.getStatus() : UserStatus.ACTIVE)
        .role(dto.getRole() != null ? dto.getRole() : UserRole.CUSTOMER)
        .build();

        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    // Admin cập nhật user. Nếu password để trống thì giữ password cũ.
    @Override
    @Transactional
    public UserResponseDTO updateUser(Long id, UserUpdateDTO dto) {
        User user = findUserById(id);
        validateUniqueEmail(dto.getEmail(), id);
        validateUniquePhone(dto.getPhone(), id);

        user.setFullName(dto.getFullName());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(dto.getPassword());
        }
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setStatus(dto.getStatus() != null ? dto.getStatus() : user.getStatus());
        user.setRole(dto.getRole() != null ? dto.getRole() : user.getRole());

        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    // Admin xóa user theo ID.
    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Khong tim thay user voi ID " + id);
        }
        userRepository.deleteById(id);
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Khong tim thay user voi ID " + id));
    }

    private void validateUniqueEmail(String email, Long currentUserId) {
        if (email == null || email.isBlank()) {
            return;
        }
        userRepository.findByEmail(email)
        .filter(user -> currentUserId == null || !user.getId().equals(currentUserId))
        .ifPresent(user -> {
            throw new RuntimeException("Email da ton tai");
        });
    }

    private void validateUniquePhone(String phone, Long currentUserId) {
        userRepository.findByPhone(phone)
        .filter(user -> currentUserId == null || !user.getId().equals(currentUserId))
        .ifPresent(user -> {
            throw new RuntimeException("Phone da ton tai");
        });
    }

    // Chuyển Entity User sang DTO, không trả password ra client.
    private UserResponseDTO convertToDTO(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setUserId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setStatus(user.getStatus());
        dto.setRole(user.getRole());
        dto.setCreateAt(user.getCreateAt());
        return dto;
    }
}
