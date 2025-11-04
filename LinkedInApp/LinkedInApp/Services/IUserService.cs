using LinkedInApp.DTOs;

namespace LinkedInApp.Services
{
    public interface IUserService
    {
        Task<ApiResponse<UserDto>> RegisterAsync(UserRegistrationDto registrationDto);
        Task<ApiResponse<UserDto>> LoginAsync(UserLoginDto loginDto);
        Task<ApiResponse<List<RoleDto>>> GetRolesAsync();
        Task<ApiResponse<List<SkillDto>>> GetSkillsAsync();
        Task<ApiResponse<UserDto>> GetUserByIdAsync(int id);
        Task<ApiResponse<UserDto>> UpdateProfilePictureAsync(ProfilePictureUpdateDto dto);
        Task<ApiResponse<UserDto>> UpdateUserAsync(UserUpdateDto dto);
        Task<ApiResponse<bool>> DeleteProfilePictureAsync(int userId);
        Task<ApiResponse<string>> ForgotPasswordAsync(string email);
        Task<ApiResponse<bool>> ResetPasswordAsync(string token, string newPassword);
        Task<ApiResponse<bool>> VerifyResetTokenAsync(string token);
    }
}