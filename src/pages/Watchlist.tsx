import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MovieCard } from "@/components/MovieCard";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/lib/tmdb";

export default function Watchlist() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    loadWatchlist();
  }, [user]);

  const loadWatchlist = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      console.log("Supabase watchlist response:", { data, error });

      if (error) throw error;

      if (!data) {
        setMovies([]);
        return;
      }

      const movieList: Movie[] = data.map((item) => ({
        id: item.movie_id,
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview || "",
        release_date: item.release_date || "",
        vote_average: item.vote_average || 0,
        genre_ids: [],
      }));

      console.log("Parsed movieList:", movieList);
      setMovies(movieList);
    } catch (error) {
      console.error("Error loading watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 px-4 md:px-12 max-w-[1920px] mx-auto min-h-[80vh]">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
          My List
        </h1>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Your watchlist is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
