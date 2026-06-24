package vn.manh.FoodSelling.dto.request;

import jakarta.validation.constraints.NotBlank;

public class AIProductInfoRequestDTO {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String productName;

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }
}
