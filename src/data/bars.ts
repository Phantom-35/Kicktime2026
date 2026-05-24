export type Bar = {
  id: string;
  name: string;
  city: string;
  address: string;
  hours: string;
  matchIds: string[];
};

export const BARS: Bar[] = [
  {
    id: "b1", name: "Stadion an der Schleuse", city: "Berlin",
    address: "Müggelseedamm 164, 12587 Berlin",
    hours: "Bei Nachtspielen geöffnet bis 06:00",
    matchIds: ["m4", "m6", "m9", "m12"],
  },
  {
    id: "b2", name: "Tribüne München", city: "München",
    address: "Sonnenstraße 12, 80331 München",
    hours: "18:00 – 04:00 (Spieltage)",
    matchIds: ["m5", "m8", "m11"],
  },
  {
    id: "b3", name: "Pott & Pitch", city: "Köln",
    address: "Friesenstraße 50, 50670 Köln",
    hours: "Durchgehend an WM-Tagen",
    matchIds: ["m4", "m7", "m10", "m13"],
  },
  {
    id: "b4", name: "Eckkneipe Sankt Pauli", city: "Hamburg",
    address: "Reeperbahn 88, 20359 Hamburg",
    hours: "Bis 05:00 bei Spielen aus USA/MEX",
    matchIds: ["m6", "m9", "m12"],
  },
];
