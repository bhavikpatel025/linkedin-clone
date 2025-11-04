using LinkedInApp.Data;
using LinkedInApp.DTOs;
using LinkedInApp.Hubs;
using LinkedInApp.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace LinkedInApp.Services
{
    public class ConnectionService : IConnectionService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public ConnectionService(
            ApplicationDbContext context,
            INotificationService notificationService,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _notificationService = notificationService;
            _hubContext = hubContext;
        }

        public async Task<ApiResponse<List<UserConnectionDto>>> GetUserConnections(int userId)
        {
            try
            {
                // First get connection IDs and basic info
                var connectionInfos = await _context.Connections
                    .Where(c => (c.SenderId == userId || c.ReceiverId == userId) && c.Status == "accepted")
                    .Select(c => new
                    {
                        ConnectionId = c.Id,
                        OtherUserId = c.SenderId == userId ? c.ReceiverId : c.SenderId,
                        ConnectionDate = c.CreatedDate
                    })
                    .ToListAsync();

                var result = new List<UserConnectionDto>();

                foreach (var info in connectionInfos)
                {
                    // Skip if OtherUserId is null
                    if (info.OtherUserId == null) continue;

                    // Get the other user with includes
                    var otherUser = await _context.Users
                        .Where(u => u.Id == info.OtherUserId)
                        .Include(u => u.Role)
                        .Select(u => new
                        {
                            u.Id,
                            u.Name,
                            RoleName = u.Role != null ? u.Role.Name : "Unknown",
                            u.ProfilePicture,
                            u.Location
                        })
                        .FirstOrDefaultAsync();

                    // Skip if user not found
                    if (otherUser == null) continue;

                    var mutualCount = await GetMutualConnectionsCount(userId, otherUser.Id);

                    result.Add(new UserConnectionDto
                    {
                        Id = otherUser.Id,
                        ConnectionId = info.ConnectionId,
                        Name = otherUser.Name ?? "Unknown User",
                        RoleName = otherUser.RoleName,
                        ProfilePicture = otherUser.ProfilePicture ?? string.Empty,
                        Location = otherUser.Location ?? string.Empty,
                        ConnectionDate = info.ConnectionDate,
                        MutualConnections = mutualCount
                    });
                }

                return new ApiResponse<List<UserConnectionDto>>
                {
                    Success = true,
                    Data = result
                };
            }
            catch (Exception ex)
            {
                // Log the full exception for debugging
                //_logger.LogError(ex, "Error retrieving connections for user {UserId}", userId);

                return new ApiResponse<List<UserConnectionDto>>
                {
                    Success = false,
                    Message = "Error retrieving connections. Please try again later."
                };
            }
        }

        public async Task<ApiResponse<List<UserConnectionDto>>> GetPendingConnections(int userId)
        {
            try
            {
                var pendingRequests = await _context.Connections
                    .Where(c => c.ReceiverId == userId && c.Status == "pending")
                    .Include(c => c.Sender)
                        .ThenInclude(s => s.Role)
                    .Select(c => new UserConnectionDto
                    {
                        Id = c.Sender.Id,
                        ConnectionId = c.Id,
                        Name = c.Sender.Name,
                        RoleName = c.Sender.Role.Name,
                        ProfilePicture = c.Sender.ProfilePicture ?? string.Empty,
                        Location = c.Sender.Location ?? string.Empty, // Handle null
                        ConnectionDate = c.CreatedDate,
                        MutualConnections = 0
                    })
                    .ToListAsync();

                // Calculate mutual connections for each pending request
                foreach (var request in pendingRequests)
                {
                    request.MutualConnections = await GetMutualConnectionsCount(userId, request.Id);
                }

                return new ApiResponse<List<UserConnectionDto>>
                {
                    Success = true,
                    Data = pendingRequests
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<UserConnectionDto>>
                {
                    Success = false,
                    Message = $"Error retrieving pending connections: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<List<UserConnectionDto>>> GetConnectionSuggestions(int userId)
        {
            try
            {
                // Get users who are not already connected or have pending requests
                var existingConnections = await _context.Connections
                    .Where(c => c.SenderId == userId || c.ReceiverId == userId)
                    .Select(c => c.SenderId == userId ? c.ReceiverId : c.SenderId)
                    .ToListAsync();

                existingConnections.Add(userId); // Exclude self

                var suggestions = await _context.Users
                    .Where(u => !existingConnections.Contains(u.Id))
                    .Include(u => u.Role)
                    .Select(u => new UserConnectionDto
                    {
                        Id = u.Id,
                        Name = u.Name,
                        RoleName = u.Role.Name,
                        ProfilePicture = u.ProfilePicture ?? string.Empty,
                        Location = u.Location ?? string.Empty, // Handle null
                        ConnectionDate = DateTime.UtcNow,
                        MutualConnections = 0
                    })
                    .ToListAsync();

                // Calculate mutual connections for each suggestion
                foreach (var suggestion in suggestions)
                {
                    suggestion.MutualConnections = await GetMutualConnectionsCount(userId, suggestion.Id);
                }

                // Order by mutual connections (most mutual first)
                suggestions = suggestions.OrderByDescending(s => s.MutualConnections).ToList();

                return new ApiResponse<List<UserConnectionDto>>
                {
                    Success = true,
                    Data = suggestions.Take(10).ToList() // Limit to 10 suggestions
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<UserConnectionDto>>
                {
                    Success = false,
                    Message = $"Error retrieving connection suggestions: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<ConnectionDto>> SendConnectionRequest(ConnectionRequestDto request)
        {
            try
            {
                // Check if connection already exists
                var existingConnection = await _context.Connections
                    .FirstOrDefaultAsync(c =>
                        (c.SenderId == request.SenderId && c.ReceiverId == request.ReceiverId) ||
                        (c.SenderId == request.ReceiverId && c.ReceiverId == request.SenderId));

                if (existingConnection != null)
                {
                    return new ApiResponse<ConnectionDto>
                    {
                        Success = false,
                        Message = "Connection already exists or request already sent"
                    };
                }

                var senderUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == request.SenderId);

                if (senderUser == null)
                {
                    return new ApiResponse<ConnectionDto>
                    {
                        Success = false,
                        Message = "Sender user not found"
                    };
                }

                var connection = new Connection
                {
                    SenderId = request.SenderId,
                    ReceiverId = request.ReceiverId,
                    Status = "pending",
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                };

                _context.Connections.Add(connection);
                await _context.SaveChangesAsync();

                // Create notification for the receiver
                var notificationDto = new NotificationCreateDto
                {
                    UserId = request.ReceiverId,
                    SenderId = request.SenderId,
                    Title = "New Connection Request",
                    Message = $"{senderUser.Name} wants to connect with you",
                    Type = "connection_request",
                    RelatedEntityId = connection.Id
                };

                // This will automatically trigger SignalR notification
                await _notificationService.CreateNotification(notificationDto);

                var connectionDto = new ConnectionDto
                {
                    Id = connection.Id,
                    SenderId = connection.SenderId,
                    ReceiverId = connection.ReceiverId,
                    Status = connection.Status,
                    CreatedDate = connection.CreatedDate,
                    UpdatedDate = connection.UpdatedDate
                };

                return new ApiResponse<ConnectionDto>
                {
                    Success = true,
                    Data = connectionDto,
                    Message = "Connection request sent successfully"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<ConnectionDto>
                {
                    Success = false,
                    Message = $"Error sending connection request: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<ConnectionDto>> RespondToConnectionRequest(ConnectionResponseDto response)
        {
            try
            {
                var connection = await _context.Connections
                    .Include(c => c.Sender)
                    .Include(c => c.Receiver)
                    .FirstOrDefaultAsync(c => c.Id == response.ConnectionId);

                if (connection == null)
                {
                    return new ApiResponse<ConnectionDto>
                    {
                        Success = false,
                        Message = "Connection request not found"
                    };
                }

                if (connection.Status != "pending")
                {
                    return new ApiResponse<ConnectionDto>
                    {
                        Success = false,
                        Message = "Connection request already processed"
                    };
                }

                connection.Status = response.Status;
                connection.UpdatedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Create notification based on response
                var notificationDto = new NotificationCreateDto();

                if (response.Status == "accepted")
                {
                    // Notify the SENDER that their request was accepted
                    notificationDto.UserId = connection.SenderId;
                    notificationDto.SenderId = connection.ReceiverId;
                    notificationDto.Title = "Connection Accepted";
                    notificationDto.Message = $"{connection.Receiver.Name} accepted your connection request";
                    notificationDto.Type = "connection_accepted";
                    notificationDto.RelatedEntityId = connection.Id;
                }
                else if (response.Status == "rejected")
                {
                    // Notify the SENDER that their request was rejected
                    notificationDto.UserId = connection.SenderId;
                    notificationDto.SenderId = connection.ReceiverId;
                    notificationDto.Title = "Connection Declined";
                    notificationDto.Message = $"{connection.Receiver.Name} declined your connection request";
                    notificationDto.Type = "connection_rejected";
                    notificationDto.RelatedEntityId = connection.Id;
                }

                // This will automatically trigger SignalR notification
                await _notificationService.CreateNotification(notificationDto);

                var connectionDto = new ConnectionDto
                {
                    Id = connection.Id,
                    SenderId = connection.SenderId,
                    ReceiverId = connection.ReceiverId,
                    Status = connection.Status,
                    CreatedDate = connection.CreatedDate,
                    UpdatedDate = connection.UpdatedDate
                };

                return new ApiResponse<ConnectionDto>
                {
                    Success = true,
                    Data = connectionDto,
                    Message = $"Connection request {response.Status}"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<ConnectionDto>
                {
                    Success = false,
                    Message = $"Error responding to connection request: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> RemoveConnection(int connectionId, int userId)
        {
            try
            {
                var connection = await _context.Connections
                    .FirstOrDefaultAsync(c => c.Id == connectionId &&
                        (c.SenderId == userId || c.ReceiverId == userId));

                if (connection == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Connection not found"
                    };
                }

                _context.Connections.Remove(connection);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "Connection removed successfully"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Error removing connection: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<int>> GetConnectionCount(int userId)
        {
            try
            {
                var count = await _context.Connections
                    .CountAsync(c => (c.SenderId == userId || c.ReceiverId == userId) && c.Status == "accepted");

                return new ApiResponse<int>
                {
                    Success = true,
                    Data = count
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = $"Error getting connection count: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> CheckConnectionStatus(int user1Id, int user2Id)
        {
            try
            {
                var connection = await _context.Connections
                    .FirstOrDefaultAsync(c =>
                        (c.SenderId == user1Id && c.ReceiverId == user2Id) ||
                        (c.SenderId == user2Id && c.ReceiverId == user1Id));

                var isConnected = connection != null && connection.Status == "accepted";

                return new ApiResponse<bool>
                {
                    Success = true,
                    Data = isConnected
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Error checking connection status: {ex.Message}"
                };
            }
        }

        private async Task<int> GetMutualConnectionsCount(int user1Id, int user2Id)
        {
            var user1Connections = await _context.Connections
                .Where(c => (c.SenderId == user1Id || c.ReceiverId == user1Id) && c.Status == "accepted")
                .Select(c => c.SenderId == user1Id ? c.ReceiverId : c.SenderId)
                .ToListAsync();

            var user2Connections = await _context.Connections
                .Where(c => (c.SenderId == user2Id || c.ReceiverId == user2Id) && c.Status == "accepted")
                .Select(c => c.SenderId == user2Id ? c.ReceiverId : c.SenderId)
                .ToListAsync();

            return user1Connections.Intersect(user2Connections).Count();
        }
    }
}