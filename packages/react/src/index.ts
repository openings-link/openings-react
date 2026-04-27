// ── Provider ──
export { OpeningsProvider } from "./context";

// ── Hooks ──
export { useBusiness } from "./hooks/useBusiness";
export { useSchedules } from "./hooks/useSchedules";
export { useServices } from "./hooks/useServices";
export { useOpenings } from "./hooks/useOpenings";
export { useBooking } from "./hooks/useBooking";
export { useBookingFlow } from "./hooks/useBookingFlow";
export { useServiceRequest } from "./hooks/useServiceRequest";

// ── Utilities ──
export { formatTime, formatPrice, formatDuration } from "./format";

// ── Types ──
export type {
  Business,
  Schedule,
  Member,
  Service,
  ServiceOption,
  SelectedService,
  MemberOpenings,
  NextAvailabilityItem,
  ScheduleInfo,
  BookingResult,
  ServiceRequestResult,
  BookingError,
  BookingErrorCode,
  Step,
  OpeningsConfig,
  OpeningsCallbacks,
  BookingEntry,
  ConsultationRequest,
} from "./types";

// ── API client (for advanced usage / testing) ──
export { createApiClient, type ApiClient } from "./api";
