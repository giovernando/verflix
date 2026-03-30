import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, User, LogOut, CheckCheck } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { tmdb, Movie } from "@/lib/tmdb";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotifications } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Notifications
  const { notifications, unreadCount, handleMarkAsRead } = useNotifications();

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search effect
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearch.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await tmdb.searchMovies(debouncedSearch);
        setSearchResults(results.slice(0, 5)); // Show top 5 results
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearch]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth/login");
  };

  const handleResultClick = (movieId: number) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    navigate(`/movies/${movieId}`);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[hsl(var(--netflix-black))]" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1920px] mx-auto px-4 md:px-12 py-4 flex items-center justify-between">
        {/* Logo and Menu */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            <h1 className="text-primary text-3xl font-bold tracking-tight">
              VERFLIX
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-muted-foreground transition-colors text-sm">
              Home
            </Link>
            <Link to="/movies" className="text-foreground hover:text-muted-foreground transition-colors text-sm">
              Movies
            </Link>
            <Link to="/watchlist" className="text-foreground hover:text-muted-foreground transition-colors text-sm">
              My List
            </Link>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          
          {/* Expandable Search */}
          <div className="relative flex items-center" ref={searchContainerRef}>
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <Input
                    autoFocus
                    placeholder="Titles, people, genres..."
                    className="h-9 w-full bg-black/60 border border-white/20 text-white placeholder:text-white/50 focus-visible:ring-1 focus-visible:ring-primary rounded-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              variant="ghost" 
              size="icon" 
              className={`text-foreground transition-transform ${isSearchOpen ? 'ml-1' : ''}`}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {isSearchOpen && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-4 w-[300px] md:w-[400px] bg-[hsl(var(--netflix-gray-dark))] border border-white/10 shadow-2xl rounded-md overflow-hidden"
                >
                  {isSearching ? (
                    <div className="p-4 space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-16 h-24 bg-white/10 rounded" />
                          <div className="flex-1 space-y-2 py-2">
                            <div className="h-4 bg-white/10 rounded w-3/4" />
                            <div className="h-3 bg-white/10 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="flex flex-col">
                      {searchResults.map((movie) => (
                        <div 
                          key={movie.id}
                          className="flex gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                          onClick={() => handleResultClick(movie.id)}
                        >
                          <img 
                            src={tmdb.getPosterUrl(movie.poster_path)} 
                            alt={movie.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div className="flex flex-col justify-center">
                            <span className="text-sm font-medium text-white line-clamp-1">{movie.title}</span>
                            <span className="text-xs text-white/50">{movie.release_date?.split('-')[0]} • Movie</span>
                          </div>
                        </div>
                      ))}
                      <div 
                        className="p-3 text-center text-xs text-primary hover:text-primary/80 cursor-pointer border-t border-white/10 bg-black/20"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery("");
                          // Assuming we might have a dedicated search page later, for now we just close
                        }}
                      >
                        See all results for "{searchQuery}"
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-white/60">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {user ? (
            <>
              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-foreground relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-white border border-[hsl(var(--netflix-black))]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-[hsl(var(--netflix-gray-dark))] border-white/10 p-0 text-white">
                  <div className="p-3 font-semibold border-b border-white/10 bg-black/20 flex justify-between items-center">
                    Notifications
                  </div>
                  <div className="max-h-[400px] overflow-y-auto scrollbar-hide py-2">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-4 border-b border-white/5 last:border-0 flex flex-col gap-1 cursor-pointer hover:bg-white/5 transition-colors ${!notif.is_read ? 'bg-white/5' : ''}`}
                          onClick={() => handleMarkAsRead(notif.id)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-sm ${!notif.is_read ? 'font-bold' : 'font-medium text-white/90'}`}>
                              {notif.title}
                            </span>
                            {!notif.is_read && (
                              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className={`text-xs ${!notif.is_read ? 'text-white/80' : 'text-white/50'}`}>
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-white/40 mt-1">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-sm text-white/50">
                        You have no notifications.
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[hsl(var(--netflix-gray-dark))] border-white/10 text-white">
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="focus:bg-white/10 focus:text-white cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="focus:bg-white/10 focus:text-white cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              onClick={() => navigate("/auth/login")}
              className="bg-primary hover:bg-[hsl(var(--netflix-red-hover))] text-primary-foreground"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};
