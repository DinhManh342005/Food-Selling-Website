package vn.manh.FoodSelling.service;



import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.manh.FoodSelling.dto.request.ChangePasswordRequestDTO;
import vn.manh.FoodSelling.dto.request.RegisterRequestDTO;
import vn.manh.FoodSelling.dto.request.UpdateProfileRequestDTO;
import vn.manh.FoodSelling.dto.request.UserUpdateRequestDTO;
import vn.manh.FoodSelling.dto.response.UserResponseDTO;
import vn.manh.FoodSelling.entity.User;

public interface UserService {
    public User registerUser(RegisterRequestDTO registerRequestDTO);

    // For Admin
    public Page<UserResponseDTO> getAllUsers(Pageable pageable);
    public UserResponseDTO getUserById(Long id);
    public UserResponseDTO adminUpdateUser(Long id, UserUpdateRequestDTO requests);

    //For User
    public UserResponseDTO getUserProfileByUsername(String username);
    public UserResponseDTO updateUserProfile(String username, UpdateProfileRequestDTO updateProfileRequestDTO); 
    public void changeUserPassword(ChangePasswordRequestDTO changePasswordRequestDTO);
    
}
