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
OPENAI_API_KEY=...
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
RESEND_API_KEY=...
EMAIL_FROM=noreply@example.com
EMAIL_DOMAIN=example.com
```

