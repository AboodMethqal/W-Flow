import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

export default function AuthPage() {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (showReset) {
        const { error } = await resetPassword(email);
        if (error) toast.error(error.message);
        else {
          toast.success("تم إرسال رابط إعادة التعيين على بريدك");
          setShowReset(false);
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) toast.error(error.message);
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) toast.error(error.message);
        else toast.success("تم إنشاء الحساب! تحقق من بريدك الإلكتروني");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="text-center">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-container-foreground font-black text-3xl">W</span>
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tighter font-headline">W-Flow</h1>
          <p className="text-on-surface-variant text-sm mt-2">
            {showReset ? "أدخل بريدك لإعادة تعيين كلمة المرور" : isLogin ? "سجّل دخولك للمتابعة" : "أنشئ حسابك الجديد"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-surface-container-low rounded-2xl p-6 space-y-4">
          {!isLogin && !showReset && (
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-2">الاسم الكامل</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40"
                placeholder="أحمد محمد"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-2">البريد الإلكتروني</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40"
              placeholder="you@example.com"
              dir="ltr"
            />
          </div>
          {!showReset && (
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-2">كلمة المرور</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/40"
                placeholder="••••••••"
                dir="ltr"
                minLength={6}
              />
            </div>
          )}

          {isLogin && !showReset && (
            <div className="text-left">
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="text-xs text-primary hover:underline"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full gradient-primary text-primary-container-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting
              ? "جاري التحميل..."
              : showReset
              ? "إرسال رابط الاستعادة"
              : isLogin
              ? "تسجيل الدخول"
              : "إنشاء حساب"}
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant">
          {showReset ? (
            <button onClick={() => setShowReset(false)} className="text-primary font-bold hover:underline">
              العودة لتسجيل الدخول
            </button>
          ) : (
            <>
              {isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-bold hover:underline"
              >
                {isLogin ? "أنشئ حساب" : "سجّل دخول"}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
