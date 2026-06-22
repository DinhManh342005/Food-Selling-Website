package vn.manh.FoodSelling.service.impl;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.entity.User;
import vn.manh.FoodSelling.repository.UserRepository;

// Class này sẽ được Spring Security sử dụng để nạp thông tin người dùng khi có request đến.
// Khi có request đến, Spring Security sẽ gọi hàm loadUserByUsername để lấy thông tin người dùng từ database.
// Nếu tìm thấy user thì trả về một đối tượng UserDetails chứa username, password và quyền hạn.
// Nếu không tìm thấy user thì ném ra UsernameNotFoundException để Spring Security biết là xác thực thất bại.
// Đây là một phần quan trọng trong việc tích hợp Spring Security với hệ thống người dùng của bạn.
// Trong trường hợp này, chúng ta chỉ gán quyền "user" mặc định cho tất cả người dùng. Bạn có thể mở rộng để gán quyền dựa trên role của user trong database nếu cần.
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
        private final UserRepository userRepository;

        // Hàm này được gọi bởi Spring Security khi có request đến để lấy thông tin
        // người dùng.
        @Override
        public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

                return org.springframework.security.core.userdetails.User
                                .withUsername(user.getUsername())
                                .password(user.getPassword())
                                .authorities(user.getRole().name()) // Gán quyền mặc định
                                .build();
        }
}