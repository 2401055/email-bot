# Integrated projects

This repository is the single integration point for the Email Bot Hub, the AI Skills site, the Cloudflare bot bridge, the Railway-ready services, and the previously prepared project inventory.

## Included in this repository

- `site/`: AI Skills site integrated into Email Bot Hub.
- `src/`: Email Bot Hub server and Cloudflare fallback bridge.
- `railway-services/`: Railway service roots for SearXNG, Reactive Resume, changedetection.io, Suwayomi, LibreTranslate, ArchiveBox, and Vaultwarden.
- `voder/`: VODER Kaggle bridge package and deployment note. VODER full inference is not marked Railway-ready because it requires GPU/model resources.
- `projects/`: all remaining projects from the Cloudflare inventory with an explicit readiness/blocker assessment.
- `cloudflare-railway-docs/`: status and Railway translation guidance.

## Deployment boundary

The repository is prepared for Railway, but Railway does not run all subdirectories as one application. Deploy the root as the Email Bot Hub, then create separate Railway services from the relevant `railway-services/<name>` roots. Do not commit secrets. Cloudflare Workers remain unchanged until each migration is independently tested.
