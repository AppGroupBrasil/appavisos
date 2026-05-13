# Deploy AppAvisos — Hetzner

## 1. DNS no Cloudflare

Adicionar registros A apontando para `46.225.191.114` (proxy laranja ativo):
- `appavisos.com.br`
- `www.appavisos.com.br`
- `app.appavisos.com.br`
- `api.appavisos.com.br`

Após transferir o domínio do Registro.br para o Cloudflare.

## 2. Gerar chaves VAPID (uma vez)

No servidor:
```bash
docker run --rm node:20-alpine sh -c "npx -y web-push generate-vapid-keys --json"
```
Copia `publicKey` e `privateKey` para o `.env`.

## 3. Subir no servidor

```bash
ssh -i ~/.ssh/hetzner_key root@46.225.191.114
mkdir -p /opt/appavisos /root/backups-appavisos
cd /opt/appavisos
# copiar projeto via scp ou git clone
cp .env.example .env
nano .env   # preencher tudo
docker compose up -d --build
docker compose logs -f appavisos-api
```

Migrations rodam automaticamente no startup; usuário Master é seedado via env.

## 4. Elastic Email (envio de e-mail)

1. Conta: eddnportugal@gmail.com em elasticemail.com
2. No painel: **Settings → SMTP → Create SMTP Credentials** para gerar usuário/senha SMTP
3. No `.env` preencher:
   - `EMAIL_FROM=noreply@appavisos.com.br`
   - `EMAIL_SMTP_USER=eddnportugal@gmail.com`
   - `EMAIL_SMTP_PASS=<api-key>` (ver CREDENCIAIS.md)
4. Verificar o domínio `appavisos.com.br` no painel → adicionar registros DKIM e SPF no Cloudflare:
   - SPF: `v=spf1 include:_spf.elasticemail.com ~all`
   - DKIM: gerado pelo Elastic Email na tela de verificação de domínio

## 5. Testar

- `https://app.appavisos.com.br` → tela de login
- Cadastrar condomínio → entra no painel
- Login Master com creds do `.env` → ver lista de condomínios

## Backups

`appavisos-db-backup` faz `pg_dump | gzip` diário em `/root/backups-appavisos/`, retenção 7 dias. Para restaurar:
```bash
gunzip -c /root/backups-appavisos/appavisos-YYYYMMDD-HHMMSS.sql.gz | \
  docker exec -i appavisos-db psql -U appavisos -d appavisos
```
