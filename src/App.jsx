import { useState } from "react";
import MarqueeHome from "./MarqueeHome";
import MovieChain from "./games/MovieChain";
import TheGrid from "./games/TheGrid";
import Crosscut from "./games/Crosscut";

export default function App() {
  const [screen, setScreen] = useState("home");

  const goHome = () => setScreen("home");

  if (screen === "chain")    return <MovieChain onBack={goHome} />;
  if (screen === "grid")     return <TheGrid onBack={goHome} />;
  if (screen === "crosscut") return <Crosscut onBack={goHome} />;

  return <MarqueeHome onPlay={(id) => setScreen(id)} />;
}
