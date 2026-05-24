package vn.manh.FoodSelling.service;

import java.util.List;

import vn.manh.FoodSelling.dto.request.UserCreateDTO;
import vn.manh.FoodSelling.dto.request.UserUpdateDTO;
import vn.manh.FoodSelling.dto.response.UserResponseDTO;

public interface UserService {
    public List<UserResponseDTO> getAllUsers();

    public UserResponseDTO getUserById(Long id);

    public UserResponseDTO addUser(UserCreateDTO dto);

    public UserResponseDTO updateUser(Long id, UserUpdateDTO dto);

    public void deleteUser(Long id);
}
