# SearXNG

Deploy as a Railway web service using the official `searxng/searxng` image. The documented container listens on port 8080. Mount **two** Volumes: `/etc/searxng` for configuration and `/var/cache/searxng` for persistent cache. The recommended upstream Compose setup also includes Valkey for limiter/bot-protection features; if enabled, run Valkey as a separate Railway managed/service dependency and configure the internal Railway hostname. Set a strong secret and review rate limits before making the instance public.

Official reference: https://docs.searxng.org/admin/installation-docker.html
