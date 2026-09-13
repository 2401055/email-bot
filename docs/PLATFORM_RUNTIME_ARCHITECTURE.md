# Platform Runtime Architecture

## Telegram as the user interface

Telegram is the final user-facing interface. The Railway Email Bot receives Telegram webhooks, authenticates users, exposes the email workflow, and provides project commands such as `/projects`, `/project <name>`, `/bots`, and `/health`.

## GitHub as the source of truth

GitHub stores the bot source, Dockerfiles, Railway IaC, service documentation, and deployment workflows. No provider tokens, SSH private keys, or API secrets belong in the repository.

## Railway as the bot control plane

Railway hosts the Email Bot Hub, its webhook endpoint, PostgreSQL, and Redis/Valkey. Railway IaC describes the seven optional application services, but the current free-plan resource limit prevents provisioning all of them in this project. The bot therefore treats their URLs as runtime configuration and reports each service as unbound or unavailable until a real URL is supplied.

## Cloudflare as edge and fallback

Cloudflare remains the DNS/edge and fallback layer for existing Workers. The `/cf/<bot-name>/...` gateway can proxy to configured Cloudflare Worker URLs. Cloudflare should not be used as a container runtime for the seven stateful applications.

## xShellz as an administration and build box

The current xShellz Agent Shell is a 512 MiB gVisor environment without Docker. It is suitable for lightweight diagnostics, repository maintenance, and one-off administrative commands, but not for running SearXNG, Reactive Resume, changedetection.io, Suwayomi, LibreTranslate, ArchiveBox, and Vaultwarden together. A larger Docker-capable VPS is required for that workload.

## Runtime URL configuration

When services are deployed on a capable host, set the following Railway variables on `email-bot`:

```text
SEARXNG_URL=https://search.example.com
REACTIVE_RESUME_URL=https://resume.example.com
CHANGEDETECTION_URL=https://watch.example.com
SUWAYOMI_URL=https://manga.example.com
LIBRETRANSLATE_URL=https://translate.example.com
ARCHIVEBOX_URL=https://archive.example.com
VAULTWARDEN_URL=https://vault.example.com
```

The bot checks these URLs at request time and displays the URL plus the latest HTTP result in `/projects` and `/project <name>`.
