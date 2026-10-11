using Moq;
using Microsoft.EntityFrameworkCore;
using KSSMCS.API.Data;
using KSSMCS.API.DTOs;
using KSSMCS.API.Helpers;
using KSSMCS.API.Models;
using KSSMCS.API.Services;

namespace KSSMCS.API.Tests.Services;

public class AuthServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        // In-memory database with unique name per test
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new AppDbContext(options);

        // Mock JWT service
        _jwtServiceMock = new Mock<IJwtService>();
        _jwtServiceMock
            .Setup(x => x.GenerateToken(It.IsAny<User>()))
            .Returns(("mock-jwt-token", DateTime.UtcNow.AddHours(24)));

        _sut = new AuthService(_db, _jwtServiceMock.Object);
    }

    [Fact]
    public async Task RegisterAsync_WithValidData_ReturnsAuthResponseWithToken()
    {
        // Arrange
        var dto = new RegisterDto
        {
            FirstName = "Thoko",
            LastName = "Nxumalo",
            Email = "principal@khulani.co.za",
            Password = "Admin123!",
            Role = "principal"
        };

        // Act
        var result = await _sut.RegisterAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(dto.Email, result.Email);
        Assert.Equal(dto.FirstName, result.FirstName);
        Assert.Equal("principal", result.Role);
        Assert.Equal("mock-jwt-token", result.Token);
        Assert.NotEqual(Guid.Empty, result.UserId);

        // Verify user was actually saved
        var savedUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        Assert.NotNull(savedUser);
        Assert.NotEqual(dto.Password, savedUser.PasswordHash); // Password must be hashed
        Assert.True(BCrypt.Net.BCrypt.Verify(dto.Password, savedUser.PasswordHash));
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateEmail_ThrowsInvalidOperationException()
    {
        // Arrange: pre-create user
        var existingUser = new User
        {
            FirstName = "Existing",
            LastName = "User",
            Email = "existing@khulani.co.za",
            PasswordHash = PasswordHasher.HashPassword("Password123!"),
            Role = "teacher"
        };
        _db.Users.Add(existingUser);
        await _db.SaveChangesAsync();

        var dto = new RegisterDto
        {
            FirstName = "New",
            LastName = "User",
            Email = "existing@khulani.co.za",
            Password = "NewPassword123!",
            Role = "teacher"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.RegisterAsync(dto));

        Assert.Contains("already exists", exception.Message);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsAuthResponse()
    {
        // Arrange: register a user first
        var password = "Admin123!";
        var user = new User
        {
            FirstName = "Thoko",
            LastName = "Nxumalo",
            Email = "principal@khulani.co.za",
            PasswordHash = PasswordHasher.HashPassword(password),
            Role = "principal",
            IsActive = true
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var dto = new LoginDto
        {
            Email = "principal@khulani.co.za",
            Password = password
        };

        // Act
        var result = await _sut.LoginAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(user.UserId, result.UserId);
        Assert.Equal("principal", result.Role);
        Assert.Equal("mock-jwt-token", result.Token);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var user = new User
        {
            FirstName = "Thoko",
            LastName = "Nxumalo",
            Email = "principal@khulani.co.za",
            PasswordHash = PasswordHasher.HashPassword("CorrectPassword123!"),
            Role = "principal",
            IsActive = true
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var dto = new LoginDto
        {
            Email = "principal@khulani.co.za",
            Password = "WrongPassword!"
        };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _sut.LoginAsync(dto));
    }

    [Fact]
    public async Task LoginAsync_WithNonExistentEmail_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var dto = new LoginDto
        {
            Email = "nobody@khulani.co.za",
            Password = "AnyPassword123!"
        };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _sut.LoginAsync(dto));
    }

    [Fact]
    public async Task LoginAsync_WithInactiveUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var user = new User
        {
            FirstName = "Deactivated",
            LastName = "User",
            Email = "inactive@khulani.co.za",
            PasswordHash = PasswordHasher.HashPassword("Password123!"),
            Role = "teacher",
            IsActive = false
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var dto = new LoginDto
        {
            Email = "inactive@khulani.co.za",
            Password = "Password123!"
        };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _sut.LoginAsync(dto));
    }

    public void Dispose()
    {
        _db.Dispose();
    }
}