using LinkedInApp.DTOs;
using LinkedInApp.Models;
using System.Security.Claims;

namespace LinkedInApp.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
        string GenerateTokenFromDto(UserDto userDto);
        bool ValidateToken(string token);
        string GenerateResetToken();
        int GetUserIdFromClaims(ClaimsPrincipal user);
    }
}