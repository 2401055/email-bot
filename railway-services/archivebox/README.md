# ArchiveBox

Use the official `archivebox/archivebox:dev` image as a verified starting point; replace `dev` with a tested version tag for production. The documented server listens on port 8000 and persistent collection data must be mounted at `/data`. Initialize the collection and admin account before public exposure, then configure `BASE_URL` and HTTPS at the Railway domain/proxy layer.

Official reference: https://github.com/ArchiveBox/ArchiveBox/wiki/Docker
