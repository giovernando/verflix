import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, User2, Mail, Lock, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid").max(255),
  password: z.string().min(8, "Password minimal 8 karakter").max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Lemah", color: "#ef4444" };
  if (score <= 2) return { score: 2, label: "Cukup", color: "#f97316" };
  if (score <= 3) return { score: 3, label: "Bagus", color: "#eab308" };
  if (score <= 4) return { score: 4, label: "Kuat", color: "#84cc16" };
  return { score: 5, label: "Sangat Kuat", color: "#b8973a" };
}

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(password);

  const validateField = (field: keyof FormErrors, value: string) => {
    const testData = { name, email, password, confirmPassword, [field]: value };
    const result = registerSchema.safeParse(testData);
    if (!result.success) {
      const fieldError = result.error.errors.find((e) => e.path[0] === field);
      setErrors((prev) => ({ ...prev, [field]: fieldError?.message }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = registerSchema.safeParse({ name, email, password, confirmPassword });
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
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/verify-email`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { name },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          setErrors({ email: "Email ini sudah terdaftar. Silakan login." });
        } else {
          toast.error(error.message || "Gagal membuat akun");
        }
        return;
      }

      if (data.user) {
        setSuccess(true);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Gagal membuat akun");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
          .font-cormorant { font-family: 'Cormorant Garamond', serif; }
          .font-inter { font-family: 'Inter', sans-serif; }
          @keyframes successPulse {
            0% { transform: scale(0.8); opacity: 0; }
            60% { transform: scale(1.05); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .anim-success { animation: successPulse 0.6s ease forwards; }
          .anim-fade { animation: fadeInUp 0.5s ease forwards; }
          .anim-fade-d1 { animation: fadeInUp 0.5s ease 0.2s forwards; opacity: 0; }
          .anim-fade-d2 { animation: fadeInUp 0.5s ease 0.4s forwards; opacity: 0; }
          .anim-fade-d3 { animation: fadeInUp 0.5s ease 0.6s forwards; opacity: 0; }
        `}</style>
        <div className="text-center max-w-md w-full font-inter">
          <div className="anim-success mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#b8973a]/10 border border-[#b8973a]/30">
            <CheckCircle2 className="w-12 h-12 text-[#b8973a]" />
          </div>
          <h1 className="anim-fade font-cormorant text-4xl font-bold text-white mb-3">
            Cek Inbox Kamu!
          </h1>
          <p className="anim-fade-d1 text-[#999] text-sm leading-relaxed mb-2">
            Kami telah mengirimkan link verifikasi ke
          </p>
          <p className="anim-fade-d1 text-[#b8973a] font-semibold text-sm mb-6 tracking-wide">
            {email}
          </p>
          <div className="anim-fade-d2 bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left space-y-3">
            {[
              "Buka email kamu",
              "Klik tombol \"Verify Email\"",
              "Akun kamu siap digunakan!",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#b8973a]/20 border border-[#b8973a]/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#b8973a] text-xs font-bold">{i + 1}</span>
                </div>
                <span className="text-white/80 text-sm">{step}</span>
              </div>
            ))}
          </div>
          <p className="anim-fade-d3 text-[#666] text-xs">
            Tidak menerima email?{" "}
            <button
              onClick={() => {
                setSuccess(false);
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-[#b8973a] hover:underline"
            >
              Coba daftar ulang
            </button>
          </p>
          <div className="anim-fade-d3 mt-4 pt-4 border-t border-white/10">
            <p className="text-[#555] text-xs">
              Sudah verifikasi?{" "}
              <Link to="/auth/login" className="text-[#b8973a] hover:underline font-medium">
                Login sekarang →
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          position: relative;
          overflow: hidden;
        }
        .btn-gold:hover:not(:disabled) {
          background-position: right center;
          box-shadow: 0 8px 32px rgba(184,151,58,0.4);
          transform: translateY(-1px);
        }
        .btn-gold:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
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
            backgroundImage: `url('https://assets.nflxext.com/ffe/siteui/vlv3/51c1d7f7-3179-4a55-93d9-704722898999/be90e543-c951-40d0-9ef5-e067f3e33d16/US-en-20240610-popsignuptwoweeks-perspective_alpha_website_large.jpg')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/20 via-transparent to-[#0a0a0a]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-[#0a0a0a]/10 to-[#0a0a0a]/10" />

        {/* Floating badge */}
        <div className="absolute top-10 left-10">
          <div className="border border-[#b8973a]/40 rounded-full px-5 py-2 backdrop-blur-sm bg-black/20">
            <span className="font-cormorant text-[#b8973a] text-lg font-semibold tracking-widest">VRFLIX</span>
          </div>
        </div>

        {/* Bottom quote */}
        <div className="absolute bottom-12 left-10 right-10">
          <p className="font-cormorant text-white/90 text-4xl font-light leading-tight mb-3">
            "Step into your next<br />
            <em className="font-medium text-[#b8973a]">signature look"</em>
          </p>
          <div className="w-12 h-px bg-[#b8973a]/60" />
        </div>
      </div>

      {/* ─── RIGHT: Form Panel ─── */}
      <div className="w-full lg:w-2/5 flex items-center justify-center px-6 py-10 anim-right font-inter overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Logo (mobile) */}
          <div className="lg:hidden mb-8 text-center">
            <span className="font-cormorant text-[#b8973a] text-3xl font-semibold tracking-widest">VRFLIX</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="font-cormorant text-4xl font-bold text-white mb-2">
              Create Account
            </h2>
            <p className="text-[#666] text-sm">
              Sudah punya akun?{" "}
              <Link to="/auth/login" className="text-[#b8973a] hover:underline font-medium">
                Masuk di sini
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4" noValidate>

            {/* Full Name */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#888] mb-2 font-medium">
                Nama Lengkap
              </label>
              <div className="relative">
                <User2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input
                  id="name"
                  type="text"
                  placeholder="Nama lengkap kamu"
                  value={name}
                  onChange={(e) => { setName(e.target.value); validateField("name", e.target.value); }}
                  className={`input-premium ${errors.name ? "error" : ""}`}
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="error-msg">⚠ {errors.name}</p>}
            </div>

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
                  placeholder="Min. 8 karakter"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); validateField("password", e.target.value); }}
                  className={`input-premium pr-12 ${errors.password ? "error" : ""}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#b8973a] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Bar */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: i <= strength.score ? strength.color : "rgba(255,255,255,0.1)",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}
              {errors.password && <p className="error-msg">⚠ {errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#888] mb-2 font-medium">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); validateField("confirmPassword", e.target.value); }}
                  className={`input-premium pr-12 ${errors.confirmPassword ? "error" : ""}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#b8973a] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Match indicator */}
              {confirmPassword && !errors.confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Password cocok
                </p>
              )}
              {errors.confirmPassword && <p className="error-msg">⚠ {errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button type="submit" className="btn-gold" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Membuat Akun...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Buat Akun
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Terms */}
          <p className="text-[#555] text-xs text-center mt-6 leading-relaxed">
            Dengan mendaftar, kamu setuju dengan{" "}
            <span className="text-[#b8973a] cursor-pointer hover:underline">Terms of Service</span>{" "}
            dan{" "}
            <span className="text-[#b8973a] cursor-pointer hover:underline">Privacy Policy</span> kami.
          </p>
        </div>
      </div>
    </div>
  );
}
