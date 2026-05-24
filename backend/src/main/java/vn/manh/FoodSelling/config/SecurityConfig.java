package vn.manh.FoodSelling.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

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