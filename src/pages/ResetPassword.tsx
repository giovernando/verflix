import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, CheckCircle2, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(3);
  const navigate = useNavigate();

  // Redirect if not authenticated (session must be established by clicking the link)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Sesi tidak valid atau telah kadaluarsa. Silakan minta link reset lagi.");
        navigate("/auth/forgot-password");
      }
    });
  }, [navigate]);

  // Countdown for redirect
  useEffect(() => {
    if (success && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (success && timer === 0) {
      navigate("/auth/login");
    }
  }, [success, timer, navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success("Password berhasil diperbarui!");
    } catch (error: any) {
      console.error("Update password error:", error);
      toast.error(error.message || "Gagal memperbarui password.");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (p: string) => {
    if (p.length === 0) return 0;
    let score = 0;
    if (p.length >= 6) score += 25;
    if (p.length >= 10) score += 25;
    if (/[A-Z]/.test(p)) score += 25;
    if (/[0-9]/.test(p)) score += 25;
    return score;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--netflix-black))] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[hsl(var(--netflix-red))]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[hsl(var(--netflix-red))]/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-8">
            <h1 className="text-primary text-4xl font-bold tracking-tighter">VERFLIX</h1>
          </Link>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-2xl shadow-2xl relative">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-white/60 text-sm mb-8">
                  Buat password baru yang aman untuk akunmu.
                </p>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/50 uppercase ml-1">Password Baru</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/5 border-white/10 text-white h-12 pl-10 pr-10 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Strength Indicator */}
                    {password && (
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-1 px-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength(password)}%` }}
                          className={`h-full ${
                            passwordStrength(password) < 50 ? "bg-red-500" :
                            passwordStrength(password) < 100 ? "bg-amber-500" : "bg-green-500"
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/50 uppercase ml-1">Konfirmasi Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`bg-white/5 border-white/10 text-white h-12 pl-10 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl ${
                          confirmPassword && password !== confirmPassword ? "border-red-500/50" : ""
                        }`}
                        required
                      />
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Password tidak sama
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !password || password !== confirmPassword}
                    className="w-full h-12 bg-primary hover:bg-[hsl(var(--netflix-red-hover))] text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all mt-4"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-6"
              >
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Sukses Diperbarui!</h2>
                  <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
                    Password kamu sudah diganti. Menuju halaman login dalam {timer} detik...
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    asChild
                    className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10"
                  >
                    <Link to="/auth/login">Kembali sekarang</Link>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
