using Microsoft.EntityFrameworkCore;
using KSSMCS.API.Models;

namespace KSSMCS.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Learner> Learners => Set<Learner>();
    public DbSet<HealthIncident> HealthIncidents => Set<HealthIncident>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Visitor> Visitors => Set<Visitor>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Unique email per user
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // HealthIncident: Learner relationship
        modelBuilder.Entity<HealthIncident>()
            .HasOne(h => h.Learner)
            .WithMany(l => l.HealthIncidents)
            .HasForeignKey(h => h.LearnerId)
            .OnDelete(DeleteBehavior.Cascade);

        // HealthIncident: ReportedBy relationship
        modelBuilder.Entity<HealthIncident>()
            .HasOne(h => h.ReportedBy)
            .WithMany(u => u.ReportedIncidents)
            .HasForeignKey(h => h.ReportedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Attendance: Learner relationship
        modelBuilder.Entity<Attendance>()
            .HasOne(a => a.Learner)
            .WithMany(l => l.Attendances)
            .HasForeignKey(a => a.LearnerId)
            .OnDelete(DeleteBehavior.Cascade);

        // Attendance: RecordedBy relationship
        modelBuilder.Entity<Attendance>()
            .HasOne(a => a.RecordedBy)
            .WithMany(u => u.RecordedAttendances)
            .HasForeignKey(a => a.RecordedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Message: Sender
        modelBuilder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany(u => u.SentMessages)
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Message: Receiver
        modelBuilder.Entity<Message>()
            .HasOne(m => m.Receiver)
            .WithMany(u => u.ReceivedMessages)
            .HasForeignKey(m => m.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

            // Parent-Learner link
modelBuilder.Entity<User>()
    .HasOne(u => u.LinkedLearner)
    .WithMany()
    .HasForeignKey(u => u.LinkedLearnerId)
    .OnDelete(DeleteBehavior.SetNull);   
    }
}