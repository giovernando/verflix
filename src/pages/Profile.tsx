import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Camera, Pencil, CheckCircle2, XCircle, LogOut, ChevronRight, Play } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { tmdb, Movie } from "@/lib/tmdb";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Profile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);

  // Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  // Preferences State
  const [preferences, setPreferences] = useState({
    language: "English",
    preferred_genre: "Action",
    notifications: {
      new_releases: true,
      recommendations: true,
      email: true,
    },
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    loadProfileAndWatchlist();
  }, [user]);

  const loadProfileAndWatchlist = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Load Profile
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileErr) throw profileErr;
      setProfile(profileData);
      setNewName(profileData.name || "");

      if (profileData.preferences) {
        setPreferences(profileData.preferences);
      }

      // 2. Load Watchlist
      const { data: watchData, error: watchErr } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!watchErr && watchData) {
        const movies: Movie[] = watchData.map((w: any) => ({
          id: w.movie_id,
          title: w.title,
          poster_path: w.poster_path,
          backdrop_path: w.backdrop_path,
          overview: w.overview,
          release_date: w.release_date,
          vote_average: w.vote_average,
          genre_ids: [],
        }));
        setWatchlist(movies);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: newName })
        .eq("id", user.id);
      
      if (error) throw error;
      setProfile({ ...profile, name: newName });
      setIsEditingName(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleUpdatePreferences = async (newPrefs: any) => {
    setPreferences(newPrefs);
    if (!user) return;
    try {
      await supabase
        .from("profiles")
        .update({ preferences: newPrefs })
        .eq("id", user.id);
    } catch (error) {
      console.error("Failed to sync preferences", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth/login");
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      toast.success("Password reset email sent. Please check your inbox!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!user) return null;

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "Recently";

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--netflix-black))] text-foreground overflow-x-hidden">
      <Navbar />

      <div className="pt-24 px-4 md:px-12 max-w-[1400px] mx-auto pb-20">
        
        {loading ? (
          <div className="pt-20 space-y-8 animate-pulse">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-full bg-white/10" />
              <div className="space-y-4 flex-1">
                <div className="h-8 w-1/3 bg-white/10 rounded" />
                <div className="h-4 w-1/4 bg-white/10 rounded" />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="h-64 bg-white/10 rounded-xl col-span-1" />
              <div className="h-64 bg-white/10 rounded-xl col-span-2" />
            </div>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            
            {/* LEFT COLUMN: Profile Navigation & Overview */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Avatar & Header Card */}
              <motion.div variants={itemVariants} className="bg-[hsl(var(--netflix-gray-dark))]/80 backdrop-blur-md rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                {/* Decorative Red Glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-[hsl(var(--netflix-red))] rounded-full blur-[100px] opacity-20" />
                
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <Avatar className="h-32 w-32 border-4 border-[hsl(var(--netflix-gray-light))] shadow-xl transition-transform duration-300 group-hover:scale-105">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-[hsl(var(--netflix-gray-light))] text-4xl text-white">
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Mock Upload Overlay */}
                    <button 
                      onClick={() => toast.success("Upload photo feature unlocked after integration!")}
                      className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 backdrop-blur-sm"
                    >
                      <Camera className="h-8 w-8 text-white" />
                    </button>
                  </div>
                  
                  <h1 className="text-3xl font-bold mb-1 tracking-tight">{profile?.name || "User"}</h1>
                  <p className="text-white/50 text-sm mb-4">{profile?.email}</p>
                  
                  <div className="flex items-center gap-2 bg-[hsl(var(--netflix-red))]/10 text-[hsl(var(--netflix-red))] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-[hsl(var(--netflix-red))]/20 mb-4">
                    Premium Member
                  </div>
                  
                  <p className="text-xs text-white/40">Member since {joinDate}</p>
                </div>
              </motion.div>

              {/* Security & Quick Actions Card */}
              <motion.div variants={itemVariants} className="bg-[hsl(var(--netflix-gray-dark))]/80 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-2xl">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Security
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-white/50" />
                      <span className="text-sm">Email Status</span>
                    </div>
                    {user?.email_confirmed_at || user?.user_metadata?.email_verified ? (
                      <span className="flex items-center gap-1 text-xs text-green-400 font-medium bg-green-400/10 px-2 py-1 rounded">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-orange-400 font-medium bg-orange-400/10 px-2 py-1 rounded">
                        <XCircle className="h-3 w-3" /> Unverified
                      </span>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-between border-white/10 hover:bg-white/5 hover:text-white"
                    onClick={handlePasswordReset}
                  >
                    Change Password
                    <ChevronRight className="h-4 w-4 text-white/50" />
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    className="w-full justify-between"
                    onClick={handleSignOut}
                  >
                    <span>Sign Out</span>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN: Content & Forms */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Personal Information */}
              <motion.div variants={itemVariants} className="bg-[hsl(var(--netflix-gray-dark))]/80 backdrop-blur-md rounded-2xl p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">Account Info</h2>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsEditingName(!isEditingName)}
                    className="text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {isEditingName ? "Cancel" : "Edit Profile"}
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Full Name</label>
                      {isEditingName ? (
                        <div className="flex gap-2">
                          <Input 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="bg-black/40 border-white/20 text-white"
                          />
                          <Button onClick={handleUpdateName} className="bg-primary hover:bg-primary/90">Save</Button>
                        </div>
                      ) : (
                        <div className="p-3 bg-black/40 rounded-lg border border-white/5 text-white/90 font-medium">
                          {profile?.name}
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Email Address</label>
                      <div className="p-3 bg-black/40 rounded-lg border border-white/5 text-white/60 font-medium opacity-80 cursor-not-allowed">
                        {profile?.email}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Activity Section: My List / Recently Watched */}
              <motion.div variants={itemVariants} className="bg-[hsl(var(--netflix-gray-dark))]/80 backdrop-blur-md rounded-2xl p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Recent Activity</h2>
                  <Button variant="link" className="text-white/50 hover:text-white p-0" onClick={() => navigate('/watchlist')}>
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <div className="space-y-8">
                  {/* Mocked Recently Watched */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Continue Watching</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                      {watchlist.slice(0, 3).map((movie, index) => (
                        <div key={`recent-${movie.id}`} className="flex-shrink-0 w-64 snap-start group cursor-pointer" onClick={() => navigate(`/player/${movie.id}`)}>
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 shadow-lg">
                            <img src={tmdb.getBackdropUrl(movie.backdrop_path)} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="h-10 w-10 text-white fill-white" />
                            </div>
                            {/* Mock Progress Bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                              <div className="h-full bg-primary" style={{ width: `${Math.max(20, 80 - index * 20)}%` }} />
                            </div>
                          </div>
                          <p className="mt-2 text-sm font-medium text-white/90 truncate">{movie.title}</p>
                        </div>
                      ))}
                      {watchlist.length === 0 && (
                        <p className="text-white/40 text-sm">No recent activity. Start watching now!</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Preferences & Notifications */}
              <motion.div variants={itemVariants} className="bg-[hsl(var(--netflix-gray-dark))]/80 backdrop-blur-md rounded-2xl p-8 border border-white/5 shadow-2xl mb-8">
                <h2 className="text-xl font-bold mb-6">Preferences</h2>
                
                <div className="grid md:grid-cols-2 gap-10">
                  {/* General Settings */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Preferred Language</label>
                      <select 
                        className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                        value={preferences.language}
                        onChange={(e) => handleUpdatePreferences({ ...preferences, language: e.target.value })}
                      >
                        <option value="English">English</option>
                        <option value="Indonesian">Bahasa Indonesia</option>
                        <option value="Spanish">Español</option>
                        <option value="Japanese">日本語</option>
                      </select>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Favorite Genre</label>
                      <select 
                        className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                        value={preferences.preferred_genre}
                        onChange={(e) => handleUpdatePreferences({ ...preferences, preferred_genre: e.target.value })}
                      >
                        <option value="Action">Action</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Horror">Horror</option>
                        <option value="Romance">Romance</option>
                        <option value="Sci-Fi">Sci-Fi & Fantasy</option>
                      </select>
                    </div>
                  </div>

                  {/* Notification Toggles */}
                  <div className="space-y-6">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Notification Settings</label>
                    
                    <div className="flex justify-between items-center p-3 bg-black/40 border border-white/5 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">New Releases</p>
                        <p className="text-xs text-white/50">Alerts when new movies are added</p>
                      </div>
                      <Switch 
                        checked={preferences.notifications.new_releases} 
                        onCheckedChange={(c) => handleUpdatePreferences({
                          ...preferences, 
                          notifications: { ...preferences.notifications, new_releases: c }
                        })}
                      />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-black/40 border border-white/5 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Recommendations</p>
                        <p className="text-xs text-white/50">Curated weekly picks for you</p>
                      </div>
                      <Switch 
                        checked={preferences.notifications.recommendations} 
                        onCheckedChange={(c) => handleUpdatePreferences({
                          ...preferences, 
                          notifications: { ...preferences.notifications, recommendations: c }
                        })}
                      />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-black/40 border border-white/5 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Email Alerts</p>
                        <p className="text-xs text-white/50">Important account updates</p>
                      </div>
                      <Switch 
                        checked={preferences.notifications.email} 
                        onCheckedChange={(c) => handleUpdatePreferences({
                          ...preferences, 
                          notifications: { ...preferences.notifications, email: c }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
