using Moq;
using KSSMCS.API.DTOs;
using KSSMCS.API.Models;
using KSSMCS.API.Repositories;
using KSSMCS.API.Services;

namespace KSSMCS.API.Tests.Services;

public class LearnerServiceTests
{
    private readonly Mock<ILearnerRepository> _repoMock;
    private readonly LearnerService _sut;

    public LearnerServiceTests()
    {
        _repoMock = new Mock<ILearnerRepository>();
        _sut = new LearnerService(_repoMock.Object);
    }

    [Fact]
    public async Task CreateAsync_WithValidData_ReturnsLearnerResponse()
    {
        // Arrange
        var dto = new CreateLearnerDto
        {
            FirstName = "Thabo",
            LastName = "Mkhize",
            DateOfBirth = new DateTime(2015, 5, 15),
            Gender = "Male",
            SupportNeeds = "Requires mobility assistance",
            GuardianName = "Nomsa Mkhize",
            GuardianPhone = "0821234567"
        };

        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Learner>()))
            .ReturnsAsync((Learner l) => l);

        // Act
        var result = await _sut.CreateAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Thabo", result.FirstName);
        Assert.Equal("Mkhize", result.LastName);
        Assert.Equal("Thabo Mkhize", result.FullName);
        Assert.True(result.Age >= 10 && result.Age <= 11); // Should be around 10-11

        _repoMock.Verify(r => r.AddAsync(It.IsAny<Learner>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithFutureDateOfBirth_ThrowsArgumentException()
    {
        // Arrange
        var dto = new CreateLearnerDto
        {
            FirstName = "Future",
            LastName = "Learner",
            DateOfBirth = DateTime.UtcNow.AddYears(1) // 1 year in the future
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.CreateAsync(dto));

        Assert.Contains("future", exception.Message);
        _repoMock.Verify(r => r.AddAsync(It.IsAny<Learner>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WithUnrealisticAge_ThrowsArgumentException()
    {
        // Arrange: 30 years old — too old for a school learner
        var dto = new CreateLearnerDto
        {
            FirstName = "Old",
            LastName = "Learner",
            DateOfBirth = DateTime.UtcNow.AddYears(-30)
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.CreateAsync(dto));

        Assert.Contains("Age", exception.Message);
    }

    [Fact]
    public async Task GetByIdAsync_WithExistingId_ReturnsLearner()
    {
        // Arrange
        var learnerId = Guid.NewGuid();
        var learner = new Learner
        {
            LearnerId = learnerId,
            FirstName = "Thabo",
            LastName = "Mkhize",
            DateOfBirth = new DateTime(2015, 5, 15)
        };

        _repoMock
            .Setup(r => r.GetByIdAsync(learnerId))
            .ReturnsAsync(learner);

        // Act
        var result = await _sut.GetByIdAsync(learnerId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(learnerId, result.LearnerId);
        Assert.Equal("Thabo Mkhize", result.FullName);
    }

    [Fact]
    public async Task GetByIdAsync_WithNonExistentId_ReturnsNull()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repoMock
            .Setup(r => r.GetByIdAsync(id))
            .ReturnsAsync((Learner?)null);

        // Act
        var result = await _sut.GetByIdAsync(id);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_WithExistingId_ReturnsTrue()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repoMock
            .Setup(r => r.DeleteAsync(id))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.DeleteAsync(id);

        // Assert
        Assert.True(result);
        _repoMock.Verify(r => r.DeleteAsync(id), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WithNonExistentLearner_ReturnsNull()
    {
        // Arrange
        var id = Guid.NewGuid();
        var dto = new UpdateLearnerDto
        {
            FirstName = "Updated",
            LastName = "Name",
            DateOfBirth = new DateTime(2015, 1, 1)
        };

        _repoMock
            .Setup(r => r.GetByIdAsync(id))
            .ReturnsAsync((Learner?)null);

        // Act
        var result = await _sut.UpdateAsync(id, dto);

        // Assert
        Assert.Null(result);
    }
}