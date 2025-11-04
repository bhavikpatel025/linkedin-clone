using LinkedInApp.DTOs;
using LinkedInApp.Models;

namespace LinkedInApp.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
        string GenerateTokenFromDto(UserDto userDto);
        bool ValidateToken(string token);
        string GenerateResetToken();
    }
}