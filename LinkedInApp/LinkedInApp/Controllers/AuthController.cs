using LinkedInApp.DTOs;
using LinkedInApp.Models;
using LinkedInApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace LinkedInApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IJwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IUserService userService,
            IJwtService jwtService,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _userService = userService;
            _jwtService = jwtService;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> Register([FromBody] UserRegistrationDto registrationDto)
        {
            try
            {
                _logger.LogInformation("Registration attempt for email: {Email}", registrationDto.Email);

                var result = await _userService.RegisterAsync(registrationDto);

                if (!result.Success)
                {
                    _logger.LogWarning("Registration failed for email: {Email}", registrationDto.Email);
                    return BadRequest(result);
                }

                // FIXED: Use the UserDto directly instead of fetching user again
                var token = _jwtService.GenerateTokenFromDto(result.Data!);

                var authResponse = new AuthResponse
                {
                    Token = token,
                    User = result.Data,
                    Expiry = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["Jwt:ExpiryInMinutes"]))
                };

                _logger.LogInformation("Registration successful for email: {Email}", registrationDto.Email);
                return Ok(new ApiResponse<AuthResponse>
                {
                    Success = true,
                    Message = "Registration successful",
                    Data = authResponse
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for email: {Email}", registrationDto.Email);
                return StatusCode(500, new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "An error occurred during registration",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] UserLoginDto loginDto)
        {
            try
            {
                _logger.LogInformation("Login attempt for email: {Email}", loginDto.Email);

                var result = await _userService.LoginAsync(loginDto);

                if (!result.Success)
                {
                    _logger.LogWarning("Login failed for email: {Email}", loginDto.Email);
                    return Unauthorized(result);
                }

                // FIXED: Use the UserDto directly
                var token = _jwtService.GenerateTokenFromDto(result.Data!);

                var authResponse = new AuthResponse
                {
                    Token = token,
                    User = result.Data,
                    Expiry = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["Jwt:ExpiryInMinutes"]))
                };

                _logger.LogInformation("Login successful for email: {Email}", loginDto.Email);
                return Ok(new ApiResponse<AuthResponse>
                {
                    Success = true,
                    Message = "Login successful",
                    Data = authResponse
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for email: {Email}", loginDto.Email);
                return StatusCode(500, new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "An error occurred during login",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<ActionResult<ApiResponse<string>>> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                _logger.LogInformation("Forgot password request for email: {Email}", request.Email);

                var result = await _userService.ForgotPasswordAsync(request.Email);

                if (!result.Success)
                {
                    _logger.LogWarning("Forgot password failed for email: {Email}", request.Email);
                    return BadRequest(result);
                }

                _logger.LogInformation("Forgot password processed for email: {Email}", request.Email);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during forgot password for email: {Email}", request.Email);
                return StatusCode(500, new ApiResponse<string>
                {
                    Success = false,
                    Message = "An error occurred while processing your request",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpPost("reset-password")]
        public async Task<ActionResult<ApiResponse<bool>>> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                _logger.LogInformation("Reset password attempt for token: {Token}", request.Token);

                var result = await _userService.ResetPasswordAsync(request.Token, request.NewPassword);

                if (!result.Success)
                {
                    _logger.LogWarning("Reset password failed for token: {Token}", request.Token);
                    return BadRequest(result);
                }

                _logger.LogInformation("Reset password successful for token: {Token}", request.Token);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during reset password for token: {Token}", request.Token);
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred while resetting your password",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpGet("verify-reset-token/{token}")]
        public async Task<ActionResult<ApiResponse<bool>>> VerifyResetToken(string token)
        {
            try
            {
                _logger.LogInformation("Token verification request: {Token}", token);

                var result = await _userService.VerifyResetTokenAsync(token);

                if (!result.Success)
                {
                    _logger.LogWarning("Token verification failed: {Token}", token);
                    return BadRequest(result);
                }

                _logger.LogInformation("Token verification result: {Token} - {IsValid}", token, result.Data);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during token verification: {Token}", token);
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred while verifying the token",
                    Errors = new List<string> { ex.Message }
                });
            }
        }
    }
}