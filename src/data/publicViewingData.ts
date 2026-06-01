export type VenueType = "Sportsbar" | "Biergarten" | "Fan Zone / Großbildleinwand";

export interface Venue {
  id: string;
  name: string;
  city: string;
  address: string;
  type: VenueType;
  atmosphere: string;
  nextMatch: string;
  nextMatchKickoff: string;
  googleMapsUrl: string;
}

const mapsUrl = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const DEFAULT_MATCH = "Deutschland – Elfenbeinküste";
const DEFAULT_KICKOFF = "20.06.2026, 22:00 Uhr";

export const publicViewingVenues: Venue[] = [
  // BERLIN
  {
    id: "v-ber-01",
    name: "Kulturbrauerei",
    city: "Berlin",
    address: "Schönhauser Allee 36, 10435 Berlin",
    type: "Fan Zone / Großbildleinwand",
    atmosphere: "Große LED-Wand im Innenhof, zusätzliche Indoor-Bildschirme bei schlechtem Wetter.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Kulturbrauerei Berlin"),
  },
  {
    id: "v-ber-02",
    name: "Brandenburger Tor",
    city: "Berlin",
    address: "Pariser Platz, 10117 Berlin",
    type: "Fan Zone / Großbildleinwand",
    atmosphere: "Historische Kulisse mitten im Regierungsviertel mit großem Fußballpublikum.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Brandenburger Tor Berlin"),
  },
  {
    id: "v-ber-03",
    name: "FC Magnet Bar",
    city: "Berlin",
    address: "Veteranenstraße 26, 10119 Berlin",
    type: "Sportsbar",
    atmosphere: "Kultige Fußballbar mit vielen Fans und mehreren Bildschirmen.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("FC Magnet Bar Berlin"),
  },
  {
    id: "v-ber-04",
    name: "Denk-Mal-Lounge Pub",
    city: "Berlin",
    address: "Auguststraße 92, 10117 Berlin",
    type: "Sportsbar",
    atmosphere: "Sportpub mit internationalem Publikum und Live-Fußball.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Denk-Mal-Lounge Pub Berlin"),
  },
  {
    id: "v-ber-05",
    name: "Hofbräu Wirtshaus Berlin",
    city: "Berlin",
    address: "Karl-Liebknecht-Straße 30, 10178 Berlin",
    type: "Sportsbar",
    atmosphere: "Stadionfeeling mit Großbildleinwand, Reservierung empfohlen.",
    nextMatch: "Viertelfinale der WM",
    nextMatchKickoff: "09.07.2026, 22:00 Uhr",
    googleMapsUrl: mapsUrl("Hofbräu Wirtshaus Berlin"),
  },

  // KÖLN
  {
    id: "v-col-01",
    name: "Joe Champs",
    city: "Köln",
    address: "Hohenzollernring 1–3, 50672 Köln",
    type: "Sportsbar",
    atmosphere: "Große Sportsbar mit amerikanischem Stil und vielen TV-Screens.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Joe Champs Hohenzollernring Köln"),
  },
  {
    id: "v-col-02",
    name: "Rhein Roxy",
    city: "Köln",
    address: "Eventschiff Rhein Roxy, 50996 Köln",
    type: "Fan Zone / Großbildleinwand",
    atmosphere: "Public Viewing auf einem Eventschiff direkt am Rhein.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Rhein Roxy Eventschiff Köln"),
  },
  {
    id: "v-col-03",
    name: "RheinEnergieSTADION",
    city: "Köln",
    address: "Aachener Straße 999, 50933 Köln",
    type: "Fan Zone / Großbildleinwand",
    atmosphere: "Fußballkulisse im Stadionumfeld mit großer Fanbasis.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("RheinEnergieSTADION Köln"),
  },
  {
    id: "v-col-04",
    name: "Lanxess Arena",
    city: "Köln",
    address: "Willy-Brandt-Platz 3, 50679 Köln",
    type: "Fan Zone / Großbildleinwand",
    atmosphere: "Große Indoor-Eventlocation mit Festivalcharakter.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Lanxess Arena Köln"),
  },
  {
    id: "v-col-05",
    name: "Kaisers",
    city: "Köln",
    address: "Innenstadt Köln",
    type: "Sportsbar",
    atmosphere: "Großbild-Beamer, Fußballatmosphäre und Public-Viewing-Abende.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Kaisers Bar Köln Innenstadt"),
  },

  // HAMBURG
  {
    id: "v-ham-01",
    name: "StrandPauli",
    city: "Hamburg",
    address: "St. Pauli Hafenstraße 89, 20359 Hamburg",
    type: "Biergarten",
    atmosphere: "Strandbar direkt an der Elbe mit Sand unter den Füßen.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("StrandPauli Hafenstraße Hamburg"),
  },
  {
    id: "v-ham-02",
    name: "Spielbudenplatz",
    city: "Hamburg",
    address: "Spielbudenplatz 21–22, 20359 Hamburg",
    type: "Fan Zone / Großbildleinwand",
    atmosphere: "Reeperbahn-Feeling mit großer Open-Air-Fanfläche.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Spielbudenplatz Hamburg"),
  },
  {
    id: "v-ham-03",
    name: "Sky & Sand Beachclub",
    city: "Hamburg",
    address: "Humboldtstraße 6, 22083 Hamburg",
    type: "Biergarten",
    atmosphere: "Dachterrasse mit Beachclub-Charakter und Großleinwand.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Sky and Sand Beachclub Hamburg"),
  },
  {
    id: "v-ham-04",
    name: "Stadtpark Open Air",
    city: "Hamburg",
    address: "Saarlandstraße 73, 22303 Hamburg",
    type: "Fan Zone / Großbildleinwand",
    atmosphere: "Große Open-Air-Fläche mit Festivalstimmung.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Stadtpark Open Air Hamburg"),
  },
  {
    id: "v-ham-05",
    name: "Volksparkstadion",
    city: "Hamburg",
    address: "Uwe-Seeler-Allee 9, 22525 Hamburg",
    type: "Fan Zone / Großbildleinwand",
    atmosphere: "Fußballumgebung beim HSV-Stadion mit vielen Fans.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Volksparkstadion Hamburg"),
  },

  // MÜNCHEN
  {
    id: "v-muc-01",
    name: "Olympiapark München",
    city: "München",
    address: "Spiridon-Louis-Ring 21, 80809 München",
    type: "Fan Zone / Großbildleinwand",
    atmosphere: "Einer der bekanntesten Public-Viewing-Orte Deutschlands.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Olympiapark München"),
  },
  {
    id: "v-muc-02",
    name: "Königlicher Hirschgarten",
    city: "München",
    address: "Hirschgarten 1, 80639 München",
    type: "Biergarten",
    atmosphere: "Riesiger Biergarten mit traditioneller Münchner Atmosphäre.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Königlicher Hirschgarten München"),
  },
  {
    id: "v-muc-03",
    name: "Olympiasee-Brücke",
    city: "München",
    address: "Rudolf-Harbig-Weg, 80809 München",
    type: "Fan Zone / Großbildleinwand",
    atmosphere: "Beliebter Treffpunkt rund um die Public-Viewing-Bereiche des Olympiaparks.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Olympiasee Brücke Olympiapark München"),
  },
  {
    id: "v-muc-04",
    name: "Munich Airport Public Viewing",
    city: "München",
    address: "Flughafen München, Terminalbereich, 85356 München",
    type: "Fan Zone / Großbildleinwand",
    atmosphere: "Große Bühne und Public-Viewing-Areal für mehrere tausend Fans.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Flughafen München Public Viewing"),
  },
  {
    id: "v-muc-05",
    name: "Paulaner am Nockherberg",
    city: "München",
    address: "Hochstraße 77, 81541 München",
    type: "Biergarten",
    atmosphere: "Traditioneller Biergarten mit Fußballübertragungen und Münchner Flair.",
    nextMatch: DEFAULT_MATCH,
    nextMatchKickoff: DEFAULT_KICKOFF,
    googleMapsUrl: mapsUrl("Paulaner am Nockherberg München"),
  },
];

export const PUBLIC_VIEWING_CITIES = ["Berlin", "Köln", "Hamburg", "München"] as const;
