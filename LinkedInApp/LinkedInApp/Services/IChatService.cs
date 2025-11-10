// Services/IChatService.cs
using LinkedInApp.DTOs;

namespace LinkedInApp.Services
{
    public interface IChatService
    {
        Task<ApiResponse<ChatDto>> CreateChatAsync(CreateChatDto createChatDto, int currentUserId);
        Task<ApiResponse<List<ChatDto>>> GetUserChatsAsync(int userId);
        Task<ApiResponse<ChatDto>> GetChatAsync(int chatId, int currentUserId);
        Task<ApiResponse<MessageDto>> SendMessageAsync(CreateMessageDto createMessageDto, int senderId);
        Task<ApiResponse<List<MessageDto>>> GetChatMessagesAsync(int chatId, int currentUserId, int page = 1, int pageSize = 50);
        Task<ApiResponse<bool>> MarkMessageAsReadAsync(int messageId, int userId);
        Task<ApiResponse<bool>> MarkAllMessagesAsReadAsync(int chatId, int userId);
    }
}