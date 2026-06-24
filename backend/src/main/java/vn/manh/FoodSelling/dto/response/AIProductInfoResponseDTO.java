package vn.manh.FoodSelling.dto.response;

public class AIProductInfoResponseDTO {

    private String markdown;

    public AIProductInfoResponseDTO(String markdown) {
        this.markdown = markdown;
    }

    public String getMarkdown() {
        return markdown;
    }

    public void setMarkdown(String markdown) {
        this.markdown = markdown;
    }
}
