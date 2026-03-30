import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Silakan masukkan email kamu.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      
      setSubmitted(true);
      toast.success("Link reset telah dikirim!");
    } catch (error: any) {
      console.error("Reset error:", error);
      // Security best practice: don't reveal if email exists, 
      // but we show errors like "Too many requests"
      toast.error(error.message || "Gagal mengirim link reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--netflix-black))] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Glow */}
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
            <h1 className="text-primary text-4xl font-bold tracking-tighter">
              VERFLIX
            </h1>
          </Link>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-2xl shadow-2xl relative">
          {!submitted ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Lupa Password?</h2>
              <p className="text-white/60 text-sm mb-8 leading-relaxed">
                Ingatkan kami email kamu, dan kami akan mengirimkan link untuk mengatur ulang password.
              </p>

              <form onSubmit={handleResetRequest} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-12 pl-10 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary hover:bg-[hsl(var(--netflix-red-hover))] text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Kirim Link Reset"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 space-y-6">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Email Terkirim!</h2>
                <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
                  Jika email tersebut terdaftar, kamu akan segera menerima link instruksi di inbox kamu.
                </p>
              </div>
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-white/40 hover:text-white border-white/5"
                >
                  Gunakan email lain
                </Button>
              </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Log In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
