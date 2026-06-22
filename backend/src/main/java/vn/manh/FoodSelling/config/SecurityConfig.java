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

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.security.JwtAuthenticationFilter;

// Class này sẽ cấu hình bảo mật cho ứng dụng, bao gồm việc sử dụng JWT để bảo vệ các endpoint cần xác thực.
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    // JwtAuthenticationFilter là một Filter tùy chỉnh để kiểm tra JWT Token trong
    // mỗi request đến.
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
        http.cors(org.springframework.security.config.Customizer.withDefaults()) // Bật CORS ở mức Security để tránh
                                                                                 // block preflight request
                .csrf(csrf -> csrf.disable())
                // Xử lý lỗi khi truy cập tài nguyên không có quyền - ném ra JSON thay vì lỗi
                // mặc định
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");

                            response.getWriter().write("""
                                    {
                                      "status": 401,
                                      "error": "UNAUTHORIZED",
                                      "message": "Bạn cần đăng nhập để truy cập tài nguyên này"
                                    }
                                    """);
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json;charset=UTF-8");

                            response.getWriter().write("""
                                    {
                                      "status": 403,
                                      "error": "FORBIDDEN",
                                      "message": "Bạn không có quyền truy cập tài nguyên này"
                                    }
                                    """);
                        }))
                // Định nghĩa các endpoint và quyền truy cập - quan trọng nhất
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**").permitAll() // Cho phép Login/Register
                        .requestMatchers("/api/v1/carts/**").authenticated() // Bắt buộc Token cho Giỏ hàng
                        .requestMatchers("/api/v1/orders/**").authenticated()
                        .requestMatchers("/api/v1/profile/**").authenticated()
                        .requestMatchers("/api/v1/admin/**").hasAuthority("admin") // Chỉ admin mới có quyền truy cập

                        .anyRequest().permitAll());

        // Thêm Filter tùy chỉnh vào chuỗi Filter của Spring Security để kiểm tra JWT
        // Token trong mỗi request đến.
        // JWT Token cho biết user nào đang request và user đó có quyền gì, có phải
        // admin không.
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
