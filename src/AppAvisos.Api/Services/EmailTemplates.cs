using AppAvisos.Domain.Entities;
using AppAvisos.Domain.Enums;

namespace AppAvisos.Api.Services;

public static class EmailTemplates
{
    public static (string assunto, string html) Renderizar(Aviso aviso, Condominio cond, string appUrl, string cienteUrl, string respostaUrl, string ativarPushUrl, string descadastroUrl, Guid reciboId)
    {
        var cor = string.IsNullOrEmpty(cond.CorPrimaria) ? "#0F172A" : cond.CorPrimaria;
        var faixaUrgente = aviso.Urgente
            ? $"<div style='background:#DC2626;color:#fff;padding:12px 24px;text-align:center;font-weight:700;letter-spacing:.5px;'>AVISO URGENTE</div>"
            : "";

        var blocoEvento = "";

        var blocoManut = aviso.Template == TemplateAviso.Manutencao
            ? BlocoManutencao(aviso)
            : "";

        var anexo = !string.IsNullOrEmpty(aviso.AnexoUrl)
            ? $"<a href='{appUrl}{aviso.AnexoUrl}' style='display:inline-block;margin-top:16px;padding:10px 16px;background:#F1F5F9;color:#0F172A;border-radius:8px;text-decoration:none;font-weight:500;'>📎 Baixar {System.Net.WebUtility.HtmlEncode(aviso.AnexoNome)}</a>"
            : "";

        var logo = !string.IsNullOrEmpty(cond.LogoUrl)
            ? $"<img src='{appUrl}{cond.LogoUrl}' alt='{System.Net.WebUtility.HtmlEncode(cond.Nome)}' style='max-height:60px;margin-bottom:8px'/>"
            : "";

        var texto = System.Net.WebUtility.HtmlEncode(aviso.Texto).Replace("\n", "<br/>");

        var assunto = aviso.Urgente ? $"[URGENTE] {aviso.Titulo}" : aviso.Titulo;

        var html = $@"<!DOCTYPE html><html><body style='margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,Arial,sans-serif;color:#0F172A;'>
<table width='100%' cellpadding='0' cellspacing='0' style='max-width:600px;margin:0 auto;background:#fff;'>
<tr><td>{faixaUrgente}</td></tr>
<tr><td style='padding:24px;border-bottom:3px solid {cor};'>
{logo}
<div style='font-size:18px;font-weight:600;'>{System.Net.WebUtility.HtmlEncode(cond.Nome)}</div>
{(string.IsNullOrEmpty(cond.DescricaoCurta) ? "" : $"<div style='color:#64748B;font-size:13px;margin-top:4px;'>{System.Net.WebUtility.HtmlEncode(cond.DescricaoCurta)}</div>")}
</td></tr>
<tr><td style='padding:32px 24px;'>
<h1 style='margin:0 0 8px;font-size:24px;line-height:1.3;'>{System.Net.WebUtility.HtmlEncode(aviso.Titulo)}</h1>
<div style='color:#64748B;font-size:13px;margin-bottom:24px;'>{aviso.PublicadoEm:dd/MM/yyyy HH:mm}</div>
{blocoEvento}{blocoManut}
<div style='font-size:16px;line-height:1.6;'>{texto}</div>
{anexo}
<table cellpadding='0' cellspacing='0' style='margin-top:32px;'>
<tr>
<td style='padding-right:8px;'><a href='{cienteUrl}' style='display:inline-block;padding:12px 24px;background:{cor};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;'>✓ Marcar como ciente</a></td>
<td><a href='{respostaUrl}' style='display:inline-block;padding:12px 24px;background:#F1F5F9;color:#0F172A;border-radius:8px;text-decoration:none;font-weight:600;'>Responder</a></td>
</tr></table>
</td></tr>
<tr><td style='padding:24px;background:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;'>
<a href='{ativarPushUrl}' style='display:inline-block;padding:12px 24px;background:#0F172A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;'>🔔 Ativar notificações no celular (sem instalar app)</a>
<div style='margin-top:10px;color:#64748B;font-size:12px;'>1 clique no navegador. Funciona como sites de notícias.</div>
<div style='margin-top:16px;color:#94A3B8;font-size:12px;'>
{System.Net.WebUtility.HtmlEncode(cond.Nome)}{(string.IsNullOrEmpty(cond.TelefoneContato) ? "" : $" • {cond.TelefoneContato}")}{(string.IsNullOrEmpty(cond.EmailContato) ? "" : $" • {cond.EmailContato}")}
<br/><a href='{descadastroUrl}' style='color:#94A3B8;'>Descadastrar e-mail</a>
<br/><span style='color:#CBD5E1;font-size:11px;'>Este aviso registra leitura, dispositivo e localização aproximada para fins de comprovação.</span>
<img src='{appUrl}/api/email/aberto/{reciboId}.gif' width='1' height='1' style='display:block' alt=''/>
</div>
</td></tr></table></body></html>";
        return (assunto, html);
    }

    static string BlocoEvento(Aviso a) => $@"<table cellpadding='0' cellspacing='0' style='margin-bottom:24px;width:100%;background:#F8FAFC;border-radius:8px;'>
<tr><td style='padding:16px;'>
{(a.PublicarEm.HasValue ? $"<div style='font-size:13px;color:#64748B;'>QUANDO</div><div style='font-weight:600;font-size:16px;margin-bottom:8px;'>{a.PublicarEm:dd/MM/yyyy HH:mm}</div>" : "")}
</td></tr></table>";

    static string BlocoManutencao(Aviso a) => $@"<table cellpadding='0' cellspacing='0' style='margin-bottom:24px;width:100%;background:#FEF3C7;border-radius:8px;'>
<tr><td style='padding:16px;'><div style='font-weight:600;'>🔧 Manutenção programada</div></td></tr></table>";
}
