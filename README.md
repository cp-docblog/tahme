# تشويش - Tashweesh Campaign Management UI

نظام إدارة وتحليل الحملات التسويقية لوكالة تشويش

## المميزات

- 🎨 واجهة مستخدم عربية بالكامل (RTL)
- 🎨 تصميم عصري بألوان الفيروزي (Turquoise)
- 👥 إدارة المستخدمين (مالك، مدير، موظف)
- 🏢 إدارة العملاء مع بيانات الاعتماد للمنصات
- 📊 تحليل الحملات مع التكامل مع Backend
- 🗄️ قاعدة بيانات Supabase
- ⚡ React + TypeScript

## التقنيات المستخدمة

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router DOM
- **Database**: Supabase (PostgreSQL)
- **Styling**: Vanilla CSS (CSS Modules)
- **Font**: Cairo (Google Fonts)

## التثبيت والإعداد

### 1. تثبيت المكتبات

```bash
npm install
```

### 2. إعداد Supabase

1. أنشئ مشروع جديد على [Supabase](https://supabase.com)
2. قم بتشغيل SQL التالي لإنشاء الجداول:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  clickup_folder TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  tiktok_username TEXT,
  tiktok_password TEXT,
  snapchat_username TEXT,
  snapchat_password TEXT,
  facebook_username TEXT,
  facebook_password TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'snapchat', 'facebook')),
  campaign_data JSONB,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed)
CREATE POLICY "Enable read access for authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON campaigns
  FOR ALL USING (auth.role() = 'authenticated');
```

### 3. إعداد المتغيرات البيئية

انسخ الملف `.env.example` إلى `.env`:

```bash
cp .env.example .env
```

ثم قم بتعديل القيم:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. تشغيل التطبيق

```bash
npm start
```

سيتم فتح التطبيق على `http://localhost:3000`

## البنية

```
src/
├── components/
│   ├── Layout/
│   │   ├── Sidebar.tsx          # القائمة الجانبية
│   │   └── MainLayout.tsx       # التخطيط الرئيسي
│   └── UI/
│       ├── Button.tsx           # زر مخصص
│       ├── Input.tsx            # حقل إدخال
│       └── Card.tsx             # بطاقة
├── pages/
│   ├── Dashboard.tsx            # لوحة التحكم
│   ├── Users.tsx                # إدارة المستخدمين
│   ├── Clients.tsx              # قائمة العملاء
│   ├── NewClient.tsx            # إضافة عميل جديد
│   └── Campaigns.tsx            # تحليل الحملات
├── lib/
│   ├── supabase.ts              # إعداد Supabase
│   └── database.types.ts        # أنواع قاعدة البيانات
└── styles/
    ├── globals.css              # الأنماط العامة
    └── animations.css           # الحركات
```

## الصفحات

### 1. لوحة التحكم (Dashboard)
- عرض الإحصائيات
- النشاط الأخير

### 2. إدارة المستخدمين (Users)
- عرض قائمة المستخدمين
- إضافة مستخدم جديد (مالك، مدير، موظف)

### 3. إدارة العملاء (Clients)
- عرض قائمة العملاء
- إضافة عميل جديد مع:
  - معلومات العميل (الاسم، جهة الاتصال، مجلد ClickUp)
  - بيانات اعتماد TikTok
  - بيانات اعتماد Snapchat
  - بيانات اعتماد Facebook

### 4. تحليل الحملات (Campaigns)
- عرض الحملات
- اختيار حملات للتحليل
- إرسال البيانات إلى Backend Webhook

## التكامل مع Backend

عند الضغط على "تحليل" في صفحة الحملات، يتم إرسال البيانات إلى:

```
POST https://aibackend.cp-devcode.com/webhooks
```

البيانات المرسلة:
```json
{
  "campaigns": [...],
  "action": "analyze"
}
```

## البناء للإنتاج

```bash
npm run build
```

## النشر باستخدام Docker

### البناء والتشغيل باستخدام Docker

#### 1. بناء الصورة (Image)

```bash
docker build \
  --build-arg REACT_APP_SUPABASE_URL=your_supabase_url \
  --build-arg REACT_APP_SUPABASE_ANON_KEY=your_anon_key \
  --build-arg REACT_APP_BACKEND_WEBHOOK=https://aibackend.cp-devcode.com/webhooks \
  -t tashweesh:latest .
```

#### 2. تشغيل الحاوية (Container)

```bash
docker run -d -p 3000:80 --name tashweesh tashweesh:latest
```

سيكون التطبيق متاحاً على `http://localhost:3000`

### استخدام Docker Compose (الطريقة الموصى بها)

#### 1. تأكد من وجود ملف `.env` مع المتغيرات المطلوبة

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_BACKEND_WEBHOOK=https://aibackend.cp-devcode.com/webhooks
```

#### 2. بناء وتشغيل التطبيق

```bash
docker-compose up -d
```

#### 3. إيقاف التطبيق

```bash
docker-compose down
```

#### 4. إعادة البناء بعد التغييرات

```bash
docker-compose up -d --build
```

### الأوامر المفيدة

```bash
# عرض السجلات (Logs)
docker-compose logs -f

# فحص الحالة الصحية (Health Check)
docker-compose ps

# إعادة تشغيل الخدمة
docker-compose restart

# حذف الحاوية والصورة
docker-compose down --rmi all
```

## الترخيص

© 2024 تشويش - جميع الحقوق محفوظة
