export type Money = { paisa?: number; display?: string };

export type VenueCard = {
  id: string;
  name?: string;
  slug?: string;
  area?: string;
  city?: string;
  sports?: string[];
  coverPhotoUrl?: string;
  photoUrls?: string[];
  fromPrice?: Money;
  startingPrice?: Money;
  distanceKm?: number;
  latitude?: number;
  longitude?: number;
  priority?: boolean;
  dealDiscountPercent?: number;
  dealPromoCode?: string;
};

export type VenueListResponse = {
  items?: VenueCard[];
  priorityVenues?: VenueCard[];
  viewportLatitude?: number;
  viewportLongitude?: number;
  page?: { totalElements?: number };
};

export type VenueMapPin = {
  id?: string;
  slug?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
};

export type VenueMapResponse = {
  items?: VenueMapPin[];
  viewportLatitude?: number;
  viewportLongitude?: number;
};

export type VenueDetailCourt = {
  id: string;
  name?: string;
  sport?: string;
  surface?: string;
  environment?: string;
  hasLights?: boolean;
  status?: string;
  conditionNote?: string;
  fromPrice?: Money;
  imageUrl?: string;
};

export type VenueDetail = VenueCard & {
  description?: string;
  addressLine?: string;
  phoneE164?: string;
  whatsappE164?: string;
  cancellationWindowHours?: number;
  cancellationPolicy?: string;
  pricesVerifiedAt?: string;
  courts?: VenueDetailCourt[];
  photos?: Array<{ url?: string }>;
  amenities?: string[];
};

export type Slot = {
  startAt?: string;
  endAt?: string;
  durationMinutes?: number;
  state?: string;
  price?: Money;
  listPrice?: Money;
  dealId?: string;
  promoCode?: string;
};

export type CourtAvailability = {
  courtId?: string;
  courtName?: string;
  name?: string;
  sport?: string;
  durations?: number[];
  defaultDuration?: number;
  closedNote?: string;
  slots?: Slot[];
};

export type AvailabilityDay = {
  date?: string;
  timezone?: string;
  generatedAt?: string;
  clientStalenessSeconds?: number;
  bookingHorizonDays?: number;
  closedNote?: string;
  emptyReason?: string;
  courts?: CourtAvailability[];
};

export type PaymentMethod =
  | "PAY_AT_VENUE"
  | "BANK_TRANSFER_DEPOSIT"
  | "GATEWAY_DEPOSIT"
  | "GATEWAY_FULL";

export type BookingQuote = {
  venueId?: string;
  venueName?: string;
  courtId?: string;
  courtName?: string;
  sport?: string;
  startAt?: string;
  endAt?: string;
  durationMinutes?: number;
  price?: Money;
  listPrice?: Money;
  cancellationWindowHours?: number;
  cancellationPolicy?: string;
  paymentMethods?: PaymentMethod[];
  venuePhoneE164?: string;
  venueAddressLine?: string;
  venueArea?: string;
  venueCity?: string;
  overlapWarning?: boolean;
};

export type DepositInstructions = {
  bookingId?: string;
  reference?: string;
  paymentStatus?: string;
  depositAmount?: Money;
  balanceDue?: Money;
  heldUntil?: string;
  accountTitle?: string;
  bankName?: string;
  accountNumberMasked?: string;
  iban?: string;
  raastId?: string;
  instructions?: string;
  lastProofStatus?: string;
  lastRejectionReason?: string;
  canUpload?: boolean;
};

export type BookingRow = {
  id?: string;
  reference?: string;
  venueName?: string;
  courtName?: string;
  sport?: string;
  startAt?: string;
  endAt?: string;
  status?: string;
  price?: Money;
  listPrice?: Money;
  venueId?: string;
  courtId?: string;
  paymentMethod?: PaymentMethod | string;
  paymentStatus?: string;
  durationMinutes?: number;
};

export type HeroBanner = {
  id?: string;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
};

export type ExclusiveDeal = {
  id?: string;
  dealId?: string;
  title?: string;
  name?: string;
  venueName?: string;
  venueId?: string;
  venueSlug?: string;
  coverImageUrl?: string;
  coverPhotoUrl?: string;
  price?: Money;
  fromPrice?: Money;
  discountPercent?: number;
  promoCode?: string;
};

export type Me = {
  id?: string;
  fullName?: string;
  /** API field from MeResponse. */
  phone?: string;
  /** Alias kept for older UI call sites. */
  phoneE164?: string;
  photoUrl?: string;
  avatarUrl?: string;
  preferredSports?: string[];
  profileComplete?: boolean;
};
