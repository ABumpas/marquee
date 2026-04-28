export default {
  "2026-04-28": {
    chain: {
      actorA: "Tom Hanks",
      actorB: "Scarlett Johansson",
    },

    grid: {
      num: 1,
      actors: ["Tom Hanks", "Leonardo DiCaprio", "Meryl Streep"],
      categories: [
        { label: "Set Outside the USA", icon: "✈" },
        { label: "Based on a True Story", icon: "📖" },
        { label: "Single-Word Title",    icon: "✦" },
      ],
      valid: [
        [
          new Set(["cast away","captain phillips","the terminal","charlie wilson's war","road to perdition"]),
          new Set(["sully","captain phillips","philadelphia","saving private ryan"]),
          new Set(["philadelphia","castaway","elvis"]),
        ],
        [
          new Set(["the aviator","the beach","the man in the iron mask","titanic","romeo + juliet","inception"]),
          new Set(["the aviator","titanic","the revenant","j. edgar","catch me if you can","the wolf of wall street"]),
          new Set(["inception","titanic","aviator","interstellar","rebecca"]),
        ],
        [
          new Set(["out of africa","mamma mia!","the iron lady","adaptation","the hours"]),
          new Set(["the iron lady","florence foster jenkins","silkwood","adaptation","julie & julia"]),
          new Set(["kramer","adaptation","doubt","carol","manhattan"]),
        ],
      ],
      rarityMap: {
        "sully": 2, "captain phillips": 2, "the aviator": 2, "inception": 1,
        "titanic": 1, "out of africa": 2, "the iron lady": 2, "adaptation": 3,
        "doubt": 3, "carol": 3, "cast away": 1, "philadelphia": 2,
      },
    },

    crosscut: {
      num: 1,
      movies: [
        { id: 0,  title: "Raiders of the Lost Ark", row: 0, isCol: true  },
        { id: 1,  title: "Die Hard",                row: 0, isCol: false },
        { id: 2,  title: "Mad Max: Fury Road",      row: 0, isCol: false },
        { id: 3,  title: "The Dark Knight",         row: 0, isCol: false },
        { id: 4,  title: "E.T.",                    row: 1, isCol: true  },
        { id: 5,  title: "Interstellar",            row: 1, isCol: false },
        { id: 6,  title: "Blade Runner 2049",       row: 1, isCol: false },
        { id: 7,  title: "Arrival",                 row: 1, isCol: false },
        { id: 8,  title: "Saving Private Ryan",     row: 2, isCol: true  },
        { id: 9,  title: "Apocalypse Now",          row: 2, isCol: false },
        { id: 10, title: "Full Metal Jacket",       row: 2, isCol: false },
        { id: 11, title: "1917",                    row: 2, isCol: false },
        { id: 12, title: "Schindler's List",        row: 3, isCol: true  },
        { id: 13, title: "The King's Speech",       row: 3, isCol: false },
        { id: 14, title: "Bohemian Rhapsody",       row: 3, isCol: false },
        { id: 15, title: "The Imitation Game",      row: 3, isCol: false },
      ],
      rowThemes: ["Action / Adventure", "Science Fiction", "War", "Historical Drama"],
      colTheme: "Directed by Steven Spielberg",
    },
  },
};
