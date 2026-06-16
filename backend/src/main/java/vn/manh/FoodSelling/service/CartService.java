package vn.manh.FoodSelling.service;

import vn.manh.FoodSelling.dto.response.CartResponseDTO;

public interface CartService {

    public CartResponseDTO getCart();

    public CartResponseDTO addItemToCart( Long productId, Integer quantity);

    public CartResponseDTO updateItemQuantity(Long cartItemId, String action);

    public CartResponseDTO removeItemFromCart(Long cartItemId);

    public void clearCart();
}
