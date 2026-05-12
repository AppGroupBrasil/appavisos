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

## 4. Amazon SES

1. Console AWS → SES → Verified identities → criar identidade do domínio `appavisos.com.br`
2. Adicionar registros DKIM (3 CNAMEs) no Cloudflare
3. Adicionar SPF: `v=spf1 include:amazonses.com ~all` em registro TXT no apex
4. DMARC: `v=DMARC1; p=quarantine; rua=mailto:contato@appavisos.com.br` em `_dmarc`
5. SES está em sandbox por padrão. Abrir ticket "Request production access" descrevendo: avisos para moradores cadastrados, opt-in, sem marketing
6. Criar IAM user com policy `AmazonSESFullAccess` → Access Key/Secret no `.env`

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
