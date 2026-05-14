# خطة هندسة Dashboard / CMS / تجربة الإدارة (Admin Experience)

> **مرجع وحيد** لمرحلة Dashboard / CMS / Admin Experience التالية. اتبع هذا الملف في جلسات Cursor لاحقًا لتجنب over-engineering وعدم نسيان القرارات.

---

## السياق (Context)

لم نعد نركز على تلميع صفحة الهبوط (landing page). صفحة الهبوط تُعتبر **جاهزة للإنتاج (production-ready)**.

المرحلة التالية: بناء **Dashboard / CMS / Admin Experience** احترافي لموقع متجر أزياء فاخرة صغير.

عامل النظام كـ **CMS صغير + إدارة e-commerce** (إدارة كتالوج وطلبات واتساب)، وليس مجرد نماذج admin بسيطة.

---

## قرار منتج أساسي (Core Product Decision)

**لا تضيف تسجيل/دخول للعملاء (customer login/register) الآن.**

**السبب:** نموذج العمل الحالي يعتمد على الطلب عبر **WhatsApp**. إضافة حسابات عملاء تزيد التعقيد دون قيمة واضحة حاليًا.

**نموذج المستخدم الحالي:**

- المالك/الأدمن يدخل إلى الـ Dashboard.
- العميل يتصفح كـ **guest**.
- الطلب يتم عبر **WhatsApp**.
- نظام حسابات العملاء يُضاف لاحقًا **فقط إذا لزم** (مثلاً: مفضلات، تتبع طلبات، طلبات مخصصة محفوظة، سجل مشتريات).

---

## الأساس الآن مقابل المستقبل لاحقًا

### الأساس الآن (Core Now)

- **Products CMS** احترافي.
- **Product variants:** size / color / quantity / availability.
- صور المنتج مع **primary image** ومعرض (gallery).
- **WhatsApp order message templates**.
- **Customer service settings**.
- **Testimonials CMS**.
- قسم **طلب تصميم خاص** كاستفسار عبر WhatsApp (ليس محرك تصميم كامل).
- **Brand / Designer CMS**.
- واجهة **Arabic-first** مع دعم **English** مخطط له لاحقًا.
- **validation** قوي و**data modeling** قابل للصيانة.
- وصول **admin-only** للـ Dashboard.

### المستقبل لاحقًا (Future Later)

- تسجيل/دخول العملاء، **customer profiles**، **Favorites**، **Order tracking**.
- **Online checkout / payment**.
- خصم تلقائي للمخزون من المبيعات المؤكدة (**automated inventory deduction**).
- رفع ملفات تصميم من العميل (**customer-uploaded design files**).
- **Advanced CRM**.
- أدوار متعددة للأدمن تتجاوز المالك/الأدمن إذا لزم الأمر.

---

## وحدات الـ Dashboard (Dashboard Modules)

### 1. Products CMS

لكل منتج يدعم:

- عنوان عربي، عنوان إنجليزي.
- وصف عربي، وصف إنجليزي.
- **price**
- **currency**، الافتراضي **LYD**
- **category**
- **brand/designer** اختياري
- **product status:**
  - `available`
  - `out of stock`
  - `special order only`
  - `hidden` / `draft`
- **images**
- **primary image**
- **sort order**
- **publish / unpublish**
- **soft delete**

**مهم:** الأحجام (**sizes**) لا يجب أن تبقى **array بسيط** على المدى الطويل. التوفر يحتاج **variant model** صحيح.

---

### 2. Product Variants

**النموذج المقترح:**

`ProductVariant`:

- `id`
- `productId`
- `size`
- `colorId` (اختياري)
- `quantity`
- `isAvailable`
- `allowSpecialOrder`
- `sortOrder`

**قواعد:**

- إذا `quantity > 0` و `isAvailable === true` → يُعرض كمتاح.
- إذا `quantity === 0` أو `isAvailable === false` → غير متاح / **struck-through** في الواجهة.
- الأحجام غير المتاحة تبقى مرئية فقط إذا رغب العمل بذلك (مثلاً لطلبات خاصة).
- إذا `allowSpecialOrder === true` → العميل يمكنه طلب هذا الحجم غير المتاح عبر **WhatsApp**.

**سلوك الواجهة (Frontend):**

- حجم متاح: **pill** عادي قابل للاختيار.
- حجم غير متاح: **pill** مشطوب (**struck-through**).
- hover/click على غير متاح: عرض «غير متوفر حاليًا».
- إذا مسموح بالطلب الخاص: عرض «طلب خاص عبر واتساب».

**مهم:** لأن الطلبات عبر WhatsApp، **لن ينقص المخزون تلقائيًا** إلا إذا حدّثه الأدمن يدويًا أو أُضيف لاحقًا **order management module**.

---

### 3. Product Images / Media Management

لكل منتج:

- صورة واحدة: بطاقة صورة ثابتة عادية.
- صورتان أو أكثر: **carousel** مع أسهم.
- اختيار **primary image** من الـ Dashboard.
- **sort order**
- **alt text**

**نسبة بطاقة الصورة المقترحة:**

- بطاقات الواجهة العامة: إطار **4:5 portrait** مناسب لمنتجات الأزياء.
- `object-fit: cover`.
- معاينة الـ **Admin** يجب أن تعكس **crop** الواجهة العامة.

**واقع كاميرا الهاتف:**

- الصور قد تكون عمودية أو أفقية؛ النظام يجب أن يقص بشكل متسق في البطاقات العامة.

