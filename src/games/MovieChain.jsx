import { useState, useEffect, useRef, useCallback } from "react";
import PUZZLES from "../puzzles.js";

/* ── PUZZLE LOOKUP ── */
const TODAY = new Date().toISOString().slice(0, 10);
const { actorA: ACTOR_A, actorB: ACTOR_B } =
  PUZZLES[TODAY]?.chain ?? PUZZLES[Object.keys(PUZZLES).sort().at(-1)].chain;

const DB = {
  "Tom Hanks":          ["Forrest Gump","Cast Away","Saving Private Ryan","The Green Mile","Philadelphia","Catch Me If You Can","The Terminal","Charlie Wilson's War","Road to Perdition","Captain Phillips"],
  "Robin Wright":       ["Forrest Gump","The Princess Bride","Moneyball","Wonder Woman","Blade Runner 2049"],
  "Gary Sinise":        ["Forrest Gump","Ransom","Snake Eyes","Mission to Mars","Of Mice and Men"],
  "Tom Sizemore":       ["Saving Private Ryan","Black Hawk Down","Heat","Natural Born Killers"],
  "Matt Damon":         ["Saving Private Ryan","Good Will Hunting","The Martian","Interstellar","Elysium","The Departed","Ocean's Eleven","We Bought a Zoo","Downsizing"],
  "Scarlett Johansson": ["We Bought a Zoo","Lost in Translation","Her","Match Point","Don Jon","Ghost World","The Prestige","Marriage Story"],
  "Leonardo DiCaprio":  ["The Departed","Catch Me If You Can","Gangs of New York","Titanic","Inception","The Aviator","Django Unchained","The Revenant"],
  "Steven Spielberg":   [],
  "Cate Blanchett":     ["The Aviator","The Lord of the Rings: The Fellowship of the Ring","Babel","Notes on a Scandal","Blue Jasmine","Carol"],
  "Ben Kingsley":       ["Schindler's List","Gandhi","Shutter Island","Sexy Beast","Iron Man 3"],
};

