// Generates a theme-colored favicon and updates the browser tab icon
// Called on login (apply saved theme) and on theme change

const DEFAULT_BG = "#0f0f0f";
const DEFAULT_ACCENT = "#d4f700";

// Theme accent colors matched to theme keys
const THEME_FAVICONS = {
  "GHOST MODE":    { bg: "#0f0f0f", accent: "#d4f700" },
  "VELVET GRAPE":  { bg: "#36255C", accent: "#D2C3F6" },
  "DEEP SAPPHIRE": { bg: "#060e22", accent: "#C5C6C7" },
  "BLOOD GARDEN":  { bg: "#70020F", accent: "#FFDEE2" },
  "ESPRESSO":      { bg: "#2a1a10", accent: "#FFEDAC" },
  "EMBER RUSH":    { bg: "#1e1008", accent: "#F0660A" },
  "CRIMSON TIDE":  { bg: "#750608", accent: "#74A5BE" },
  "FOREST FLOOR":  { bg: "#0e1e0e", accent: "#b8dba0" },
};

function makeFaviconSVG(bg, accent) {
  // Card suit symbol in theme colors
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" fill="${bg}"/>
    <rect x="3" y="3" width="26" height="26" fill="none" stroke="${accent}" stroke-width="2"/>
    <text x="16" y="22" font-family="serif" font-size="18" font-weight="bold" 
      fill="${accent}" text-anchor="middle">♠</text>
  </svg>`;
}

function svgToDataURL(svg) {
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

export function applyFavicon(themeKey) {
  const colors = THEME_FAVICONS[themeKey] || { bg: DEFAULT_BG, accent: DEFAULT_ACCENT };
  const svg = makeFaviconSVG(colors.bg, colors.accent);
  const url = svgToDataURL(svg);

  // Update favicon
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = url;

  // Update PWA theme-color meta tag
  let meta = document.querySelector("meta[name='theme-color']");
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = colors.bg;
}

export function resetFavicon() {
  applyFavicon("GHOST MODE");
}
