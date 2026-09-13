# Email Bot Hub — Railway

هذا المستودع هو نقطة الدمج المركزية: واجهة AI Skills، كتالوج الخدمات المجهزة لـRailway، وقائمة Workers الموجودة على Cloudflare، مع بوابة موحدة وحالة تشغيل قابلة للفحص.

## واجهات الدمج

- `/`: واجهة Email Bot Hub وAI Skills وكتالوج الخدمات.
- `/health`: فحص الخدمة.
- `/api/bots`: قائمة البوتات المرتبطة.
- `/api/railway-services`: الخدمات السبعة المجهزة لـRailway ومتطلباتها.
- `/api/projects`: الخدمات الجاهزة وبقية المشاريع وحالتها.
- `/api/bot-menu`: قائمة موحدة قابلة للاستخدام في واجهة أو Telegram Bot.
- `/cf/<bot-name>/...`: بوابة اختيارية إلى Worker موجود على Cloudflare.

## طريقة التشغيل على Railway

انشر جذر المستودع كخدمة Email Bot Hub. سيستخدم Railway `Dockerfile` و`railway.json` ويستمع إلى متغير `PORT` الذي توفره Railway. بعد إنشاء Domain اختبر `/health` و`/api/railway-services` و`/api/bot-menu`.

## الخدمات المدمجة

تعريفات الخدمات موجودة في `railway-services/`:

1. SearXNG
2. Reactive Resume
3. changedetection.io
4. Suwayomi
5. LibreTranslate
6. ArchiveBox
7. Vaultwarden

هي مدمجة في المستودع والكتالوج، لكن كل خدمة تحتاج Railway Service مستقلًا وVolumes/Database/Variables الخاصة بها. لا يمكن تشغيلها كلها داخل Container Email Bot واحد؛ تشغيلها كخدمات مستقلة داخل نفس Railway Project هو التصميم الصحيح.

## Cloudflare وTelegram

الوضع الحالي Hybrid آمن: Workers الأصلية تظل Backend احتياطيًا حتى يتم نقل كل بوت واختباره على حدة. لا يتم نسخ Telegram tokens أو Resend keys أو KV/D1/Workers AI secrets إلى GitHub. يتم وضعها في Railway Variables أو الخدمات البديلة فقط بعد اختبار كل عملية نقل.


## Full original bot + new Railway catalog


Set these variables only in Railway Variables (never commit their values):

```text
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
BOT_LOGIN_PASSWORD=...
RESEND_API_KEY=...
EMAIL_FROM=noreply@example.com
EMAIL_DOMAIN=example.com
```


## Automatic multi-service Railway setup

The repository now includes `.railway/railway.ts`, Railway Infrastructure as Code for the whole project. It declares the Email Bot service, all seven application services, a PostgreSQL service for Reactive Resume, a Redis/Valkey service, and persistent volumes for each workload. It also connects Reactive Resume to PostgreSQL and the services that use cache to Redis/Valkey.

Railway evaluates this file through the Railway CLI. After creating or linking the Railway project to this repository, run:

```bash
npm install
railway login
railway link
railway config plan
railway config apply
```

`config plan` previews the resources; `config apply` creates the services and resources after confirmation. A GitHub Repo selection alone deploys one service and does not create the complete dependency graph; the IaC apply is the supported one-project automation step. Secrets such as Telegram, Resend, and AI keys remain Railway Variables and are intentionally not stored in GitHub.


## تشغيل الخدمات من GitHub بدون Railway CLI

يمكن تشغيل IaC من GitHub Actions بعد إضافة Secret واحد إلى المستودع:

```text
Settings → Secrets and variables → Actions → New repository secret
Name: RAILWAY_TOKEN
Value: Railway Project Token
```

بعد ذلك:

1. أنشئ Railway Project واختر Repo `2401055/email-bot` مرة واحدة.
2. أضف Secret `RAILWAY_TOKEN` في GitHub.
3. افتح تبويب **Actions** في GitHub.
4. اختر **Railway infrastructure**.
5. اضغط **Run workflow**.

الـWorkflow سيشغّل Railway IaC وينشئ الخدمات، PostgreSQL، Redis/Valkey، والـVolumes من الملف `.railway/railway.ts`. لا تحتاج إلى تثبيت Railway CLI أو تنفيذ أوامر في الطرفية. لا تضع Telegram أو Resend secrets في GitHub؛ أضفها داخل Railway Variables عند الحاجة.
