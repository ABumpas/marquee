const API_KEY = process.env.REACT_APP_TMDB_KEY;
const BASE = "https://api.themoviedb.org/3";

export async function searchMovies(query) {
  const res = await fetch(`${BASE}/search/movie?query=${encodeURIComponent(query)}&api_key=${API_KEY}`);
  const data = await res.json();
  return (data.results ?? [])
    .slice(0, 8)
    .map(({ id, title, release_date }) => ({ id, title, year: release_date?.slice(0, 4) ?? "" }));
}

export async function searchMovie(title) {
  const res = await fetch(`${BASE}/search/movie?query=${encodeURIComponent(title)}&api_key=${API_KEY}`);
  const data = await res.json();
  if (!data.results?.length) return null;
  const { id, title: t, release_date, genre_ids, original_language } = data.results[0];
  return { id, title: t, release_date, genre_ids, original_language };
}

export async function getMovieCredits(tmdbId) {
  const res = await fetch(`${BASE}/movie/${tmdbId}/credits?api_key=${API_KEY}`);
  const data = await res.json();
  return data.cast?.map(c => c.name) ?? [];
}

export async function getMovieDetails(tmdbId) {
  const res = await fetch(`${BASE}/movie/${tmdbId}?api_key=${API_KEY}`);
  const data = await res.json();
  const { genres, production_countries, runtime, release_date, spoken_languages } = data;
  return { genres, production_countries, runtime, release_date, spoken_languages };
}

export async function getActorFilmography(actorName) {
  const searchRes = await fetch(`${BASE}/search/person?query=${encodeURIComponent(actorName)}&api_key=${API_KEY}`);
  const searchData = await searchRes.json();
  if (!searchData.results?.length) return [];
  const personId = searchData.results[0].id;

  const creditsRes = await fetch(`${BASE}/person/${personId}/movie_credits?api_key=${API_KEY}`);
  const creditsData = await creditsRes.json();

  return (creditsData.cast ?? [])
    .map(({ id, title, release_date }) => ({ id, title, release_date }))
    .sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""));
}

export async function verifyActorInMovie(actorName, movieTitle) {
  const movie = await searchMovie(movieTitle);
  if (!movie) return { valid: false, tmdbId: null, movieTitle: null };

  const cast = await getMovieCredits(movie.id);
  const nameLower = actorName.toLowerCase();
  const valid = cast.some(n => n.toLowerCase().includes(nameLower) || nameLower.includes(n.toLowerCase()));

  return { valid, tmdbId: movie.id, movieTitle: movie.title };
}

export async function verifyCategory(tmdbId, category) {
  const details = await getMovieDetails(tmdbId);

  const genreNames = details.genres?.map(g => g.name) ?? [];
  if (genreNames.some(g => g.toLowerCase() === category.toLowerCase())) return { valid: true };

  const decadeMatch = category.match(/^(\d{4})s$/);
  if (decadeMatch) {
    const decade = parseInt(decadeMatch[1]);
    const year = parseInt(details.release_date?.slice(0, 4));
    return { valid: !isNaN(year) && year >= decade && year < decade + 10 };
  }

  const langMatch = category.match(/^(\w+) Language$/i);
  if (langMatch) {
    const lang = langMatch[1].toLowerCase();
    const languages = details.spoken_languages?.map(l => (l.english_name ?? l.name ?? "").toLowerCase()) ?? [];
    return { valid: languages.some(l => l.includes(lang)) };
  }

  const countryMatch = category.match(/Set in the (.+)$/i);
  if (countryMatch) {
    const country = countryMatch[1].toLowerCase();
    const countries = details.production_countries?.map(c => (c.name ?? "").toLowerCase()) ?? [];
    return { valid: countries.some(c => c.includes(country)) };
  }

  const overMatch = category.match(/Over (\d+) Hours?/i);
  if (overMatch) {
    return { valid: (details.runtime ?? 0) > parseInt(overMatch[1]) * 60 };
  }

  const underMatch = category.match(/Under (\d+) Hours?/i);
  if (underMatch) {
    return { valid: (details.runtime ?? 0) < parseInt(underMatch[1]) * 60 };
  }

  return { valid: false };
}
