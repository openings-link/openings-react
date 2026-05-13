/**
 * Lightweight API client for the Openings public API.
 *
 * Zero dependencies. Uses native `fetch`. This is adapted from the Openings
 * embed widget — talks to the same REST endpoints with plain fetch and minimal
 * types.
 */

import type {
  Business,
  Schedule,
  Member,
  Service,
  MemberOpenings,
  BookingResult,
  ServiceRequestResult,
  NextAvailabilityItem,
  AppointmentMetadata,
} from "./types";

/* ─── Internal response types ─── */

interface ScheduleDetail {
  schedule: Schedule;
  members: Member[];
  services: Service[];
}

interface SendVerificationResult {
  status: string;
  method?: "sms" | "email";
}

interface VerifyCodeResult {
  verified: boolean;
}

interface CreateCustomerResult {
  customerId: string;
  alreadyExists?: boolean;
}

export interface AppointmentHistoryService {
  id: string;
  title?: string;
  duration?: number;
  price?: number;
  referenceId?: string;
  optionId?: string;
}

export interface AppointmentHistoryItem {
  id?: string;
  appointmentId: string;
  date: string;
  time: string;
  datetime?: string;
  formattedDatetime: string;
  price?: number;
  duration?: number;
  isCanceled?: boolean;
  isRescheduled?: boolean;
  services?: AppointmentHistoryService[];
}

export interface SafeAppointmentHistoryResult {
  customerId?: string;
  needCreditCard: boolean;
  hasUpcomingAppointments: boolean;
  verificationPurpose?: string;
  upcomingAppointments: AppointmentHistoryItem[];
}

export interface AppointmentHistoryResult {
  customerId?: string;
  needCreditCard: boolean;
  hasUpcomingAppointments?: boolean;
  verificationPurpose?: string;
  upcomingAppointments: AppointmentHistoryItem[];
}

interface CreateAppointmentResult {
  appointmentId: string;
  date?: string;
  time?: string;
}

type RescheduleAppointmentResult = CreateAppointmentResult;

/* ─── Fetch helper ─── */

