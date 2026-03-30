import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Plus, Check, Info } from "lucide-react";
import { Movie, tmdb } from "@/lib/tmdb";
import { Button } from "./ui/button";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Cek status watchlist dari database saat komponen mount
  useEffect(() => {
    const checkWatchlist = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("watchlist")
        .select("id")
        .eq("movie_id", movie.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setIsInWatchlist(!!data);
    };
    checkWatchlist();
  }, [movie.id, user]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/player/${movie.id}`);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/movies/${movie.id}`);
  };

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      navigate("/auth/login");
      return;
    }

    try {
      if (isInWatchlist) {
        const { error } = await supabase
          .from("watchlist")
          .delete()
          .eq("movie_id", movie.id)
          .eq("user_id", user.id);
        if (error) throw error;
        setIsInWatchlist(false);
        toast.success("Removed from My List");
      } else {
        const { error } = await supabase.from("watchlist").insert({
          user_id: user.id,
          movie_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          overview: movie.overview,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
        });
        if (error) throw error;
        setIsInWatchlist(true);
        toast.success("Added to My List");
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      toast.error("Gagal menyimpan ke My List. Pastikan kamu sudah login.");
    }
  };

  return (
    <div
      className="relative group cursor-pointer flex-shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/movies/${movie.id}`)}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md">
        <img
          src={tmdb.getPosterUrl(movie.poster_path)}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity duration-300">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full bg-foreground text-background hover:bg-foreground/80"
              onClick={handlePlayClick}
            >
              <Play className="h-5 w-5 fill-current" />
            </Button>

            <Button
              size="icon"
              variant="secondary"
              className="rounded-full"
              onClick={toggleWatchlist}
            >
              {isInWatchlist ? (
                <Check className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </Button>

            <Button
              size="icon"
              variant="secondary"
              className="rounded-full"
              onClick={handleInfoClick}
            >
              <Info className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="mt-2 px-1">
        <h3 className="text-sm font-medium text-foreground truncate">
          {movie.title}
        </h3>
      </div>
    </div>
  );
};
