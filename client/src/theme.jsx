import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = {
  "GHOST MODE": {
    label: "GHOST MODE",
    desc: "Acid yellow on void black",
    swatch: ["#0f0f0f", "#d4f700"],
    vars: {
      "--bg": "#0f0f0f",
      "--surface": "#161616",
      "--surface2": "#1e1e1e",
      "--border": "#2a2a2a",
      "--border-hard": "#3a3a3a",
      "--yellow": "#d4f700",
      "--text": "#f0f0f0",
      "--muted": "#666",
      "--muted2": "#444",
      "--red": "#ff3333",
      "--green": "#00e676",
      "--blue": "#00b4ff",
      "--purple": "#c77dff",
      "--bg-hard": "#000000",
      "--on-accent": "#000000",
      "--ticker-bg": "#000000",
      "--ticker-text": "#d4f700",
      "--hero-text": "#f0f0f0",
      "--hero-muted": "#888",
    },
  },

  "VELVET GRAPE": {
    label: "VELVET GRAPE",
    desc: "Lavender haze meets deep violet",
    swatch: ["#D2C3F6", "#36255C"],
    vars: {
      "--bg": "#e8deff",
      "--surface": "#d8ccf8",
      "--surface2": "#c8baf0",
      "--border": "#b0a0e0",
      "--border-hard": "#8870c8",
      "--yellow": "#36255C",
      "--text": "#1a1030",
      "--muted": "#6050a0",
      "--muted2": "#9080c0",
      "--red": "#8b0030",
      "--green": "#005a28",
      "--blue": "#003898",
      "--purple": "#5500aa",
      "--bg-hard": "#2a1a50",
      "--on-accent": "#ffffff",
      "--ticker-bg": "#36255C",
      "--ticker-text": "#D2C3F6",
      "--hero-text": "#ede8ff",
      "--hero-muted": "#a090d0",
    },
  },

  "DEEP SAPPHIRE": {
    label: "DEEP SAPPHIRE",
    desc: "Silver mist with navy depths",
    swatch: ["#C5C6C7", "#060e22"],
    vars: {
      "--bg": "#d8dce4",
      "--surface": "#c4c8d4",
      "--surface2": "#b0b6c8",
      "--border": "#909ab0",
      "--border-hard": "#6070a0",
      "--yellow": "#060e22",
      "--text": "#080f24",
      "--muted": "#506080",
      "--muted2": "#8090b0",
      "--red": "#990010",
      "--green": "#005038",
      "--blue": "#0030a0",
      "--purple": "#5500aa",
      "--bg-hard": "#0a1428",
      "--on-accent": "#ffffff",
      "--ticker-bg": "#060e22",
      "--ticker-text": "#C5C6C7",
      "--hero-text": "#dde4f0",
      "--hero-muted": "#8090b0",
    },
  },

  "BLOOD GARDEN": {
    label: "BLOOD GARDEN",
    desc: "Misty rose with rosewood dark",
    swatch: ["#FFDEE2", "#70020F"],
    vars: {
      "--bg": "#fff0f2",
      "--surface": "#ffd8dc",
      "--surface2": "#ffc8cc",
      "--border": "#f0a8b0",
      "--border-hard": "#d07080",
      "--yellow": "#70020F",
      "--text": "#3a0008",
      "--muted": "#904050",
      "--muted2": "#c08090",
      "--red": "#8b0000",
      "--green": "#004d30",
      "--blue": "#002880",
      "--purple": "#440060",
      "--bg-hard": "#50010a",
      "--on-accent": "#ffffff",
      "--ticker-bg": "#70020F",
      "--ticker-text": "#FFDEE2",
      "--hero-text": "#ffdee2",
      "--hero-muted": "#e0a0a8",
    },
  },

  "ESPRESSO": {
    label: "ESPRESSO",
    desc: "Butter cream with dark roast",
    swatch: ["#FFEDAC", "#3E2723"],
    vars: {
      "--bg": "#fff8e0",
      "--surface": "#ffefc0",
      "--surface2": "#ffe8a0",
      "--border": "#e0c870",
      "--border-hard": "#c0a040",
      "--yellow": "#3E2723",
      "--text": "#1a0e0a",
      "--muted": "#7a5020",
      "--muted2": "#b09060",
      "--red": "#8b0000",
      "--green": "#004820",
      "--blue": "#002880",
      "--purple": "#440060",
      "--bg-hard": "#2a1a10",
      "--on-accent": "#ffffff",
      "--ticker-bg": "#3E2723",
      "--ticker-text": "#FFEDAC",
      "--hero-text": "#fff3dc",
      "--hero-muted": "#c8a070",
    },
  },

  "EMBER RUSH": {
    label: "EMBER RUSH",
    desc: "Warm cream with burnt orange fire",
    swatch: ["#F0660A", "#3E2723"],
    vars: {
      "--bg": "#fff0e0",
      "--surface": "#ffe0c0",
      "--surface2": "#ffd0a0",
      "--border": "#e0a060",
      "--border-hard": "#c07030",
      "--yellow": "#F0660A",
      "--text": "#1a0800",
      "--muted": "#906020",
      "--muted2": "#c09060",
      "--red": "#8b0000",
      "--green": "#004820",
      "--blue": "#003080",
      "--purple": "#440060",
      "--bg-hard": "#1e1008",
      "--on-accent": "#ffffff",
      "--ticker-bg": "#3E2723",
      "--ticker-text": "#F0660A",
      "--hero-text": "#ffe8d0",
      "--hero-muted": "#c09060",
    },
  },

  "CRIMSON TIDE": {
    label: "CRIMSON TIDE",
    desc: "Cosmos marble with cherry red",
    swatch: ["#74A5BE", "#750608"],
    vars: {
      "--bg": "#c8dce8",
      "--surface": "#b0ccd8",
      "--surface2": "#98bcc8",
      "--border": "#78a0b8",
      "--border-hard": "#5080a0",
      "--yellow": "#750608",
      "--text": "#05101a",
      "--muted": "#3a6080",
      "--muted2": "#6090a8",
      "--red": "#750608",
      "--green": "#004838",
      "--blue": "#003888",
      "--purple": "#440060",
      "--bg-hard": "#3a0408",
      "--on-accent": "#ffffff",
      "--ticker-bg": "#750608",
      "--ticker-text": "#c8dce8",
      "--hero-text": "#ddeef8",
      "--hero-muted": "#88b0c8",
    },
  },

  "FOREST FLOOR": {
    label: "FOREST FLOOR",
    desc: "Nyanza light with deep olivine",
    swatch: ["#b8dba0", "#1a2e1a"],
    vars: {
      "--bg": "#d8f0c0",
      "--surface": "#c4e4a8",
      "--surface2": "#b0d890",
      "--border": "#88c070",
      "--border-hard": "#60a048",
      "--yellow": "#1a2e1a",
      "--text": "#080f08",
      "--muted": "#3a5830",
      "--muted2": "#709060",
      "--red": "#8b0000",
      "--green": "#004820",
      "--blue": "#002880",
      "--purple": "#440060",
      "--bg-hard": "#0e1e0e",
      "--on-accent": "#ffffff",
      "--ticker-bg": "#1a2e1a",
      "--ticker-text": "#b8dba0",
      "--hero-text": "#d8f0c0",
      "--hero-muted": "#90c878",
    },
  },
};

export const THEME_KEYS = Object.keys(THEMES);

const ThemeContext = createContext(null);
const STORAGE_KEY = "tp_theme";

function applyTheme(key) {
  const theme = THEMES[key];
  if (!theme) return;
  Object.entries(theme.vars).forEach(([prop, val]) => {
    document.documentElement.style.setProperty(prop, val);
  });
}

export function ThemeProvider({ children }) {
  // Apply synchronously in initializer — no flash of wrong theme
  const [themeKey, setThemeKey] = useState(() => {
    let key = "GHOST MODE";
    try { key = localStorage.getItem(STORAGE_KEY) || "GHOST MODE"; } catch {}
    applyTheme(key);  // ← sync, before first paint
    return key;
  });

  // Also re-apply whenever key changes
  useEffect(() => { applyTheme(themeKey); }, [themeKey]);

  const setTheme = (key) => {
    applyTheme(key);  // ← immediate, don't wait for re-render
    setThemeKey(key);
    try { localStorage.setItem(STORAGE_KEY, key); } catch {}
  };

  return (
    <ThemeContext.Provider value={{ themeKey, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
