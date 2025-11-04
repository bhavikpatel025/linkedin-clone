using LinkedInApp.DTOs;

namespace LinkedInApp.Services
{
    public interface IConnectionService
    {
        Task<ApiResponse<List<UserConnectionDto>>> GetUserConnections(int userId);
        Task<ApiResponse<List<UserConnectionDto>>> GetPendingConnections(int userId);
        Task<ApiResponse<List<UserConnectionDto>>> GetConnectionSuggestions(int userId);
        Task<ApiResponse<ConnectionDto>> SendConnectionRequest(ConnectionRequestDto request);
        Task<ApiResponse<ConnectionDto>> RespondToConnectionRequest(ConnectionResponseDto response);
        Task<ApiResponse<bool>> RemoveConnection(int connectionId, int userId);
        Task<ApiResponse<int>> GetConnectionCount(int userId);
        Task<ApiResponse<bool>> CheckConnectionStatus(int user1Id, int user2Id);
    }
}