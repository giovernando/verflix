import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Plus, Check, Star } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { tmdb, Movie } from "@/lib/tmdb";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadMovie();
    }
  }, [id]);

  useEffect(() => {
    if (movie && user) {
      checkWatchlist();
    }
  }, [movie, user]);

  const loadMovie = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const movieData = await tmdb.getMovieDetails(parseInt(id));
      setMovie(movieData);
    } catch (error) {
      console.error("Error loading movie:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlist = async () => {
    if (!movie || !user) return;

    const { data } = await supabase
      .from("watchlist")
      .select("id")
      .eq("movie_id", movie.id)
      .eq("user_id", user.id)
      .maybeSingle();

    setIsInWatchlist(!!data);
  };

  const toggleWatchlist = async () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    if (!movie) return;

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
    } catch (error: any) {
      console.error("Error toggling watchlist:", error);
      toast.error(`Gagal menyimpan: ${error.message || "Unknown error"}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <p className="text-muted-foreground">Movie not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[70vh] w-full">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${tmdb.getBackdropUrl(movie.backdrop_path)})`,
          }}
        >
          <div className="absolute inset-0 hero-gradient" />
        </div>
      </div>

      {/* Content */}
      <div className="relative -mt-32 px-4 md:px-12 max-w-[1920px] mx-auto pb-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0 w-64">
            <img
              src={tmdb.getPosterUrl(movie.poster_path)}
              alt={movie.title}
              className="w-full rounded-lg shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {movie.title}
            </h1>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                <span className="font-bold">{movie.vote_average?.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">{movie.release_date?.split("-")[0]}</span>
              {movie.runtime && (
                <span className="text-muted-foreground">{movie.runtime} min</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {movie.genres?.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="bg-primary hover:bg-[hsl(var(--netflix-red-hover))] gap-2"
                onClick={() => navigate(`/player/${movie.id}`)}
              >
                <Play className="h-5 w-5 fill-current" />
                Play
              </Button>

              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
                onClick={toggleWatchlist}
              >
                {isInWatchlist ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                My List
              </Button>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Overview</h2>
              <p className="text-muted-foreground leading-relaxed">
                {movie.overview}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
