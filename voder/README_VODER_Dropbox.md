# VODER on Kaggle + Cloudflare + Telegram

هذه الحزمة مخصصة لتشغيل VODER في جلسة Kaggle واحدة باستخدام GPU، مع إبقاء الأسرار خارج Dropbox وGitHub.

## ما تنفذه جلسة Kaggle

1. تثبيت FFmpeg وGit واعتماديات VODER.
2. تنزيل مشروع VODER الرسمي من GitHub داخل `/kaggle/working/VODER`.
3. قراءة الأسرار من Kaggle Secrets.
4. اختبار الاتصال بنقاط جسر Cloudflare.
5. تشغيل عامل الجسر في الخلفية.
6. سحب الملفات الموجودة في طابور Telegram من Cloudflare.
7. تنزيل الملف ثم تشغيل VODER عليه.
8. إرسال النتيجة إلى Telegram عبر Cloudflare.

## قبل التشغيل

أنشئ Notebook جديدًا في Kaggle، فعّل **Internet** و **GPU**، ثم أضف الأسرار التالية من Add-ons → Secrets:

- `VODER_BRIDGE_TOKEN`: رمز جديد طويل وعشوائي. لا تستخدم أي رمز ظهر سابقًا.
- `DROPBOX_ACCESS_TOKEN`: مطلوب فقط إذا أردت حفظ نسخ النتائج في Dropbox. التشغيل الأساسي لا يحتاجه.

فعّل خيار إتاحة كل Secret للـNotebook.

## التشغيل

انسخ محتوى `KAGGLE_SETUP.py` إلى خلية Notebook وشغّله. أو ارفع الملفين `KAGGLE_SETUP.py` و`voder_colab_bridge.py` إلى Notebook ثم شغّل:

```python
%run /kaggle/working/KAGGLE_SETUP.py
```

سيتم تشغيل الجسر في جلسة Kaggle. اترك الخلية قيد التشغيل ولا تغلق الـNotebook.

## الاختبار

1. افتح بوت Telegram.
2. سجّل الدخول بالطريقة المعتادة.
3. أرسل ملفًا صوتيًا أو فيديو.
4. يجب أن تظهر رسالة استلام الملف.
5. راقب مخرجات خلية Kaggle حتى يظهر `Processed item`.
6. ستصل النتيجة إلى نفس محادثة Telegram.

## ملاحظات مهمة

- لا تضع أي Token في هذا المجلد أو في GitHub.
- لا تستخدم `DROPBOX_ACCESS_TOKEN` داخل Notebook إلا عند الحاجة إلى نسخ النتائج إلى Dropbox.
- جلسة Kaggle ليست دائمة؛ يجب إعادة تشغيلها عند انتهاء الجلسة.
- التنفيذ الافتراضي يستخدم VODER في وضع STT ويحاول إنتاج تفريغ نصي للملف الصوتي/الفيديو.
- لتغيير الأمر، عرّف متغير البيئة `VODER_COMMAND_TEMPLATE` قبل التشغيل. استخدم `{input}` لمسار الإدخال و`{output_dir}` لمسار النتائج.

## إيقاف الجسر

نفّذ في خلية جديدة:

```python
!pkill -f voder_colab_bridge.py || true
```

## استكشاف الأعطال

- `401 Unauthorized`: قيمة `VODER_BRIDGE_TOKEN` في Kaggle لا تطابق الرمز الموجود في Cloudflare.
- `No item`: لا يوجد ملف جديد في طابور Telegram.
- فشل التثبيت: تأكد من تشغيل Internet واستخدام GPU، ثم أعد تشغيل الخلية.
- انتهت الجلسة: شغّل Notebook مرة أخرى؛ لا تحفظ الأسرار داخل الملفات.

## المصدر

- VODER: https://github.com/HAKORADev/VODER
- دليل الأوامر: https://github.com/HAKORADev/VODER/blob/main/docs/COMMAND_CATALOG.md
