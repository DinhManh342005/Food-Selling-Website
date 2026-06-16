package vn.manh.FoodSelling;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// @SpringBootApplication là annotation để đánh dấu đây là ứng dụng Spring Boot, nó sẽ kích hoạt auto-configuration và component scanning
@SpringBootApplication
public class FoodSellingApplication {
	
	public static void main(String[] args) {
		SpringApplication.run(FoodSellingApplication.class, args);
	}

}