**إرشادات في الـ Dashboard:**

- تفضيل صور عمودية، إضاءة جيدة، توحيد المزاج/الـ color grading قدر الإمكان.
- تجنب لقطات شاشة/بوسترات إن أمكن.

---

### 4. WhatsApp Message Templates

**لا تُثبّت رسائل WhatsApp داخل مكوّنات UI (hardcode).**

دعم **templates** لـ:

- طلب منتج (**product order**)
- طلب خاص لحجم غير متاح (**unavailable size special order**)
- طلب تصميم مخصص (**custom design request**)
- تواصل عام (**general contact**)

يجب أن تدعم المتغيرات مثل:

- عنوان المنتج، السعر، العملة، الحجم المختار، اللون المختار، الفرع إن وُجد، ملاحظة العميل.

---

### 5. Customer Service Settings

من الـ Dashboard:

- أرقام هاتف، أرقام **WhatsApp**
- روابط **social**
- **branches**، عناوين الفروع
- روابط **Google Maps**
- ساعات العمل إن لزم
- **customer service message templates**

---

### 6. Testimonials CMS

بداية بسيطة:

- `customerName`
- نص الشهادة
- `rating` من 1 إلى 5
- صورة اختيارية
- `isPublished`
- `sortOrder`

لا حاجة لتسجيل دخول العميل.

---

### 7. Special Design Requests

اعتبرها **WhatsApp inquiry flow** وليس محرك تصميم كامل.

**الواجهة العامة:**

- عنوان مثل «طلب تصميم خاص»
- نموذج بسيط: الاسم، الهاتف، نوع القطعة، المقاس، اللون، ملاحظات؛ و**صورة مرجعية اختيارية** لاحقًا إن وُجدت.
- إرسال رسالة WhatsApp منظمة.

**الـ Dashboard:**

- تفعيل/تعطيل القسم
- تعديل نص القسم
- رقم WhatsApp
- **WhatsApp template**
- نص إرشادي اختياري

**أسئلة مفتوحة للعميل (client):** توضيح معنى «إضافة تصاميم خاصة»:

- هل الأدمن يضيف تصاميم خاصة؟ أم العميل يطلب تصميمًا مخصصًا؟
- هل يرفع العملاء صور مرجعية؟
- هل الأمر استفسار WhatsApp فقط؟
- هل المتجر يصنع/يخصص أم يقتصر على التوريد؟

---

### 8. Brands / Designers

**النموذج المقترح:**

`BrandDesigner`:

- `id`
- `nameAr`, `nameEn`
- `type`: `brand` | `designer`
- `logo`
- `descriptionAr`, `descriptionEn`
- `isPublished`
- `sortOrder`

المنتجات قد تربط اختياريًا بـ `BrandDesigner`.

---

### 9. Languages and Content

**قاعدة:** لا **hardcoded UI copy**.

نوعان من النصوص:

1. **Static system UI text:** ملفات JSON:
   - `messages/ar.json`
   - `messages/en.json`
   
   أمثلة: أزرار، تسميات، رسائل **validation**، تنقل الـ Dashboard، **empty states**، نصوص مساعدة.

2. **Dynamic client content:** قاعدة البيانات:
   - منتجات، محتوى الهبوط، footer، شهادات، بيانات خدمة العملاء، فروع، brands/designers.

**لا تضع المحتوى الديناميكي للعمل في JSON فقط.**

---

### 10. Permissions

**المرحلة الحالية:**

- Dashboard **admin-only**
- مستخدم واحد تقريبًا: المالك/الأدمن

**المستقبل (إن لزم):** أدوار مثل owner / manager / editor / viewer.

**لا تبني RBAC معقدًا** إلا عند الحاجة الفعلية.

---

### 11. Production Readiness Principles

يجب أن يوفّر الـ Dashboard:

- **validation**، **empty states** واضحة، **loading states**، **error states**
- **confirmation dialogs** للإجراءات التدميرية
- **soft delete** / سلة مهملات حيث يناسب
- **audit logs** للإجراءات المهمة **إن وُجدت بالفعل** في المشروع
- واجهة **responsive**، نماذج **accessible**
- **authorization** آمنة من السيرفر
- **لا public mutation endpoints**
- فصل واضح بين **public APIs** و **admin APIs**

---

## أولويات التنفيذ (Implementation Priority)

1. تحليل الـ Dashboard الحالي و**data model**.
2. ترقية **Products CMS**.
3. **Product variants** والتوفر.
4. إدارة صور المنتج.
5. **WhatsApp templates**.
6. **Customer service settings**.
7. **Testimonials**.
8. **Special design requests**.
9. **Brands / designers**.
10. تنظيف **i18n**.
11. **Permissions** وتصليب الإنتاج (**production hardening**).

---

## قاعدة هندسية مهمة (Important Engineering Rule)

قبل تنفيذ تغييرات كبيرة:

- حلل الـ **codebase** الحالي.
- حدد **schemas** / **routes** / **components** الموجودة.
- تجنب إعادة كتابة كل شيء بلا تحليل.
- اقترح **migration plan**، احفظ **production data**، لا تكسر **landing page** العامة الحالية.
- بعد كل مرحلة: تشغيل **lint** / **typecheck** / **build**.

---

*آخر تحديث: وثيقة تخطيط أولية لمرحلة Dashboard / CMS — لا تعديل على كود التطبيق مطلوب لإنشاء هذا الملف.*
