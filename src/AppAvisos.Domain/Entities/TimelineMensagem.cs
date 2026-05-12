using AppAvisos.Domain.Enums;

namespace AppAvisos.Domain.Entities;

public class TimelineMensagem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AvisoId { get; set; }
    public Aviso Aviso { get; set; } = null!;
    public Guid MoradorId { get; set; }
    public Morador Morador { get; set; } = null!;
    public AutorMensagem AutorTipo { get; set; }
    public Guid AutorId { get; set; }
    public string AutorNome { get; set; } = "";
    public string Texto { get; set; } = "";
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
