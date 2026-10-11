using KSSMCS.API.DTOs;
using KSSMCS.API.Models;
using KSSMCS.API.Repositories;

namespace KSSMCS.API.Services;

public interface IVisitorService
{
    Task<IEnumerable<VisitorResponseDto>> GetAllAsync();
    Task<VisitorResponseDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<VisitorResponseDto>> GetActiveAsync();
    Task<IEnumerable<VisitorResponseDto>> GetTodayAsync();
    Task<IEnumerable<VisitorResponseDto>> GetByDateRangeAsync(DateTime from, DateTime to);
    Task<VisitorResponseDto> CheckInAsync(CheckInVisitorDto dto, Guid recordedByUserId);
    Task<VisitorResponseDto?> CheckOutAsync(Guid id);
    Task<bool> DeleteAsync(Guid id);
    Task<int> CountAsync();
}

public class VisitorService : IVisitorService
{
    private readonly IVisitorRepository _repo;

    public VisitorService(IVisitorRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<VisitorResponseDto>> GetAllAsync()
    {
        var visitors = await _repo.GetAllAsync();
        return visitors.Select(MapToDto);
    }

    public async Task<VisitorResponseDto?> GetByIdAsync(Guid id)
    {
        var visitor = await _repo.GetByIdAsync(id);
        return visitor == null ? null : MapToDto(visitor);
    }

    public async Task<IEnumerable<VisitorResponseDto>> GetActiveAsync()
    {
        var visitors = await _repo.GetActiveAsync();
        return visitors.Select(MapToDto);
    }

    public async Task<IEnumerable<VisitorResponseDto>> GetTodayAsync()
    {
        var visitors = await _repo.GetTodayAsync();
        return visitors.Select(MapToDto);
    }

    public async Task<IEnumerable<VisitorResponseDto>> GetByDateRangeAsync(DateTime from, DateTime to)
    {
        if (from > to)
            throw new ArgumentException("Start date must be before end date.");
        if ((to - from).TotalDays > 365)
            throw new ArgumentException("Date range cannot exceed 365 days.");

        var visitors = await _repo.GetByDateRangeAsync(from, to);
        return visitors.Select(MapToDto);
    }

    public async Task<VisitorResponseDto> CheckInAsync(CheckInVisitorDto dto, Guid recordedByUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
            throw new ArgumentException("Visitor name cannot be empty.");

        if (string.IsNullOrWhiteSpace(dto.Purpose))
            throw new ArgumentException("Purpose of visit is required.");

        var visitor = new Visitor
        {
            FullName = dto.FullName.Trim(),
            Phone = dto.Phone?.Trim(),
            Purpose = dto.Purpose.Trim(),
            CheckInTime = DateTime.UtcNow,
            CheckOutTime = null,
            RecordedByUserId = recordedByUserId
        };

        await _repo.AddAsync(visitor);
        var full = await _repo.GetByIdAsync(visitor.VisitorId);
        return MapToDto(full!);
    }

    public async Task<VisitorResponseDto?> CheckOutAsync(Guid id)
    {
        var visitor = await _repo.GetByIdAsync(id);
        if (visitor == null) return null;

        if (visitor.CheckOutTime.HasValue)
            throw new ArgumentException("Visitor has already been checked out.");

        visitor.CheckOutTime = DateTime.UtcNow;
        await _repo.UpdateAsync(visitor);
        return MapToDto(visitor);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        return await _repo.DeleteAsync(id);
    }

    public async Task<int> CountAsync()
    {
        return await _repo.CountAsync();
    }

    private static VisitorResponseDto MapToDto(Visitor v)
    {
        return new VisitorResponseDto
        {
            VisitorId = v.VisitorId,
            FullName = v.FullName,
            Phone = v.Phone,
            Purpose = v.Purpose,
            CheckInTime = v.CheckInTime,
            CheckOutTime = v.CheckOutTime,
            RecordedByUserId = v.RecordedByUserId,
            RecordedByName = v.RecordedBy != null
                ? $"{v.RecordedBy.FirstName} {v.RecordedBy.LastName}"
                : null
        };
    }
}