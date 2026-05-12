namespace AppAvisos.Domain.Entities;

public class AvisoRecibo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AvisoId { get; set; }
    public Aviso Aviso { get; set; } = null!;
    public Guid MoradorId { get; set; }
    public Morador Morador { get; set; } = null!;

    public DateTime? CienteEm { get; set; }
    public string? Resposta { get; set; }
    public DateTime? RespondidoEm { get; set; }

    public DateTime? EmailEnviadoEm { get; set; }
    public int EmailTentativas { get; set; }
    public DateTime? EmailProximaTentativaEm { get; set; }
    public DateTime? PushEnviadoEm { get; set; }
    public int PushTentativas { get; set; }
    public DateTime? PushProximaTentativaEm { get; set; }

    public DateTime? EmailAbertoEm { get; set; }
    public string? EmailAbertoIp { get; set; }
    public string? EmailAbertoUserAgent { get; set; }

    public DateTime? VisualizadoEm { get; set; }
    public string? VisualizadoIp { get; set; }
    public string? VisualizadoUserAgent { get; set; }
    public string? VisualizadoCidade { get; set; }
    public string? VisualizadoEstado { get; set; }
    public string? VisualizadoPais { get; set; }
}
