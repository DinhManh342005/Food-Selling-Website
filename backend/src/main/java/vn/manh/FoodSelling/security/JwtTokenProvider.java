package vn.manh.FoodSelling.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

// Class này sẽ chịu trách nhiệm tạo và xác thực JWT Token. 
// Nó sẽ được sử dụng trong quá trình đăng nhập và bảo vệ các endpoint cần xác thực.
@Component
public class JwtTokenProvider {
    // Điểm mới: Sử dụng Keys.hmacShaKeyFor để tạo Key an toàn và
    // Jwts.parserBuilder().

    // Lấy giá trị secret key và expiration time từ file application.yaml để dễ dàng
    // cấu hình mà không cần sửa code
    @Value("${jwt.secret}")
    private String jwtSecret;
    @Value("${jwt.expiration}")
    private long jwtExpiration;

    /**
     * Tạo khóa bí mật (SecretKey) từ chuỗi config.
     * JJWT mới yêu cầu khóa phải có độ dài đủ lớn (ít nhất 256-bit cho HS256).
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Tạo Token khi User đăng nhập thành công.
     */
    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .claim("role",
                        userPrincipal.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "")
                                .toLowerCase())// Lưu username vào field 'sub'
                .setIssuedAt(now) // Thời điểm tạo
                .setExpiration(expiryDate) // Thời điểm hết hạn
                .signWith(getSigningKey(), SignatureAlgorithm.HS256) // Thuật toán ký mới
                .compact();
    }

    /**
     * Trích xuất username từ chuỗi Token.
     */
    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey()) // Dùng parserBuilder thay cho parser cũ
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    /**
     * Kiểm tra Token có hợp lệ, đúng chữ ký và còn hạn hay không.
     */
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException ex) {
            // Token không đúng định dạng
        } catch (ExpiredJwtException ex) {
            // Token đã hết hạn
        } catch (UnsupportedJwtException ex) {
            // Token không được hỗ trợ
        } catch (IllegalArgumentException ex) {
            // Chuỗi Claims trống
        }
        return false;
    }
}