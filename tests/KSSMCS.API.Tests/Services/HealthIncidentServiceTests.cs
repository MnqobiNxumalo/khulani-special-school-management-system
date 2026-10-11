using Moq;
using KSSMCS.API.DTOs;
using KSSMCS.API.Models;
using KSSMCS.API.Repositories;
using KSSMCS.API.Services;

namespace KSSMCS.API.Tests.Services;

public class HealthIncidentServiceTests
{
    private readonly Mock<IHealthIncidentRepository> _incidentRepoMock;
    private readonly Mock<ILearnerRepository> _learnerRepoMock;
    private readonly HealthIncidentService _sut;

    public HealthIncidentServiceTests()
    {
        _incidentRepoMock = new Mock<IHealthIncidentRepository>();
        _learnerRepoMock = new Mock<ILearnerRepository>();
        _sut = new HealthIncidentService(_incidentRepoMock.Object, _learnerRepoMock.Object);
    }

    [Fact]
    public async Task CreateAsync_WithValidData_ReturnsIncidentResponse()
    {
        // Arrange
        var learnerId = Guid.NewGuid();
        var reporterId = Guid.NewGuid();

        var dto = new CreateHealthIncidentDto
        {
            LearnerId = learnerId,
            IncidentType = "Seizure",
            Description = "Learner had a seizure lasting 2 minutes",
            ActionTaken = "Kept safe, called nurse",
            NotifyGuardian = true
        };

        // Learner exists
        _learnerRepoMock
            .Setup(r => r.ExistsAsync(learnerId))
            .ReturnsAsync(true);

        var learner = new Learner { LearnerId = learnerId, FirstName = "Thabo", LastName = "Mkhize" };
        var reporter = new User { UserId = reporterId, FirstName = "Sarah", LastName = "Dlamini" };

        // AddAsync returns the incident
        _incidentRepoMock
            .Setup(r => r.AddAsync(It.IsAny<HealthIncident>()))
            .ReturnsAsync((HealthIncident h) => h);

        // GetByIdAsync (called after add) returns with navigation props
        _incidentRepoMock
            .Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Guid id) => new HealthIncident
            {
                IncidentId = id,
                LearnerId = learnerId,
                Learner = learner,
                ReportedByUserId = reporterId,
                ReportedBy = reporter,
                IncidentType = "Seizure",
                Description = "Learner had a seizure lasting 2 minutes",
                ActionTaken = "Kept safe, called nurse",
                NotifyGuardian = true,
                IncidentDate = DateTime.UtcNow
            });

        // Act
        var result = await _sut.CreateAsync(dto, reporterId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Seizure", result.IncidentType);
        Assert.Equal("Thabo Mkhize", result.LearnerFullName);
        Assert.Equal("Sarah Dlamini", result.ReportedByName);
        Assert.True(result.NotifyGuardian);

        _learnerRepoMock.Verify(r => r.ExistsAsync(learnerId), Times.Once);
        _incidentRepoMock.Verify(r => r.AddAsync(It.IsAny<HealthIncident>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithNonExistentLearner_ThrowsArgumentException()
    {
        // Arrange
        var dto = new CreateHealthIncidentDto
        {
            LearnerId = Guid.NewGuid(),
            IncidentType = "Seizure",
            Description = "Test description here"
        };

        _learnerRepoMock
            .Setup(r => r.ExistsAsync(It.IsAny<Guid>()))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.CreateAsync(dto, Guid.NewGuid()));

        Assert.Contains("does not exist", exception.Message);
        _incidentRepoMock.Verify(r => r.AddAsync(It.IsAny<HealthIncident>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WithInvalidIncidentType_ThrowsArgumentException()
    {
        // Arrange
        var learnerId = Guid.NewGuid();
        var dto = new CreateHealthIncidentDto
        {
            LearnerId = learnerId,
            IncidentType = "Hangnail", // Not in the allowed list
            Description = "Test description here"
        };

        _learnerRepoMock
            .Setup(r => r.ExistsAsync(learnerId))
            .ReturnsAsync(true);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.CreateAsync(dto, Guid.NewGuid()));

        Assert.Contains("Invalid incident type", exception.Message);
    }

    [Fact]
    public async Task CreateAsync_WithFutureIncidentDate_ThrowsArgumentException()
    {
        // Arrange
        var learnerId = Guid.NewGuid();
        var dto = new CreateHealthIncidentDto
        {
            LearnerId = learnerId,
            IncidentType = "Seizure",
            Description = "Test description here",
            IncidentDate = DateTime.UtcNow.AddHours(2) // 2 hours in the future
        };

        _learnerRepoMock
            .Setup(r => r.ExistsAsync(learnerId))
            .ReturnsAsync(true);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _sut.CreateAsync(dto, Guid.NewGuid()));

        Assert.Contains("future", exception.Message);
    }

    [Fact]
    public async Task GetByLearnerIdAsync_ReturnsAllIncidentsForLearner()
    {
        // Arrange
        var learnerId = Guid.NewGuid();
        var incidents = new List<HealthIncident>
        {
            new HealthIncident
            {
                IncidentId = Guid.NewGuid(),
                LearnerId = learnerId,
                IncidentType = "Seizure",
                Description = "First incident",
                Learner = new Learner { FirstName = "Thabo", LastName = "Mkhize" }
            },
            new HealthIncident
            {
                IncidentId = Guid.NewGuid(),
                LearnerId = learnerId,
                IncidentType = "Fall",
                Description = "Second incident",
                Learner = new Learner { FirstName = "Thabo", LastName = "Mkhize" }
            }
        };

        _incidentRepoMock
            .Setup(r => r.GetByLearnerIdAsync(learnerId))
            .ReturnsAsync(incidents);

        // Act
        var result = (await _sut.GetByLearnerIdAsync(learnerId)).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, r => r.IncidentType == "Seizure");
        Assert.Contains(result, r => r.IncidentType == "Fall");
    }
}