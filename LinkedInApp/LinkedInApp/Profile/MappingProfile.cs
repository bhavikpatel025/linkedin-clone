using AutoMapper;
using LinkedInApp.DTOs;
using LinkedInApp.Models;

namespace LinkedInApp.Profiles
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User mappings
            CreateMap<UserRegistrationDto, User>()
                .ForMember(dest => dest.UserSkills, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src => DateTime.Now));

            CreateMap<User, UserDto>()
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role.Name))
                .ForMember(dest => dest.Skills, opt => opt.MapFrom(src => src.UserSkills.Select(us => us.Skill)))
                .ForMember(dest => dest.ProfilePicture, opt => opt.MapFrom(src => src.ProfilePicture));

            // Role mappings
            CreateMap<Role, RoleDto>();

            // Skill mappings
            CreateMap<Skill, SkillDto>();

            // Post mappings
            CreateMap<PostCreateDto, Post>()
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.PhotoPath, opt => opt.Ignore());

            CreateMap<PostUpdateDto, Post>()
                .ForMember(dest => dest.UpdatedDate, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.PhotoPath, opt => opt.Ignore());

            CreateMap<Post, PostDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.Name))
                .ForMember(dest => dest.LikesCount, opt => opt.MapFrom(src => src.Likes.Count))
                .ForMember(dest => dest.CommentsCount, opt => opt.MapFrom(src => src.Comments.Count))
                .ForMember(dest => dest.IsLikedByCurrentUser, opt => opt.Ignore())
                .ForMember(dest => dest.Comments, opt => opt.MapFrom(src => src.Comments));
            //            .ForMember(dest => dest.LikesCount, opt => opt.MapFrom(src => src.Likes.Count))
            //.ForMember(dest => dest.CommentsCount, opt => opt.MapFrom(src => src.Comments.Count));


            // Comment mappings
            CreateMap<CommentCreateDto, Comment>()
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src => DateTime.Now));

            CreateMap<Comment, CommentDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.Name))
                 .ForMember(dest => dest.UserProfilePicture, opt => opt.MapFrom(src => src.User.ProfilePicture))
                 .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src =>
        src.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")));

            CreateMap<ReplyCreateDto, Reply>()
               .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<Reply, ReplyDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.Name))
                 .ForMember(dest => dest.UserProfilePicture, opt => opt.MapFrom(src => src.User.ProfilePicture))
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src => src.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss")));

            // Like mappings
            CreateMap<LikeDto, Like>()
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src => DateTime.Now));

            // Connection mappings
            CreateMap<Connection, ConnectionDto>();
            CreateMap<ConnectionRequestDto, Connection>();
            CreateMap<User, UserConnectionDto>()
                    .ForMember(dest => dest.ProfilePicture, opt => opt.MapFrom(src => src.ProfilePicture))
                .ForMember(dest => dest.ConnectionDate, opt => opt.Ignore())
                .ForMember(dest => dest.MutualConnections, opt => opt.Ignore());

            CreateMap<Notification, NotificationDto>()
             .ForMember(dest => dest.SenderName, opt => opt.MapFrom(src => src.Sender != null ? src.Sender.Name : "Unknown User"))
             .ForMember(dest => dest.TimeAgo, opt => opt.Ignore()); // This will be set manually

            CreateMap<NotificationCreateDto, Notification>()
            .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src => DateTime.UtcNow));

            // Add this to your MappingProfile if needed
            CreateMap<User, UserSearchResult>()
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role.Name))
                .ForMember(dest => dest.ProfilePicture, opt => opt.MapFrom(src => src.ProfilePicture))
                .ForMember(dest => dest.MutualConnections, opt => opt.Ignore())
                .ForMember(dest => dest.ConnectionStatus, opt => opt.Ignore())
                .ForMember(dest => dest.CanConnect, opt => opt.Ignore());

            CreateMap<SavePostRequestDto, SavedPost>();
            CreateMap<SavedPost, SavedPostDto>();
        }
    }
}