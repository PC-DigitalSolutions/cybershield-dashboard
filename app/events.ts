// VIP concert-tour protection registry — Mission series beyond sports.
//
// These are UPCOMING protection targets, not completed missions: major VIP
// artist tours draw the same fan-directed scam surge as the World Cup
// (fake presales, resale fraud, bogus VIP packages). Each entry is a curated
// "watch profile" — the scam vectors El Guardián is tuned to defend against
// for that artist's shows. It carries NO fabricated threat stats; when a tour
// actually runs and collects data it graduates to a completed mission
// (see ./missions.ts).
//
// Curated, VIP-only roster — confirmed with Aldo. Edit here to add/remove.

export type ConcertScam =
  | "presale"
  | "resale"
  | "vip"
  | "livestream"
  | "typosquat"
  | "impersonation"
  | "merch"
  | "crypto";

export const CONCERT_SCAM_META: Record<ConcertScam, { icon: string; short: string; label: string }> = {
  presale:       { icon: "🎟️", short: "Fake presale", label: "Fake ‘verified fan’ presale codes" },
  resale:        { icon: "🎫", short: "Resale fraud", label: "Counterfeit resale tickets & fake QR" },
  vip:           { icon: "🌟", short: "VIP scams", label: "Bogus VIP & meet-and-greet packages" },
  livestream:    { icon: "📺", short: "Fake livestream", label: "Fake ‘free livestream’ scam sites" },
  typosquat:     { icon: "🔗", short: "Fake domains", label: "Typosquatted ticket domains" },
  impersonation: { icon: "🎭", short: "Impersonation", label: "Fan-account & giveaway impersonation" },
  merch:         { icon: "👕", short: "Fake merch", label: "Counterfeit tour-merch stores" },
  crypto:        { icon: "🪙", short: "Crypto/gift-card", label: "Crypto / gift-card payment demands" },
};

export type VipEvent = {
  id: string;
  artist: string;
  flag: string;      // origin flag emoji
  origin: string;    // country / territory
  genre: string;
  reach: string[];   // languages & regions the defense is tuned for
  scams: ConcertScam[];
  // Optional artist image. Drop a file at public/artists/<id>.(jpg|png|webp)
  // and set this to its path — the card renders photo-forward. If omitted or
  // the file is missing, the card falls back to the accent/flag treatment.
  // Portrait/3:4 crops look best (recommended ~640×800). Use images you have
  // rights to; the site is public.
  image?: string;
};

// Newest / highest-priority first. VIP artists only.
export const VIP_EVENTS: VipEvent[] = [
  {
    id: "karol-g",
    image: "/artists/karol-g.jpg",
    artist: "Karol G",
    flag: "🇨🇴",
    origin: "Colombia",
    genre: "Reggaetón · Latin pop",
    reach: ["Español", "English", "Latin America", "US"],
    scams: ["presale", "resale", "vip", "livestream", "impersonation"],
  },
  {
    id: "bad-bunny",
    image: "/artists/bad-bunny.jpg",
    artist: "Bad Bunny",
    flag: "🇵🇷",
    origin: "Puerto Rico",
    genre: "Reggaetón · Trap",
    reach: ["Español", "English", "Latin America", "US"],
    scams: ["presale", "resale", "vip", "livestream", "crypto"],
  },
  {
    id: "beyonce",
    image: "/artists/beyonce.jpg",
    artist: "Beyoncé",
    flag: "🇺🇸",
    origin: "United States",
    genre: "R&B · Pop",
    reach: ["English", "Global"],
    scams: ["presale", "resale", "vip", "typosquat", "merch"],
  },
  {
    id: "taylor-swift",
    image: "/artists/taylor-swift.jpg",
    artist: "Taylor Swift",
    flag: "🇺🇸",
    origin: "United States",
    genre: "Pop",
    reach: ["English", "Global"],
    scams: ["presale", "resale", "vip", "typosquat", "impersonation", "merch"],
  },
  {
    id: "shakira",
    image: "/artists/shakira.jpg",
    artist: "Shakira",
    flag: "🇨🇴",
    origin: "Colombia",
    genre: "Latin pop · Rock",
    reach: ["Español", "English", "Global"],
    scams: ["presale", "resale", "livestream", "merch"],
  },
  {
    id: "christina-aguilera",
    image: "/artists/christina-aguilera.jpg",
    artist: "Christina Aguilera",
    flag: "🇺🇸",
    origin: "United States",
    genre: "Pop",
    reach: ["English", "Español"],
    scams: ["presale", "resale", "vip", "impersonation"],
  },
  {
    id: "peso-pluma",
    image: "/artists/peso-pluma.jpg",
    artist: "Peso Pluma",
    flag: "🇲🇽",
    origin: "Mexico",
    genre: "Corridos tumbados",
    reach: ["Español", "US"],
    scams: ["presale", "resale", "livestream", "impersonation"],
  },
  {
    id: "rauw-alejandro",
    image: "/artists/rauw-alejandro.jpg",
    artist: "Rauw Alejandro",
    flag: "🇵🇷",
    origin: "Puerto Rico",
    genre: "Reggaetón",
    reach: ["Español", "English", "Latin America"],
    scams: ["presale", "resale", "vip", "merch"],
  },
  {
    id: "becky-g",
    image: "/artists/becky-g.jpg",
    artist: "Becky G",
    flag: "🇺🇸",
    origin: "United States",
    genre: "Latin pop · Reggaetón",
    reach: ["Español", "English", "US"],
    scams: ["presale", "resale", "impersonation", "merch"],
  },
  {
    id: "coldplay",
    image: "/artists/coldplay.jpg",
    artist: "Coldplay",
    flag: "🇬🇧",
    origin: "United Kingdom",
    genre: "Rock · Pop",
    reach: ["English", "Global"],
    scams: ["presale", "resale", "typosquat", "livestream"],
  },
  {
    id: "the-weeknd",
    image: "/artists/the-weeknd.jpg",
    artist: "The Weeknd",
    flag: "🇨🇦",
    origin: "Canada",
    genre: "R&B · Pop",
    reach: ["English", "Global"],
    scams: ["presale", "resale", "vip", "crypto"],
  },
];
