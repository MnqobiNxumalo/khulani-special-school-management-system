using KSSMCS.API.DTOs;
using KSSMCS.API.Helpers;
using KSSMCS.API.Models;
using KSSMCS.API.Repositories;

namespace KSSMCS.API.Services;

public interface IUserService
{
    Task<IEnumerable<UserResponseDto>> GetAllAsync();
    Task<UserResponseDto?> GetByIdAsync(Guid id);
    Task<UserResponseDto> CreateAsync(CreateUserDto dto, string createdByRole);
    Task<UserResponseDto?> ToggleActiveAsync(Guid id, Guid currentUserId);
    Task<bool> DeleteAsync(Guid id, Guid currentUserId);
}

public class UserService : IUserService
{
    private readonly IUserRepository _repo;

    public UserService(IUserRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<UserResponseDto>> GetAllAsync()
    {
        var users = await _repo.GetAllAsync();
        return users.Select(MapToDto);
    }

    public async Task<UserResponseDto?> GetByIdAsync(Guid id)
    {
        var user = await _repo.GetByIdAsync(id);
        return user == null ? null : MapToDto(user);
    }

    public async Task<UserResponseDto> CreateAsync(CreateUserDto dto, string createdByRole)
    {
        // Rule 1: Email must be unique
        var existing = await _repo.GetByEmailAsync(dto.Email);
        if (existing != null)
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        // Rule 2: Only principals can create another principal or admin
        var role = dto.Role.ToLower();
        if (role == "principal" || role == "admin")
        {
            if (createdByRole.ToLower() != "principal")
            {
                throw new UnauthorizedAccessException(
                    "Only a principal can create principal or admin accounts.");
            }
        }

        var user = new User
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = PasswordHasher.HashPassword(dto.Password),
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(user);
        return MapToDto(user);
    }

    public async Task<UserResponseDto?> ToggleActiveAsync(Guid id, Guid currentUserId)
    {
        // Prevent self-deactivation
        if (id == currentUserId)
        {
            throw new ArgumentException("You cannot deactivate your own account.");
        }

        var user = await _repo.GetByIdAsync(id);
        if (user == null) return null;

        user.IsActive = !user.IsActive;
        await _repo.UpdateAsync(user);
        return MapToDto(user);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid currentUserId)
    {
        if (id == currentUserId)
        {
            throw new ArgumentException("You cannot delete your own account.");
        }

        return await _repo.DeleteAsync(id);
    }

    private static UserResponseDto MapToDto(User u)
    {
        return new UserResponseDto
        {
            UserId = u.UserId,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Email = u.Email,
            Role = u.Role,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt,
            UpdatedAt = u.UpdatedAt
        };
    }
}