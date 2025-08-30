import React, { useState, useEffect } from 'react';
import { useDebounce } from "react-use";
import Search from "./Component/Search.jsx";
import Spinner from "./Component/Spinner.jsx";
import MovieCard from "./Component/MovieCard.jsx";
import { getTrendingMovies, updateSearchCount } from "./appwrite.js";

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`
    }
};

const App = () => {
    const [debouncedSearchTerm, setDebouncedSearch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [movieList, setMovieList] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [trendingMovies, setTrendingMovies] = useState([]); // safe default
    const [trendingError, setTrendingError] = useState('');
    const [isTrendingLoading, setIsTrendingLoading] = useState(false);

    // Debounce search term
    useDebounce(() => setDebouncedSearch(searchTerm), 500, [searchTerm]);

    const fetchMovies = async (query = "") => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS);
            if (!response.ok) throw Error('Failed to fetch movies');

            const data = await response.json();
            if (data.Response === 'False') {
                setErrorMessage("No movies found.");
                setMovieList([]);
                return;
            }

            setMovieList(data.results || []);
            if (query && data.results?.length > 0) {
                await updateSearchCount(query, data.results[0]);
            }
        } catch (error) {
            console.log(`Error fetching movies: ${error}`);
            setErrorMessage("Error fetching movies: Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadTrendingMovies = async () => {
        setIsTrendingLoading(true);
        setTrendingError('');
        try {
            const movies = await getTrendingMovies();
            setTrendingMovies(Array.isArray(movies) ? movies : []);
        } catch (error) {
            console.error(`Error fetching trending movies: ${error}`);
            setTrendingError("Could not load trending movies.");
            setTrendingMovies([]); // fallback
        } finally {
            setIsTrendingLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    return (
        <main>
            <div className="pattern"/>
            <div className="wrapper">
                <header>
                    <img src="./hero.png" alt="Hero Banner"/>
                    <h1>
                        Find <span className="text-gradient">Movies</span> You'll Enjoy
                    </h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
                </header>

                <section className="trending">
                    <h2>Trending Movies</h2>
                    {isTrendingLoading ? (
                        <div className="flex w-full justify-center p-4">
                            <Spinner/>
                        </div>
                    ) : trendingError ? (
                        <p className="text-red-500">{trendingError}</p>
                    ) : trendingMovies.length === 0 ? (
                        <p>No trending movies available.</p>
                    ) : (
                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.$id ?? movie.id ?? index}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title}/>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="all-movies">
                    <h2>All Movies</h2>
                    {isLoading ? (
                        <div className="flex w-full justify-center p-4">
                            <Spinner/>
                        </div>
                    ) : errorMessage ? (
                        <p className="text-red-500">{errorMessage}</p>
                    ) : (
                        <ul>
                            {movieList.map(movie => (
                                <MovieCard key={movie.id} movie={movie}/>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
};

export default App;
