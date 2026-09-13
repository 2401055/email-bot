# Migration plan

| Phase | Action | Exit criterion |
|---|---|---|
| 1 | Deploy this hub to Railway | `/health` returns 200 and `/api/bots` returns JSON |
| 2 | Verify AI Skills UI | `/` loads and links work |
| 3 | Keep Cloudflare Workers as fallback | Telegram/webhook traffic remains healthy |
| 4 | Port email-bot bindings | KV/D1/Workers AI/Resend equivalents tested |
| 5 | Port each bot separately | Dedicated health test and webhook test pass |
| 6 | Controlled cutover | DNS/webhook switched only after confirmation |

## Current Cloudflare sources

- email-bot: https://email-bot.2401055.workers.dev
- ai-skills-bot-site: https://ai-skills-bot-site.2401055.workers.dev

## Secrets

Do not copy Cloudflare secret values to this repository. Use Railway Variables. Rotate any credential that was previously embedded in Worker source before production migration.
