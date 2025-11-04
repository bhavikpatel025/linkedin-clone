using AutoMapper;
using LinkedInApp.Data;
using LinkedInApp.DTOs;
using LinkedInApp.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace LinkedInApp.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IJwtService _jwtService;
        private readonly ILogger<UserService> _logger;

        public UserService(
            ApplicationDbContext context,
            IMapper mapper,
            IWebHostEnvironment environment,
            IConfiguration configuration,
            IEmailService emailService,
            IJwtService jwtService,
            ILogger<UserService> logger)
        {
            _context = context;
            _mapper = mapper;
            _environment = environment;
            _configuration = configuration;
            _emailService = emailService;
            _jwtService = jwtService;
            _logger = logger;
        }

        public async Task<ApiResponse<UserDto>> RegisterAsync(UserRegistrationDto registrationDto)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == registrationDto.Email);

                if (existingUser != null)
                {
                    return new ApiResponse<UserDto>
                    {
                        Success = false,
                        Message = "User with this email already exists",
                        Errors = new List<string> { "Email already registered" }
                    };
                }

                // Hash password
                var hashedPassword = HashPassword(registrationDto.Password);

                // Map to user entity
                var user = _mapper.Map<User>(registrationDto);
                user.Password = hashedPassword;

                // Add user to context
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Add user skills
                if (registrationDto.SkillIds.Any())
                {
                    var userSkills = registrationDto.SkillIds.Select(skillId => new UserSkill
                    {
                        UserId = user.Id,
                        SkillId = skillId
                    }).ToList();

                    _context.UserSkills.AddRange(userSkills);
                    await _context.SaveChangesAsync();
                }

                // Get user with related data
                var createdUser = await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.UserSkills)
                        .ThenInclude(us => us.Skill)
                    .FirstOrDefaultAsync(u => u.Id == user.Id);

                var userDto = _mapper.Map<UserDto>(createdUser);

                return new ApiResponse<UserDto>
                {
                    Success = true,
                    Message = "User registered successfully",
                    Data = userDto
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user registration for email: {Email}", registrationDto.Email);
                return new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Registration failed",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<UserDto>> LoginAsync(UserLoginDto loginDto)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.UserSkills)
                        .ThenInclude(us => us.Skill)
                    .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

                if (user == null || !VerifyPassword(loginDto.Password, user.Password))
                {
                    _logger.LogWarning("Failed login attempt for email: {Email}", loginDto.Email);
                    return new ApiResponse<UserDto>
                    {
                        Success = false,
                        Message = "Invalid email or password",
                        Errors = new List<string> { "Authentication failed" }
                    };
                }

                var userDto = _mapper.Map<UserDto>(user);

                _logger.LogInformation("Successful login for user: {Email}", loginDto.Email);
                return new ApiResponse<UserDto>
                {
                    Success = true,
                    Message = "Login successful",
                    Data = userDto
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for email: {Email}", loginDto.Email);
                return new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Login failed",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<List<RoleDto>>> GetRolesAsync()
        {
            try
            {
                var roles = await _context.Roles.ToListAsync();
                var roleDtos = _mapper.Map<List<RoleDto>>(roles);

                return new ApiResponse<List<RoleDto>>
                {
                    Success = true,
                    Message = "Roles retrieved successfully",
                    Data = roleDtos
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving roles");
                return new ApiResponse<List<RoleDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve roles",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<List<SkillDto>>> GetSkillsAsync()
        {
            try
            {
                var skills = await _context.Skills.ToListAsync();
                var skillDtos = _mapper.Map<List<SkillDto>>(skills);

                return new ApiResponse<List<SkillDto>>
                {
                    Success = true,
                    Message = "Skills retrieved successfully",
                    Data = skillDtos
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving skills");
                return new ApiResponse<List<SkillDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve skills",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<UserDto>> GetUserByIdAsync(int id)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.UserSkills)
                        .ThenInclude(us => us.Skill)
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (user == null)
                {
                    return new ApiResponse<UserDto>
                    {
                        Success = false,
                        Message = "User not found",
                        Errors = new List<string> { "User does not exist" }
                    };
                }

                var userDto = _mapper.Map<UserDto>(user);

                return new ApiResponse<UserDto>
                {
                    Success = true,
                    Message = "User retrieved successfully",
                    Data = userDto
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user with ID: {UserId}", id);
                return new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Failed to retrieve user",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<UserDto>> UpdateProfilePictureAsync(ProfilePictureUpdateDto dto)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.UserSkills)
                        .ThenInclude(us => us.Skill)
                    .FirstOrDefaultAsync(u => u.Id == dto.UserId);

                if (user == null)
                {
                    return new ApiResponse<UserDto>
                    {
                        Success = false,
                        Message = "User not found",
                        Errors = new List<string> { "User does not exist" }
                    };
                }

                // Delete old profile picture if exists
                if (!string.IsNullOrEmpty(user.ProfilePicture))
                {
                    DeleteProfilePictureFile(user.ProfilePicture);
                }

                // Save new profile picture
                var profilePicturePath = await SaveProfilePictureAsync(dto.ProfilePicture);
                user.ProfilePicture = profilePicturePath;
                user.UpdatedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var userDto = _mapper.Map<UserDto>(user);

                _logger.LogInformation("Profile picture updated for user: {UserId}", dto.UserId);
                return new ApiResponse<UserDto>
                {
                    Success = true,
                    Message = "Profile picture updated successfully",
                    Data = userDto
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating profile picture for user: {UserId}", dto.UserId);
                return new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Failed to update profile picture",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<UserDto>> UpdateUserAsync(UserUpdateDto dto)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.UserSkills)
                        .ThenInclude(us => us.Skill)
                    .FirstOrDefaultAsync(u => u.Id == dto.Id);

                if (user == null)
                {
                    return new ApiResponse<UserDto>
                    {
                        Success = false,
                        Message = "User not found",
                        Errors = new List<string> { "User does not exist" }
                    };
                }

                // Update basic info if provided
                if (!string.IsNullOrEmpty(dto.Name))
                    user.Name = dto.Name;

                if (!string.IsNullOrEmpty(dto.Gender))
                    user.Gender = dto.Gender;

                if (!string.IsNullOrEmpty(dto.PhoneNumber))
                    user.PhoneNumber = dto.PhoneNumber;

                if (!string.IsNullOrEmpty(dto.Location))
                    user.Location = dto.Location;

                if (!string.IsNullOrEmpty(dto.Bio))
                    user.Bio = dto.Bio;

                // Update profile picture if provided
                if (dto.ProfilePicture != null && dto.ProfilePicture.Length > 0)
                {
                    // Delete old picture
                    if (!string.IsNullOrEmpty(user.ProfilePicture))
                    {
                        DeleteProfilePictureFile(user.ProfilePicture);
                    }

                    // Save new picture
                    var profilePicturePath = await SaveProfilePictureAsync(dto.ProfilePicture);
                    user.ProfilePicture = profilePicturePath;
                }

                user.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var userDto = _mapper.Map<UserDto>(user);

                _logger.LogInformation("User profile updated for user: {UserId}", dto.Id);
                return new ApiResponse<UserDto>
                {
                    Success = true,
                    Message = "Profile updated successfully",
                    Data = userDto
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile for user: {UserId}", dto.Id);
                return new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Failed to update profile",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteProfilePictureAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "User not found",
                        Errors = new List<string> { "User does not exist" }
                    };
                }

                if (!string.IsNullOrEmpty(user.ProfilePicture))
                {
                    DeleteProfilePictureFile(user.ProfilePicture);
                    user.ProfilePicture = null;
                    user.UpdatedDate = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation("Profile picture deleted for user: {UserId}", userId);
                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Profile picture deleted successfully",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting profile picture for user: {UserId}", userId);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to delete profile picture",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        // Forgot Password Methods
        public async Task<ApiResponse<string>> ForgotPasswordAsync(string email)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == email);

                if (user == null)
                {
                    // Don't reveal that the user doesn't exist
                    _logger.LogInformation("Password reset requested for non-existent email: {Email}", email);
                    return new ApiResponse<string>
                    {
                        Success = true,
                        Message = "If the email exists, a reset link has been sent.",
                        Data = null
                    };
                }

                // Generate reset token
                var resetToken = GenerateSecureResetToken();
                var resetTokenExpiry = DateTime.UtcNow.AddHours(1);

                // Save token to database
                user.ResetToken = resetToken;
                user.ResetTokenExpiry = resetTokenExpiry;
                await _context.SaveChangesAsync();

                // Generate reset link
                var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:4200";
                var resetLink = $"{frontendUrl}/reset-password?token={resetToken}";

                // Send email
                await _emailService.SendPasswordResetEmailAsync(email, resetLink);

                _logger.LogInformation("Password reset token generated for {Email}. Token: {Token}",
                    email, resetToken);

                return new ApiResponse<string>
                {
                    Success = true,
                    Message = "Password reset link has been sent to your email.",
                    Data = resetToken // For testing purposes
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ForgotPasswordAsync for email: {Email}", email);
                return new ApiResponse<string>
                {
                    Success = false,
                    Message = "An error occurred while processing your request.",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> ResetPasswordAsync(string token, string newPassword)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.ResetToken == token && u.ResetTokenExpiry > DateTime.UtcNow);

                if (user == null)
                {
                    _logger.LogWarning("Invalid or expired reset token attempted: {Token}", token);
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Invalid or expired reset token.",
                        Errors = new List<string> { "Token is invalid or has expired" }
                    };
                }

                // Hash new password
                user.Password = HashPassword(newPassword);
                user.ResetToken = null;
                user.ResetTokenExpiry = null;
                user.UpdatedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Password reset successful for user: {Email}", user.Email);
                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Password has been reset successfully.",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ResetPasswordAsync for token: {Token}", token);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred while resetting your password.",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> VerifyResetTokenAsync(string token)
        {
            try
            {
                var isValid = await _context.Users
                    .AnyAsync(u => u.ResetToken == token && u.ResetTokenExpiry > DateTime.UtcNow);

                _logger.LogInformation("Token verification for {Token}: {IsValid}", token, isValid);

                return new ApiResponse<bool>
                {
                    Success = isValid,
                    Message = isValid ? "Token is valid." : "Invalid or expired token.",
                    Data = isValid
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in VerifyResetTokenAsync for token: {Token}", token);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred while verifying the token.",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        // Private Helper Methods
        private async Task<string> SaveProfilePictureAsync(IFormFile file)
        {
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "profiles");

            // Create directory if it doesn't exist
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Generate unique filename
            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return relative path
            return $"/uploads/profiles/{fileName}";
        }

        private void DeleteProfilePictureFile(string profilePicturePath)
        {
            try
            {
                var fullPath = Path.Combine(_environment.WebRootPath, profilePicturePath.TrimStart('/'));
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    _logger.LogInformation("Deleted profile picture file: {FilePath}", fullPath);
                }
            }
            catch (Exception ex)
            {
                // Log error but don't throw - file deletion failure shouldn't stop the operation
                _logger.LogError(ex, "Error deleting profile picture file: {FilePath}", profilePicturePath);
            }
        }

        private string GenerateSecureResetToken()
        {
            var tokenBytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(tokenBytes);
            return Convert.ToBase64String(tokenBytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .Replace("=", "");
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private bool VerifyPassword(string password, string hashedPassword)
        {
            var hashOfInput = HashPassword(password);
            return hashOfInput == hashedPassword;
        }
    }
}