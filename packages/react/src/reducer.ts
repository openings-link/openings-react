import type {
  Step,
  Business,
  Schedule,
  Member,
  Service,
  MemberOpenings,
  SelectedService,
  BookingResult,
  ServiceRequestResult,
} from "./types";

/* ─── State ─── */

export interface BookingState {
  step: Step;
  loading: boolean;
  error: string | null;

  /* Entry point config (immutable after init) */
  entryScheduleId: string | null;
  entryMemberId: string | null;
  entryResolved: boolean;

  business: Business | null;
  schedules: Schedule[] | null;

  selectedScheduleId: string | null;
  selectedMemberId: string | null;
  members: Member[];
  services: Service[];

  selectedServices: SelectedService[];
  selectedDate: string | null;
  memberOpenings: MemberOpenings[];
  openingsLoading: boolean;

  selectedMemberOpenings: MemberOpenings | null;
  selectedTime: string | null;

  /* Verification */
  phoneNumber: string;
  email: string;
  verificationCode: string;
  verificationSent: boolean;
  verifyPhase: "phone" | "new-customer" | "returning";
  customerId: string | null;
  customerFirstName: string;
  customerLastName: string;

  /* Result */
  result: BookingResult | null;

  /* Service request (consultation) */
  serviceRequestMember: MemberOpenings | null;
  serviceRequestResult: ServiceRequestResult | null;
}

export const initialState: BookingState = {
  step: "schedule",
  loading: false,
  error: null,

  entryScheduleId: null,
  entryMemberId: null,
  entryResolved: false,

  business: null,
  schedules: null,

  selectedScheduleId: null,
  selectedMemberId: null,
  members: [],
  services: [],

  selectedServices: [],
  selectedDate: null,
  memberOpenings: [],
  openingsLoading: false,

  selectedMemberOpenings: null,
  selectedTime: null,

  phoneNumber: "",
  email: "",
  verificationCode: "",
  verificationSent: false,
  verifyPhase: "phone",
  customerId: null,
  customerFirstName: "",
  customerLastName: "",

  result: null,

  serviceRequestMember: null,
  serviceRequestResult: null,
};

/* ─── Actions ─── */

export type BookingAction =
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_STEP"; step: Step }
  | { type: "SET_BUSINESS"; business: Business }
  | { type: "SET_SCHEDULES"; schedules: Schedule[] }
  | { type: "SET_ENTRY"; scheduleId: string | null; memberId: string | null }
  | { type: "SET_ENTRY_RESOLVED" }
  | { type: "SET_SELECTED_MEMBER"; memberId: string | null }
  | { type: "SET_SELECTED_SCHEDULE"; scheduleId: string | null }
  | {
      type: "SET_SCHEDULE_DETAIL";
      scheduleId: string;
      members: Member[];
      services: Service[];
    }
  | { type: "SELECT_SERVICE"; service: SelectedService }
  | { type: "REMOVE_SERVICE"; serviceId: string }
  | { type: "SET_SERVICES"; services: SelectedService[] }
  | { type: "CLEAR_SERVICES" }
  | { type: "SELECT_DATE"; date: string }
  | { type: "SET_OPENINGS_LOADING"; loading: boolean }
  | { type: "SET_MEMBER_OPENINGS"; memberOpenings: MemberOpenings[] }
  | {
      type: "SELECT_SLOT";
      memberOpenings: MemberOpenings;
      time: string;
    }
  | { type: "SET_PHONE"; phoneNumber: string }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_VERIFICATION_CODE"; code: string }
  | { type: "SET_VERIFICATION_SENT"; sent: boolean }
  | { type: "SET_VERIFY_PHASE"; phase: "phone" | "new-customer" | "returning" }
  | { type: "SET_CUSTOMER_ID"; customerId: string }
  | { type: "SET_CUSTOMER_NAME"; firstName: string; lastName: string }
  | { type: "SET_RESULT"; result: BookingResult }
  | {
      type: "SET_SERVICE_REQUEST_MEMBER";
      member: MemberOpenings;
    }
  | {
      type: "SET_SERVICE_REQUEST_RESULT";
      result: ServiceRequestResult;
    }
  | { type: "RESET" };

