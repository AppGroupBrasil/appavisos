namespace AppAvisos.Domain.Entities;

public class ConfiguracaoSistema
{
    public string Chave { get; set; } = "";
    public string Valor { get; set; } = "";
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
}
