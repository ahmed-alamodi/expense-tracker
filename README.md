# Expense Tracker App | تطبيق تتبع المصاريف

**Jump to:** [English](#english) | [العربية](#arabic)

---

<a name="english"></a>
# Expense Tracker App

A mobile app for tracking personal expenses in Saudi Riyal and Yemeni Riyal, built with React Native (Expo) and Supabase.

## Features

- **Add, edit, and delete expenses** with full details (category, description, amount, payment method)
- **Automatic conversion** between Saudi Riyal and Yemeni Riyal
- **Charts and statistics** by month (Pie Chart + Bar Chart)
- **Monthly budget** overall and per category with progress bars
- **Search and filter** by category, payment method, and text
- **Excel export** for all expenses
- **Full Arabic language support** (RTL)
- **Dark and light mode**

## Project Setup

### 1. Install packages

```bash
cd expense-tracker
npm install
```

### 2. Set up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor**, copy the contents of `supabase-setup.sql`, and run it
4. Go to **Settings > API** and copy:
   - **Project URL**
   - **anon public key**
5. Edit `lib/supabase.ts` and set the values:

```typescript
const supabaseUrl = 'https://xxxxx.supabase.co';    // ← paste URL here
const supabaseAnonKey = 'eyJhbGciOiJIUzI1...';      // ← paste Key here
```

### 3. Run the app

```bash
npx expo start
```

Then scan the QR Code with the Expo Go app on your phone.

## Project Structure

```
expense-tracker/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        # Home screen
│   │   ├── add.tsx          # Add expense
│   │   ├── stats.tsx        # Statistics
│   │   ├── budget.tsx       # Budget
│   │   └── settings.tsx     # Settings
│   ├── expense/[id].tsx     # Edit expense
│   └── _layout.tsx          # Root layout
├── components/
│   ├── ExpenseCard.tsx      # Expense card
│   ├── ExpenseForm.tsx      # Add/edit form
│   ├── MonthPicker.tsx      # Month selector
│   └── SearchFilter.tsx     # Search and filter
├── lib/
│   ├── supabase.ts          # Supabase config
│   ├── database.ts          # Database functions
│   └── storage.ts           # Local storage
├── constants/
│   ├── categories.ts        # Categories and payment methods
│   └── Colors.ts            # App colors
├── hooks/
│   ├── useExpenses.ts       # Expenses hook
│   └── useThemeColor.ts     # Colors hook
├── types/
│   └── expense.ts           # TypeScript types
└── supabase-setup.sql       # SQL for table creation
```

## Tech Stack

- **Expo SDK 55** + **Expo Router**
- **TypeScript**
- **Supabase** (PostgreSQL + Auth + RLS)
- **react-native-chart-kit** (charts)
- **xlsx** (Excel export)

---

<a name="arabic"></a>
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
