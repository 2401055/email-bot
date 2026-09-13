# نشر الخدمات الإضافية من Repo `email-bot`

كل الخدمات التالية موجودة داخل نفس المستودع:

```text
2401055/email-bot
```

لا تنشئ مستودعات GitHub جديدة. أنشئ Railway Service مستقلًا لكل مجلد، مع استخدام نفس Repo واختيار Root Directory المناسب.

| Railway Service | Root Directory | ملف البناء | المنفذ | متطلبات إضافية |
|---|---|---|---:|---|
| SearXNG | `/railway-services/searxng` | `Dockerfile` | 8080 | Volume، وValkey اختياري |
| Reactive Resume | `/railway-services/reactive-resume` | `Dockerfile` | 3000 | PostgreSQL، Variables |
| changedetection.io | `/railway-services/changedetection-io` | `Dockerfile` | 5000 | datastore Volume، Browser اختياري |
| Suwayomi | `/railway-services/suwayomi` | `Dockerfile` | 4567 | persistent storage |
| LibreTranslate | `/railway-services/libretranslate` | `Dockerfile` | 5000 | model storage وRAM كافٍ |
| ArchiveBox | `/railway-services/archivebox` | `Dockerfile` | 8000 | data Volume ونسخ احتياطية |
| Vaultwarden | `/railway-services/vaultwarden` | `Dockerfile` | 80 | data Volume وHTTPS ونسخ احتياطية |

## خطوات Railway لكل خدمة

1. افتح نفس Railway Project الذي يحتوي Email Bot.
2. اختر **New → GitHub Repo**.
3. اختر `2401055/email-bot` مرة أخرى.
4. في إعدادات الخدمة، ضع **Root Directory** للمجلد الموجود في الجدول.
5. اترك Builder على Dockerfile.
6. أضف Variables وVolumes المذكورة في README الخاص بالخدمة.
7. اعمل Deploy ثم اختبر المنفذ أو Healthcheck.

Email Bot نفسه يظل خدمة الجذر:

```text
Root Directory: /
```

بهذا تكون كل الخدمات في نفس GitHub Repo ونفس Railway Project، لكنها Containers/Services مستقلة حتى لا تتعارض المنافذ أو قواعد البيانات أو التخزين.
