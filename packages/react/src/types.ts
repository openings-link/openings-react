/* ─── Public types for @openings/react ─── */

/* ─── Business ─── */

export interface Business {
  id: string;
  name: string;
  slug: string | null;
  domain: string | null;
  logo: { url: string; thumbnail?: string } | null;
  timezone: string | null;
  cancellationPolicyEnabled: boolean;
  cancellationPolicyHours: number | null;
  verificationMethod: "SMS" | "EMAIL";
}

/* ─── Schedules (bookable locations / online schedules) ─── */

export interface Schedule {
  id: string;
  title: string;
  address?: string;
  images?: string[];
}

/* ─── Members ─── */

export interface Member {
  id: string;
  userId: string | null;
  teamMemberId: string | null;
  username: string | null;
  name: string | null;
  photo: string | null;
  bio?: string | null;
}

/* ─── Services ─── */

export interface ServiceOption {
  id: string;
  title: string;
  description?: string;
  duration: number;
  price: number;
}

export interface Service {
  id: string;
  title: string;
  description?: string;
  price: number;
  duration: number;
  up: boolean;
  hasConsultation?: boolean;
  referenceId?: string;
  userId?: string | null;
  teamMemberId?: string | null;
  options?: ServiceOption[];
}

/* ─── Openings / time slots ─── */

export interface ScheduleInfo {
  id: string;
  title?: string;
  address?: string | null;
}

export interface MemberOpenings {
  userId: string | null;
  teamMemberId: string | null;
  username: string;
  name: string;
  photo?: string;
  schedule: ScheduleInfo;
  openings: string[];
  openingLabels?: Record<string, string>;
  dayStatus?: "vacation" | "workday" | "offday";
  services: {
    id: string;
    referenceId?: string;
    title?: string;
    duration?: number;
    price?: number;
    hasConsultation?: boolean;
    option?: ServiceOption;
  }[];
}

/* ─── Selected service (user's choice) ─── */

export interface SelectedService {
  id: string;
  title: string;
  price: number;
  duration: number;
  options?: ServiceOption[];
  option?: ServiceOption;
  hasConsultation?: boolean;
}

/* ─── Booking result ─── */

export interface BookingResult {
  appointmentId: string;
  date: string;
  time: string;
}

/* ─── Service request result ─── */

export interface ServiceRequestResult {
  serviceRequestId: string;
}

/* ─── Step machine ─── */

export type Step =
  | "schedule"
  | "openings"
  | "review"
  | "verify"
  | "confirm"
  | "service-request";

/* ─── Error ─── */

export type BookingErrorCode =
  | "NETWORK"
  | "SLOT_TAKEN"
  | "BUSINESS_NOT_FOUND"
  | "VERIFICATION_FAILED"
  | "RATE_LIMITED";

export interface BookingError {
  code: BookingErrorCode;
  message: string;
  step: Step;
  retryable: boolean;
}

/* ─── Entry point ─── */

/**
 * Controls where the booking flow starts.
 *
 * - No entry props → schedule list (auto-selects if only one)
 * - `scheduleId` → skip list, start at that schedule's services/slots
 * - `memberId` → show that member's availability across all schedules
 * - `scheduleId` + `memberId` → member's slots at that specific schedule
 */
export interface BookingEntry {
  /** Pre-select a specific schedule (skip the schedule list). */
  scheduleId?: string;
  /** Pre-select a specific team member (show their availability). */
  memberId?: string;
}

/* ─── Provider config ─── */

export interface OpeningsConfig {
  /** Business handle (slug). Required. */
  business: string;
  /** API base URL. Defaults to https://api.openings.link */
  apiBase?: string;
  /** Locale for date/price formatting. Defaults to "en-US". */
  locale?: string;
  /** Currency code for price formatting. Auto-detected if omitted. */
  currency?: string;
  /** Timezone. "auto" = use business timezone. */
  timezone?: string;
  /** Entry point — controls where the booking flow starts. */
  entry?: BookingEntry;
}

export interface ConsultationRequest {
  member: MemberOpenings;
  services: SelectedService[];
}

export interface OpeningsCallbacks {
  onBookingComplete?: (result: BookingResult) => void;
  onServiceRequestComplete?: (result: ServiceRequestResult) => void;
  onStepChange?: (from: Step, to: Step) => void;
  onError?: (error: BookingError) => void;
  onVerificationSent?: (method: "SMS" | "EMAIL") => void;
  onVerificationComplete?: (customerId: string) => void;
  onScheduleSelect?: (schedule: Schedule) => void;
  onServiceSelect?: (service: Service) => void;
  onSlotSelect?: (slot: { time: string; member: MemberOpenings }) => void;
  onConsultationRequest?: (request: ConsultationRequest) => void;
}
