// Hubs/ChatHub.cs
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using LinkedInApp.Services;
using LinkedInApp.DTOs;
using LinkedInApp.Models;
using Microsoft.EntityFrameworkCore; 
using LinkedInApp.Data;

namespace LinkedInApp.Hubs
{
    public class ChatHub : Hub
    {
        private static readonly Dictionary<int, string> _userConnections = new Dictionary<int, string>();
        private readonly IConfiguration _configuration;
        private readonly ILogger<ChatHub> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory; 

        public ChatHub(IConfiguration configuration, ILogger<ChatHub> logger, IServiceScopeFactory serviceScopeFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        public override async Task OnConnectedAsync()
        {
            try
            {
                _logger.LogInformation("🔗 New connection attempt: {ConnectionId}", Context.ConnectionId);

                var userId = await GetUserIdFromContextAsync();
                if (userId.HasValue)
                {
                    _userConnections[userId.Value] = Context.ConnectionId;
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

                    _logger.LogInformation("✅ User {UserId} connected with connection ID: {ConnectionId}",
                        userId, Context.ConnectionId);

                    // Notify others that user is online
                    await Clients.All.SendAsync("UserOnlineStatus", new
                    {
                        UserId = userId.Value,
                        IsOnline = true
                    });
                }
                else
                {
                    _logger.LogWarning("❌ Could not identify user for connection: {ConnectionId}", Context.ConnectionId);
                    // Close the connection if user cannot be identified
                    Context.Abort();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in OnConnectedAsync for connection: {ConnectionId}", Context.ConnectionId);
                Context.Abort();
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            try
            {
                var userId = await GetUserIdFromContextAsync();
                if (userId.HasValue && _userConnections.ContainsKey(userId.Value))
                {
                    _userConnections.Remove(userId.Value);
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");

                    _logger.LogInformation("🔴 User {UserId} disconnected", userId);

                    // Notify others that user is offline
                    await Clients.All.SendAsync("UserOnlineStatus", new
                    {
                        UserId = userId.Value,
                        IsOnline = false
                    });
                }

                if (exception != null)
                {
                    _logger.LogWarning(exception, "Connection closed with error for: {ConnectionId}", Context.ConnectionId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in OnDisconnectedAsync");
            }
        }

        public async Task UserOnline()
        {
            try
            {
                var userId = await GetUserIdFromContextAsync();
                if (userId.HasValue)
                {
                    _logger.LogInformation("🟢 User {UserId} reported online", userId);
                    await Clients.All.SendAsync("UserOnlineStatus", new
                    {
                        UserId = userId.Value,
                        IsOnline = true
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in UserOnline");
            }
        }

        public async Task UserOffline()
        {
            try
            {
                var userId = await GetUserIdFromContextAsync();
                if (userId.HasValue)
                {
                    _logger.LogInformation("🔴 User {UserId} reported offline", userId);
                    await Clients.All.SendAsync("UserOnlineStatus", new
                    {
                        UserId = userId.Value,
                        IsOnline = false
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in UserOffline");
            }
        }

        public async Task Ping()
        {
            try
            {
                var userId = await GetUserIdFromContextAsync();
                if (userId.HasValue)
                {
                    await Clients.Caller.SendAsync("Pong");
                    _logger.LogDebug("🏓 Ping received from user {UserId}", userId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in Ping");
            }
        }

        public async Task JoinChat(int chatId)
        {
            try
            {
                var userId = await GetUserIdFromContextAsync();
                if (!userId.HasValue) return;

                await Groups.AddToGroupAsync(Context.ConnectionId, $"chat_{chatId}");
                _logger.LogInformation("✅ User {UserId} joined chat {ChatId}", userId, chatId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in JoinChat for chat {ChatId}", chatId);
            }
        }

        public async Task LeaveChat(int chatId)
        {
            try
            {
                var userId = await GetUserIdFromContextAsync();
                if (!userId.HasValue) return;

                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"chat_{chatId}");
                _logger.LogInformation("✅ User {UserId} left chat {ChatId}", userId, chatId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in LeaveChat for chat {ChatId}", chatId);
            }
        }

        public async Task SendMessage(int chatId, string message)
        {
            try
            {
                var userId = await GetUserIdFromContextAsync();
                if (!userId.HasValue) return;

                // Get user details from database
                var (userName, profilePicture) = await GetUserDetailsAsync(userId.Value);

                _logger.LogInformation("💬 User {UserId} sending message to chat {ChatId}", userId, chatId);

                // Broadcast to all participants in the chat
                await Clients.Group($"chat_{chatId}").SendAsync("ReceiveMessage", new
                {
                    Id = 0, // Temporary ID - will be replaced by database ID
                    ChatId = chatId,
                    Content = message,
                    SenderId = userId.Value,
                    MessageType = "text",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false,
                    SenderName = userName, // Use actual user name
                    SenderProfilePicture = profilePicture
                });

                _logger.LogInformation("✅ Message broadcasted to chat {ChatId}", chatId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in SendMessage to chat {ChatId}", chatId);
            }
        }
        private async Task<string> GetUserNameAsync(int userId)
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var user = await dbContext.Users.FindAsync(userId);
                return user?.Name ?? $"User{userId}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user name for user {UserId}", userId);
                return $"User{userId}";
            }
        }
        private async Task<(string UserName, string ProfilePicture)> GetUserDetailsAsync(int userId)
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var user = await dbContext.Users.FindAsync(userId);
                return (user?.Name ?? $"User{userId}", user?.ProfilePicture ?? "");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user details for user {UserId}", userId);
                return ($"User{userId}", "");
            }
        }

        public async Task Typing(int chatId, bool isTyping)
        {
            try
            {
                var userId = await GetUserIdFromContextAsync();
                if (!userId.HasValue) return;

                // Get actual user name from database
                var userName = await GetUserNameAsync(userId.Value);

                await Clients.OthersInGroup($"chat_{chatId}").SendAsync("UserTyping", new
                {
                    ChatId = chatId,
                    UserId = userId.Value,
                    IsTyping = isTyping,
                    UserName = userName // Use actual user name
                });

                _logger.LogDebug("⌨️ User {UserId} ({UserName}) {Action} typing in chat {ChatId}",
                    userId, userName, isTyping ? "started" : "stopped", chatId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in Typing for chat {ChatId}", chatId);
            }
        }

        public async Task MarkAsRead(int chatId, int messageId)
        {
            try
            {
                var userId = await GetUserIdFromContextAsync();
                if (!userId.HasValue) return;

                await Clients.Group($"chat_{chatId}").SendAsync("MessageRead", new
                {
                    ChatId = chatId,
                    MessageId = messageId,
                    UserId = userId.Value,
                    ReadAt = DateTime.UtcNow
                });

                _logger.LogInformation("👀 User {UserId} marked message {MessageId} as read in chat {ChatId}",
                    userId, messageId, chatId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in MarkAsRead for message {MessageId}", messageId);
            }
        }

        private async Task<int?> GetUserIdFromContextAsync()
        {
            try
            {
                // Method 1: Try to get from JWT token in query string (SignalR standard)
                var httpContext = Context.GetHttpContext();
                var accessToken = httpContext?.Request.Query["access_token"].ToString();

                if (!string.IsNullOrEmpty(accessToken))
                {
                    var userId = ValidateJwtToken(accessToken);
                    if (userId.HasValue)
                    {
                        _logger.LogDebug(" User ID {UserId} extracted from access_token", userId);
                        return userId.Value;
                    }
                }

                // Method 2: Try to get from User claims (for authenticated HTTP context)
                var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(userIdClaim, out var userIdFromClaims))
                {
                    _logger.LogDebug(" User ID {UserId} extracted from claims", userIdFromClaims);
                    return userIdFromClaims;
                }

                // Method 3: Try to get from Authorization header
                var authHeader = httpContext?.Request.Headers.Authorization.ToString();
                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                {
                    var token = authHeader["Bearer ".Length..].Trim();
                    var userIdFromHeader = ValidateJwtToken(token);
                    if (userIdFromHeader.HasValue)
                    {
                        _logger.LogDebug(" User ID {UserId} extracted from Authorization header", userIdFromHeader);
                        return userIdFromHeader;
                    }
                }

                // Log available claims for debugging
                _logger.LogWarning("❌ Could not extract user ID from any authentication method");
                if (Context.User?.Claims != null)
                {
                    foreach (var claim in Context.User.Claims)
                    {
                        _logger.LogDebug("Claim: {Type} = {Value}", claim.Type, claim.Value);
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error extracting user ID from context");
                return null;
            }
        }

        private int? ValidateJwtToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var jwtKey = _configuration["Jwt:Key"];

                if (string.IsNullOrEmpty(jwtKey))
                {
                    _logger.LogError("JWT Key is not configured");
                    return null;
                }

                var key = Encoding.ASCII.GetBytes(jwtKey);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidIssuer = _configuration["Jwt:Issuer"],
                    ValidAudience = _configuration["Jwt:Audience"],
                    ClockSkew = TimeSpan.Zero,
                    ValidateLifetime = true
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (int.TryParse(userIdClaim, out var userId))
                {
                    return userId;
                }

                _logger.LogWarning("Invalid user ID claim in token: {UserIdClaim}", userIdClaim);
                return null;
            }
            catch (SecurityTokenExpiredException)
            {
                _logger.LogWarning("JWT token expired");
                return null;
            }
            catch (SecurityTokenInvalidSignatureException)
            {
                _logger.LogWarning("JWT token signature invalid");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "JWT token validation failed");
                return null;
            }
        }

        public async Task FileUploadProgress(string uploadId, long bytesUploaded, long totalBytes, string fileName)
        {
            try
            {
                var userId = await GetUserIdFromContextAsync();
                if (!userId.HasValue) return;

                await Clients.Caller.SendAsync("FileUploadProgress", new FileUploadProgressDto
                {
                    UploadId = uploadId,
                    BytesUploaded = bytesUploaded,
                    TotalBytes = totalBytes,
                    FileName = fileName
                });

                _logger.LogDebug("File upload progress: {FileName} - {Percentage}%",
                    fileName, (bytesUploaded * 100.0 / totalBytes).ToString("0.0"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in FileUploadProgress");
            }
        }

        // NEW: File upload completed
        public async Task FileUploadCompleted(string uploadId, string fileName, string fileUrl, string fileType)
        {
            try
            {
                var userId = await GetUserIdFromContextAsync();
                if (!userId.HasValue) return;

                await Clients.Caller.SendAsync("FileUploadCompleted", new
                {
                    UploadId = uploadId,
                    FileName = fileName,
                    FileUrl = fileUrl,
                    FileType = fileType,
                    Success = true
                });

                _logger.LogInformation("File upload completed: {FileName}", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in FileUploadCompleted");
            }
        }

        // Helper method to get connection statistics
        public async Task<object> GetConnectionInfo()
        {
            var userId = await GetUserIdFromContextAsync();
            return new
            {
                UserId = userId,
                ConnectionId = Context.ConnectionId,
                ConnectedUsers = _userConnections.Count,
                IsAuthenticated = Context.User?.Identity?.IsAuthenticated ?? false
            };
        }
    }
}