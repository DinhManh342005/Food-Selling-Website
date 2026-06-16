package vn.manh.FoodSelling.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// Class này sẽ xử lý tất cả các exception được ném ra trong toàn bộ ứng dụng và trả về response có cấu trúc thống nhất cho frontend.
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ResourceNotFoundException là exception tùy chỉnh mà bạn có thể ném ra khi không tìm thấy tài nguyên nào đó (ví dụ: sản phẩm, người dùng, đơn hàng...). 
    // Khi bắt được exception này, chúng ta sẽ trả về lỗi 404 Not Found cùng với thông tin chi tiết về lỗi.
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleResourceNotFoundException(ResourceNotFoundException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problemDetail.setTitle("Resource Not Found");
        return new ResponseEntity<>(problemDetail, HttpStatus.NOT_FOUND);
    }

    // Exception là lớp cha của tất cả các exception khác, nên khi bắt được exception này, có nghĩa là đã có lỗi không mong muốn xảy ra mà chúng ta chưa xử lý cụ thể
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGlobalException(Exception ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred on the server: " + ex.getMessage());
        problemDetail.setTitle("Internal Server Error");
        return new ResponseEntity<>(problemDetail, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // MethodArgumentNotValidException là exception được ném ra khi dữ liệu đầu vào không hợp lệ theo các ràng buộc đã định nghĩa trong DTO (ví dụ: @NotBlank, @Email...).
    @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
            Map<String, String> errors = new HashMap<>();
            
            ex.getBindingResult().getFieldErrors().forEach(error -> {
                errors.put(error.getField(), error.getDefaultMessage());
            });
            
            // Trả về map chứa { "email": "Email is not valid format", "password": "..." }
            return ResponseEntity.badRequest().body(errors);
        }

}
