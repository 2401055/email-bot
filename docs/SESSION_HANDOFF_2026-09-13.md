# Email Bot / Railway — Session Handoff

**Date:** 2026-09-13  
**Repository:** `https://github.com/2401055/email-bot`  
**Default branch:** `main`  
**Visibility:** Public

## Completed work

The repository was prepared as the central Email Bot Hub and as a Railway monorepo. The root service contains the Telegram webhook server, login flow, email menu, EGX stock lookup, Railway service catalog, project details, bot catalog, health endpoint, and Cloudflare fallback proxy.

VODER was removed completely from the repository and Email Bot. Its Telegram menu entries, queue/result endpoints, files, documentation references, and `VODER_BRIDGE_TOKEN` references were removed.

The unavailable AI-dependent features were also removed from Email Bot: Social Media Skills, UI UX Pro Max, `aiGenerate`, and OpenAI environment-variable references. This means the current bot does not require an OpenAI API balance.

The following Railway service definitions remain in the repository:

- `railway-services/searxng`
- `railway-services/reactive-resume`
- `railway-services/changedetection-io`
- `railway-services/suwayomi`
- `railway-services/libretranslate`
- `railway-services/archivebox`
- `railway-services/vaultwarden`

Railway Infrastructure as Code was added at `.railway/railway.ts`. It declares the root Email Bot service, the seven services above, a PostgreSQL resource for Reactive Resume, a Redis/Valkey resource, and persistent volumes for the workloads. It also declares the relevant database/cache variable references.

A GitHub Actions workflow was added at `.github/workflows/railway-config.yml`. It follows Railway’s plan/apply workflow: plan on pull requests and apply after a merged pull request. The workflow requires a GitHub Actions secret named `RAILWAY_TOKEN` containing a Railway Project Token. A manual dispatch was tested once and failed because Railway’s official action requires a plan artifact; the standard PR workflow was then added.

Pull Request #1 was created and merged:

- PR: `https://github.com/2401055/email-bot/pull/1`
- Railway plan run succeeded: `https://github.com/2401055/email-bot/actions/runs/34759655337`
- Post-merge action run succeeded: `https://github.com/2401055/email-bot/actions/runs/34759760688`

The current latest code commit after removing the unavailable AI features is:

```text
134cc8d Remove unavailable AI features from Email Bot
```

## Current Telegram/Railway configuration

The custom domain used for the Email Bot webhook is:

```text
https://email-bot.joserv.dpdns.org/telegram/webhook
```

The domain health endpoint returned HTTP 200 during setup, and Telegram accepted the webhook registration with `Webhook was set`.

Required current Railway variables for the basic bot are:

```text
TELEGRAM_BOT_TOKEN=<new token from BotFather>
BOT_LOGIN_PASSWORD=<password chosen by the owner>
```

No OpenAI variables are needed after the AI feature removal. `TELEGRAM_WEBHOOK_SECRET`, Resend variables, and other optional integrations are not required for the basic bot.

## Security action required before resuming

A Telegram bot token was pasted into the chat during setup. It must be revoked in `@BotFather`, a new token must be generated, and the new token must replace `TELEGRAM_BOT_TOKEN` in Railway. The webhook should then be registered again using the new token. The old token must not be reused.

Never commit or store the following in GitHub files:

- Telegram bot tokens
- Railway Project Tokens
- SSH private keys
- Resend API keys
- Any provider/API secret

## Next time

1. Revoke the exposed Telegram token and generate a new one.
2. Update `TELEGRAM_BOT_TOKEN` in Railway.
3. Confirm the custom domain still returns `/health` with HTTP 200.
4. Register the webhook again with the new token.
5. Check that the Railway project contains the root service, seven app services, PostgreSQL, Redis/Valkey, and persistent volumes.
6. Add `BOT_LOGIN_PASSWORD` if it is not already set.
7. Test `/start`, `/help`, `/projects`, `/bots`, and `/health` in Telegram.

## Important limitation

The GitHub repository and automation files are prepared, but Railway resource creation and service health still depend on the linked Railway project, the Railway Project Token used by GitHub Actions, plan limits, variables, volumes, and the external provider status. The catalog inside the bot describes the services; it does not itself replace Railway deployment or service configuration.
