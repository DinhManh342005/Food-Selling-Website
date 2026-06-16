package vn.manh.FoodSelling.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.security.JwtAuthenticationFilter;

// Class này sẽ cấu hình bảo mật cho ứng dụng, bao gồm việc sử dụng JWT để bảo vệ các endpoint cần xác thực.
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    // JwtAuthenticationFilter là một Filter tùy chỉnh để kiểm tra JWT Token trong mỗi request đến. 
    // Nó sẽ được thêm vào chuỗi Filter của Spring Security.
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Mã hóa mật khẩu
    }

    // Cấu hình bảo mật HTTP - phân quyền truy cập và thêm Filter tùy chỉnh
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll() // Cho phép Login/Register
                .requestMatchers("/api/v1/cart/**").authenticated() // Bắt buộc Token cho Giỏ hàng
                .anyRequest().permitAll()
            );
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}