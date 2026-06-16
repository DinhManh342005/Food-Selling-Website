package vn.manh.FoodSelling.service.impl;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.request.RegisterRequestDTO;
import vn.manh.FoodSelling.entity.User;
import vn.manh.FoodSelling.enums.UserRole;
import vn.manh.FoodSelling.enums.UserStatus;
import vn.manh.FoodSelling.repository.UserRepository;
import vn.manh.FoodSelling.service.UserService;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;
    
    @Override
    @Transactional
    public User registerUser(RegisterRequestDTO registerRequestDTO) {
        // Kiểm tra xem username đã tồn tại chưa
       if(userRepository.existsByUsername(registerRequestDTO.getUsername())){
            // Ném ra exception hoặc trả về lỗi cho frontend biết là username đã tồn tại
            throw new RuntimeException("Username already exists: " + registerRequestDTO.getUsername());
       }

       // Kiểm tra xem email đã tồn tại chưa
       if(userRepository.existsByEmail(registerRequestDTO.getEmail())){
            // Ném ra exception hoặc trả về lỗi cho frontend biết là email đã tồn tại
            throw new RuntimeException("Email already exists: " + registerRequestDTO.getEmail());

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

}
