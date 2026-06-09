# سكريبت إعداد Environment Variables
Write-Host "🔧 إعداد متغيرات البيئة للـ Telegram Bot API" -ForegroundColor Green
Write-Host "=" * 60

# معلومات المشروع
$projectId = "vaghwmhtztyxdxvxoiag"
$projectUrl = "https://$projectId.supabase.co"

Write-Host "📌 معلومات المشروع:" -ForegroundColor Yellow
Write-Host "   Project ID: $projectId" -ForegroundColor White
Write-Host "   URL: $projectUrl" -ForegroundColor White

Write-Host "`n📋 متطلبات الإعداد:" -ForegroundColor Cyan
Write-Host "1. Service Role Key من Supabase Dashboard" -ForegroundColor White
Write-Host "2. Anonymous Key (موجود في .env)" -ForegroundColor White
Write-Host "3. Workspace ID للاختبار" -ForegroundColor White

# قراءة ملف .env الحالي
Write-Host "`n📖 قراءة ملف .env الحالي..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "VITE_SUPABASE") {
            Write-Host "   Found: $_" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "   ❌ ملف .env غير موجود!" -ForegroundColor Red
}

# إعداد Service Role Key
Write-Host "`n🔐 الحصول على Service Role Key:" -ForegroundColor Yellow
Write-Host "1. اذهب إلى: https://supabase.com/dashboard/project/$projectId/settings/api" -ForegroundColor White
Write-Host "2. انسخ 'service_role' key (ليست 'anon' key)" -ForegroundColor White
Write-Host "3. الصقها أدناه" -ForegroundColor White

$serviceRoleKey = Read-Host "   أدخل Service Role Key"

if ($serviceRoleKey) {
    Write-Host "`n📝 تحديث ملف .env..." -ForegroundColor Yellow
    
    # قراءة محتوى .env الحالي
    $envContent = @()
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
    }
    
    # إضافة أو تحديث Service Role Key
    $updated = $false
    $newEnvContent = @()
    
    foreach ($line in $envContent) {
        if ($line -match "^VITE_SUPABASE_SERVICE_ROLE_KEY=") {
            $newEnvContent += "VITE_SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey"
            $updated = $true
        } else {
            $newEnvContent += $line
        }
    }
    
    if (-not $updated) {
        $newEnvContent += "`n# Service Role Key for Edge Functions"
        $newEnvContent += "VITE_SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey"
    }
    
    # إضافة متغيرات إضافية
    if (-not ($newEnvContent -match "^VITE_SUPABASE_FUNCTIONS_URL=")) {
        $newEnvContent += "`n# Edge Functions URL"
        $newEnvContent += "VITE_SUPABASE_FUNCTIONS_URL=$projectUrl/functions/v1"
    }
    
    if (-not ($newEnvContent -match "^VITE_TELEGRAM_BOT_API_URL=")) {
        $newEnvContent += "`n# Telegram Bot API Endpoint"
        $newEnvContent += "VITE_TELEGRAM_BOT_API_URL=$projectUrl/functions/v1/telegram-bot-api"
    }
    
    # حفظ الملف
    Set-Content -Path ".env" -Value ($newEnvContent -join "`n")
    
    Write-Host "   ✅ تم تحديث ملف .env بنجاح" -ForegroundColor Green
    
    # عرض الملف المحدث
    Write-Host "`n📄 محتوى ملف .env المحدث:" -ForegroundColor Cyan
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "VITE_SUPABASE") {
            Write-Host "   $_" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "   ⚠️  تخطي إضافة Service Role Key" -ForegroundColor Yellow
}

# اختبار الـ Environment Variables
Write-Host "`n🧪 اختبار Environment Variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    # تحميل الـ .env في الجلسة الحالية
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    
    # عرض المتغيرات المهمة
    $importantVars = @(
        "VITE_SUPABASE_URL",
        "VITE_SUPABASE_PUBLISHABLE_KEY", 
        "VITE_SUPABASE_SERVICE_ROLE_KEY",
        "VITE_SUPABASE_FUNCTIONS_URL",
        "VITE_TELEGRAM_BOT_API_URL"
    )
    
    foreach ($var in $importantVars) {
        $value = [Environment]::GetEnvironmentVariable($var, "Process")
        if ($value) {
            if ($var -match "KEY") {
                $displayValue = $value.Substring(0, [Math]::Min(20, $value.Length)) + "..."
                Write-Host "   $var = $displayValue" -ForegroundColor Gray
            } else {
                Write-Host "   $var = $value" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ⚠️  $var غير معرف" -ForegroundColor Yellow
        }
    }
}

# إعداد Edge Functions
Write-Host "`n⚡ إعداد Edge Functions..." -ForegroundColor Yellow
Write-Host "   يجب نشر Edge Function يدوياً:" -ForegroundColor White
Write-Host "   1. supabase functions deploy telegram-bot-api" -ForegroundColor White
Write-Host "   2. أو انتظر حتى أقوم بنشرها لك إذا كان لدي صلاحيات" -ForegroundColor White

Write-Host "`n📋 ملخص الخطوات التالية:" -ForegroundColor Cyan
Write-Host "1. تشغيل سكريبت SQL في Supabase Dashboard" -ForegroundColor White
Write-Host "2. نشر Edge Function: supabase functions deploy telegram-bot-api" -ForegroundColor White
Write-Host "3. اختتبار الـ API: node scripts/test-telegram-api.js" -ForegroundColor White
Write-Host "4. تسجيل الدخول إلى التطبيق والتحقق من قسم API Keys" -ForegroundColor White

Write-Host "`n🎯 روابط مهمة:" -ForegroundColor Green
Write-Host "   • SQL Editor: https://supabase.com/dashboard/project/$projectId/sql" -ForegroundColor White
Write-Host "   • Functions: https://supabase.com/dashboard/project/$projectId/functions" -ForegroundColor White
Write-Host "   • Table Editor: https://supabase.com/dashboard/project/$projectId/editor" -ForegroundColor White

Write-Host "`n✅ تم إعداد Environment Variables!" -ForegroundColor Green
Write-Host "=" * 60

Write-Host "`n🚀 اضغط Enter للخروج..." -ForegroundColor Green
Read-Host