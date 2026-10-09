const SPORT: Record<string, string> = {
  PADEL: "Padel",
  FUTSAL: "Futsal",
  CRICKET: "Cricket",
  TENNIS: "Tennis",
  TABLE_TENNIS: "Table tennis",
  SNOOKER: "Snooker",
  SHOOTING: "Shooting",
  OTHER: "Other",
};

const AMENITY: Record<string, string> = {
  PARKING: "Parking",
  WASHROOM: "Washroom",
  AC: "AC",
  FLOODLIGHTS: "Floodlights",
  CHANGING_ROOM: "Changing room",
  CAFE: "Café",
  EQUIPMENT_RENTAL: "Equipment rental",
  SEATING: "Seating",
  WIFI: "Wi‑Fi",
};

const SURFACE: Record<string, string> = {
  ARTIFICIAL_GRASS: "Artificial grass",
  CONCRETE: "Concrete",
  ACRYLIC: "Acrylic",
  CLAY: "Clay",
  WOOD: "Wood",
  MATTING: "Matting",
  OTHER: "Other",
};

function titleCaseKey(key: string) {
  return key
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function sportLabel(sport?: string | null) {
  if (!sport) return "Sport";
  return SPORT[sport] ?? titleCaseKey(sport);
}

export function amenityLabel(amenity?: string | null) {
  if (!amenity) return "";
  return AMENITY[amenity] ?? titleCaseKey(amenity);
}

export function surfaceLabel(surface?: string | null) {
  if (!surface) return "";
  return SURFACE[surface] ?? titleCaseKey(surface);
}