function getMoviesForActor(actor) { return DB[actor] || []; }
function getActorsForMovie(movie) {
  return Object.entries(DB).filter(([,movies]) => movies.includes(movie)).map(([a]) => a);
}
function getAllMovies() { return [...new Set(Object.values(DB).flat())]; }
function getAllActors() { return Object.keys(DB); }

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

  .mc-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    min-height: 100vh;
    color: var(--text);
    display: flex;
    flex-direction: column;
    max-width: 430px;
    margin: 0 auto;
  }

  /* ── HEADER ── */
  .mc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px 12px;
    border-bottom: 1px solid var(--border);
  }

  .mc-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--cream);
    letter-spacing: 0.3px;
  }

  .mc-logo em { color: var(--gold); font-style: italic; }

  .mc-header-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .mc-timer-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
  }

  .mc-timer {
    font-family: 'DM Mono', monospace;
    font-size: 15px;
    color: var(--cream);
    line-height: 1;
  }

  .mc-timer.flash { color: var(--red); animation: timerFlash 0.5s ease; }

  @keyframes timerFlash {
    0%,100% { color: var(--red); }
    50%     { color: var(--cream); }
  }

  .mc-timer-lbl {
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text2);
  }

  .mc-help-btn {
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
  .mc-help-btn:hover { border-color: var(--gold); color: var(--gold); }

  .mc-back-btn {
    width: 28px; height: 28px;
    border-radius: var(--radius);
    border: 1px solid var(--border2);
    background: var(--surface2);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .mc-back-btn:hover { border-color: var(--gold); }
  .mc-back-btn:hover svg polyline { stroke: var(--gold); }

  /* ── CHALLENGE BANNER ── */
  .mc-challenge {
    margin: 14px 16px 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px 16px;
    position: relative;
    overflow: hidden;
  }

  .mc-challenge::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--gold-dim), transparent);
  }

  .mc-challenge-lbl {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text2);
    margin-bottom: 10px;
  }

  .mc-actors {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .mc-actor-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 8px;
    padding: 7px 12px;
    flex: 1;
  }

  .mc-actor-chip.target { border-color: var(--gold-dim); }

  .mc-actor-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: var(--border2);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
    color: var(--text2);
    font-weight: 600;
    flex-shrink: 0;
  }

  .mc-actor-chip.target .mc-actor-avatar {
    background: var(--gold-dim);
    color: var(--gold-l);
  }

  .mc-actor-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--cream);
    line-height: 1.2;
  }

  .mc-actor-sub {
    font-size: 10px;
    color: var(--text2);
  }

  .mc-chain-arrow {
    color: var(--text2);
    font-size: 16px;
    flex-shrink: 0;
  }

  /* ── CHAIN SCROLL ── */
  .mc-chain-wrap {
    flex: 1;
    overflow-y: auto;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .mc-chain-wrap::-webkit-scrollbar { width: 3px; }
  .mc-chain-wrap::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

  .mc-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    animation: linkIn 0.25s ease both;
  }

  @keyframes linkIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .mc-link-type {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text2);
    width: 36px;
    flex-shrink: 0;
  }

  .mc-link-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--cream);
    flex: 1;
  }

  .mc-link.penalty {
    border-color: var(--red-dim);
    background: var(--red-dim);
  }

  .mc-link.penalty .mc-link-type { color: var(--red); }
  .mc-link.penalty .mc-link-name { color: var(--red); }

  .mc-link-connector {
    display: flex;
    justify-content: center;
    padding: 2px 0;
    color: var(--text3);
    font-size: 12px;
  }

  /* ── SEARCH AREA ── */
  .mc-search-area {
    padding: 0 16px 12px;
  }

  .mc-search-prompt {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text2);
    margin-bottom: 8px;
  }

  .mc-search-box {
    position: relative;
  }

  .mc-search-input {
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

  .mc-search-input::placeholder { color: var(--text2); }
  .mc-search-input:focus { border-color: var(--gold); }

  .mc-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0; right: 0;
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 10px;
    overflow: hidden;
    z-index: 20;
    max-height: 220px;
    overflow-y: auto;
  }

  .mc-dropdown::-webkit-scrollbar { width: 3px; }
  .mc-dropdown::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

  .mc-option {
    padding: 11px 14px;
    font-size: 13px;
    color: var(--text);
    cursor: pointer;
    border-bottom: 1px solid var(--border);
    transition: background 0.1s;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .mc-option:last-child { border-bottom: none; }
  .mc-option:hover, .mc-option.focused { background: var(--border); }
  .mc-option.used { opacity: 0.4; pointer-events: none; }

  .mc-option-tag {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text2);
    padding: 3px 7px;
    background: var(--border);
    border-radius: 4px;
  }

  /* ── BOTTOM BAR ── */
  .mc-bottom {
    padding: 10px 16px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg2);
  }

  .mc-steps {
    font-size: 13px;
    color: var(--text2);
  }
  .mc-steps strong { color: var(--cream); }

  .mc-penalty-note {
    font-size: 11px;
    color: var(--red);
    margin-top: 2px;
  }

  /* ── TOAST ── */
  .mc-toast {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface2);
    border: 1px solid var(--red);
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 12px;
    color: var(--red);
    white-space: nowrap;
    animation: toastIn 0.2s ease;
    z-index: 30;
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* ── MODAL / WIN ── */
  .mc-overlay {
    position: fixed;
    inset: 0;
    background: rgba(7,8,13,0.88);
    display: flex;
    align-items: flex-end;
    z-index: 50;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .mc-sheet {
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

  .mc-sheet-handle {
    width: 36px; height: 3px;
    background: var(--border2);
    border-radius: 99px;
    margin: 0 auto 20px;
  }

  .mc-sheet-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 4px;
  }
  .mc-sheet-title em { color: var(--gold); font-style: italic; }

  .mc-sheet-sub {
    font-size: 12px;
    color: var(--text2);
    margin-bottom: 20px;
  }

  .mc-how-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .mc-how-num {
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

  .mc-how-text {
    font-size: 13px;
    color: var(--text2);
    line-height: 1.5;
  }

  .mc-how-text strong { color: var(--cream); }

  .mc-sheet-btn {
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
    letter-spacing: 0.3px;
  }

  .mc-sheet-btn:hover { opacity: 0.9; }

  /* win card */
  .mc-win-center {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 24px;
  }

  .mc-win-card {
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

  .mc-win-icon { font-size: 40px; margin-bottom: 12px; }

  .mc-win-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 4px;
  }
  .mc-win-title em { color: var(--gold); font-style: italic; }

  .mc-win-sub { font-size: 12px; color: var(--text2); margin-bottom: 20px; }

  .mc-win-stats {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }

  .mc-win-stat {
    flex: 1;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 8px;
  }

  .mc-win-val {
    font-family: 'DM Mono', monospace;
    font-size: 20px;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 4px;
  }

  .mc-win-lbl {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text2);
  }

  .mc-win-chain {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 16px;
    text-align: left;
    max-height: 140px;
    overflow-y: auto;
  }

  .mc-win-chain-item {
    font-size: 12px;
    color: var(--text2);
    padding: 3px 0;
    border-bottom: 1px solid var(--border);
  }
  .mc-win-chain-item:last-child { border-bottom: none; }
  .mc-win-chain-item strong { color: var(--cream); }

  .mc-copied { font-size: 11px; color: var(--green); margin-top: 8px; min-height: 14px; }
`;

export default function MovieChain({ onBack }) {
  const [chain, setChain] = useState([{ type: "ACTOR", name: ACTOR_A }]);
  const [query, setQuery] = useState("");
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [used, setUsed] = useState(new Set([ACTOR_A.toLowerCase()]));
  const [penalties, setPenalties] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [timerFlash, setTimerFlash] = useState(false);
  const [toast, setToast] = useState("");
  const [won, setWon] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (won) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [won, showHelp]);

  const lastLink = chain[chain.length - 1];
  const needsMovie = lastLink.type === "ACTOR";
  const currentActor = needsMovie ? lastLink.name : chain[chain.length - 2]?.name;

  const results = useCallback(() => {
    const q = query.toLowerCase();
    if (!q) return [];
    if (needsMovie) {
      return getAllMovies()
        .filter(m => m.toLowerCase().includes(q))
        .slice(0, 8)
        .map(m => ({ name: m, used: used.has(m.toLowerCase()) }));
    } else {
      const movie = lastLink.name;
      return getActorsForMovie(movie)
        .filter(a => a.toLowerCase().includes(q) && a !== currentActor)
        .slice(0, 8)
        .map(a => ({ name: a, used: used.has(a.toLowerCase()) }));
    }
  }, [query, needsMovie, lastLink, used, currentActor]);

  const options = results();

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function addLink(name) {
    const key = name.toLowerCase();
    let isPenalty = false;

    if (used.has(key)) {
      isPenalty = true;
      setSeconds(s => s + 15);
      setPenalties(p => p + 1);
      setTimerFlash(true);
      setTimeout(() => setTimerFlash(false), 600);
      showToast(`+15s penalty — ${name} already used`);
    }

    const type = needsMovie ? "MOVIE" : "ACTOR";
    const newChain = [...chain, { type, name, penalty: isPenalty }];
    setChain(newChain);
    setUsed(prev => new Set([...prev, key]));
    setQuery("");
    setFocusedIdx(0);

    if (type === "ACTOR" && name === ACTOR_B) {
      setTimeout(() => setWon(true), 300);
    }
  }

  function handleKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusedIdx(i => Math.min(i+1, options.length-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocusedIdx(i => Math.max(i-1, 0)); }
    else if (e.key === "Enter" && options[focusedIdx]) addLink(options[focusedIdx].name);
  }

  function copyResult() {
    const steps = Math.floor((chain.length - 1) / 2);
    const text = `🎬 Marquee — Movie Chain\n${ACTOR_A} → ${ACTOR_B}\n${steps} steps · ${fmtTime(seconds)} · ${penalties} penalties`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  }

  const steps = Math.floor((chain.length - 1) / 2);

  return (
    <>
      <style>{STYLE}</style>
      <div className="mc-root">

        <div className="mc-header">
          <button className="mc-back-btn" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 13 14" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,2 4,7 9,12"/>
            </svg>
          </button>
          <div className="mc-logo">Mar<em>quee</em> — Movie Chain</div>
          <div className="mc-header-right">
            <div className="mc-timer-wrap">
              <div className={`mc-timer ${timerFlash ? "flash" : ""}`}>{fmtTime(seconds)}</div>
              <div className="mc-timer-lbl">Time</div>
            </div>
            <button className="mc-help-btn" onClick={() => setShowHelp(true)}>?</button>
          </div>
        </div>

        <div className="mc-challenge">
          <div className="mc-challenge-lbl">Today's Challenge</div>
          <div className="mc-actors">
            <div className="mc-actor-chip">
              <div className="mc-actor-avatar">TH</div>
              <div>
                <div className="mc-actor-name">{ACTOR_A}</div>
                <div className="mc-actor-sub">Start</div>
              </div>
            </div>
            <div className="mc-chain-arrow">→</div>
            <div className="mc-actor-chip target">
              <div className="mc-actor-avatar">SJ</div>
              <div>
                <div className="mc-actor-name">{ACTOR_B}</div>
                <div className="mc-actor-sub">Target</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mc-chain-wrap">
          {chain.map((link, i) => (
            <div key={i}>
              {i > 0 && <div className="mc-link-connector">↓</div>}
              <div className={`mc-link ${link.penalty ? "penalty" : ""}`}>
                <div className="mc-link-type">{link.type}</div>
                <div className="mc-link-name">{link.name}</div>
                {link.penalty && <span style={{fontSize:"10px",color:"var(--red)"}}>+15s</span>}
              </div>
            </div>
          ))}
        </div>

        {!won && (
          <div className="mc-search-area">
            <div className="mc-search-prompt">
              {needsMovie ? `Pick a film starring ${lastLink.name}` : `Pick a co-star from ${lastLink.name}`}
            </div>
            <div className="mc-search-box">
              <input
                ref={inputRef}
                className="mc-search-input"
                placeholder={needsMovie ? "Search movies…" : "Search actors…"}
                value={query}
                onChange={e => { setQuery(e.target.value); setFocusedIdx(0); }}
                onKeyDown={handleKey}
                autoFocus
              />
              {options.length > 0 && (
                <div className="mc-dropdown">
                  {options.map((o, i) => (
                    <div
                      key={o.name}
                      className={`mc-option ${i === focusedIdx ? "focused" : ""} ${o.used ? "used" : ""}`}
                      onClick={() => !o.used && addLink(o.name)}
                    >
                      {o.name}
                      {o.used && <span className="mc-option-tag">Used (+15s)</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mc-bottom">
          <div>
            <div className="mc-steps"><strong>{steps}</strong> steps taken</div>
            {penalties > 0 && <div className="mc-penalty-note">{penalties} penalt{penalties === 1 ? "y" : "ies"}</div>}
          </div>
        </div>

        {toast && <div className="mc-toast">{toast}</div>}

        {/* HOW TO PLAY */}
        {showHelp && (
          <div className="mc-overlay" onClick={() => setShowHelp(false)}>
            <div className="mc-sheet" onClick={e => e.stopPropagation()}>
              <div className="mc-sheet-handle" />
              <div className="mc-sheet-title">Movie <em>Chain</em></div>
              <div className="mc-sheet-sub">Connect two stars through the films they share.</div>
              {[
                ["You're given two actors.", "Start"],
                ["Pick a movie starring the first actor.", "Step 1"],
                ["Pick a co-star from that film, then another movie, and so on.", "Step 2"],
                ["Reach the target actor to complete the chain.", "Win"],
                ["Using an actor or film twice adds a 15-second penalty.", "Penalty"],
              ].map(([text, label], i) => (
                <div key={i} className="mc-how-row">
                  <div className="mc-how-num">{i+1}</div>
                  <div className="mc-how-text"><strong>{label}:</strong> {text}</div>
                </div>
              ))}
              <button className="mc-sheet-btn" onClick={() => setShowHelp(false)}>Let's Play →</button>
            </div>
          </div>
        )}

        {/* WIN */}
        {won && (
          <div className="mc-overlay">
            <div className="mc-win-center">
              <div className="mc-win-card">
                <div className="mc-win-icon">🎬</div>
                <div className="mc-win-title">Chain <em>Complete!</em></div>
                <div className="mc-win-sub">{ACTOR_A} → {ACTOR_B}</div>
                <div className="mc-win-stats">
                  <div className="mc-win-stat">
                    <div className="mc-win-val">{steps}</div>
                    <div className="mc-win-lbl">Steps</div>
                  </div>
                  <div className="mc-win-stat">
                    <div className="mc-win-val">{fmtTime(seconds)}</div>
                    <div className="mc-win-lbl">Time</div>
                  </div>
                  <div className="mc-win-stat">
                    <div className="mc-win-val">{penalties}</div>
                    <div className="mc-win-lbl">Penalties</div>
                  </div>
                </div>
                <div className="mc-win-chain">
                  {chain.map((l, i) => (
                    <div key={i} className="mc-win-chain-item">
                      <strong>{l.type}:</strong> {l.name}
                    </div>
                  ))}
                </div>
                <button className="mc-sheet-btn" onClick={copyResult}>Share Result</button>
                {copied && <div className="mc-copied">✓ Copied to clipboard</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
