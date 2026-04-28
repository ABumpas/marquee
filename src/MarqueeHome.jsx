import { useState, useEffect } from "react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #07080D; }

  :root {
    --bg:         #07080D;
    --bg2:        #0C0E15;
    --surface:    #10121A;
    --surface2:   #161921;
    --border:     #1E2130;
    --border2:    #272B3A;
    --gold:       #C9A84C;
    --gold-light: #E4C97A;
    --gold-dim:   #C9A84C30;
    --gold-line:  #C9A84C18;
    --cream:      #F0EAE0;
    --cream2:     #B8B2A8;
    --text:       #EDE8E0;
    --text2:      #6B7080;
    --text3:      #2E323F;
    --red:        #C45050;
    --green:      #4BA876;
    --radius:     12px;
    --radius-lg:  18px;
  }

  .mq-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    min-height: 100vh;
    color: var(--text);
    display: flex;
    flex-direction: column;
    max-width: 430px;
    margin: 0 auto;
    position: relative;
    overflow-x: hidden;
  }

  /* ── AMBIENT GLOW ── */
  .mq-glow {
    position: fixed;
    top: -120px;
    left: 50%;
    transform: translateX(-50%);
    width: 500px;
    height: 300px;
    background: radial-gradient(ellipse, #C9A84C14 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── HEADER ── */
  .mq-header {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px 32px;
    text-align: center;
  }

  .mq-marquee-lights {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    align-items: center;
  }

  .mq-bulb {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--gold);
    opacity: 0;
    animation: bulb-blink 3.2s ease-in-out infinite;
  }

  .mq-bulb:nth-child(1)  { animation-delay: 0s; }
  .mq-bulb:nth-child(2)  { animation-delay: 0.2s; }
  .mq-bulb:nth-child(3)  { animation-delay: 0.4s; }
  .mq-bulb:nth-child(4)  { animation-delay: 0.6s; }
  .mq-bulb:nth-child(5)  { animation-delay: 0.8s; }
  .mq-bulb:nth-child(6)  { animation-delay: 1.0s; }
  .mq-bulb:nth-child(7)  { animation-delay: 0.8s; }
  .mq-bulb:nth-child(8)  { animation-delay: 0.6s; }
  .mq-bulb:nth-child(9)  { animation-delay: 0.4s; }
  .mq-bulb:nth-child(10) { animation-delay: 0.2s; }
  .mq-bulb:nth-child(11) { animation-delay: 0s; }

  @keyframes bulb-blink {
    0%, 100% { opacity: 0.25; }
    50%       { opacity: 1; box-shadow: 0 0 6px var(--gold); }
  }

  .mq-wordmark {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 52px;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: var(--cream);
    line-height: 1;
    position: relative;
  }

  .mq-wordmark em {
    color: var(--gold);
    font-style: italic;
    font-weight: 600;
  }

  .mq-rule {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 14px 0 12px;
    width: 100%;
    max-width: 260px;
  }

  .mq-rule-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--gold-dim), transparent);
  }

  .mq-rule-diamond {
    width: 5px;
    height: 5px;
    background: var(--gold);
    transform: rotate(45deg);
    flex-shrink: 0;
    opacity: 0.7;
  }

  .mq-tagline {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text2);
  }

  /* ── DATE STRIP ── */
  .mq-date-strip {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 24px 20px;
    gap: 8px;
  }

  .mq-date-pill {
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 99px;
    padding: 5px 14px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text2);
    letter-spacing: 1px;
  }

  /* ── GAME CARDS ── */
  .mq-games {
    position: relative;
    z-index: 10;
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .mq-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px 22px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.25s, transform 0.15s;
    -webkit-tap-highlight-color: transparent;
  }

  .mq-card:active { transform: scale(0.985); }
  .mq-card:hover  { border-color: var(--border2); }
  .mq-card.featured { border-color: var(--gold-dim); }
  .mq-card.featured:hover { border-color: var(--gold); }

  /* card shimmer accent */
  .mq-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--gold-line), transparent);
  }
  .mq-card.featured::before {
    background: linear-gradient(to right, transparent, var(--gold-dim), transparent);
  }

  /* card bg illustration */
  .mq-card-bg {
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 80px;
    opacity: 0.04;
    user-select: none;
    pointer-events: none;
    line-height: 1;
  }

  .mq-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .mq-card-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--cream);
    line-height: 1.05;
  }

  .mq-card-name em {
    color: var(--gold);
    font-style: italic;
  }

  .mq-card-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    background: var(--gold-dim);
    border: 1px solid var(--gold-line);
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 10px;
    font-weight: 600;
    color: var(--gold-light);
    letter-spacing: 0.5px;
    white-space: nowrap;
    flex-shrink: 0;
    margin-left: 12px;
  }

  .mq-card-badge.new {
    background: #4BA87620;
    border-color: #4BA87630;
    color: #6ECC9A;
  }

  .mq-card-desc {
    font-size: 13px;
    color: var(--text2);
    line-height: 1.5;
    margin-bottom: 16px;
    max-width: 240px;
  }

  .mq-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .mq-card-stats {
    display: flex;
    gap: 14px;
  }

  .mq-card-stat {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .mq-card-stat-val {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: var(--cream);
    line-height: 1;
  }

  .mq-card-stat-lbl {
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text2);
  }

  .mq-play-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: 1px solid var(--border2);
    border-radius: 8px;
    padding: 8px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--text2);
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.5px;
  }

  .mq-play-btn:hover { border-color: var(--gold); color: var(--gold); }

  .mq-play-btn svg {
    width: 10px;
    height: 10px;
    fill: currentColor;
    transition: transform 0.2s;
  }

  .mq-play-btn:hover svg { transform: translateX(2px); }

  .mq-card.featured .mq-play-btn {
    border-color: var(--gold-dim);
    color: var(--gold);
  }
  .mq-card.featured .mq-play-btn:hover {
    background: var(--gold-dim);
    border-color: var(--gold);
  }

  /* ── DIVIDER ── */
  .mq-section-label {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 16px 12px;
  }

  .mq-section-line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .mq-section-text {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--text3);
  }

  /* ── STREAK / STATS BAR ── */
  .mq-stats-bar {
    position: relative;
    z-index: 10;
    margin: 0 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-around;
  }

  .mq-stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }

  .mq-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--cream);
    line-height: 1;
  }

  .mq-stat-num.gold { color: var(--gold); }

  .mq-stat-lbl {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text2);
  }

  .mq-stat-divider {
    width: 1px;
    height: 32px;
    background: var(--border);
  }

  /* ── BOTTOM NAV ── */
  .mq-nav {
    position: relative;
    z-index: 10;
    margin-top: auto;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 8px;
    background: var(--bg2);
  }

  .mq-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px 16px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .mq-nav-icon {
    font-size: 18px;
    line-height: 1;
  }

  .mq-nav-lbl {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text2);
    transition: color 0.15s;
  }

  .mq-nav-item.active .mq-nav-lbl { color: var(--gold); }

  /* ── TOAST / MODAL OVERLAY ── */
  .mq-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(7, 8, 13, 0.85);
    display: flex;
    align-items: flex-end;
    z-index: 100;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .mq-sheet {
    width: 100%;
    max-width: 430px;
    margin: 0 auto;
    background: var(--surface);
    border: 1px solid var(--border2);
    border-bottom: none;
    border-radius: 20px 20px 0 0;
    padding: 24px;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  .mq-sheet-handle {
    width: 36px;
    height: 3px;
    background: var(--border2);
    border-radius: 99px;
    margin: 0 auto 20px;
  }

  .mq-sheet-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 4px;
  }

  .mq-sheet-title em { color: var(--gold); font-style: italic; }

  .mq-sheet-sub {
    font-size: 12px;
    color: var(--text2);
    margin-bottom: 20px;
  }

  .mq-how-row {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .mq-how-num {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--gold-dim);
    border: 1px solid var(--gold-line);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--gold-light);
    flex-shrink: 0;
    margin-top: 1px;
  }

  .mq-how-text {
    font-size: 13px;
    color: var(--text2);
    line-height: 1.5;
  }

  .mq-how-text strong { color: var(--cream); font-weight: 600; }

  .mq-sheet-close {
    width: 100%;
    margin-top: 8px;
    background: var(--gold);
    color: #07080D;
    border: none;
    border-radius: 10px;
    padding: 13px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: opacity 0.15s;
  }

  .mq-sheet-close:hover { opacity: 0.9; }

  /* ── ANIMATIONS ── */
  .mq-card {
    opacity: 0;
    transform: translateY(16px);
    animation: cardReveal 0.5s ease forwards;
  }
  .mq-card:nth-child(1) { animation-delay: 0.1s; }
  .mq-card:nth-child(2) { animation-delay: 0.2s; }
  .mq-card:nth-child(3) { animation-delay: 0.3s; }

  @keyframes cardReveal {
    to { opacity: 1; transform: translateY(0); }
  }

  .mq-header { animation: headerReveal 0.6s ease both; }
  @keyframes headerReveal {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const GAMES = [
  {
    id: "chain",
    label: "Game 01",
    name: ["Movie ", "Chain"],
    nameItalic: false,
    nameGoldIdx: 1,
    desc: "Connect two stars through shared films. Shortest path wins.",
    badge: "Daily",
    badgeClass: "",
    bg: "⛓",
    stats: [
      { val: "4:22", lbl: "Best Time" },
      { val: "7", lbl: "Streak" },
    ],
    how: [
      { step: "You're given two actors.", key: "step" },
      { step: "Pick a movie starring Actor A, then a co-star from that film.", key: "step" },
      { step: "Keep chaining movies & actors until you reach Actor B.", key: "step" },
      { step: "Score = fewest steps + fastest time. Backtracking costs a penalty.", key: "step" },
    ],
    featured: false,
  },
  {
    id: "grid",
    label: "Game 02",
    name: ["The ", "Grid"],
    nameGoldIdx: 1,
    desc: "Fill a 3×3 grid with films that match each actor and category pair.",
    badge: "Daily",
    badgeClass: "",
    bg: "⬛",
    stats: [
      { val: "9/9", lbl: "Best Score" },
      { val: "12", lbl: "Streak" },
    ],
    how: [
      { step: "A 3×3 grid: 3 actors down the left, 3 categories across the top.", key: "step" },
      { step: "Fill each cell with a movie starring that row's actor that fits the column category.", key: "step" },
      { step: "No movie can appear twice. Wrong guesses cost from your shared guess pool.", key: "step" },
      { step: "Rare answers score higher. Fewer guesses + faster time = better score.", key: "step" },
    ],
    featured: true,
  },
  {
    id: "crosscut",
    label: "Game 03",
    name: ["Cross", "cut"],
    nameGoldIdx: 1,
    desc: "Swap tiles to group films by hidden row themes — and find the secret column.",
    badge: "New",
    badgeClass: "new",
    bg: "✂",
    stats: [
      { val: "—", lbl: "Best Time" },
      { val: "0", lbl: "Streak" },
    ],
    how: [
      { step: "A 4×4 grid of shuffled movies — each row hides a theme.", key: "step" },
      { step: "Tap a tile to select it, tap another to swap their positions.", key: "step" },
      { step: "Rows glow green when all four films correctly share a theme.", key: "step" },
      { step: "One column across all four rows shares a secret cross-cutting theme. Find it to win.", key: "step" },
    ],
    featured: false,
  },
];

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();

export default function MarqueeHome({ onPlay }) {
  const [activeNav, setActiveNav] = useState("home");
  const [sheet, setSheet] = useState(null);

  return (
    <>
      <style>{STYLE}</style>
      <div className="mq-root">
        <div className="mq-glow" />

        {/* HEADER */}
        <div className="mq-header">
          <div className="mq-marquee-lights">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="mq-bulb" />
            ))}
          </div>

          <div className="mq-wordmark">
            Mar<em>quee</em>
          </div>

          <div className="mq-rule">
            <div className="mq-rule-line" />
            <div className="mq-rule-diamond" />
            <div className="mq-rule-line" />
          </div>

          <div className="mq-tagline">Daily Movie Games</div>
        </div>

        {/* DATE */}
        <div className="mq-date-strip">
          <div className="mq-date-pill">{TODAY}</div>
        </div>

        {/* GAME CARDS */}
        <div className="mq-games">
          {GAMES.map((g) => (
            <div
              key={g.id}
              className={`mq-card ${g.featured ? "featured" : ""}`}
              onClick={() => setSheet(g)}
            >
              <div className="mq-card-bg">{g.bg}</div>

              <div className="mq-card-top">
                <div>
                  <div className="mq-card-name">
                    {g.name[0]}<em>{g.name[1]}</em>
                  </div>
                </div>
                <div className={`mq-card-badge ${g.badgeClass}`}>
                  {g.badge}
                </div>
              </div>

              <div className="mq-card-desc">{g.desc}</div>

              <div className="mq-card-footer">
                <div className="mq-card-stats">
                  {g.stats.map((s) => (
                    <div key={s.lbl} className="mq-card-stat">
                      <div className="mq-card-stat-val">{s.val}</div>
                      <div className="mq-card-stat-lbl">{s.lbl}</div>
                    </div>
                  ))}
                </div>
                <button className="mq-play-btn" onClick={(e) => { e.stopPropagation(); onPlay(g.id); }}>
                  Play
                  <svg viewBox="0 0 10 10"><polygon points="2,1 9,5 2,9" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* STATS BAR */}
        <div className="mq-section-label">
          <div className="mq-section-line" />
          <div className="mq-section-text">Your Season</div>
          <div className="mq-section-line" />
        </div>

        <div className="mq-stats-bar">
          <div className="mq-stat-item">
            <div className="mq-stat-num gold">12</div>
            <div className="mq-stat-lbl">Day Streak</div>
          </div>
          <div className="mq-stat-divider" />
          <div className="mq-stat-item">
            <div className="mq-stat-num">47</div>
            <div className="mq-stat-lbl">Games Played</div>
          </div>
          <div className="mq-stat-divider" />
          <div className="mq-stat-item">
            <div className="mq-stat-num">83<span style={{fontSize:"16px",color:"var(--text2)"}}>%</span></div>
            <div className="mq-stat-lbl">Win Rate</div>
          </div>
        </div>

        {/* BOTTOM NAV */}
        <div style={{ height: "24px" }} />
        <div className="mq-nav">
          {[
            { id: "home", icon: "🎬", label: "Today" },
            { id: "archive", icon: "🗂", label: "Archive" },
            { id: "stats", icon: "📊", label: "Stats" },
            { id: "settings", icon: "⚙️", label: "Settings" },
          ].map((n) => (
            <div
              key={n.id}
              className={`mq-nav-item ${activeNav === n.id ? "active" : ""}`}
              onClick={() => setActiveNav(n.id)}
            >
              <div className="mq-nav-icon">{n.icon}</div>
              <div className="mq-nav-lbl">{n.label}</div>
            </div>
          ))}
        </div>

        {/* HOW TO PLAY SHEET */}
        {sheet && (
          <div className="mq-modal-overlay" onClick={() => setSheet(null)}>
            <div className="mq-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="mq-sheet-handle" />
              <div className="mq-sheet-title">
                {sheet.name[0]}<em>{sheet.name[1]}</em>
              </div>
              <div className="mq-sheet-sub">{sheet.desc}</div>

              {sheet.how.map((h, i) => (
                <div key={i} className="mq-how-row">
                  <div className="mq-how-num">{i + 1}</div>
                  <div className="mq-how-text">{h.step}</div>
                </div>
              ))}

              <button className="mq-sheet-close" onClick={() => setSheet(null)}>
                Let's Play →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
