package vn.manh.FoodSelling.service.impl;

import java.time.LocalDateTime;

import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.request.ChangePasswordRequestDTO;
import vn.manh.FoodSelling.dto.request.RegisterRequestDTO;
import vn.manh.FoodSelling.dto.request.UpdateProfileRequestDTO;
import vn.manh.FoodSelling.dto.request.UserUpdateRequestDTO;
import vn.manh.FoodSelling.dto.response.UserResponseDTO;
import vn.manh.FoodSelling.entity.User;
import vn.manh.FoodSelling.enums.UserRole;
import vn.manh.FoodSelling.enums.UserStatus;
import vn.manh.FoodSelling.exception.BadRequestException;
import vn.manh.FoodSelling.exception.ResourceNotFoundException;
import vn.manh.FoodSelling.repository.UserRepository;
import vn.manh.FoodSelling.service.UserService;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

     private final UserRepository userRepository;

     private final ModelMapper modelMapper;

     private final PasswordEncoder passwordEncoder;

     // ===========================================================================
     // DÀNH CHO USER
     // Đăng ký user
     @Override
     @Transactional
     public User registerUser(RegisterRequestDTO registerRequestDTO) {
          // Kiểm tra xem username đã tồn tại chưa
          if (userRepository.existsByUsername(registerRequestDTO.getUsername())) {
               // Ném ra exception hoặc trả về lỗi cho frontend biết là username đã tồn tại
               throw new BadRequestException("Username already exists: " + registerRequestDTO.getUsername());
          }

          // Kiểm tra xem email đã tồn tại chưa
          if (userRepository.existsByEmail(registerRequestDTO.getEmail())) {
               // Ném ra exception hoặc trả về lỗi cho frontend biết là email đã tồn tại
               throw new BadRequestException("Email already exists: " + registerRequestDTO.getEmail());

          }

          // Tạo mới user và lưu vào database
          User user = new User();
          user.setUsername(registerRequestDTO.getUsername());
          user.setEmail(registerRequestDTO.getEmail());
          user.setFullName(registerRequestDTO.getFullName());
          user.setPhone(registerRequestDTO.getPhone());

          // Mã hóa mật khẩu trước khi lưu vào database
          user.setPassword(passwordEncoder.encode(registerRequestDTO.getPassword()));

          // Gán role và status mặc định cho user mới đăng ký
          user.setRole(UserRole.user);
          user.setStatus(UserStatus.active);
          user.setCreatedAt(LocalDateTime.now());

          // Lưu user vào database và trả về đối tượng user đã lưu (có id được sinh ra)
          return userRepository.save(user);
     }

     // Lấy thông tin người dùng
     @Override
     public UserResponseDTO getUserProfileByUsername(String username) {
          // Xác thực người dùng chỉ có thể xem thông tin của chính mình
          String usernameAuth = SecurityContextHolder.getContext().getAuthentication().getName();
          if (!usernameAuth.equals(username)) {
               throw new AccessDeniedException("Bạn không có quyền truy cập thông tin của người khác");
          }
          User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

          UserResponseDTO userResponseDTO = modelMapper.map(user, UserResponseDTO.class);
          userResponseDTO.setPhoneNumber(user.getPhone());
          return userResponseDTO;
     }

     // Cập nhật thống tin người dùng
     @Override
     @Transactional
     public UserResponseDTO updateUserProfile(String username, UpdateProfileRequestDTO updateProfileRequestDTO) {
          String usernameAuth = SecurityContextHolder.getContext().getAuthentication().getName();
          if (!usernameAuth.equals(username)) {
               throw new AccessDeniedException("Bạn không có quyền truy cập thông tin của người khác");
          }
          User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

          if (updateProfileRequestDTO.getFullName() != null) {
               user.setFullName(updateProfileRequestDTO.getFullName());
          }
          if (updateProfileRequestDTO.getEmail() != null) {
               user.setEmail(updateProfileRequestDTO.getEmail());
          }
          if (updateProfileRequestDTO.getPhoneNumber() != null) {
               user.setPhone(updateProfileRequestDTO.getPhoneNumber());
          }

          // Lưu user vào database
          userRepository.save(user);

          UserResponseDTO userResponseDTO = modelMapper.map(user, UserResponseDTO.class);
          userResponseDTO.setPhoneNumber(updateProfileRequestDTO.getPhoneNumber());

          return userResponseDTO;
     }

     // Đổi mật khẻu
     @Override
     @Transactional
     public void changeUserPassword(ChangePasswordRequestDTO changePasswordRequestDTO) {
          String usernameAuth = SecurityContextHolder.getContext().getAuthentication().getName();
          User user = userRepository.findByUsername(usernameAuth)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + usernameAuth));

          if (!passwordEncoder.matches(changePasswordRequestDTO.getOldPassword(), user.getPassword())) {
               throw new BadRequestException("Mật khẩu hiện tại không đúng");
          }

          if (changePasswordRequestDTO.getNewPassword().equals(changePasswordRequestDTO.getOldPassword())) {
               throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu cũ");
          }

          if (!changePasswordRequestDTO.getNewPassword().equals(changePasswordRequestDTO.getConfirmPassword())) {
               throw new BadRequestException("Xác nhận mật khẩu không trùng khớp");
          }

          user.setPassword(passwordEncoder.encode(changePasswordRequestDTO.getNewPassword()));

          // Lưu user vào database
          userRepository.save(user);
     }

     // ===================================================================
     // DÀNH CHO ADMIN

     @Override
     public UserResponseDTO getUserById(Long id) {
          User user = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
          return modelMapper.map(user, UserResponseDTO.class);
     }

     @Override
     @Transactional
     public Page<UserResponseDTO> getAllUsers(Pageable pageable) {
          Page<UserResponseDTO> users = userRepository.findAll(pageable)
                    .map(user -> modelMapper.map(user, UserResponseDTO.class));
          return users;
     }

     @Override
     @Transactional
     public UserResponseDTO adminUpdateUser(Long id, UserUpdateRequestDTO requests) {
          User user = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

          if (requests.getRole() != null)
               user.setRole(requests.getRole());
          if (requests.getStatus() != null)
               user.setStatus(requests.getStatus());

          // Lưu user vào database
          userRepository.save(user);

          return modelMapper.map(user, UserResponseDTO.class);
     }

}
