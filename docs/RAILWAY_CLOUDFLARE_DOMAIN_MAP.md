# Railway and Cloudflare domain map

This repository defines the seven application services as independent Railway services in `.railway/railway.ts`. The following subdomains are reserved for their Railway public domains and Cloudflare DNS records.

| Service | Subdomain | Railway service | Required public target |
|---|---|---|---|
| SearXNG | `searxng.joserv.dpdns.org` | `searxng` | Railway public domain for `searxng` |
| Reactive Resume | `resume.joserv.dpdns.org` | `reactive-resume` | Railway public domain for `reactive-resume` |
| changedetection.io | `watch.joserv.dpdns.org` | `changedetection-io` | Railway public domain for `changedetection-io` |
| Suwayomi | `suwayomi.joserv.dpdns.org` | `suwayomi` | Railway public domain for `suwayomi` |
| LibreTranslate | `translate.joserv.dpdns.org` | `libretranslate` | Railway public domain for `libretranslate` |
| ArchiveBox | `archivebox.joserv.dpdns.org` | `archivebox` | Railway public domain for `archivebox` |
| Vaultwarden | `vault.joserv.dpdns.org` | `vaultwarden` | Railway public domain for `vaultwarden` |

## DNS policy

Each Cloudflare DNS record should be a proxied CNAME from the subdomain above to the corresponding Railway public domain. The target must be copied from the actual Railway service after deployment; it must not be guessed or replaced with the Email Bot domain.

The existing `email-bot.joserv.dpdns.org`, PostgreSQL, and Redis resources are not deleted or renamed by this plan.

## Deployment order

1. Apply `.railway/railway.ts` in the intended Railway project.
2. Wait until each service has a successful health check and a Railway public domain.
3. Create the seven Cloudflare proxied CNAME records using those exact Railway targets.
4. Set each service's application URL variables to its final HTTPS subdomain where required, especially Reactive Resume and Vaultwarden.
5. Verify every subdomain over HTTPS and configure backups for persistent data before production use.

GitHub Actions remains a temporary test path only; it is not the target for these DNS records.
