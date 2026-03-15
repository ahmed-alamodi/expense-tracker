# تطبيق تتبع المصاريف

تطبيق موبايل لتتبع المصاريف الشخصية بالريال السعودي والريال اليمني، مبني بـ React Native (Expo) و Supabase.

## المميزات

- **إضافة وتعديل وحذف المصاريف** مع كل التفاصيل (الفئة، الوصف، المبلغ، طريقة الدفع)
- **تحويل تلقائي** بين الريال السعودي والريال اليمني
- **رسوم بيانية وإحصائيات** شهرية (Pie Chart + Bar Chart)
- **ميزانية شهرية** إجمالية ولكل فئة مع أشرطة تقدم
- **بحث وفلترة** حسب الفئة وطريقة الدفع والنص
- **تصدير Excel** لجميع المصاريف
- **دعم كامل للغة العربية** (RTL)
- **الوضع الداكن والفاتح**

## إعداد المشروع

### 1. تثبيت الحزم

```bash
cd expense-tracker
npm install
```

### 2. إعداد Supabase

1. أنشئ حساب مجاني على [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد
3. اذهب إلى **SQL Editor** وانسخ محتوى ملف `supabase-setup.sql` وشغّله
4. اذهب إلى **Settings > API** وانسخ:
   - **Project URL**
   - **anon public key**
5. عدّل ملف `lib/supabase.ts` وضع القيم:

```typescript
const supabaseUrl = 'https://xxxxx.supabase.co';    // ← ضع الـ URL هنا
const supabaseAnonKey = 'eyJhbGciOiJIUzI1...';      // ← ضع الـ Key هنا
```

### 3. تشغيل التطبيق

```bash
npx expo start
```

ثم امسح QR Code بتطبيق Expo Go على جوالك.

## هيكل المشروع

```
expense-tracker/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        # الصفحة الرئيسية
│   │   ├── add.tsx          # إضافة مصروف
│   │   ├── stats.tsx        # الإحصائيات
│   │   ├── budget.tsx       # الميزانية
│   │   └── settings.tsx     # الإعدادات
│   ├── expense/[id].tsx     # تعديل مصروف
│   └── _layout.tsx          # التخطيط الرئيسي
├── components/
│   ├── ExpenseCard.tsx      # بطاقة المصروف
│   ├── ExpenseForm.tsx      # نموذج الإضافة/التعديل
│   ├── MonthPicker.tsx      # اختيار الشهر
│   └── SearchFilter.tsx     # البحث والفلترة
├── lib/
│   ├── supabase.ts          # إعداد Supabase
│   ├── database.ts          # دوال قاعدة البيانات
│   └── storage.ts           # التخزين المحلي
├── constants/
│   ├── categories.ts        # الفئات وطرق الدفع
│   └── Colors.ts            # ألوان التطبيق
├── hooks/
│   ├── useExpenses.ts       # Hook للمصاريف
│   └── useThemeColor.ts     # Hook للألوان
├── types/
│   └── expense.ts           # الأنواع TypeScript
└── supabase-setup.sql       # SQL لإنشاء الجداول
```

## التقنيات المستخدمة

- **Expo SDK 55** + **Expo Router**
- **TypeScript**
- **Supabase** (PostgreSQL + Auth + RLS)
- **react-native-chart-kit** (الرسوم البيانية)
- **xlsx** (تصدير Excel)