async function api<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = baseUrl.replace(/\/$/, "") + path;
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  // Only set Content-Type for requests with a body — setting it on GETs
  // triggers a CORS preflight that many servers don't handle.
  if (init?.body) {
    headers["Content-Type"] ??= "application/json";
  }
  const res = await fetch(url, { ...init, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as Record<string, unknown>)?.error &&
      typeof (json as Record<string, unknown>).error === "object"
        ? ((json as Record<string, { message?: string }>).error?.message ??
          `HTTP ${res.status}`)
        : (((json as Record<string, unknown>)?.message as string) ??
          `HTTP ${res.status}`);
    throw Object.assign(new Error(msg), { status: res.status, body: json });
  }
  // The Openings API wraps responses in { ok: true, data: … }
  if (json && typeof json === "object" && "data" in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

/* ─── Public API client ─── */

export interface ApiClient {
  fetchBusiness(slug: string): Promise<Business>;
  fetchSchedules(businessId: string): Promise<Schedule[]>;
  fetchScheduleDetail(
    scheduleId: string,
  ): Promise<{ schedule: Schedule; members: Member[]; services: Service[] }>;
  fetchMemberOpenings(
    businessId: string,
    scheduleId: string,
    date: string,
    services: { serviceId: string; optionId?: string }[],
  ): Promise<MemberOpenings[]>;
  fetchNextAvailability(input: {
    businessId: string;
    scheduleIds: string[];
    /** Restrict search to per-member child schedules of this team member. */
    teamMemberId?: string;
    date: string;
    serviceDuration: number;
    days?: number;
  }): Promise<NextAvailabilityItem[]>;
  fetchAppointmentHistory(
    phoneNumber: string,
    businessId: string,
  ): Promise<SafeAppointmentHistoryResult>;
  fetchAppointmentHistoryByEmail(
    email: string,
    businessId: string,
  ): Promise<SafeAppointmentHistoryResult>;
  fetchVerifiedAppointmentHistory(input: {
    businessId: string;
    phoneNumber?: string;
    email?: string;
    code: string;
  }): Promise<AppointmentHistoryResult>;
  sendVerification(opts: {
    phoneNumber?: string;
    email?: string;
    businessId: string;
    /** Defaults to booking:{businessId}. Use the API-provided purpose for non-booking flows. */
    purpose?: string;
  }): Promise<SendVerificationResult>;
  verifyCode(opts: {
    phoneNumber?: string;
    email?: string;
    code: string;
    businessId: string;
    /** Defaults to booking:{businessId}. Use the API-provided purpose for non-booking flows. */
    purpose?: string;
  }): Promise<VerifyCodeResult>;
  createCustomer(input: {
    businessId: string;
    userId: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }): Promise<CreateCustomerResult>;
  createAppointment(input: {
    businessId: string;
    userId: string;
    scheduleId: string;
    customerId: string;
    teamMemberId?: string;
    services: { id: string; optionId?: string }[];
    date: string;
    time: string;
    verificationCode?: string;
    metadata?: AppointmentMetadata;
  }): Promise<BookingResult>;
  rescheduleAppointment(input: {
    businessId: string;
    userId: string;
    scheduleId: string;
    rescheduleAppointmentId: string;
    services: { id: string; optionId?: string }[];
    date: string;
    time: string;
    verificationCode: string;
    phoneNumber?: string;
    email?: string;
  }): Promise<BookingResult>;
  createServiceRequest(input: {
    businessId: string;
    userId?: string;
    teamMemberId?: string;
    scheduleId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    note?: string;
    userPhotos?: string[];
    referencePhotos?: string[];
    serviceIds: string[];
    serviceTitles: string[];
  }): Promise<ServiceRequestResult>;
  uploadImage(input: {
    filename: string;
    filetype: string;
    base64String: string;
  }): Promise<{ url: string }>;
}

/** Create the default API client that talks to the Openings public API. */
export function createApiClient(baseUrl: string): ApiClient {
  return {
    fetchBusiness(slug) {
      return api<Business>(
        baseUrl,
        `/v1/salons/by-slug?slug=${encodeURIComponent(slug)}`,
      );
    },

    fetchSchedules(businessId) {
      return api<{ items: Schedule[] }>(
        baseUrl,
        `/v1/locations?salonId=${encodeURIComponent(businessId)}`,
      ).then((r) => r?.items ?? []);
    },

    fetchScheduleDetail(scheduleId) {
      return api<ScheduleDetail>(
        baseUrl,
        `/v1/locations/${encodeURIComponent(scheduleId)}/detail`,
      );
    },

    fetchMemberOpenings(businessId, scheduleId, date, services) {
      const qs = new URLSearchParams({
        salonId: businessId,
        scheduleId,
        date,
        services: JSON.stringify(services),
      });
      return api<MemberOpenings[]>(
        baseUrl,
        `/v1/openings/members?${qs.toString()}`,
      );
    },

    fetchNextAvailability({
      businessId,
      scheduleIds,
      teamMemberId,
      date,
      serviceDuration,
      days,
    }) {
      const qs = new URLSearchParams({
        salonId: businessId,
        scheduleIds: scheduleIds.join(","),
        date,
        serviceDuration: String(serviceDuration),
      });
      if (teamMemberId) qs.set("teamMemberId", teamMemberId);
      if (days) qs.set("days", String(days));
      return api<NextAvailabilityItem[]>(
        baseUrl,
        `/v1/openings/next-availability?${qs.toString()}`,
      );
    },

    fetchAppointmentHistory(phoneNumber, businessId) {
      const qs = new URLSearchParams({ salonId: businessId });
      return api<SafeAppointmentHistoryResult>(
        baseUrl,
        `/v1/appointments/history/${encodeURIComponent(phoneNumber)}?${qs.toString()}`,
      );
    },

    fetchAppointmentHistoryByEmail(email, businessId) {
      const qs = new URLSearchParams({ email, salonId: businessId });
      return api<SafeAppointmentHistoryResult>(
        baseUrl,
        `/v1/appointments/history/by-email?${qs.toString()}`,
      );
    },

    fetchVerifiedAppointmentHistory(input) {
      const body: Record<string, string> = {
        salonId: input.businessId,
        code: input.code,
      };
      if (input.phoneNumber) body.phoneNumber = input.phoneNumber;
      if (input.email) body.email = input.email;
      return api<AppointmentHistoryResult>(
        baseUrl,
        "/v1/appointments/history/verified",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
    },

    sendVerification(opts) {
      const body: Record<string, string> = {
        purpose: opts.purpose ?? `booking:${opts.businessId}`,
      };
      if (opts.phoneNumber) body.phoneNumber = opts.phoneNumber;
      if (opts.email) body.email = opts.email;
      return api<SendVerificationResult>(baseUrl, "/v1/verifications/send", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    verifyCode(opts) {
      const body: Record<string, string> = {
        code: opts.code,
        purpose: opts.purpose ?? `booking:${opts.businessId}`,
      };
      if (opts.phoneNumber) body.phoneNumber = opts.phoneNumber;
      if (opts.email) body.email = opts.email;
      return api<VerifyCodeResult>(baseUrl, "/v1/verifications/verify", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    createCustomer(input) {
      return api<CreateCustomerResult>(baseUrl, "/v1/customers/booking", {
        method: "POST",
        body: JSON.stringify({
          salonId: input.businessId,
          userId: input.userId,
          firstName: input.firstName,
          lastName: input.lastName,
          phoneNumber: input.phoneNumber,
        }),
      });
    },

    createAppointment(input) {
      return api<CreateAppointmentResult>(baseUrl, "/v1/appointments/create", {
        method: "POST",
        body: JSON.stringify({
          salonId: input.businessId,
          userId: input.userId,
          scheduleId: input.scheduleId,
          customerId: input.customerId,
          teamMemberId: input.teamMemberId,
          services: input.services,
          date: input.date,
          time: input.time,
          verificationCode: input.verificationCode,
          metadata: input.metadata,
        }),
      }).then((result) => ({
        appointmentId: result.appointmentId,
        date: result.date ?? input.date,
        time: result.time ?? input.time,
      }));
    },

    rescheduleAppointment(input) {
      return api<RescheduleAppointmentResult>(
        baseUrl,
        "/v1/appointments/reschedule",
        {
          method: "POST",
          body: JSON.stringify({
            salonId: input.businessId,
            userId: input.userId,
            scheduleId: input.scheduleId,
            rescheduleAppointmentId: input.rescheduleAppointmentId,
            services: input.services,
            date: input.date,
            time: input.time,
            verificationCode: input.verificationCode,
            phoneNumber: input.phoneNumber,
            email: input.email,
          }),
        },
      ).then((result) => ({
        appointmentId: result.appointmentId,
        date: result.date ?? input.date,
        time: result.time ?? input.time,
      }));
    },

    createServiceRequest(input) {
      const body: Record<string, unknown> = {
        salonId: input.businessId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        serviceIds: input.serviceIds,
        serviceTitles: input.serviceTitles,
      };
      if (input.userId) body.userId = input.userId;
      if (input.teamMemberId) body.teamMemberId = input.teamMemberId;
      if (input.scheduleId) body.scheduleId = input.scheduleId;
      if (input.phoneNumber) body.phoneNumber = input.phoneNumber;
      if (input.note) body.note = input.note;
      if (input.userPhotos?.length) body.userPhotos = input.userPhotos;
      if (input.referencePhotos?.length)
        body.referencePhotos = input.referencePhotos;
      return api<ServiceRequestResult>(baseUrl, "/v1/service-requests/public", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    uploadImage(input) {
      return api<{ url: string }>(baseUrl, "/v1/media/upload-public", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
  };
}
