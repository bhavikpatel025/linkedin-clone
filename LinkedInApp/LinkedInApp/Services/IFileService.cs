using LinkedInApp.DTOs;

namespace LinkedInApp.Services
{
    public interface IFileService
    {
        Task<FileUploadResponseDto> UploadFileAsync(IFormFile file, string uploadPath, bool generateThumbnail = false);
        Task<bool> DeleteFileAsync(string filePath);
        string GenerateThumbnail(string imagePath, string thumbnailPath, int width = 200, int height = 200);
        string GetFileType(string fileName);
        string FormatFileSize(long bytes);
        string GetUploadPath(string fileType);
    }
}