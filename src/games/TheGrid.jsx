import { useState, useEffect, useRef, useCallback } from "react";
import PUZZLES from "../puzzles.js";
import { searchMovies, verifyActorInMovie, verifyCategory } from "../services/tmdb.js";

/* ── PUZZLE LOOKUP ── */
const TODAY = new Date().toISOString().slice(0, 10);
const PUZZLE =
  PUZZLES[TODAY]?.grid ?? PUZZLES[Object.keys(PUZZLES).sort().at(-1)].grid;

const TOTAL_GUESSES = 15;
const RARITY_LABELS = ["", "Popular pick", "Solid find", "Rare gem ✦"];

const verifyCache = new Map();

function fmtTime(s) {
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

/* ── STYLES ── */
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #07080D; }

  :root {
    --bg:        #07080D;
    --bg2:       #0C0E15;
    --surface:   #10121A;
    --surface2:  #161921;
    --border:    #1E2130;
    --border2:   #272B3A;
    --gold:      #C9A84C;
    --gold-l:    #E4C97A;
    --gold-dim:  #C9A84C30;
    --gold-line: #C9A84C18;
    --cream:     #F0EAE0;
    --text:      #EDE8E0;
    --text2:     #6B7080;
    --text3:     #2A2D38;
    --green:     #4BA876;
    --green-dim: #4BA87622;
    --red:       #C45050;
    --red-dim:   #C4505022;
    --radius:    12px;
  }

  .tg-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    min-height: 100vh;
    color: var(--text);
    display: flex;
    flex-direction: column;
    max-width: 430px;
    margin: 0 auto;
    user-select: none;
  }

  /* ── HEADER ── */
  .tg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px 12px;
    border-bottom: 1px solid var(--border);
  }

  .tg-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--cream);
  }
  .tg-logo em { color: var(--gold); font-style: italic; }

  .tg-header-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .tg-timer-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
  }

  .tg-timer {
    font-family: 'DM Mono', monospace;
    font-size: 15px;
    color: var(--cream);
    line-height: 1;
  }

  .tg-timer-lbl {
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text2);
  }

  .tg-guesses-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 99px;
    padding: 4px 10px;
  }

  .tg-dots {
    display: flex;
    gap: 3px;
  }

  .tg-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--gold);
    transition: background 0.2s, transform 0.2s;
  }

  .tg-dot.used { background: var(--border2); transform: scale(0.75); }
  .tg-dot.last { animation: dotPop 0.3s ease; }

  @keyframes dotPop {
    0% { transform: scale(1.6); background: var(--red); }
    100% { transform: scale(0.75); background: var(--border2); }
  }

  .tg-guesses-count {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text2);
  }

  .tg-help-btn {
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 1px solid var(--border2);
    background: var(--surface2);
    color: var(--text2);
    font-size: 13px; font-weight: 600;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .tg-help-btn:hover { border-color: var(--gold); color: var(--gold); }

  .tg-back-btn {
    width: 28px; height: 28px;
    border-radius: var(--radius);
    border: 1px solid var(--border2);
    background: var(--surface2);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .tg-back-btn:hover { border-color: var(--gold); }
  .tg-back-btn:hover svg polyline { stroke: var(--gold); }

  /* ── GRID ── */
  .tg-grid-wrap { padding: 14px 12px 8px; }

  .tg-grid {
    display: grid;
    grid-template-columns: 64px repeat(3, 1fr);
    grid-template-rows: auto repeat(3, 1fr);
    gap: 5px;
  }

  .tg-corner { display: flex; align-items: flex-end; padding-bottom: 4px; }
  .tg-day-lbl {
    font-size: 9px; font-weight: 600; letter-spacing: 1.5px;
    text-transform: uppercase; color: var(--text3); line-height: 1.3;
  }

  .tg-cat-header {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 6px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    min-height: 60px;
  }

  .tg-cat-icon { font-size: 14px; margin-bottom: 3px; line-height: 1; }

  .tg-cat-name {
    font-size: 9px; font-weight: 600;
    color: var(--text2); line-height: 1.3;
    letter-spacing: 0.2px;
  }

  .tg-actor-header {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 4px 2px 4px 0;
  }

  .tg-actor-avatar {
    width: 30px; height: 30px;
    border-radius: 50%;
    background: var(--surface2);
    border: 1.5px solid var(--border2);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; margin-bottom: 4px;
  }

  .tg-actor-name {
    font-size: 8px; font-weight: 600;
    color: var(--text2); text-align: center;
    line-height: 1.2; letter-spacing: 0.2px;
  }

  /* ── CELL ── */
  .tg-cell {
    aspect-ratio: 1;
    border-radius: 8px;
    background: var(--surface);
    border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
    cursor: pointer;
    transition: border-color 0.2s, background 0.3s, transform 0.12s;
    padding: 4px;
    position: relative;
    overflow: hidden;
  }

  .tg-cell:active { transform: scale(0.93); }
  .tg-cell.active { border-color: var(--gold); background: var(--gold-dim); }

  .tg-cell.correct {
    background: var(--green-dim);
    border-color: var(--green);
    cursor: default;
  }

  .tg-cell.wrong { animation: cellShake 0.3s ease; }

  @keyframes cellShake {
    0%,100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  .tg-cell-text {
    font-size: 9px; font-weight: 600;
    color: var(--text); line-height: 1.2;
    text-align: center;
  }

  .tg-cell.correct .tg-cell-text { color: var(--green); }

  .tg-rarity {
    font-size: 7px; font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--gold);
    margin-top: 2px;
    text-align: center;
  }

  /* ── CONTEXT BADGE ── */
  .tg-ctx-wrap {
    padding: 0 12px 8px;
    min-height: 36px;
    display: flex;
    align-items: center;
  }

  .tg-ctx-badge {
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 11px;
    color: var(--text2);
    line-height: 1.4;
  }

  .tg-ctx-badge strong { color: var(--cream); }

  /* ── SEARCH ── */
  .tg-search-wrap { padding: 0 12px 12px; position: relative; }

  .tg-search-input {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 10px;
    padding: 12px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--cream);
    outline: none;
    transition: border-color 0.2s;
  }
  .tg-search-input::placeholder { color: var(--text2); }
  .tg-search-input:focus { border-color: var(--gold); }

  .tg-dropdown {
    position: absolute;
    top: calc(100% - 4px);
    left: 12px; right: 12px;
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 10px;
    overflow: hidden;
    z-index: 20;
    max-height: 200px;
    overflow-y: auto;
  }

  .tg-option {
    padding: 10px 14px;
    font-size: 13px;
    color: var(--text);
    cursor: pointer;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background 0.1s;
  }
  .tg-option:last-child { border-bottom: none; }
  .tg-option:hover, .tg-option.focused { background: var(--border); }
  .tg-option.used { opacity: 0.4; pointer-events: none; }

  .tg-option-year {
    font-size: 11px;
    color: var(--text2);
    margin-left: 4px;
  }

  .tg-used-tag {
    font-size: 9px; letter-spacing: 0.5px;
    color: var(--text2);
    background: var(--border);
    border-radius: 4px;
    padding: 2px 6px;
  }

  /* ── BOTTOM BAR ── */
  .tg-bottom {
    padding: 10px 16px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg2);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tg-progress {
    font-size: 13px;
    color: var(--text2);
  }
  .tg-progress strong { color: var(--cream); }

  /* ── OVERLAYS ── */
  .tg-overlay {
    position: fixed;
    inset: 0;
    background: rgba(7,8,13,0.88);
    display: flex;
    align-items: flex-end;
    z-index: 50;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .tg-sheet {
    width: 100%;
    max-width: 430px;
    margin: 0 auto;
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 20px 20px 0 0;
    padding: 24px 22px 36px;
    animation: slideUp 0.3s cubic-bezier(.22,.68,0,1.2);
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  .tg-sheet-handle {
    width: 36px; height: 3px;
    background: var(--border2);
    border-radius: 99px;
    margin: 0 auto 20px;
  }

  .tg-sheet-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 4px;
  }
  .tg-sheet-title em { color: var(--gold); font-style: italic; }

  .tg-sheet-sub { font-size: 12px; color: var(--text2); margin-bottom: 20px; }

  .tg-how-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .tg-how-num {
    width: 22px; height: 22px;
    border-radius: 6px;
    background: var(--gold-dim);
    border: 1px solid var(--gold-line);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--gold-l);
    flex-shrink: 0;
    margin-top: 1px;
  }

  .tg-how-text { font-size: 13px; color: var(--text2); line-height: 1.5; }
  .tg-how-text strong { color: var(--cream); }

  .tg-sheet-btn {
    width: 100%;
    margin-top: 10px;
    background: var(--gold);
    color: #07080D;
    border: none;
    border-radius: 10px;
    padding: 13px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .tg-sheet-btn:hover { opacity: 0.9; }

  /* win/lose overlay */
  .tg-end-overlay {
    position: fixed;
    inset: 0;
    background: rgba(7,8,13,0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 60;
    padding: 24px;
    animation: fadeIn 0.3s ease;
  }

  .tg-end-card {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 20px;
    padding: 28px 22px 24px;
    width: 100%;
    max-width: 340px;
    text-align: center;
    animation: popIn 0.4s cubic-bezier(.22,.68,0,1.2);
  }

  @keyframes popIn {
    from { transform: scale(0.85); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }

  .tg-end-icon { font-size: 40px; margin-bottom: 12px; }

  .tg-end-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 4px;
  }
  .tg-end-title em { color: var(--gold); font-style: italic; }

  .tg-end-sub { font-size: 12px; color: var(--text2); margin-bottom: 20px; }

  .tg-end-stats {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }

  .tg-end-stat {
    flex: 1;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 8px;
  }

  .tg-end-val {
    font-family: 'DM Mono', monospace;
    font-size: 20px;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 4px;
  }

  .tg-end-lbl {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text2);
  }

  .tg-result-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-bottom: 18px;
  }

  .tg-result-sq {
    aspect-ratio: 1;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }

  .tg-result-sq.g { background: var(--green-dim); border: 1px solid var(--green); }
  .tg-result-sq.e { background: var(--surface2); border: 1px solid var(--border2); }

  .tg-copied { font-size: 11px; color: var(--green); margin-top: 8px; min-height: 14px; }
`;

export default function TheGrid({ onBack }) {
  const [grid, setGrid] = useState(() =>
    Array.from({ length: 3 }, () => Array(3).fill(null))
  );
  const [activeCell, setActiveCell] = useState(null);
  const [query, setQuery] = useState("");
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [guessesLeft, setGuessesLeft] = useState(TOTAL_GUESSES);
  const [usedMovies, setUsedMovies] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [lastDot, setLastDot] = useState(false);
  const [checking, setChecking] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [gameOver, showHelp]);

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setFocusedIdx(0);
      setSearchResults([]);
    }
  }, [activeCell]);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const id = setTimeout(async () => {
      console.log("TMDB key:", process.env.REACT_APP_TMDB_KEY);
      console.log("Searching for:", query);
      const hits = await searchMovies(query);
      console.log("Results:", hits);
      setSearchResults(hits);
      setFocusedIdx(0);
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  const correctCount = grid.flat().filter(c => c?.status === "correct").length;

  const results = searchResults.map(r => ({ ...r, used: usedMovies.has(r.title.toLowerCase()) }));

  function handleCellClick(row, col) {
    if (grid[row][col]?.status === "correct") return;
    if (guessesLeft === 0) return;
    setActiveCell(prev =>
      prev?.row === row && prev?.col === col ? null : { row, col }
    );
  }

  const handleGuess = useCallback(async (movieName) => {
    if (!activeCell || checking) return;
    const { row, col } = activeCell;
    const key = movieName.toLowerCase();
    if (usedMovies.has(key)) return;

    const actor = PUZZLE.actors[row];
    const category = PUZZLE.categories[col];
    const cacheKey = `${actor}|${movieName}`;

    setChecking(true);
    let verification;
    if (verifyCache.has(cacheKey)) {
      verification = verifyCache.get(cacheKey);
    } else {
      verification = await verifyActorInMovie(actor, movieName);
      if (verification.valid) verifyCache.set(cacheKey, verification);
    }

    let isCorrect = false;
    if (verification.valid) {
      const catResult = await verifyCategory(verification.tmdbId, category.label);
      isCorrect = catResult.valid;
    }
    setChecking(false);

    const canonicalTitle = verification.movieTitle || movieName;
    const rarity = PUZZLE.rarityMap[key] || 1;
    const newGrid = grid.map(r => [...r]);

    if (isCorrect) {
      newGrid[row][col] = { movie: canonicalTitle, status: "correct", rarity };
      setGrid(newGrid);
      setUsedMovies(prev => new Set([...prev, key]));
      setActiveCell(null);
      setQuery("");
      const newCorrect = newGrid.flat().filter(c => c?.status === "correct").length;
      if (newCorrect === 9) setTimeout(() => setGameOver("won"), 400);
    } else {
      newGrid[row][col] = { movie: movieName, status: "wrong" };
      setGrid(newGrid);
      const newGuesses = guessesLeft - 1;
      setGuessesLeft(newGuesses);
      setLastDot(true);
      setTimeout(() => setLastDot(false), 400);
      setTimeout(() => {
        setGrid(prev => { const g = prev.map(r => [...r]); g[row][col] = null; return g; });
      }, 700);
      if (newGuesses === 0) setTimeout(() => setGameOver("lost"), 900);
    }
    setQuery("");
    setFocusedIdx(0);
  }, [activeCell, checking, grid, guessesLeft, usedMovies]);

  function handleKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusedIdx(i => Math.min(i+1, results.length-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocusedIdx(i => Math.max(i-1, 0)); }
    else if (e.key === "Enter") {
      const sel = results[focusedIdx];
      if (sel && !sel.used) handleGuess(sel.title);
      else if (query.trim()) handleGuess(query.trim());
    }
  }

  function copyResult() {
    const squares = grid.flat().map(c => c?.status === "correct" ? "🟩" : "⬛").join("").match(/.{3}/g).join("\n");
    const text = `🎬 Marquee — The Grid #${PUZZLE.num}\n${squares}\n${correctCount}/9 · ${fmtTime(seconds)} · ${TOTAL_GUESSES - guessesLeft} wrong`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  }

  const usedDots = TOTAL_GUESSES - guessesLeft;

  return (
    <>
      <style>{STYLE}</style>
      <div className="tg-root">

        <div className="tg-header">
          <button className="tg-back-btn" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 13 14" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,2 4,7 9,12"/>
            </svg>
          </button>
          <div className="tg-logo">Mar<em>quee</em> — The Grid</div>
          <div className="tg-header-right">
            <div className="tg-timer-wrap">
              <div className="tg-timer">{fmtTime(seconds)}</div>
              <div className="tg-timer-lbl">Time</div>
            </div>
            <div className="tg-guesses-pill">
              <div className="tg-dots">
                {Array(Math.min(TOTAL_GUESSES, 10)).fill(null).map((_, i) => (
                  <div key={i} className={`tg-dot ${i < usedDots ? "used" : ""} ${i === usedDots - 1 && lastDot ? "last" : ""}`} />
                ))}
              </div>
              <div className="tg-guesses-count">{guessesLeft}</div>
            </div>
            <button className="tg-help-btn" onClick={() => setShowHelp(true)}>?</button>
          </div>
        </div>

        <div className="tg-grid-wrap">
          <div className="tg-grid">
            <div className="tg-corner"><div className="tg-day-lbl">PUZZLE<br/>#{PUZZLE.num}</div></div>
            {PUZZLE.categories.map((cat, c) => (
              <div key={c} className="tg-cat-header">
                <div className="tg-cat-icon">{cat.icon}</div>
                <div className="tg-cat-name">{cat.label}</div>
              </div>
            ))}
            {PUZZLE.actors.map((actor, r) => (
              <>
                <div key={`actor-${r}`} className="tg-actor-header">
                  <div className="tg-actor-avatar">{actor.split(" ").map(w => w[0]).join("")}</div>
                  <div className="tg-actor-name">{actor.split(" ")[0]}<br/>{actor.split(" ")[1]}</div>
                </div>
                {PUZZLE.categories.map((_, c) => {
                  const cell = grid[r][c];
                  const isActive = activeCell?.row === r && activeCell?.col === c;
                  let cls = "tg-cell";
                  if (isActive) cls += " active";
                  if (cell?.status === "correct") cls += " correct";
                  if (cell?.status === "wrong") cls += " wrong";
                  return (
                    <div key={`cell-${r}-${c}`} className={cls} onClick={() => handleCellClick(r, c)}>
                      {cell?.status === "correct" ? (
                        <>
                          <div className="tg-cell-text">{cell.movie}</div>
                          {cell.rarity > 1 && <div className="tg-rarity">{RARITY_LABELS[cell.rarity]}</div>}
                        </>
                      ) : (
                        <div className="tg-cell-text" style={{color:"var(--text3)"}}>tap</div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        <div className="tg-ctx-wrap">
          {activeCell && (
            <div className="tg-ctx-badge">
              <strong>{PUZZLE.actors[activeCell.row]}</strong> × <strong>{PUZZLE.categories[activeCell.col].label}</strong>
            </div>
          )}
        </div>

        {activeCell && !gameOver && (
          <div className="tg-search-wrap">
            <input
              ref={inputRef}
              className="tg-search-input"
              placeholder={checking ? "Checking…" : "Search movies…"}
              value={query}
              disabled={checking}
              onChange={e => { setQuery(e.target.value); setFocusedIdx(0); }}
              onKeyDown={handleKey}
            />
            {!checking && results.length > 0 && (
              <div className="tg-dropdown">
                {results.map((r, i) => (
                  <div
                    key={r.id}
                    className={`tg-option ${i === focusedIdx ? "focused" : ""} ${r.used ? "used" : ""}`}
                    onClick={() => !r.used && handleGuess(r.title)}
                  >
                    <span>{r.title}{r.year && <span className="tg-option-year"> {r.year}</span>}</span>
                    {r.used && <span className="tg-used-tag">Used</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="tg-bottom">
          <div className="tg-progress">
            <strong>{correctCount}</strong>/9 correct
          </div>
          <div style={{fontSize:"12px",color:"var(--text2)"}}>
            {TOTAL_GUESSES - guessesLeft} wrong
          </div>
        </div>

        {/* HOW TO PLAY */}
        {showHelp && (
          <div className="tg-overlay" onClick={() => setShowHelp(false)}>
            <div className="tg-sheet" onClick={e => e.stopPropagation()}>
              <div className="tg-sheet-handle" />
              <div className="tg-sheet-title">The <em>Grid</em></div>
              <div className="tg-sheet-sub">Fill the grid with films that match each actor and category.</div>
              {[
                ["A 3×3 grid: 3 actors down the left, 3 categories across the top.","Layout"],
                ["Tap a cell, then search for a film starring that row's actor that fits the column's category.","Play"],
                ["No movie can appear twice. Wrong answers cost a guess from your shared pool.","Rules"],
                ["Rarer answers score higher. Fewer guesses + faster time = better score.","Scoring"],
              ].map(([text, label], i) => (
                <div key={i} className="tg-how-row">
                  <div className="tg-how-num">{i+1}</div>
                  <div className="tg-how-text"><strong>{label}:</strong> {text}</div>
                </div>
              ))}
              <button className="tg-sheet-btn" onClick={() => setShowHelp(false)}>Let's Play →</button>
            </div>
          </div>
        )}

        {/* WIN / LOSE */}
        {gameOver && (
          <div className="tg-end-overlay">
            <div className="tg-end-card">
              <div className="tg-end-icon">{gameOver === "won" ? "🏆" : "🎬"}</div>
              <div className="tg-end-title">
                {gameOver === "won" ? <>The <em>Grid!</em></> : "No More Guesses"}
              </div>
              <div className="tg-end-sub">
                {gameOver === "won"
                  ? `Puzzle #${PUZZLE.num} complete · ${fmtTime(seconds)}`
                  : `${correctCount}/9 cells filled · Better luck tomorrow`}
              </div>
              <div className="tg-end-stats">
                <div className="tg-end-stat">
                  <div className="tg-end-val">{correctCount}/9</div>
                  <div className="tg-end-lbl">Correct</div>
                </div>
                <div className="tg-end-stat">
                  <div className="tg-end-val">{guessesLeft}</div>
                  <div className="tg-end-lbl">Left</div>
                </div>
                <div className="tg-end-stat">
                  <div className="tg-end-val">{fmtTime(seconds)}</div>
                  <div className="tg-end-lbl">Time</div>
                </div>
              </div>
              <div className="tg-result-grid">
                {grid.flat().map((c, i) => (
                  <div key={i} className={`tg-result-sq ${c?.status === "correct" ? "g" : "e"}`}>
                    {c?.status === "correct" ? "🟩" : "⬛"}
                  </div>
                ))}
              </div>
              <button className="tg-sheet-btn" onClick={copyResult}>Share Result</button>
              {copied && <div className="tg-copied">✓ Copied to clipboard</div>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
