export type Bar = {
  id: string;
  name: string;
  city: string;
  address: string;
  hours: string;
  matchIds: string[];
  website: string;
  // Distance in km from city center of `city`. Used together with the user's
  // selected radius filter on the Gastro-Finder screen.
  distanceKm: number;
};

export const BARS: Bar[] = [
  // München
  {
    id: "b1", name: "Tribüne München", city: "München",
    address: "Sonnenstraße 12, 80331 München",
    hours: "18:00 – 04:00 (Spieltage)",
    matchIds: ["m2", "m4", "m8", "m10"],
    website: "https://www.google.com/search?q=Tribüne+München+Sportsbar",
    distanceKm: 2,
  },
  {
    id: "b2", name: "Stadion an der Isar", city: "München",
    address: "Steinsdorfstraße 20, 80538 München",
    hours: "Klassische Sportsbar, bis 02:00",
    matchIds: ["m3", "m5", "m9"],
    website: "https://www.google.com/search?q=Stadion+an+der+Isar+München",
    distanceKm: 4,
  },

  // Berlin
  {
    id: "b3", name: "Stadion an der Schleuse", city: "Berlin",
    address: "Müggelseedamm 164, 12587 Berlin",
    hours: "Bei Nachtspielen geöffnet bis 06:00",
    matchIds: ["m1", "m4", "m8", "m10"],
    website: "https://www.stadion-schleuse.de",
    distanceKm: 12,
  },
  {
    id: "b4", name: "Hauptstadt-Kurve", city: "Berlin",
    address: "Oranienburger Str. 45, 10117 Berlin",
    hours: "Public Viewing auf Großleinwand",
    matchIds: ["m4", "m6", "m9"],
    website: "https://www.google.com/search?q=Hauptstadt+Kurve+Berlin+Public+Viewing",
    distanceKm: 3,
  },

  // Köln
  {
    id: "b5", name: "Gastro-Arena Köln", city: "Köln",
    address: "Aachener Str. 55, 50674 Köln",
    hours: "Durchgehend an WM-Tagen",
    matchIds: ["m3", "m6", "m7", "m9"],
    website: "https://www.google.com/search?q=Gastro+Arena+Köln+Fußball",
    distanceKm: 2,
  },

  // Frankfurt
  {
    id: "b6", name: "Main-Viewing Point", city: "Frankfurt",
    address: "Schweizer Str. 12, 60594 Frankfurt",
    hours: "Sportsbar am Main, bis 03:00",
    matchIds: ["m2", "m5", "m7", "m10"],
    website: "https://www.google.com/search?q=Main+Viewing+Point+Frankfurt",
    distanceKm: 2,
  },
];

export const BAR_CITIES = ["München", "Berlin", "Köln", "Frankfurt"] as const;
