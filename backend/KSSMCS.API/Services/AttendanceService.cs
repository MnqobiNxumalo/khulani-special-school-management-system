using KSSMCS.API.DTOs;
using KSSMCS.API.Models;
using KSSMCS.API.Repositories;

namespace KSSMCS.API.Services;

public interface IAttendanceService
{
    Task<IEnumerable<AttendanceResponseDto>> GetAllAsync();
    Task<AttendanceResponseDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<AttendanceResponseDto>> GetByLearnerIdAsync(Guid learnerId);
    Task<IEnumerable<AttendanceResponseDto>> GetByDateAsync(DateTime date);
    Task<IEnumerable<AttendanceResponseDto>> GetByDateRangeAsync(DateTime from, DateTime to);
    Task<AttendanceResponseDto> MarkAsync(MarkAttendanceDto dto, Guid recordedByUserId);
    Task<AttendanceResponseDto?> UpdateAsync(Guid id, UpdateAttendanceDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<AttendanceSummaryDto> GetSummaryForDateAsync(DateTime date);
    Task<int> CountAsync();
}

public class AttendanceService : IAttendanceService
{
    private readonly IAttendanceRepository _repo;
    private readonly ILearnerRepository _learnerRepo;

    public AttendanceService(IAttendanceRepository repo, ILearnerRepository learnerRepo)
    {
        _repo = repo;
        _learnerRepo = learnerRepo;
    }

    public async Task<IEnumerable<AttendanceResponseDto>> GetAllAsync()
    {
        var records = await _repo.GetAllAsync();
        return records.Select(MapToDto);
    }

    public async Task<AttendanceResponseDto?> GetByIdAsync(Guid id)
    {
        var record = await _repo.GetByIdAsync(id);
        return record == null ? null : MapToDto(record);
    }

    public async Task<IEnumerable<AttendanceResponseDto>> GetByLearnerIdAsync(Guid learnerId)
    {
        var records = await _repo.GetByLearnerIdAsync(learnerId);
        return records.Select(MapToDto);
    }

    public async Task<IEnumerable<AttendanceResponseDto>> GetByDateAsync(DateTime date)
    {
        var records = await _repo.GetByDateAsync(date);
        return records.Select(MapToDto);
    }

    public async Task<IEnumerable<AttendanceResponseDto>> GetByDateRangeAsync(DateTime from, DateTime to)
    {
        if (from > to)
            throw new ArgumentException("Start date must be before end date.");
        if ((to - from).TotalDays > 90)
            throw new ArgumentException("Date range cannot exceed 90 days.");

        var records = await _repo.GetByDateRangeAsync(from, to);
        return records.Select(MapToDto);
    }

    public async Task<AttendanceResponseDto> MarkAsync(MarkAttendanceDto dto, Guid recordedByUserId)
    {
        // Business rule 1: learner must exist
        var learnerExists = await _learnerRepo.ExistsAsync(dto.LearnerId);
        if (!learnerExists)
            throw new ArgumentException($"Learner with ID {dto.LearnerId} does not exist.");

        // Business rule 2: attendance date can't be in the future
        var date = (dto.Date ?? DateTime.UtcNow).Date;
        if (date > DateTime.UtcNow.Date)
            throw new ArgumentException("Cannot mark attendance for a future date.");

        // Business rule 3: only one attendance record per learner per day
        var existing = await _repo.GetByLearnerAndDateAsync(dto.LearnerId, date);
        if (existing != null)
            throw new ArgumentException(
                "Attendance for this learner on this date already exists. Use update instead.");

        var attendance = new Attendance
        {
            LearnerId = dto.LearnerId,
            RecordedByUserId = recordedByUserId,
            Date = date,
            Status = dto.Status.ToLower(),
            Notes = dto.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(attendance);
        var full = await _repo.GetByIdAsync(attendance.AttendanceId);
        return MapToDto(full!);
    }

    public async Task<AttendanceResponseDto?> UpdateAsync(Guid id, UpdateAttendanceDto dto)
    {
        var attendance = await _repo.GetByIdAsync(id);
        if (attendance == null) return null;

        attendance.Status = dto.Status.ToLower();
        attendance.Notes = dto.Notes?.Trim();

        await _repo.UpdateAsync(attendance);
        return MapToDto(attendance);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        return await _repo.DeleteAsync(id);
    }

    public async Task<AttendanceSummaryDto> GetSummaryForDateAsync(DateTime date)
    {
        var records = (await _repo.GetByDateAsync(date)).ToList();
        var total = records.Count;
        var present = records.Count(a => a.Status == "present");
        var absent = records.Count(a => a.Status == "absent");
        var late = records.Count(a => a.Status == "late");

        return new AttendanceSummaryDto
        {
            Total = total,
            Present = present,
            Absent = absent,
            Late = late,
            AttendanceRate = total == 0 ? 0 : Math.Round((double)(present + late) / total * 100, 2)
        };
    }

    public async Task<int> CountAsync()
    {
        return await _repo.CountAsync();
    }

    private static AttendanceResponseDto MapToDto(Attendance a)
    {
        return new AttendanceResponseDto
        {
            AttendanceId = a.AttendanceId,
            LearnerId = a.LearnerId,
            LearnerFullName = a.Learner != null
                ? $"{a.Learner.FirstName} {a.Learner.LastName}"
                : "(Unknown Learner)",
            RecordedByUserId = a.RecordedByUserId,
            RecordedByName = a.RecordedBy != null
                ? $"{a.RecordedBy.FirstName} {a.RecordedBy.LastName}"
                : "(Unknown User)",
            Date = a.Date,
            Status = a.Status,
            Notes = a.Notes,
            CreatedAt = a.CreatedAt
        };
    }
}