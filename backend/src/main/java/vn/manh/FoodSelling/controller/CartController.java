package vn.manh.FoodSelling.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import vn.manh.FoodSelling.dto.response.CartResponseDTO;
import vn.manh.FoodSelling.service.CartService;

@RequiredArgsConstructor
@RestController
@RequestMapping("api/v1/carts")
public class CartController {
    private final CartService cartService;

    // API: Get cart
    // URL: GET http://localhost:8080/api/v1/cart
    @GetMapping()
    public ResponseEntity<CartResponseDTO> getCart() {
        return ResponseEntity.ok(cartService.getCart());
    }

    // API: Add cart item
    // URL: POST http://localhost:8080/api/v1/cart/add
    @PostMapping("/add")
    public ResponseEntity<CartResponseDTO> addCartItem(
        @RequestParam Long productId,
        @RequestParam Integer quantity) {

        return ResponseEntity.ok(cartService.addItemToCart(productId, quantity));
    }

    // API: Update quantity of cart item
    // URL: PUT http://localhost:8080/api/v1/cart/update/{id}?action=increase  hoặc decrease
    @PutMapping("/update/{cartItemId}")
    public ResponseEntity<CartResponseDTO> updateItemQuantity(
        @PathVariable Long cartItemId,
        @RequestParam String action) {
        return ResponseEntity.ok(cartService.updateItemQuantity(cartItemId, action));
    }

    // API: Remove cart item
    // URL: DELETE http://localhost:8080/api/v1/cart/remove/{id}
    @DeleteMapping("/remove/{cartItemId}")
    public ResponseEntity<CartResponseDTO> removeItemFromCart(@PathVariable Long cartItemId) {
        return ResponseEntity.ok(cartService.removeItemFromCart(cartItemId));
    }

    // API: Clear cart
    // URL: DELETE http://localhost:8080/api/v1/cart/clear
    @DeleteMapping("/clear")
    public void clearCart() { 
        cartService.clearCart();
    }


}
