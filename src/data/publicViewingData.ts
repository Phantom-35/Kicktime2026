export type VenueType = "Sportsbar" | "Biergarten" | "Fan Zone / Großbildleinwand";

export interface Venue {
  id: string;
  name: string;
  city: string;
  address: string;
  type: VenueType;
  distanceMock: string;
  hours: string;
  googleMapsUrl: string;
}

export const publicViewingVenues: Venue[] = [
  // MÜNCHEN
  {
    id: "v-muc-01",
    name: "Stadion an der Schleißheimer Straße",
    city: "München",
    address: "Schleißheimer Str. 125, 80797 München",
    type: "Sportsbar",
    distanceMock: "1.2 km",
    hours: "17:00 – 01:00 Uhr",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Stadion+an+der+Schleissheimer+Strasse+Muenchen",
  },
  {
    id: "v-muc-02",
    name: "Olympiapark Fan Zone",
    city: "München",
    address: "Spiridon-Louis-Ring 21, 80809 München",
    type: "Fan Zone / Großbildleinwand",
    distanceMock: "3.4 km",
    hours: "An Spieltagen geöffnet",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Olympiapark+Fan+Zone+Muenchen",
  },
  {
    id: "v-muc-03",
    name: "Hirschgarten Biergarten",
    city: "München",
    address: "Hirschgarten 1, 80639 München",
    type: "Biergarten",
    distanceMock: "4.1 km",
    hours: "11:30 – 22:30 Uhr",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Koeniglicher+Hirschgarten+Muenchen",
  },
  {
    id: "v-muc-04",
    name: "Champions Sports Bar",
    city: "München",
    address: "Berliner Str. 93, 80805 München",
    type: "Sportsbar",
    distanceMock: "2.8 km",
    hours: "17:00 – 01:00 Uhr",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Champions+Sports+Bar+Berliner+Str+Muenchen",
  },
  // BERLIN
  {
    id: "v-ber-01",
    name: "Fanmeile Brandenburger Tor",
    city: "Berlin",
    address: "Straße des 17. Juni, 10117 Berlin",
    type: "Fan Zone / Großbildleinwand",
    distanceMock: "0.5 km",
    hours: "An Spieltagen geöffnet",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Brandenburger+Tor+Fanmeile+Berlin",
  },
  {
    id: "v-ber-02",
    name: "FC Magnet Bar",
    city: "Berlin",
    address: "Veteranenstraße 26, 10119 Berlin",
    type: "Sportsbar",
    distanceMock: "1.8 km",
    hours: "Ab 13:00 Uhr geöffnet",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=FC+Magnet+Bar+Berlin",
  },
  {
    id: "v-ber-03",
    name: "Kulturbrauerei (Soda Beach Garden)",
    city: "Berlin",
    address: "Schönhauser Allee 36, 10435 Berlin",
    type: "Biergarten",
    distanceMock: "2.3 km",
    hours: "15:00 – 00:00 Uhr",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kulturbrauerei+Berlin",
  },
  // HAMBURG
  {
    id: "v-ham-01",
    name: "Heiligengeistfeld Fan Zone",
    city: "Hamburg",
    address: "Heiligengeistfeld, 20359 Hamburg",
    type: "Fan Zone / Großbildleinwand",
    distanceMock: "1.1 km",
    hours: "An Spieltagen geöffnet",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Heiligengeistfeld+Fan+Zone+Hamburg",
  },
  {
    id: "v-ham-02",
    name: "Hooters St. Pauli",
    city: "Hamburg",
    address: "Reeperbahn 157, 20359 Hamburg",
    type: "Sportsbar",
    distanceMock: "1.4 km",
    hours: "12:00 – 02:00 Uhr",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Hooters+Reeperbahn+Hamburg",
  },
  {
    id: "v-ham-03",
    name: "Landhaus Walter",
    city: "Hamburg",
    address: "Otto-Wels-Str. 2, 22303 Hamburg",
    type: "Biergarten",
    distanceMock: "4.5 km",
    hours: "12:00 – 23:00 Uhr",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Landhaus+Walter+Hamburg",
  },
  // KÖLN
  {
    id: "v-col-01",
    name: "Tanzbrunnen Open-Air",
    city: "Köln",
    address: "Rheinparkweg 1, 50679 Köln",
    type: "Fan Zone / Großbildleinwand",
    distanceMock: "1.9 km",
    hours: "An Spieltagen geöffnet",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Tanzbrunnen+Koeln+Public+Viewing",
  },
  {
    id: "v-col-02",
    name: "Club Bahnhof Ehrenfeld",
    city: "Köln",
    address: "Bartholomäus-Schink-Straße 65, 50825 Köln",
    type: "Sportsbar",
    distanceMock: "3.2 km",
    hours: "Ab 16:00 Uhr an Spieltagen",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Club+Bahnhof+Ehrenfeld+Koeln",
  },
  {
    id: "v-col-03",
    name: "Aachener Weiher Biergarten",
    city: "Köln",
    address: "Hiroshima-Nagasaki-Park 1, 50674 Köln",
    type: "Biergarten",
    distanceMock: "2.1 km",
    hours: "11:00 – 24:00 Uhr",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Biergarten+Aachener+Weiher+Koeln",
  },
  // FRANKFURT
  {
    id: "v-fra-01",
    name: "Mainufer Fan Zone",
    city: "Frankfurt",
    address: "Mainkai, 60311 Frankfurt am Main",
    type: "Fan Zone / Großbildleinwand",
    distanceMock: "0.4 km",
    hours: "An Spieltagen geöffnet",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mainufer+Fan+Zone+Frankfurt",
  },
  {
    id: "v-fra-02",
    name: "Sam's Sportsbar",
    city: "Frankfurt",
    address: "Schäfergasse 27, 60313 Frankfurt am Main",
    type: "Sportsbar",
    distanceMock: "0.9 km",
    hours: "12:00 – 02:00 Uhr",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Sams+Sportsbar+Schaefergasse+Frankfurt",
  },
];

export const PUBLIC_VIEWING_CITIES = ["München", "Berlin", "Hamburg", "Köln", "Frankfurt"] as const;
