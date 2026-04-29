import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import PUZZLES from "../puzzles.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── ENV ───────────────────────────────────────────────────────────────────────

function loadEnv() {
  try {
    const raw = readFileSync(resolve(__dirname, "../../.env"), "utf8");
    for (const line of raw.split("\n")) {
      const clean = line.trim();
      if (!clean || clean.startsWith("#")) continue;
      const eq = clean.indexOf("=");
      if (eq < 0) continue;
      const key = clean.slice(0, eq).trim();
      const val = clean.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* no .env — rely on shell env */ }
}

loadEnv();

const TMDB_KEY      = process.env.REACT_APP_TMDB_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const TMDB          = "https://api.themoviedb.org/3";

// ── UTILS ─────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseJson(text) {
  const cleaned = text.replace(/^```(?:json)?\n?|\n?```$/g, "").trim();
  try { return JSON.parse(cleaned); } catch { return null; }
}

// ── TMDB HELPERS ──────────────────────────────────────────────────────────────

async function searchMovie(title) {
  await sleep(300);
  const searchRes  = await fetch(`${TMDB}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}`);
  const searchData = await searchRes.json();
  const top = searchData.results?.[0];
  if (!top) return null;

  await sleep(300);
  const detail = await (await fetch(`${TMDB}/movie/${top.id}?api_key=${TMDB_KEY}&append_to_response=credits`)).json();

  return {
    id:       detail.id,
    title:    detail.title,
    year:     detail.release_date?.slice(0, 4) ?? "?",
    genres:   detail.genres?.map((g) => g.name) ?? [],
    director: detail.credits?.crew?.find((c) => c.job === "Director")?.name ?? "Unknown",
    overview: detail.overview ?? "",
    cast:     detail.credits?.cast?.map((c) => c.name) ?? [],
  };
}

async function getMovieCredits(tmdbId) {
  await sleep(300);
  const data = await (await fetch(`${TMDB}/movie/${tmdbId}/credits?api_key=${TMDB_KEY}`)).json();
  return data.cast?.map((c) => c.name) ?? [];
}

async function verifyActorInMovie(actorName, movieTitle) {
  const movie = await searchMovie(movieTitle);
  if (!movie) return { valid: false, confidence: "high", movie: null };

  const lower   = actorName.toLowerCase();
  const exact   = movie.cast.some((n) => n.toLowerCase() === lower);
  const partial = !exact && movie.cast.some((n) =>
    n.toLowerCase().includes(lower) || lower.includes(n.toLowerCase())
  );

  return {
    valid:      exact || partial,
    confidence: exact ? "high" : partial ? "low" : "high",
    movie,
  };
}

// ── CLAUDE HELPER ─────────────────────────────────────────────────────────────

