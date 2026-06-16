package vn.manh.FoodSelling.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
// import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.request.LoginRequestDTO;
import vn.manh.FoodSelling.dto.request.RegisterRequestDTO;
import vn.manh.FoodSelling.security.JwtTokenProvider;
import vn.manh.FoodSelling.service.UserService;

// Class này sẽ xử lý các yêu cầu liên quan đến xác thực người dùng, như đăng nhập để lấy JWT Token.
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/auth")
// @CrossOrigin("*") // Để Frontend sau này gọi vào không bị lỗi CORS
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;

    // API này sẽ nhận username và password từ client, 
    // sau đó sử dụng AuthenticationManager để xác thực thông tin đăng nhập.
    // accessToken - là chuỗi JWT Token được tạo ra sau khi xác thực thành công, sẽ được trả về cho client để sử dụng trong các yêu cầu tiếp theo.
    // URL: POST http://localhost:8080/api/v1/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequestDTO loginRequest) {
        // 1. Xác thực username & password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        // 2. Tạo Token
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        // 3. Trả về cho Frontend chuỗi Token
        return ResponseEntity.ok(Map.of("accessToken", jwt, "tokenType", "Bearer"));
    }

    // API này sẽ nhận thông tin đăng ký từ client,
    // sau đó gọi service để tạo mới user trong database.
    // URL: POST http://localhost:8080/api/v1/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequestDTO registerRequestDTO) {
        try {
            userService.registerUser(registerRequestDTO);
            return ResponseEntity.ok("Đăng ký thành công");
        } catch (Exception e) {
            // Bắt tất cả các exception có thể xảy ra trong quá trình đăng ký và trả về lỗi
            // 400 Bad Request với thông tin chi tiết về lỗi
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}