using KSSMCS.API.DTOs;
using KSSMCS.API.Models;
using KSSMCS.API.Repositories;

namespace KSSMCS.API.Services;

public interface ILearnerService
{
    Task<IEnumerable<LearnerResponseDto>> GetAllAsync();
    Task<LearnerResponseDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<LearnerResponseDto>> SearchAsync(string query);
    Task<IEnumerable<LearnerResponseDto>> GetForTeacherAsync(Guid teacherId);
    Task<LearnerResponseDto> CreateAsync(CreateLearnerDto dto);
    Task<LearnerResponseDto?> UpdateAsync(Guid id, UpdateLearnerDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<int> CountAsync();
}

public class LearnerService : ILearnerService
{
    private readonly ILearnerRepository _repo;

    public LearnerService(ILearnerRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<LearnerResponseDto>> GetAllAsync()
    {
        var learners = await _repo.GetAllAsync();
        return learners.Select(MapToDto);
    }

    public async Task<LearnerResponseDto?> GetByIdAsync(Guid id)
    {
        var learner = await _repo.GetByIdAsync(id);
        return learner == null ? null : MapToDto(learner);
    }

    public async Task<IEnumerable<LearnerResponseDto>> SearchAsync(string query)
    {
        var learners = await _repo.SearchAsync(query);
        return learners.Select(MapToDto);
    }

    public async Task<IEnumerable<LearnerResponseDto>> GetForTeacherAsync(Guid teacherId)
    {
        var learners = await _repo.GetByTeacherIdAsync(teacherId);
        return learners.Select(MapToDto);
    }

    public async Task<LearnerResponseDto> CreateAsync(CreateLearnerDto dto)
    {
        if (dto.DateOfBirth > DateTime.UtcNow)
            throw new ArgumentException("Date of birth cannot be in the future.");

        var age = DateTime.UtcNow.Year - dto.DateOfBirth.Year;
        if (age < 0 || age > 25)
            throw new ArgumentException("Age must be between 0 and 25.");

        var learner = new Learner
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            DateOfBirth = dto.DateOfBirth,
            Gender = dto.Gender?.Trim(),
            SupportNeeds = dto.SupportNeeds?.Trim(),
            Address = dto.Address?.Trim(),
            MedicalConditions = dto.MedicalConditions?.Trim(),
            Allergies = dto.Allergies?.Trim(),
            GuardianName = dto.GuardianName?.Trim(),
            GuardianPhone = dto.GuardianPhone?.Trim(),
            GuardianEmail = dto.GuardianEmail?.Trim().ToLower(),
            AssignedTeacherId = dto.AssignedTeacherId,
            EnrollmentDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _repo.AddAsync(learner);
        // Reload to get navigation props
        var full = await _repo.GetByIdAsync(created.LearnerId);
        return MapToDto(full!);
    }

    public async Task<LearnerResponseDto?> UpdateAsync(Guid id, UpdateLearnerDto dto)
    {
        var learner = await _repo.GetByIdAsync(id);
        if (learner == null) return null;

        if (dto.DateOfBirth > DateTime.UtcNow)
            throw new ArgumentException("Date of birth cannot be in the future.");

        learner.FirstName = dto.FirstName.Trim();
        learner.LastName = dto.LastName.Trim();
        learner.DateOfBirth = dto.DateOfBirth;
        learner.Gender = dto.Gender?.Trim();
        learner.SupportNeeds = dto.SupportNeeds?.Trim();
        learner.Address = dto.Address?.Trim();
        learner.MedicalConditions = dto.MedicalConditions?.Trim();
        learner.Allergies = dto.Allergies?.Trim();
        learner.GuardianName = dto.GuardianName?.Trim();
        learner.GuardianPhone = dto.GuardianPhone?.Trim();
        learner.GuardianEmail = dto.GuardianEmail?.Trim().ToLower();
        learner.AssignedTeacherId = dto.AssignedTeacherId;  // ← THE FIX
        learner.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(learner);
        // Reload to get navigation props
        var full = await _repo.GetByIdAsync(id);
        return MapToDto(full!);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        return await _repo.DeleteAsync(id);
    }

    public async Task<int> CountAsync()
    {
        return await _repo.CountAsync();
    }

    private static LearnerResponseDto MapToDto(Learner l)
    {
        return new LearnerResponseDto
        {
            LearnerId = l.LearnerId,
            FirstName = l.FirstName,
            LastName = l.LastName,
            DateOfBirth = l.DateOfBirth,
            Gender = l.Gender,
            SupportNeeds = l.SupportNeeds,
            Address = l.Address,
            EnrollmentDate = l.EnrollmentDate,
            MedicalConditions = l.MedicalConditions,
            Allergies = l.Allergies,
            GuardianName = l.GuardianName,
            GuardianPhone = l.GuardianPhone,
            GuardianEmail = l.GuardianEmail,
            HealthIncidentCount = l.HealthIncidents?.Count ?? 0,
            CreatedAt = l.CreatedAt,
            AssignedTeacherId = l.AssignedTeacherId,
            AssignedTeacherName = l.AssignedTeacher != null
                ? $"{l.AssignedTeacher.FirstName} {l.AssignedTeacher.LastName}"
                : null
        };
    }
}