/* ─── Reducer ─── */

export function bookingReducer(
  state: BookingState,
  action: BookingAction,
): BookingState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_STEP":
      return { ...state, step: action.step, error: null };
    case "SET_BUSINESS":
      return { ...state, business: action.business };
    case "SET_SCHEDULES":
      return { ...state, schedules: action.schedules };
    case "SET_ENTRY":
      return {
        ...state,
        entryScheduleId: action.scheduleId,
        entryMemberId: action.memberId,
      };
    case "SET_ENTRY_RESOLVED":
      return { ...state, entryResolved: true };
    case "SET_SELECTED_MEMBER":
      return { ...state, selectedMemberId: action.memberId };
    case "SET_SELECTED_SCHEDULE":
      return { ...state, selectedScheduleId: action.scheduleId };
    case "SET_SCHEDULE_DETAIL":
      return {
        ...state,
        selectedScheduleId: action.scheduleId,
        members: action.members,
        services: action.services,
      };
    case "SELECT_SERVICE": {
      const exists = state.selectedServices.some(
        (s) => s.id === action.service.id,
      );
      return {
        ...state,
        selectedServices: exists
          ? state.selectedServices.map((s) =>
              s.id === action.service.id ? action.service : s,
            )
          : [...state.selectedServices, action.service],
      };
    }
    case "REMOVE_SERVICE":
      return {
        ...state,
        selectedServices: state.selectedServices.filter(
          (s) => s.id !== action.serviceId,
        ),
      };
    case "SET_SERVICES":
      return { ...state, selectedServices: action.services };
    case "CLEAR_SERVICES":
      return { ...state, selectedServices: [] };
    case "SELECT_DATE":
      return {
        ...state,
        selectedDate: action.date,
        memberOpenings: [],
        selectedMemberOpenings: null,
        selectedTime: null,
      };
    case "SET_OPENINGS_LOADING":
      return { ...state, openingsLoading: action.loading };
    case "SET_MEMBER_OPENINGS":
      return { ...state, memberOpenings: action.memberOpenings };
    case "SELECT_SLOT":
      return {
        ...state,
        selectedMemberOpenings: action.memberOpenings,
        selectedTime: action.time,
      };
    case "SET_PHONE":
      return { ...state, phoneNumber: action.phoneNumber };
    case "SET_EMAIL":
      return { ...state, email: action.email };
    case "SET_VERIFICATION_CODE":
      return { ...state, verificationCode: action.code };
    case "SET_VERIFICATION_SENT":
      return { ...state, verificationSent: action.sent };
    case "SET_VERIFY_PHASE":
      return { ...state, verifyPhase: action.phase };
    case "SET_CUSTOMER_ID":
      return { ...state, customerId: action.customerId };
    case "SET_CUSTOMER_NAME":
      return {
        ...state,
        customerFirstName: action.firstName,
        customerLastName: action.lastName,
      };
    case "SET_RESULT":
      return { ...state, result: action.result, step: "confirm", error: null };
    case "SET_SERVICE_REQUEST_MEMBER":
      return {
        ...state,
        serviceRequestMember: action.member,
        step: "service-request",
        error: null,
      };
    case "SET_SERVICE_REQUEST_RESULT":
      return {
        ...state,
        serviceRequestResult: action.result,
        step: "confirm",
        error: null,
      };
    case "RESET":
      // Preserve business + schedules (no need to refetch) AND the original
      // entry point so a post-confirm "Book another" lands back on the same
      // entry screen (e.g. staff-booking returns to that member, not the
      // schedule list). Auto-selection re-runs because entryResolved resets.
      return {
        ...initialState,
        business: state.business,
        schedules: state.schedules,
        entryScheduleId: state.entryScheduleId,
        entryMemberId: state.entryMemberId,
      };
    default:
      return state;
  }
}
