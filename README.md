# Email Bot Hub — Railway

This is the safe first-stage integration for the Cloudflare Workers in the account. It serves the `ai-skills-bot-site` static UI inside the Email Bot service and exposes `/health`, `/api/bots`, and `/cf/<bot-name>/...`.

## Important architecture

The current mode is a **hybrid Railway bridge**: the hub runs on Railway, while existing Cloudflare Workers remain the bot backends until each Worker is ported and tested. This prevents an outage and avoids copying Cloudflare KV/D1/Workers AI secrets into GitHub. The original Workers are not deleted or changed.

## Railway

Deploy the repository root as one Railway service. Railway will use the Dockerfile and listen on the injected `PORT`. Generate a Railway domain and check `/health` and `/api/bots`.

## Required next migration steps

1. Add Telegram, Resend, D1/KV, and Workers AI replacements as Railway Variables/services only after a migration design is approved.
2. Port one bot at a time and test its Telegram webhook using a separate bot token or controlled cutover.
3. Move DNS/webhooks only after health checks pass.
4. Keep secrets out of GitHub; rotate any token that has ever been exposed in source.

The seven Docker service definitions from `cloudflare-railway-projects` are referenced under `railway-services/` and are not automatically started by this hub.
