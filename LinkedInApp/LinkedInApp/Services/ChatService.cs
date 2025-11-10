using LinkedInApp.Data;
using LinkedInApp.DTOs;
using LinkedInApp.Hubs;
using LinkedInApp.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace LinkedInApp.Services
{
    public class ChatService : IChatService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ILogger<ChatService> _logger;

        public ChatService(ApplicationDbContext context, IHubContext<ChatHub> hubContext, ILogger<ChatService> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task<ApiResponse<ChatDto>> CreateChatAsync(CreateChatDto createChatDto, int currentUserId)
        {
            try
            {
                _logger.LogInformation("Creating chat for user {CurrentUserId} with participants: {ParticipantIds}",
                    currentUserId, string.Join(", ", createChatDto.ParticipantIds));

                // Validate input
                if (createChatDto == null)
                {
                    return new ApiResponse<ChatDto>
                    {
                        Success = false,
                        Message = "Invalid chat data",
                        Errors = new List<string> { "Chat data cannot be null" }
                    };
                }

                if (createChatDto.ParticipantIds == null || createChatDto.ParticipantIds.Count == 0)
                {
                    return new ApiResponse<ChatDto>
                    {
                        Success = false,
                        Message = "No participants specified",
                        Errors = new List<string> { "At least one participant is required" }
                    };
                }

                // Verify current user exists
                var currentUser = await _context.Users.FindAsync(currentUserId);
                if (currentUser == null)
                {
                    return new ApiResponse<ChatDto>
                    {
                        Success = false,
                        Message = "Current user not found",
                        Errors = new List<string> { "Invalid current user ID" }
                    };
                }

                _logger.LogInformation("Current user found: {UserName} (ID: {UserId})", currentUser.Name, currentUser.Id);

                // For direct chats, check if already exists
                if (createChatDto.ParticipantIds.Count == 1)
                {
                    var otherUserId = createChatDto.ParticipantIds[0];
                    _logger.LogInformation("Checking for existing direct chat with user {OtherUserId}", otherUserId);

                    // Verify other user exists
                    var otherUser = await _context.Users.FindAsync(otherUserId);
                    if (otherUser == null)
                    {
                        return new ApiResponse<ChatDto>
                        {
                            Success = false,
                            Message = "Participant user not found",
                            Errors = new List<string> { $"User with ID {otherUserId} does not exist" }
                        };
                    }

                    var existingChat = await _context.Chats
                        .Include(c => c.Participants)
                        .Where(c => c.Type == "direct" &&
                                   c.Participants.Count == 2 &&
                                   c.Participants.Any(p => p.UserId == currentUserId) &&
                                   c.Participants.Any(p => p.UserId == otherUserId))
                        .FirstOrDefaultAsync();

                    if (existingChat != null)
                    {
                        _logger.LogInformation("Existing chat found: {ChatId}", existingChat.Id);
                        var existingChatDto = await MapToChatDto(existingChat, currentUserId);
                        return new ApiResponse<ChatDto>
                        {
                            Success = true,
                            Message = "Chat already exists",
                            Data = existingChatDto
                        };
                    }
                }

                // Create new chat
                var chat = new Chat
                {
                    Type = createChatDto.ParticipantIds.Count > 1 ? "group" : "direct",
                    GroupName = createChatDto.GroupName,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _logger.LogInformation("Creating new {ChatType} chat", chat.Type);

                // Add current user as participant
                chat.Participants.Add(new ChatParticipant
                {
                    UserId = currentUserId,
                    Role = "admin",
                    JoinedAt = DateTime.UtcNow
                });

                _logger.LogInformation("Added current user {CurrentUserId} as participant", currentUserId);

                // Add other participants with validation
                foreach (var participantId in createChatDto.ParticipantIds)
                {
                    if (participantId == currentUserId)
                    {
                        _logger.LogInformation("Skipping current user {ParticipantId} in participants list", participantId);
                        continue;
                    }

                    // Verify participant exists
                    var participantUser = await _context.Users.FindAsync(participantId);
                    if (participantUser == null)
                    {
                        return new ApiResponse<ChatDto>
                        {
                            Success = false,
                            Message = $"Participant user not found: {participantId}",
                            Errors = new List<string> { $"User with ID {participantId} does not exist" }
                        };
                    }

                    _logger.LogInformation("Adding participant: {ParticipantName} (ID: {ParticipantId})",
                        participantUser.Name, participantUser.Id);

                    chat.Participants.Add(new ChatParticipant
                    {
                        UserId = participantId,
                        Role = "member",
                        JoinedAt = DateTime.UtcNow
                    });
                }

                // Verify we have at least 2 participants
                if (chat.Participants.Count < 2)
                {
                    return new ApiResponse<ChatDto>
                    {
                        Success = false,
                        Message = "Insufficient participants",
                        Errors = new List<string> { "A chat must have at least 2 participants" }
                    };
                }

                _logger.LogInformation("Chat has {ParticipantCount} participants", chat.Participants.Count);

                _context.Chats.Add(chat);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Chat created successfully with ID: {ChatId}", chat.Id);

                // Notify participants about new chat via SignalR
                foreach (var participant in chat.Participants)
                {
                    if (participant.UserId != currentUserId)
                    {
                        await _hubContext.Clients.Group($"user_{participant.UserId}").SendAsync("ChatCreated",
                            await MapToChatDto(chat, participant.UserId));
                    }
                }

                var createdChat = await _context.Chats
                    .Include(c => c.Participants)
                        .ThenInclude(p => p.User)
                    .FirstOrDefaultAsync(c => c.Id == chat.Id);

                if (createdChat == null)
                {
                    return new ApiResponse<ChatDto>
                    {
                        Success = false,
                        Message = "Failed to retrieve created chat",
                        Errors = new List<string> { "Chat was created but could not be retrieved" }
                    };
                }

                var chatDto = await MapToChatDto(createdChat, currentUserId);

                return new ApiResponse<ChatDto>
                {
                    Success = true,
                    Message = "Chat created successfully",
                    Data = chatDto
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CreateChatAsync for user {CurrentUserId}", currentUserId);
                return new ApiResponse<ChatDto>
                {
                    Success = false,
                    Message = "Failed to create chat",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<List<ChatDto>>> GetUserChatsAsync(int userId)
        {
            try
            {
                var chats = await _context.Chats
                    .Include(c => c.Participants)
                        .ThenInclude(p => p.User)
                    .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                        .ThenInclude(m => m.Sender)
                    .Where(c => c.Participants.Any(p => p.UserId == userId))
                    .OrderByDescending(c => c.UpdatedAt)
                    .ToListAsync();

                var chatDtos = new List<ChatDto>();
                foreach (var chat in chats)
                {
                    chatDtos.Add(await MapToChatDto(chat, userId));
                }

                return new ApiResponse<List<ChatDto>>
                {
                    Success = true,
                    Message = "Chats retrieved successfully",
                    Data = chatDtos
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetUserChatsAsync for user {UserId}", userId);
                return new ApiResponse<List<ChatDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve chats",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<ChatDto>> GetChatAsync(int chatId, int currentUserId)
        {
            try
            {
                var chat = await _context.Chats
                    .Include(c => c.Participants)
                        .ThenInclude(p => p.User)
                    .Include(c => c.Messages)
                        .ThenInclude(m => m.Sender)
                    .FirstOrDefaultAsync(c => c.Id == chatId && c.Participants.Any(p => p.UserId == currentUserId));

                if (chat == null)
                {
                    return new ApiResponse<ChatDto>
                    {
                        Success = false,
                        Message = "Chat not found or access denied"
                    };
                }

                var chatDto = await MapToChatDto(chat, currentUserId);
                return new ApiResponse<ChatDto>
                {
                    Success = true,
                    Message = "Chat retrieved successfully",
                    Data = chatDto
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetChatAsync for chat {ChatId} and user {UserId}", chatId, currentUserId);
                return new ApiResponse<ChatDto>
                {
                    Success = false,
                    Message = "Failed to retrieve chat",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<MessageDto>> SendMessageAsync(CreateMessageDto createMessageDto, int senderId)
        {
            try
            {
                // Verify user has access to chat
                var hasAccess = await _context.ChatParticipants
                    .AnyAsync(cp => cp.ChatId == createMessageDto.ChatId && cp.UserId == senderId);

                if (!hasAccess)
                {
                    return new ApiResponse<MessageDto>
                    {
                        Success = false,
                        Message = "Access denied to this chat"
                    };
                }

                var message = new Message
                {
                    ChatId = createMessageDto.ChatId,
                    SenderId = senderId,
                    Content = createMessageDto.Content.Trim(),
                    MessageType = createMessageDto.MessageType ?? "text",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };

                _context.Messages.Add(message);

                // Update chat's updated timestamp
                var chat = await _context.Chats.FindAsync(createMessageDto.ChatId);
                if (chat != null)
                {
                    chat.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                // Get message with sender info
                var messageWithSender = await _context.Messages
                    .Include(m => m.Sender)
                    .FirstOrDefaultAsync(m => m.Id == message.Id);

                if (messageWithSender == null)
                {
                    return new ApiResponse<MessageDto>
                    {
                        Success = false,
                        Message = "Failed to retrieve sent message"
                    };
                }

                var messageDto = MapToMessageDto(messageWithSender);

                // Send real-time notification via SignalR
                await _hubContext.Clients.Group($"chat_{createMessageDto.ChatId}").SendAsync("ReceiveMessage", messageDto);

                _logger.LogInformation("Message {MessageId} sent to chat {ChatId} by user {SenderId}",
                    message.Id, createMessageDto.ChatId, senderId);

                return new ApiResponse<MessageDto>
                {
                    Success = true,
                    Message = "Message sent successfully",
                    Data = messageDto
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendMessageAsync for chat {ChatId} and sender {SenderId}",
                    createMessageDto.ChatId, senderId);
                return new ApiResponse<MessageDto>
                {
                    Success = false,
                    Message = "Failed to send message",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<List<MessageDto>>> GetChatMessagesAsync(int chatId, int currentUserId, int page = 1, int pageSize = 50)
        {
            try
            {
                var hasAccess = await _context.ChatParticipants
                    .AnyAsync(cp => cp.ChatId == chatId && cp.UserId == currentUserId);

                if (!hasAccess)
                {
                    return new ApiResponse<List<MessageDto>>
                    {
                        Success = false,
                        Message = "Access denied to this chat"
                    };
                }

                var messages = await _context.Messages
                    .Where(m => m.ChatId == chatId)
                    .Include(m => m.Sender)
                    .OrderByDescending(m => m.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .OrderBy(m => m.CreatedAt) // Re-order for display
                    .ToListAsync();

                var messageDtos = messages.Select(MapToMessageDto).ToList();
                return new ApiResponse<List<MessageDto>>
                {
                    Success = true,
                    Message = "Messages retrieved successfully",
                    Data = messageDtos
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetChatMessagesAsync for chat {ChatId} and user {UserId}", chatId, currentUserId);
                return new ApiResponse<List<MessageDto>>
                {
                    Success = false,
                    Message = "Failed to retrieve messages",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> MarkMessageAsReadAsync(int messageId, int userId)
        {
            try
            {
                var message = await _context.Messages
                    .FirstOrDefaultAsync(m => m.Id == messageId);

                if (message == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Message not found",
                        Errors = new List<string> { "Message does not exist" }
                    };
                }

                var hasAccess = await _context.ChatParticipants
                    .AnyAsync(cp => cp.ChatId == message.ChatId && cp.UserId == userId);

                if (!hasAccess)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Access denied to this message",
                        Errors = new List<string> { "You don't have permission to mark this message as read" }
                    };
                }

                if (!message.IsRead && message.SenderId != userId)
                {
                    message.IsRead = true;
                    message.ReadAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Message {MessageId} marked as read by user {UserId}", messageId, userId);

                    await _hubContext.Clients.Group($"chat_{message.ChatId}").SendAsync("MessageRead", new
                    {
                        ChatId = message.ChatId,
                        MessageId = messageId,
                        UserId = userId,
                        ReadAt = message.ReadAt
                    });
                }

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Message marked as read",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in MarkMessageAsReadAsync for message {MessageId} and user {UserId}", messageId, userId);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to mark message as read",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<ApiResponse<bool>> MarkAllMessagesAsReadAsync(int chatId, int userId)
        {
            try
            {
                var hasAccess = await _context.ChatParticipants
                    .AnyAsync(cp => cp.ChatId == chatId && cp.UserId == userId);

                if (!hasAccess)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Access denied to this chat",
                        Errors = new List<string> { "You don't have permission to mark messages as read in this chat" }
                    };
                }

                var unreadMessages = await _context.Messages
                    .Where(m => m.ChatId == chatId && !m.IsRead && m.SenderId != userId)
                    .ToListAsync();

                _logger.LogInformation("Found {UnreadCount} unread messages in chat {ChatId} for user {UserId}",
                    unreadMessages.Count, chatId, userId);

                if (unreadMessages.Count > 0)
                {
                    var now = DateTime.UtcNow;

                    foreach (var message in unreadMessages)
                    {
                        message.IsRead = true;
                        message.ReadAt = now;
                    }

                    await _context.SaveChangesAsync();

                    // Notify all participants via SignalR
                    foreach (var message in unreadMessages)
                    {
                        await _hubContext.Clients.Group($"chat_{chatId}").SendAsync("MessageRead", new
                        {
                            ChatId = chatId,
                            MessageId = message.Id,
                            UserId = userId,
                            ReadAt = now
                        });
                    }
                }

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = $"All messages marked as read",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in MarkAllMessagesAsReadAsync for chat {ChatId} and user {UserId}", chatId, userId);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Failed to mark messages as read",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        private async Task<ChatDto> MapToChatDto(Chat chat, int currentUserId)
        {
            try
            {
                // Get last message
                var lastMessage = await _context.Messages
                    .Where(m => m.ChatId == chat.Id)
                    .OrderByDescending(m => m.CreatedAt)
                    .FirstOrDefaultAsync();

                // Get unread count
                var unreadCount = await _context.Messages
                    .CountAsync(m => m.ChatId == chat.Id && !m.IsRead && m.SenderId != currentUserId);

                var chatDto = new ChatDto
                {
                    Id = chat.Id,
                    Type = chat.Type ?? "direct",
                    GroupName = chat.GroupName,
                    CreatedAt = chat.CreatedAt,
                    UpdatedAt = chat.UpdatedAt,
                    LastMessage = lastMessage?.Content ?? string.Empty,
                    LastMessageAt = lastMessage?.CreatedAt,
                    UnreadCount = unreadCount,
                    Participants = new List<ChatParticipantDto>()
                };

                if (chat.Participants != null)
                {
                    foreach (var participant in chat.Participants)
                    {
                        if (participant?.User != null)
                        {
                            chatDto.Participants.Add(new ChatParticipantDto
                            {
                                UserId = participant.UserId,
                                UserName = participant.User.Name ?? "Unknown User",
                                ProfilePicture = participant.User.ProfilePicture ?? string.Empty,
                                Role = participant.Role ?? "member",
                                IsOnline = false // You can implement online status check here
                            });
                        }
                    }
                }

                return chatDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in MapToChatDto for chat {ChatId}", chat.Id);
                return new ChatDto
                {
                    Id = chat.Id,
                    Type = chat.Type ?? "direct",
                    GroupName = chat.GroupName,
                    CreatedAt = chat.CreatedAt,
                    UpdatedAt = chat.UpdatedAt,
                    LastMessage = string.Empty,
                    UnreadCount = 0,
                    Participants = new List<ChatParticipantDto>()
                };
            }
        }

        private MessageDto MapToMessageDto(Message message)
        {
            if (message == null) return null;

            return new MessageDto
            {
                Id = message.Id,
                ChatId = message.ChatId,
                SenderId = message.SenderId,
                SenderName = message.Sender?.Name ?? "Unknown User",
                SenderProfilePicture = message.Sender?.ProfilePicture ?? string.Empty,
                Content = message.Content,
                MessageType = message.MessageType,
                IsRead = message.IsRead,
                CreatedAt = message.CreatedAt,
                ReadAt = message.ReadAt
            };
        }
    }
}