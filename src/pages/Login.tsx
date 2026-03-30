import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type FormErrors = { email?: string; password?: string };

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuthStore();

  if (session) {
    navigate("/");
    return null;
  }

  const validateField = (field: keyof FormErrors, value: string) => {
    const testData = { email, password, [field]: value };
    const result = loginSchema.safeParse(testData);
    if (!result.success) {
      const fieldError = result.error.errors.find((e) => e.path[0] === field);
      setErrors((prev) => ({ ...prev, [field]: fieldError?.message }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (
          error.message.toLowerCase().includes("email not confirmed") ||
          error.message.toLowerCase().includes("email_not_confirmed")
        ) {
          setUnverifiedEmail(email);
        } else if (
          error.message.toLowerCase().includes("invalid login") ||
          error.message.toLowerCase().includes("invalid credentials")
        ) {
          setErrors({ password: "Email atau password salah." });
        } else {
          toast.error(error.message || "Gagal login");
        }
        return;
      }

      if (data.session) {
        toast.success("Selamat datang kembali!");
        navigate("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Gagal login");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: unverifiedEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/verify-email` },
      });
      if (error) throw error;
      toast.success("Email verifikasi telah dikirim ulang. Cek inbox kamu!");
    } catch (err: any) {
      toast.error(err.message || "Gagal kirim ulang email");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .anim-left { animation: fadeInLeft 0.7s ease forwards; }
        .anim-right { animation: fadeInRight 0.7s ease forwards; }
        .gold-shimmer {
          background: linear-gradient(90deg, #b8973a, #e8d07a, #b8973a);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .input-premium {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white;
          padding: 14px 16px 14px 44px;
          font-size: 14px;
          width: 100%;
          outline: none;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }
        .input-premium::placeholder { color: rgba(255,255,255,0.25); }
        .input-premium:focus {
          border-color: #b8973a;
          background: rgba(184,151,58,0.06);
          box-shadow: 0 0 0 3px rgba(184,151,58,0.12);
        }
        .input-premium.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
        }
        .btn-gold {
          background: linear-gradient(135deg, #b8973a, #d4af50, #b8973a);
          background-size: 200% auto;
          border: none;
          border-radius: 12px;
          padding: 15px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #0a0a0a;
          width: 100%;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-gold:hover:not(:disabled) {
          background-position: right center;
          box-shadow: 0 8px 32px rgba(184,151,58,0.4);
          transform: translateY(-1px);
        }
        .btn-gold:disabled { opacity: 0.6; cursor: not-allowed; }
        .error-msg {
          font-size: 12px;
          color: #f87171;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: 'Inter', sans-serif;
        }
      `}</style>

      {/* ─── LEFT: Hero Image Panel ─── */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden anim-left">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/20 via-transparent to-[#0a0a0a]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-[#0a0a0a]/10 to-[#0a0a0a]/10" />

        <div className="absolute top-10 left-10">
          <div className="border border-[#b8973a]/40 rounded-full px-5 py-2 backdrop-blur-sm bg-black/20">
            <span className="font-cormorant text-[#b8973a] text-lg font-semibold tracking-widest">VRFLIX</span>
          </div>
        </div>

        <div className="absolute bottom-12 left-10 right-10">
          <p className="font-cormorant text-white/90 text-4xl font-light leading-tight mb-3">
            "Where every step<br />
            <em className="font-medium text-[#b8973a]">tells a story"</em>
          </p>
          <div className="w-12 h-px bg-[#b8973a]/60" />
        </div>
      </div>

      {/* ─── RIGHT: Form Panel ─── */}
      <div className="w-full lg:w-2/5 flex items-center justify-center px-6 py-10 anim-right font-inter">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span className="font-cormorant text-[#b8973a] text-3xl font-semibold tracking-widest">VRFLIX</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="font-cormorant text-4xl font-bold text-white mb-2">
              Selamat Datang
            </h2>
            <p className="text-[#666] text-sm">
              Belum punya akun?{" "}
              <Link to="/auth/register" className="text-[#b8973a] hover:underline font-medium">
                Daftar gratis
              </Link>
            </p>
          </div>

          {/* Unverified Email Banner */}
          {unverifiedEmail && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-300 text-sm font-medium mb-1">Email belum diverifikasi</p>
                  <p className="text-amber-400/70 text-xs mb-3">
                    Cek inbox kamu untuk link verifikasi, atau kirim ulang di bawah ini.
                  </p>
                  <button
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="text-xs text-[#b8973a] hover:underline flex items-center gap-1 font-medium"
                  >
                    {resendLoading ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Mengirim...</>
                    ) : (
                      <><Mail className="w-3 h-3" /> Kirim ulang email verifikasi</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#888] mb-2 font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input
                  id="email"
                  type="email"
                  placeholder="kamu@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); validateField("email", e.target.value); }}
                  className={`input-premium ${errors.email ? "error" : ""}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="error-msg">⚠ {errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#888] mb-2 font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); validateField("password", e.target.value); }}
                  className={`input-premium pr-12 ${errors.password ? "error" : ""}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#b8973a] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="error-msg">⚠ {errors.password}</p>}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button type="submit" className="btn-gold" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Masuk...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Masuk <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </div>
          </form>

          <p className="text-[#555] text-xs text-center mt-8 leading-relaxed">
            © 2025 VRFLIX · Premium Shoe Store
          </p>
        </div>
      </div>
    </div>
  );
}
