using KSSMCS.API.DTOs;
using KSSMCS.API.Models;
using KSSMCS.API.Repositories;

namespace KSSMCS.API.Services;

public interface IHealthIncidentService
{
    Task<IEnumerable<HealthIncidentResponseDto>> GetAllAsync();
    Task<HealthIncidentResponseDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<HealthIncidentResponseDto>> GetByLearnerIdAsync(Guid learnerId);
    Task<IEnumerable<HealthIncidentResponseDto>> GetByReporterIdAsync(Guid userId);
    Task<IEnumerable<HealthIncidentResponseDto>> GetRecentAsync(int days);
    Task<HealthIncidentResponseDto> CreateAsync(CreateHealthIncidentDto dto, Guid reporterId);
    Task<HealthIncidentResponseDto?> UpdateAsync(Guid id, UpdateHealthIncidentDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<int> CountAsync();
}

public class HealthIncidentService : IHealthIncidentService
{
    private readonly IHealthIncidentRepository _repo;
    private readonly ILearnerRepository _learnerRepo;

    // Allowed incident types — matches clinical + safety categories
    private static readonly string[] AllowedTypes = new[]
    {
        "Seizure", "Fall", "Illness", "Injury", "Allergic Reaction",
        "Behavioral", "Medication", "Respiratory", "Other"
    };

    public HealthIncidentService(
        IHealthIncidentRepository repo,
        ILearnerRepository learnerRepo)
    {
        _repo = repo;
        _learnerRepo = learnerRepo;
    }

    public async Task<IEnumerable<HealthIncidentResponseDto>> GetAllAsync()
    {
        var incidents = await _repo.GetAllAsync();
        return incidents.Select(MapToDto);
    }

    public async Task<HealthIncidentResponseDto?> GetByIdAsync(Guid id)
    {
        var incident = await _repo.GetByIdAsync(id);
        return incident == null ? null : MapToDto(incident);
    }

    public async Task<IEnumerable<HealthIncidentResponseDto>> GetByLearnerIdAsync(Guid learnerId)
    {
        var incidents = await _repo.GetByLearnerIdAsync(learnerId);
        return incidents.Select(MapToDto);
    }

    public async Task<IEnumerable<HealthIncidentResponseDto>> GetByReporterIdAsync(Guid userId)
    {
        var incidents = await _repo.GetByReporterIdAsync(userId);
        return incidents.Select(MapToDto);
    }

    public async Task<IEnumerable<HealthIncidentResponseDto>> GetRecentAsync(int days)
    {
        if (days < 1) days = 7;
        if (days > 365) days = 365;
        var incidents = await _repo.GetRecentAsync(days);
        return incidents.Select(MapToDto);
    }

    public async Task<HealthIncidentResponseDto> CreateAsync(CreateHealthIncidentDto dto, Guid reporterId)
    {
        // Business rule 1: learner must exist
        var learnerExists = await _learnerRepo.ExistsAsync(dto.LearnerId);
        if (!learnerExists)
        {
            throw new ArgumentException($"Learner with ID {dto.LearnerId} does not exist.");
        }

        // Business rule 2: incident type must be valid
        if (!AllowedTypes.Contains(dto.IncidentType, StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                $"Invalid incident type. Allowed values: {string.Join(", ", AllowedTypes)}");
        }

        // Business rule 3: incident date can't be in the future
        var incidentDate = dto.IncidentDate ?? DateTime.UtcNow;
        if (incidentDate > DateTime.UtcNow.AddMinutes(5))
        {
            throw new ArgumentException("Incident date cannot be in the future.");
        }

        var incident = new HealthIncident
        {
            LearnerId = dto.LearnerId,
            ReportedByUserId = reporterId,
            IncidentDate = incidentDate,
            IncidentType = dto.IncidentType.Trim(),
            Description = dto.Description.Trim(),
            ActionTaken = dto.ActionTaken?.Trim(),
            Outcome = dto.Outcome?.Trim(),
            NotifyGuardian = dto.NotifyGuardian,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repo.AddAsync(incident);

        // Reload with navigation properties for the response
        var full = await _repo.GetByIdAsync(created.IncidentId);
        return MapToDto(full!);
    }

    public async Task<HealthIncidentResponseDto?> UpdateAsync(Guid id, UpdateHealthIncidentDto dto)
    {
        var incident = await _repo.GetByIdAsync(id);
        if (incident == null) return null;

        if (!AllowedTypes.Contains(dto.IncidentType, StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                $"Invalid incident type. Allowed values: {string.Join(", ", AllowedTypes)}");
        }

        incident.IncidentType = dto.IncidentType.Trim();
        incident.Description = dto.Description.Trim();
        incident.ActionTaken = dto.ActionTaken?.Trim();
        incident.Outcome = dto.Outcome?.Trim();
        incident.NotifyGuardian = dto.NotifyGuardian;

        await _repo.UpdateAsync(incident);
        return MapToDto(incident);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        return await _repo.DeleteAsync(id);
    }

    public async Task<int> CountAsync()
    {
        return await _repo.CountAsync();
    }

    private static HealthIncidentResponseDto MapToDto(HealthIncident h)
    {
        return new HealthIncidentResponseDto
        {
            IncidentId = h.IncidentId,
            LearnerId = h.LearnerId,
            LearnerFullName = h.Learner != null
                ? $"{h.Learner.FirstName} {h.Learner.LastName}"
                : "(Unknown Learner)",
            ReportedByUserId = h.ReportedByUserId,
            ReportedByName = h.ReportedBy != null
                ? $"{h.ReportedBy.FirstName} {h.ReportedBy.LastName}"
                : "(Unknown User)",
            IncidentDate = h.IncidentDate,
            IncidentType = h.IncidentType,
            Description = h.Description,
            ActionTaken = h.ActionTaken,
            Outcome = h.Outcome,
            NotifyGuardian = h.NotifyGuardian,
            CreatedAt = h.CreatedAt
        };
    }
}