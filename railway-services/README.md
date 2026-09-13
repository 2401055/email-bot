# Railway deployment bundle

Each directory is a separate Railway service root. Railway should be configured to deploy each service from its directory; the included `railway.json` explicitly selects the Dockerfile builder. Add Railway Variables, managed databases, and Volumes before deployment.

| Service | Image | Port | Persistent mount / dependency |
|---|---|---:|---|
| SearXNG | `searxng/searxng:latest` | 8080 | `/etc/searxng`, `/var/cache/searxng`; optional Valkey |
| Reactive Resume | `amruthpillai/reactive-resume:latest` | 3000 | PostgreSQL; `/app/data` if no S3 |
| changedetection.io | `dgtlmoon/changedetection.io:latest` | 5000 | `/datastore`; optional browser service |
| Suwayomi | `ghcr.io/suwayomi/suwayomi-server:stable` | 4567 | server data/downloads Volume |
| LibreTranslate | `libretranslate/libretranslate:latest` | 5000 | model/cache sizing required |
| ArchiveBox | `archivebox/archivebox:dev` | 8000 | `/data`; pin a tested release for production |
| Vaultwarden | `vaultwarden/server:latest` | 80 | `/data`; backup and HTTPS required |

These files prepare the services for Railway; they do not create Railway projects or set secrets automatically.
