namespace AppAvisos.Domain.Entities;

public class PushSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MoradorId { get; set; }
    public Morador Morador { get; set; } = null!;
    public string Endpoint { get; set; } = "";
    public string P256dh { get; set; } = "";
    public string Auth { get; set; } = "";
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime? UltimoUso { get; set; }
}
