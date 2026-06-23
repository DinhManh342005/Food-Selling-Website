package vn.manh.FoodSelling.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import vn.manh.FoodSelling.dto.request.ProductCreateDTO;
import vn.manh.FoodSelling.dto.response.AdminProductResponseDTO;
import vn.manh.FoodSelling.entity.Category;
import vn.manh.FoodSelling.entity.Product;
import vn.manh.FoodSelling.repository.CategoryRepository;
import vn.manh.FoodSelling.repository.ProductRepository;
import vn.manh.FoodSelling.service.StorageService;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private ProductServiceImpl productService;

    @Test
    void addProductStoresMainImageUrlAndPublicId() {
        Category category = Category.builder().id(1L).name("Mon an").build();
        ProductCreateDTO request = productRequest("https://res.cloudinary.com/demo/image.jpg", "food-selling/products/new-image");

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId(10L);
            return product;
        });

        AdminProductResponseDTO response = productService.addProduct(request);

        assertThat(response.getImageUrl()).isEqualTo("https://res.cloudinary.com/demo/image.jpg");
        assertThat(response.getImagePublicId()).isEqualTo("food-selling/products/new-image");
    }

    @Test
    void updateProductReplacesCloudinaryImageAndDeletesOldImage() throws Exception {
        Category category = Category.builder().id(1L).name("Mon an").build();
        Product existing = Product.builder()
                .id(10L)
                .name("Old")
                .imageUrl("https://res.cloudinary.com/demo/old.jpg")
                .imagePublicId("food-selling/products/old-image")
                .stockQuantity(3)
                .category(category)
                .images(new ArrayList<>())
                .build();
        ProductCreateDTO request = productRequest("https://res.cloudinary.com/demo/new.jpg", "food-selling/products/new-image");

        when(productRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminProductResponseDTO response = productService.updateProduct(10L, request);

        assertThat(response.getImageUrl()).isEqualTo("https://res.cloudinary.com/demo/new.jpg");
        assertThat(response.getImagePublicId()).isEqualTo("food-selling/products/new-image");
        verify(storageService).delete("food-selling/products/old-image");
    }

    @Test
    void updateProductKeepsSameCloudinaryImageWithoutDeletingIt() throws Exception {
        Category category = Category.builder().id(1L).name("Mon an").build();
        Product existing = Product.builder()
                .id(10L)
                .name("Old")
                .imageUrl("https://res.cloudinary.com/demo/same.jpg")
                .imagePublicId("food-selling/products/same-image")
                .stockQuantity(3)
                .category(category)
                .images(new ArrayList<>())
                .build();
        ProductCreateDTO request = productRequest("https://res.cloudinary.com/demo/same.jpg", "food-selling/products/same-image");

        when(productRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        productService.updateProduct(10L, request);

        verify(storageService, never()).delete(any());
    }


    @Test
    void updateProductCanRemoveExistingCloudinaryImage() throws Exception {
        Category category = Category.builder().id(1L).name("Mon an").build();
        Product existing = Product.builder()
                .id(10L)
                .name("Old")
                .imageUrl("https://res.cloudinary.com/demo/old.jpg")
                .imagePublicId("food-selling/products/old-image")
                .stockQuantity(3)
                .category(category)
                .images(new ArrayList<>())
                .build();
        ProductCreateDTO request = productRequest("", "");

        when(productRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminProductResponseDTO response = productService.updateProduct(10L, request);

        assertThat(response.getImageUrl()).isNull();
        assertThat(response.getImagePublicId()).isNull();
        verify(storageService).delete("food-selling/products/old-image");
    }

    @Test
    void deleteProductDeletesCloudinaryImageWhenProductHasNoOrders() throws Exception {
        Category category = Category.builder().id(1L).name("Mon an").build();
        Product existing = Product.builder()
                .id(10L)
                .name("Old")
                .imageUrl("https://res.cloudinary.com/demo/old.jpg")
                .imagePublicId("food-selling/products/old-image")
                .stockQuantity(3)
                .category(category)
                .orderItems(new ArrayList<>())
                .images(new ArrayList<>())
                .build();

        when(productRepository.findById(10L)).thenReturn(Optional.of(existing));

        productService.deleteProduct(10L);

        verify(storageService).delete("food-selling/products/old-image");
        verify(productRepository).delete(existing);
    }

    @Test
    void addProductStoresDetailImagesAndMarksPrimaryThumbnail() {
        Category category = Category.builder().id(1L).name("Mon an").build();
        ProductCreateDTO request = productRequest("https://cdn.test/main.jpg", "public-main");
        request.setDetailImages(java.util.List.of(
                "https://cdn.test/main.jpg",
                "https://cdn.test/side-1.jpg",
                "https://cdn.test/side-2.jpg"));

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId(10L);
            return product;
        });

        AdminProductResponseDTO response = productService.addProduct(request);

        assertThat(response.getImageUrl()).isEqualTo("https://cdn.test/main.jpg");
        assertThat(response.getDetailImages()).containsExactly(
                "https://cdn.test/main.jpg",
                "https://cdn.test/side-1.jpg",
                "https://cdn.test/side-2.jpg");
    }

    private ProductCreateDTO productRequest(String imageUrl, String imagePublicId) {
        ProductCreateDTO request = new ProductCreateDTO();
        request.setName("Banh mi");
        request.setDescription("Ngon");
        request.setPrice(BigDecimal.valueOf(25000));
        request.setStockQuantity(5);
        request.setCategoryId(1L);
        request.setImageUrl(imageUrl);
        request.setImagePublicId(imagePublicId);
        return request;
    }
}
