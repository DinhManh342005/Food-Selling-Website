package vn.manh.FoodSelling.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

// Class này để cấu hình bảo mật cho ứng dụng, hiện tại đang tắt bảo mật để Postman gọi API dễ dàng
// Sau này nếu muốn thêm bảo mật thì sẽ chỉnh sửa class này
// Để phân quyền cho user thì sẽ cần thêm UserDetailsService, PasswordEncoder, v.v... vào class này
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. TẮT bảo mật CSRF (Bắt buộc phải tắt thì Postman mới gọi được POST)
            .csrf(csrf -> csrf.disable()) 
            
            // 2. Cho phép TẤT CẢ các API được truy cập tự do không cần đăng nhập
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            );
            
        return http.build();
    }
}