async function analyzeCategory(movieTitle, overview, category) {
  await sleep(200);
  const prompt =
    `You are a film expert. Determine if the movie genuinely belongs to the given category.\n\n` +
    `Movie: "${movieTitle}"\n` +
    `Overview: "${overview}"\n` +
    `Category: "${category}"\n\n` +
    `Respond with JSON only, no markdown:\n` +
    `{"matches": true or false, "confidence": "high" or "medium" or "low", "reason": "one sentence"}`;

  const res  = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":         ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json",
    },
    body: JSON.stringify({
      model:      "claude-sonnet-4-6",
      max_tokens: 200,
      messages:   [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();

  if (data.type === "error") {
    throw new Error(`Anthropic API error: ${data.error?.message ?? JSON.stringify(data.error)}`);
  }

  const parsed = parseJson(data.content?.[0]?.text ?? "");
  return parsed ?? { matches: null, confidence: "low", reason: "Failed to parse Claude response" };
}

// ── STATS & LOGGING ───────────────────────────────────────────────────────────

const stats = { total: 0, passed: 0, warned: 0, failed: 0 };

function pass(msg, pad = "    ") { stats.total++; stats.passed++; console.log(`${pad}✅  ${msg}`); }
function warn(msg, pad = "    ") { stats.total++; stats.warned++; console.log(`${pad}⚠️   ${msg}`); }
function fail(msg, pad = "    ") { stats.total++; stats.failed++; console.log(`${pad}❌  ${msg}`); }

function reportCategoryCheck(label, check) {
  const msg = `${label} — ${check.confidence} confidence: ${check.reason}`;
  if (check.matches === null) return fail(msg);
  if (!check.matches)          return fail(msg);
  if (check.confidence === "low" || check.confidence === "medium") return warn(msg);
  return pass(msg);
}

// ── CHAIN VALIDATION ──────────────────────────────────────────────────────────

async function validateChain(puzzle) {
  console.log("\n  [CHAIN]");

  for (const name of [puzzle.actorA, puzzle.actorB]) {
    try {
      await sleep(300);
      const res  = await fetch(`${TMDB}/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (data.results?.length) {
        pass(`${name} found on TMDB (id: ${data.results[0].id})`);
      } else {
        fail(`${name} not found on TMDB`);
      }
    } catch (e) {
      fail(`${name} — error: ${e.message}`);
    }
  }
}

// ── GRID VALIDATION ───────────────────────────────────────────────────────────

async function validateGrid(puzzle) {
  console.log(`\n  [GRID] Puzzle #${puzzle.num}`);

  for (let r = 0; r < puzzle.actors.length; r++) {
    const actor = puzzle.actors[r];
    console.log(`\n    Row ${r}: ${actor}`);

    for (let c = 0; c < puzzle.categories.length; c++) {
      const category = puzzle.categories[c];
      const movies   = [...puzzle.valid[r][c]];
      console.log(`\n      Col ${c} — "${category.label}" (${movies.length} valid answers)`);

      // Check every actor/movie combination
      for (const movieKey of movies) {
        try {
          const check = await verifyActorInMovie(actor, movieKey);

          if (!check.movie) {
            fail(`"${movieKey}" not found on TMDB`);
            continue;
          }

          const actorMsg = `${actor} in "${check.movie.title}"`;
          if (!check.valid)                         fail(actorMsg);
          else if (check.confidence === "low")       warn(actorMsg);
          else                                       pass(actorMsg);
        } catch (e) {
          fail(`"${movieKey}" — error: ${e.message}`);
        }
      }

      // Category analysis: sample first 2 movies per cell
      const sample = movies.slice(0, 2);
      for (const movieKey of sample) {
        try {
          const movie = await searchMovie(movieKey);
          if (!movie) continue;
          const check = await analyzeCategory(movie.title, movie.overview, category.label);
          reportCategoryCheck(`"${movie.title}" fits "${category.label}"`, check);
        } catch (e) {
          fail(`Category check for "${movieKey}" — error: ${e.message}`);
        }
      }
    }
  }
}

// ── CROSSCUT VALIDATION ───────────────────────────────────────────────────────

async function validateCrosscut(puzzle) {
  console.log(`\n  [CROSSCUT] Puzzle #${puzzle.num}`);
  console.log(`    Column theme: "${puzzle.colTheme}"`);

  const colMovies    = puzzle.movies.filter((m) => m.isCol);
  const nonColSample = puzzle.movies.filter((m) => !m.isCol).slice(0, 3);

  console.log("\n    isCol=true — should match colTheme:");
  for (const m of colMovies) {
    try {
      const info = await searchMovie(m.title);
      if (!info) { fail(`"${m.title}" not found on TMDB`); continue; }
      const check = await analyzeCategory(info.title, info.overview, puzzle.colTheme);
      reportCategoryCheck(`"${info.title}" fits "${puzzle.colTheme}"`, check);
    } catch (e) {
      fail(`"${m.title}" — error: ${e.message}`);
    }
  }

  console.log("\n    isCol=false spot-check — should NOT match colTheme:");
  for (const m of nonColSample) {
    try {
      const info = await searchMovie(m.title);
      if (!info) { warn(`"${m.title}" not found on TMDB`); continue; }
      const check = await analyzeCategory(info.title, info.overview, puzzle.colTheme);
      if (check.matches && check.confidence === "high") {
        warn(`"${info.title}" unexpectedly matches colTheme — ${check.reason}`);
      } else {
        pass(`"${info.title}" correctly does not match colTheme`);
      }
    } catch (e) {
      fail(`"${m.title}" — error: ${e.message}`);
    }
  }

  // Verify row themes for one movie per row
  console.log("\n    Row theme spot-check:");
  for (let r = 0; r < puzzle.rowThemes.length; r++) {
    const theme     = puzzle.rowThemes[r];
    const rowMovies = puzzle.movies.filter((m) => m.row === r);
    const sample    = rowMovies[0];
    if (!sample) continue;

    try {
      const info = await searchMovie(sample.title);
      if (!info) { warn(`"${sample.title}" not found on TMDB`); continue; }
      const check = await analyzeCategory(info.title, info.overview, theme);
      reportCategoryCheck(`"${info.title}" fits row theme "${theme}"`, check);
    } catch (e) {
      fail(`"${sample.title}" row theme check — error: ${e.message}`);
    }
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!TMDB_KEY) {
    console.error("❌  REACT_APP_TMDB_KEY is not set");
    process.exit(1);
  }
  if (!ANTHROPIC_KEY) {
    console.error("❌  ANTHROPIC_API_KEY is not set");
    process.exit(1);
  }

  const dates = Object.keys(PUZZLES).sort();
  console.log(`\nValidating ${dates.length} puzzle date(s)…`);

  for (const date of dates) {
    const bar = "═".repeat(52);
    console.log(`\n${bar}`);
    console.log(`  VALIDATING ${date}`);
    console.log(bar);

    const day = PUZZLES[date];
    await validateChain(day.chain);
    await validateGrid(day.grid);
    await validateCrosscut(day.crosscut);
  }

  const bar = "═".repeat(52);
  console.log(`\n${bar}`);
  console.log("  SUMMARY");
  console.log(bar);
  console.log(`  Total checks  ${stats.total}`);
  console.log(`  ✅  Passed    ${stats.passed}`);
  console.log(`  ⚠️   Warned    ${stats.warned}`);
  console.log(`  ❌  Failed    ${stats.failed}`);
  console.log();

  if (stats.failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
