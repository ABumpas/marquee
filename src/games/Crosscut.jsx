import { useState, useEffect, useCallback } from "react";
import PUZZLES from "../puzzles.js";

/* ── PUZZLE LOOKUP ── */
const TODAY = new Date().toISOString().slice(0, 10);
const { movies: ALL_MOVIES, rowThemes: ROW_THEMES, colTheme: COL_THEME, num: PUZZLE_NUM } =
  PUZZLES[TODAY]?.crosscut ?? PUZZLES[Object.keys(PUZZLES).sort().at(-1)].crosscut;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function checkRow(grid, r) { return grid.slice(r*4, r*4+4).every(m => m.row === r); }
function checkCol(grid, c) { return [0,1,2,3].every(r => grid[r*4+c].isCol); }
function getSolvedCol(grid) {
  for (let c = 0; c < 4; c++) if (checkCol(grid, c)) return c;
  return null;
}
function fmtTime(s) {
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

/* ── STYLES ── */
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #07080D; }

  :root {
    --bg:         #07080D;
    --bg2:        #0C0E15;
    --surface:    #10121A;
    --surface2:   #161921;
    --border:     #1E2130;
    --border2:    #272B3A;
    --gold:       #C9A84C;
    --gold-l:     #E4C97A;
    --gold-dim:   #C9A84C30;
    --gold-glow:  #C9A84C44;
    --gold-line:  #C9A84C18;
    --cream:      #F0EAE0;
    --text:       #EDE8E0;
    --text2:      #6B7080;
    --text3:      #2A2D38;
    --green:      #4BA876;
    --green-dim:  #4BA87622;
    --green-glow: #4BA87644;
    --red:        #C45050;
    --radius:     12px;
  }

  .cc-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    min-height: 100vh;
    color: var(--text);
    display: flex;
    flex-direction: column;
    max-width: 430px;
    margin: 0 auto;
    position: relative;
  }

  /* ── HEADER ── */
  .cc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px 12px;
    border-bottom: 1px solid var(--border);
  }

  .cc-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--cream);
    letter-spacing: 0.3px;
  }
  .cc-logo em { color: var(--gold); font-style: italic; }

  .cc-header-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .cc-timer-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
  }

  .cc-timer {
    font-family: 'DM Mono', monospace;
    font-size: 15px;
    color: var(--cream);
    line-height: 1;
  }

  .cc-timer-lbl {
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text2);
  }

  .cc-help-btn {
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
  .cc-help-btn:hover { border-color: var(--gold); color: var(--gold); }

  .cc-back-btn {
    width: 28px; height: 28px;
    border-radius: var(--radius);
    border: 1px solid var(--border2);
    background: var(--surface2);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .cc-back-btn:hover { border-color: var(--gold); }
  .cc-back-btn:hover svg polyline { stroke: var(--gold); }

  /* ── LEGEND STRIP ── */
  .cc-strip {
    padding: 8px 18px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .cc-strip-lbl {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text2);
    white-space: nowrap;
  }

  .cc-legend { display: flex; gap: 14px; }

  .cc-legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--text2);
  }

  .cc-legend-dot {
    width: 10px; height: 10px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .cc-legend-dot.green { background: var(--green); }
  .cc-legend-dot.gold  { border: 2px solid var(--gold); }

  /* ── PROGRESS PIPS ── */
  .cc-pips {
    display: flex;
    gap: 5px;
    padding: 10px 16px 0;
  }

  .cc-pip {
    flex: 1;
    height: 3px;
    border-radius: 99px;
    background: var(--surface2);
    transition: background 0.4s;
  }
  .cc-pip.row-done { background: var(--green); }
  .cc-pip.col-done { background: var(--gold); }

  /* ── GRID ── */
  .cc-grid-wrap { padding: 12px 14px 8px; flex: 1; }

  .cc-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  /* ── TILE ── */
  .cc-tile {
    aspect-ratio: 1;
    border-radius: var(--radius);
    background: var(--surface);
    border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    text-align: center;
    padding: 6px;
    cursor: pointer;
    position: relative;
    transition: background 0.3s, border-color 0.3s, transform 0.12s, box-shadow 0.3s;
    -webkit-tap-highlight-color: transparent;
  }

  .cc-tile:active { transform: scale(0.93); }

  .cc-tile-text {
    font-size: 10px;
    font-weight: 500;
    line-height: 1.25;
    color: var(--text);
  }

  .cc-tile.selected {
    background: var(--surface2);
    border-color: var(--cream);
    transform: scale(1.04);
  }

  .cc-tile.row-solved {
    background: var(--green-dim);
    border-color: var(--green);
    cursor: default;
  }
  .cc-tile.row-solved .cc-tile-text { color: var(--green); }

  .cc-tile.col-solved {
    box-shadow: 0 0 0 2px var(--gold), 0 0 10px var(--gold-glow);
  }

  .cc-tile.row-solved.col-solved {
    background: #141A10;
    border-color: var(--green);
    box-shadow: 0 0 0 2.5px var(--gold), 0 0 12px var(--gold-glow);
  }

  .cc-tile.pulse { animation: tilePulse 0.5s ease; }

  @keyframes tilePulse {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.07); }
    100% { transform: scale(1); }
  }

  /* ── BOTTOM BAR ── */
  .cc-bottom {
    padding: 10px 16px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg2);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .cc-moves { font-size: 13px; color: var(--text2); }
  .cc-moves strong { color: var(--cream); }

  .cc-hint-btn {
    padding: 7px 16px;
    border-radius: 99px;
    border: 1px solid var(--border2);
    background: transparent;
    color: var(--text2);
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  .cc-hint-btn:hover { border-color: var(--gold); color: var(--gold); }
  .cc-hint-btn:disabled { opacity: 0.3; cursor: default; }

  /* ── OVERLAYS ── */
  .cc-overlay {
    position: fixed;
    inset: 0;
    background: rgba(7,8,13,0.88);
    display: flex;
    align-items: flex-end;
    z-index: 50;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .cc-sheet {
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

  .cc-sheet-handle {
    width: 36px; height: 3px;
    background: var(--border2);
    border-radius: 99px;
    margin: 0 auto 20px;
  }

  .cc-sheet-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 4px;
  }
  .cc-sheet-title em { color: var(--gold); font-style: italic; }

  .cc-sheet-sub { font-size: 12px; color: var(--text2); margin-bottom: 20px; }

  .cc-how-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .cc-how-num {
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

  .cc-how-text { font-size: 13px; color: var(--text2); line-height: 1.5; }
  .cc-how-text strong { color: var(--cream); }

  .cc-sheet-btn {
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
  .cc-sheet-btn:hover { opacity: 0.9; }

  /* win overlay */
  .cc-win-overlay {
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

  .cc-win-card {
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

  .cc-win-icon { font-size: 40px; margin-bottom: 12px; }

  .cc-win-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 4px;
  }
  .cc-win-title em { color: var(--gold); font-style: italic; }

  .cc-win-sub { font-size: 12px; color: var(--text2); margin-bottom: 20px; }

  .cc-win-stats {
    display: flex;
    gap: 8px;
    margin-bottom: 18px;
  }

  .cc-win-stat {
    flex: 1;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 8px;
  }

  .cc-win-val {
    font-family: 'DM Mono', monospace;
    font-size: 20px;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 4px;
  }

  .cc-win-lbl {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text2);
  }

  .cc-win-themes {
    margin-bottom: 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cc-win-theme {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    text-align: left;
  }
  .cc-win-theme.green { background: var(--green-dim); color: var(--green); border: 1px solid #4BA87640; }
  .cc-win-theme.gold  { background: var(--gold-dim);  color: var(--gold);  border: 1px solid #C9A84C40; }
  .cc-win-theme-icon  { font-size: 13px; flex-shrink: 0; }

  .cc-copied { font-size: 11px; color: var(--green); margin-top: 8px; min-height: 14px; }
`;

export default function Crosscut({ onBack }) {
  const [grid, setGrid]             = useState(() => shuffle(ALL_MOVIES));
  const [selected, setSelected]     = useState(null);
  const [solvedRows, setSolvedRows] = useState([false,false,false,false]);
  const [solvedCol, setSolvedCol]   = useState(null);
  const [timer, setTimer]           = useState(0);
  const [moves, setMoves]           = useState(0);
  const [won, setWon]               = useState(false);
  const [showHelp, setShowHelp]     = useState(false);
  const [copied, setCopied]         = useState(false);
  const [pulsingIdxs, setPulsingIdxs] = useState([]);
  const [hintsLeft, setHintsLeft]   = useState(3);

  useEffect(() => {
    if (won) return;
    const t = setInterval(() => setTimer(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [won, showHelp]);

  const evaluate = useCallback((g) => {
    const rows = [0,1,2,3].map(r => checkRow(g, r));
    const col  = getSolvedCol(g);
    return { rows, col };
  }, []);

  function handleTileClick(idx) {
    if (won) return;
    if (selected === null) {
      setSelected(idx);
    } else {
      if (selected === idx) { setSelected(null); return; }

      const newGrid = [...grid];
      [newGrid[selected], newGrid[idx]] = [newGrid[idx], newGrid[selected]];
      setGrid(newGrid);
      setSelected(null);
      setMoves(m => m + 1);

      const { rows: newRows, col: newCol } = evaluate(newGrid);

      const newlySolved = [];
      newRows.forEach((solved, r) => {
        if (solved && !solvedRows[r])
          for (let c = 0; c < 4; c++) newlySolved.push(r*4+c);
      });
      if (newCol !== null && solvedCol === null)
        for (let r = 0; r < 4; r++) newlySolved.push(r*4+newCol);

      if (newlySolved.length) {
        setPulsingIdxs(newlySolved);
        setTimeout(() => setPulsingIdxs([]), 500);
      }

      setSolvedRows(newRows);
      setSolvedCol(newCol);

      if (newRows.every(Boolean) && newCol !== null)
        setTimeout(() => setWon(true), 650);
    }
  }

  function useHint() {
    if (hintsLeft === 0 || won) return;
    const firstUnsolved = grid.findIndex((m, i) => {
      const rowIdx = Math.floor(i/4);
      return !solvedRows[rowIdx] && m.row !== rowIdx;
    });
    if (firstUnsolved === -1) return;

    const movie = grid[firstUnsolved];
    const correctRowStart = movie.row * 4;
    let swapTarget = -1;
    for (let c = 0; c < 4; c++) {
      const tIdx = correctRowStart + c;
      if (grid[tIdx].row !== movie.row) { swapTarget = tIdx; break; }
    }
    if (swapTarget === -1) return;

    const newGrid = [...grid];
    [newGrid[firstUnsolved], newGrid[swapTarget]] = [newGrid[swapTarget], newGrid[firstUnsolved]];
    setGrid(newGrid);
    setHintsLeft(h => h - 1);
    setMoves(m => m + 1);

    const { rows: newRows, col: newCol } = evaluate(newGrid);
    setSolvedRows(newRows);
    setSolvedCol(newCol);
    if (newRows.every(Boolean) && newCol !== null) setTimeout(() => setWon(true), 650);
  }

  function copyResult() {
    const rowEmojis = solvedRows.map(s => s ? "🟩" : "⬛");
    const colEmoji  = solvedCol !== null ? "🟨" : "⬛";
    const text = `🎬 Marquee — Crosscut #${PUZZLE_NUM}\n⏱ ${fmtTime(timer)}  🎬 ${moves} moves\n${rowEmojis.join("")}${colEmoji}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  }

  const solvedCount = solvedRows.filter(Boolean).length + (solvedCol !== null ? 1 : 0);

  return (
    <>
      <style>{STYLE}</style>
      <div className="cc-root">

        <div className="cc-header">
          <button className="cc-back-btn" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 13 14" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,2 4,7 9,12"/>
            </svg>
          </button>
          <div className="cc-logo">Mar<em>quee</em> — Cross<em>cut</em></div>
          <div className="cc-header-right">
            <div className="cc-timer-wrap">
              <div className="cc-timer">{fmtTime(timer)}</div>
              <div className="cc-timer-lbl">Time</div>
            </div>
            <button className="cc-help-btn" onClick={() => setShowHelp(true)}>?</button>
          </div>
        </div>

        <div className="cc-strip">
          <span className="cc-strip-lbl">Key</span>
          <div className="cc-legend">
            <div className="cc-legend-item">
              <div className="cc-legend-dot green" />
              Row theme solved
            </div>
            <div className="cc-legend-item">
              <div className="cc-legend-dot gold" />
              Column theme found
            </div>
          </div>
        </div>

        <div className="cc-pips">
          {[0,1,2,3].map(r => (
            <div key={r} className={`cc-pip ${solvedRows[r] ? "row-done" : ""}`} />
          ))}
          <div className={`cc-pip ${solvedCol !== null ? "col-done" : ""}`} />
        </div>

        <div className="cc-grid-wrap">
          <div className="cc-grid">
            {grid.map((movie, idx) => {
              const rowIdx = Math.floor(idx/4);
              const colIdx = idx % 4;
              const isRowSolved = solvedRows[rowIdx];
              const isColSolved = solvedCol === colIdx && movie.isCol;
              const isSelected  = selected === idx;
              const isPulsing   = pulsingIdxs.includes(idx);

              let cls = "cc-tile";
              if (isSelected)  cls += " selected";
              if (isRowSolved) cls += " row-solved";
              if (isColSolved) cls += " col-solved";
              if (isPulsing)   cls += " pulse";

              return (
                <div key={movie.id} className={cls} onClick={() => handleTileClick(idx)}>
                  <span className="cc-tile-text">{movie.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cc-bottom">
          <div className="cc-moves">
            <strong>{moves}</strong> moves · {solvedCount}/5 found
          </div>
          <button className="cc-hint-btn" onClick={useHint} disabled={hintsLeft === 0 || won}>
            Hint ({hintsLeft})
          </button>
        </div>

        {/* HOW TO PLAY */}
        {showHelp && (
          <div className="cc-overlay" onClick={() => setShowHelp(false)}>
            <div className="cc-sheet" onClick={e => e.stopPropagation()}>
              <div className="cc-sheet-handle" />
              <div className="cc-sheet-title">Cross<em>cut</em></div>
              <div className="cc-sheet-sub">Group the films by hidden theme — and find the secret column.</div>
              {[
                ["A 4×4 grid of shuffled movies. Each row hides a theme — genre, era, cast, or more.","The Grid"],
                ["Tap a tile to select it, then tap another to swap their positions.","Swap"],
                ["Rows glow green when all four films correctly share the same theme.","Rows"],
                ["One column across all four rows shares a hidden cross-cutting theme. Find it to win.","Column"],
                ["Stuck? Use a hint to nudge one tile into place. You have 3.","Hints"],
              ].map(([text, label], i) => (
                <div key={i} className="cc-how-row">
                  <div className="cc-how-num">{i+1}</div>
                  <div className="cc-how-text"><strong>{label}:</strong> {text}</div>
                </div>
              ))}
              <button className="cc-sheet-btn" onClick={() => setShowHelp(false)}>Let's Play →</button>
            </div>
          </div>
        )}

        {/* WIN */}
        {won && (
          <div className="cc-win-overlay">
            <div className="cc-win-card">
              <div className="cc-win-icon">🎬</div>
              <div className="cc-win-title">Cross<em>cut</em> Solved!</div>
              <div className="cc-win-sub">You cracked today's puzzle</div>
              <div className="cc-win-stats">
                <div className="cc-win-stat">
                  <div className="cc-win-val">{fmtTime(timer)}</div>
                  <div className="cc-win-lbl">Time</div>
                </div>
                <div className="cc-win-stat">
                  <div className="cc-win-val">{moves}</div>
                  <div className="cc-win-lbl">Moves</div>
                </div>
                <div className="cc-win-stat">
                  <div className="cc-win-val">{3 - hintsLeft}</div>
                  <div className="cc-win-lbl">Hints</div>
                </div>
              </div>
              <div className="cc-win-themes">
                {ROW_THEMES.map((theme, i) => (
                  <div key={i} className="cc-win-theme green">
                    <span className="cc-win-theme-icon">🟩</span>
                    Row {i+1}: {theme}
                  </div>
                ))}
                <div className="cc-win-theme gold">
                  <span className="cc-win-theme-icon">🟨</span>
                  Column: {COL_THEME}
                </div>
              </div>
              <button className="cc-sheet-btn" onClick={copyResult}>Share Result</button>
              {copied && <div className="cc-copied">✓ Copied to clipboard</div>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
