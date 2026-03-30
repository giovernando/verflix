import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Mail, Loader2, ArrowRight } from "lucide-react";

type VerifyState = "loading" | "success" | "error" | "resend";

export default function VerifyEmail() {
  const [state, setState] = useState<VerifyState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    verifyToken();
  }, []);

  useEffect(() => {
    if (state === "success") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/auth/login");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [state, navigate]);

  const verifyToken = async () => {
    // Supabase mengirim token via URL hash (#access_token=...) atau query params
    // Saat user klik link email, Supabase Auth otomatis menangani verifikasi via onAuthStateChange
    // Kita perlu exchange code jika ada
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      setState("error");
      setErrorMsg(errorDescription || "Link verifikasi tidak valid atau sudah kadaluarsa.");
      return;
    }

    if (code) {
      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setState("error");
          setErrorMsg(exchangeError.message || "Verifikasi gagal. Coba minta link baru.");
          return;
        }
        setState("success");
        return;
      } catch {
        setState("error");
        setErrorMsg("Terjadi kesalahan saat memverifikasi. Silakan coba lagi.");
        return;
      }
    }

    // Cek session yang mungkin sudah ada dari hash-based redirect Supabase
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.email_confirmed_at) {
        setState("success");
      } else {
        setState("error");
        setErrorMsg("Link verifikasi tidak ditemukan. Pastikan kamu mengklik link yang benar dari email.");
      }
    } catch {
      setState("error");
      setErrorMsg("Terjadi kesalahan. Silakan coba lagi.");
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: resendEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email`,
        },
      });

      if (error) {
        setErrorMsg(error.message || "Gagal mengirim ulang email.");
        return;
      }
      setResendSent(true);
    } catch {
      setErrorMsg("Gagal mengirim ulang email. Silakan coba lagi.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        @keyframes spinSlow { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes successPop {
          0% { transform: scale(0.6); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .anim-pop { animation: successPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .anim-fade { animation: fadeInUp 0.5s ease forwards; }
        .anim-fade-d1 { animation: fadeInUp 0.5s ease 0.15s forwards; opacity: 0; }
        .anim-fade-d2 { animation: fadeInUp 0.5s ease 0.3s forwards; opacity: 0; }
        .pulse-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #b8973a;
          animation: pulse-ring 1.5s ease infinite;
        }
        .btn-gold {
          background: linear-gradient(135deg, #b8973a, #d4af50, #b8973a);
          background-size: 200% auto;
          border: none;
          border-radius: 12px;
          padding: 14px 28px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #0a0a0a;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-gold:hover { box-shadow: 0 8px 32px rgba(184,151,58,0.4); transform: translateY(-1px); }
        .btn-outline {
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 14px 28px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: white;
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-outline:hover { border-color: #b8973a; color: #b8973a; }
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
      `}</style>

      <div className="text-center max-w-md w-full font-inter">
        {/* LOADING */}
        {state === "loading" && (
          <div className="space-y-4">
            <div className="relative inline-flex items-center justify-center w-24 h-24">
              <div className="pulse-ring" />
              <div className="w-24 h-24 rounded-full bg-[#b8973a]/10 border border-[#b8973a]/30 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#b8973a] animate-spin" />
              </div>
            </div>
            <h1 className="font-cormorant text-3xl font-bold text-white">Memverifikasi...</h1>
            <p className="text-[#666] text-sm">Sedang memproses link verifikasi kamu</p>
          </div>
        )}

        {/* SUCCESS */}
        {state === "success" && (
          <div className="space-y-4">
            <div className="anim-pop inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
            <div>
              <h1 className="anim-fade font-cormorant text-4xl font-bold text-white mb-2">
                Email Terverifikasi! 🎉
              </h1>
              <p className="anim-fade-d1 text-[#999] text-sm mb-6">
                Akun kamu sudah aktif. Selamat datang di VRFLIX!
              </p>
            </div>
            <div className="anim-fade-d1 bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
              <p className="text-[#888] text-xs">
                Otomatis redirect ke login dalam{" "}
                <span className="text-[#b8973a] font-bold text-sm">{countdown}</span>{" "}
                detik...
              </p>
              <div className="mt-2 bg-white/10 rounded-full h-1 overflow-hidden">
                <div
                  className="h-full bg-[#b8973a] rounded-full transition-all duration-1000"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                />
              </div>
            </div>
            <div className="anim-fade-d2">
              <Link to="/auth/login">
                <button className="btn-gold">
                  Ke Halaman Login
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ERROR */}
        {state === "error" && !resendSent && (
          <div className="space-y-4">
            <div className="anim-pop inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <div>
              <h1 className="anim-fade font-cormorant text-4xl font-bold text-white mb-2">
                Verifikasi Gagal
              </h1>
              <p className="anim-fade-d1 text-[#999] text-sm mb-2">
                {errorMsg || "Link tidak valid atau sudah kadaluarsa (berlaku 1 jam)."}
              </p>
            </div>

            {/* Resend Form */}
            {state === "error" && (
              <div className="anim-fade-d1 bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
                <p className="text-white text-sm font-medium mb-4">Kirim Ulang Email Verifikasi</p>
                <form onSubmit={handleResend} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                    <input
                      type="email"
                      placeholder="Email kamu"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="input-premium"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-gold w-full justify-center"
                    disabled={resendLoading}
                  >
                    {resendLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                    ) : (
                      <><Mail className="w-4 h-4" /> Kirim Ulang</>
                    )}
                  </button>
                </form>
              </div>
            )}

            <div className="anim-fade-d2">
              <Link to="/auth/login">
                <button className="btn-outline">
                  Kembali ke Login
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* RESEND SUCCESS */}
        {resendSent && (
          <div className="space-y-4">
            <div className="anim-pop inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#b8973a]/10 border border-[#b8973a]/30">
              <Mail className="w-12 h-12 text-[#b8973a]" />
            </div>
            <h1 className="anim-fade font-cormorant text-4xl font-bold text-white mb-2">
              Email Terkirim!
            </h1>
            <p className="anim-fade-d1 text-[#999] text-sm mb-2">
              Kami telah mengirim ulang link verifikasi ke{" "}
              <span className="text-[#b8973a] font-semibold">{resendEmail}</span>.
              Cek inbox kamu!
            </p>
            <div className="anim-fade-d2">
              <Link to="/auth/login">
                <button className="btn-outline">Kembali ke Login</button>
              </Link>
            </div>
          </div>
        )}

        {/* VRFLIX branding */}
        <div className="mt-12">
          <span className="font-cormorant text-[#333] text-sm tracking-widest">VRFLIX</span>
        </div>
      </div>
    </div>
  );
}
