<p align="center">
  <img src="frontend/public/favicon.png" width="80" alt="Orbit logo" />
</p>

# Orbit

A minimalist self-hosted timeline for capturing and revisiting life's moments.

## Deployment

**1. Create data directories**

```bash
mkdir -p data/postgres data/uploads
```

**2. Download compose file and config**

```bash
curl -O https://raw.githubusercontent.com/ihainan/Orbit/main/docker/prod/compose.yml
curl -o .env https://raw.githubusercontent.com/ihainan/Orbit/main/docker/prod/.env.example
```

**3. Edit `.env`**

Fill in `DB_PASSWORD`, `DEFAULT_USERNAME`, `DEFAULT_EMAIL`, and `AMAP_WEB_SERVICE_KEY`.

**4. Start**

```bash
docker compose up -d
```

The app will be available on port `80` (override with `HTTP_PORT` in `.env`).
