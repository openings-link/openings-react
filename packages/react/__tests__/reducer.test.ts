import { describe, it, expect } from "vitest";
import { bookingReducer, initialState } from "../src/reducer";
import type { BookingState } from "../src/reducer";
import type {
  MemberOpenings,
  SelectedService,
  BookingResult,
  ServiceRequestResult,
} from "../src/types";

/* ─── Fixtures ─── */

const service: SelectedService = {
  id: "svc1",
  title: "Haircut",
  price: 50,
  duration: 30,
};

const service2: SelectedService = {
  id: "svc2",
  title: "Beard Trim",
  price: 20,
  duration: 15,
};

const member: MemberOpenings = {
  userId: "u1",
  teamMemberId: "tm1",
  name: "Alex",
  photo: null,
  schedule: { id: "s1", title: "Downtown" },
  services: [{ id: "svc1", title: "Haircut", price: 50, duration: 30 }],
  slots: ["09:00", "09:30", "10:00"],
};

/* ─── Tests ─── */

describe("bookingReducer", () => {
  describe("initial state", () => {
    it("starts on the schedule step", () => {
      expect(initialState.step).toBe("schedule");
    });

    it("has no business or schedules", () => {
      expect(initialState.business).toBeNull();
      expect(initialState.schedules).toBeNull();
    });

    it("has empty selected services", () => {
      expect(initialState.selectedServices).toEqual([]);
    });
  });

  describe("SET_STEP", () => {
    it("changes the step and clears errors", () => {
      const state: BookingState = {
        ...initialState,
        error: "something broke",
      };
      const next = bookingReducer(state, {
        type: "SET_STEP",
        step: "openings",
      });
      expect(next.step).toBe("openings");
      expect(next.error).toBeNull();
    });
  });

  describe("SET_LOADING / SET_ERROR", () => {
    it("sets loading", () => {
      const next = bookingReducer(initialState, {
        type: "SET_LOADING",
        loading: true,
      });
      expect(next.loading).toBe(true);
    });

    it("sets error", () => {
      const next = bookingReducer(initialState, {
        type: "SET_ERROR",
        error: "oops",
      });
      expect(next.error).toBe("oops");
    });
  });

  describe("SET_BUSINESS / SET_SCHEDULES", () => {
    it("stores business", () => {
      const biz = { id: "b1", name: "Test Biz", slug: "test" };
      const next = bookingReducer(initialState, {
        type: "SET_BUSINESS",
        business: biz,
      });
      expect(next.business).toEqual(biz);
    });

    it("stores schedules", () => {
      const schedules = [{ id: "s1", title: "Main" }];
      const next = bookingReducer(initialState, {
        type: "SET_SCHEDULES",
        schedules,
      });
      expect(next.schedules).toEqual(schedules);
    });
  });

  describe("entry point", () => {
    it("SET_ENTRY stores schedule and member IDs", () => {
      const next = bookingReducer(initialState, {
        type: "SET_ENTRY",
        scheduleId: "s1",
        memberId: "m1",
      });
      expect(next.entryScheduleId).toBe("s1");
      expect(next.entryMemberId).toBe("m1");
    });

    it("SET_ENTRY_RESOLVED marks entry as resolved", () => {
      const next = bookingReducer(initialState, {
        type: "SET_ENTRY_RESOLVED",
      });
      expect(next.entryResolved).toBe(true);
    });
  });

  describe("services", () => {
    it("SELECT_SERVICE adds a service", () => {
      const next = bookingReducer(initialState, {
        type: "SELECT_SERVICE",
        service,
      });
      expect(next.selectedServices).toEqual([service]);
    });

    it("SELECT_SERVICE updates an existing service", () => {
      const state: BookingState = {
        ...initialState,
        selectedServices: [service],
      };
      const updated = {
        ...service,
        option: { id: "opt1", title: "Long", price: 70, duration: 45 },
      };
      const next = bookingReducer(state, {
        type: "SELECT_SERVICE",
        service: updated,
      });
      expect(next.selectedServices).toHaveLength(1);
      expect(next.selectedServices[0].option?.price).toBe(70);
    });

    it("REMOVE_SERVICE removes by ID", () => {
      const state: BookingState = {
        ...initialState,
        selectedServices: [service, service2],
      };
      const next = bookingReducer(state, {
        type: "REMOVE_SERVICE",
        serviceId: "svc1",
      });
      expect(next.selectedServices).toEqual([service2]);
    });

    it("SET_SERVICES replaces all services", () => {
      const state: BookingState = {
        ...initialState,
        selectedServices: [service],
      };
      const next = bookingReducer(state, {
        type: "SET_SERVICES",
        services: [service2],
      });
      expect(next.selectedServices).toEqual([service2]);
    });

    it("CLEAR_SERVICES empties the list", () => {
      const state: BookingState = {
        ...initialState,
        selectedServices: [service, service2],
      };
      const next = bookingReducer(state, { type: "CLEAR_SERVICES" });
      expect(next.selectedServices).toEqual([]);
    });
  });

  describe("date & time selection", () => {
    it("SELECT_DATE sets date and clears slots", () => {
      const state: BookingState = {
        ...initialState,
        selectedDate: "2026-01-01",
        memberOpenings: [member],
        selectedMemberOpenings: member,
        selectedTime: "10:00",
      };
      const next = bookingReducer(state, {
        type: "SELECT_DATE",
        date: "2026-01-02",
      });
      expect(next.selectedDate).toBe("2026-01-02");
      expect(next.memberOpenings).toEqual([]);
      expect(next.selectedMemberOpenings).toBeNull();
      expect(next.selectedTime).toBeNull();
    });

    it("SELECT_SLOT stores member and time", () => {
      const next = bookingReducer(initialState, {
        type: "SELECT_SLOT",
        memberOpenings: member,
        time: "09:30",
      });
      expect(next.selectedMemberOpenings).toEqual(member);
      expect(next.selectedTime).toBe("09:30");
    });
  });

  describe("verification flow", () => {
    it("SET_PHONE stores phone", () => {
      const next = bookingReducer(initialState, {
        type: "SET_PHONE",
        phoneNumber: "+15551234567",
      });
      expect(next.phoneNumber).toBe("+15551234567");
    });

    it("SET_EMAIL stores email", () => {
      const next = bookingReducer(initialState, {
        type: "SET_EMAIL",
        email: "test@example.com",
      });
      expect(next.email).toBe("test@example.com");
    });

    it("SET_VERIFY_PHASE transitions verification phase", () => {
      const next = bookingReducer(initialState, {
        type: "SET_VERIFY_PHASE",
        phase: "new-customer",
      });
      expect(next.verifyPhase).toBe("new-customer");
    });

    it("SET_VERIFICATION_SENT marks code as sent", () => {
      const next = bookingReducer(initialState, {
        type: "SET_VERIFICATION_SENT",
        sent: true,
      });
      expect(next.verificationSent).toBe(true);
    });

    it("SET_CUSTOMER_ID stores the customer ID", () => {
      const next = bookingReducer(initialState, {
        type: "SET_CUSTOMER_ID",
        customerId: "cust_123",
      });
      expect(next.customerId).toBe("cust_123");
    });

    it("SET_CUSTOMER_NAME stores first and last name", () => {
      const next = bookingReducer(initialState, {
        type: "SET_CUSTOMER_NAME",
        firstName: "Jane",
        lastName: "Doe",
      });
      expect(next.customerFirstName).toBe("Jane");
      expect(next.customerLastName).toBe("Doe");
    });
  });

  describe("booking result", () => {
    it("SET_RESULT stores result and moves to confirm", () => {
      const result: BookingResult = {
        appointmentId: "apt_1",
        date: "2026-04-10",
        time: "14:00",
      };
      const state: BookingState = {
        ...initialState,
        step: "verify",
        error: "stale error",
      };
      const next = bookingReducer(state, { type: "SET_RESULT", result });
      expect(next.result).toEqual(result);
      expect(next.step).toBe("confirm");
      expect(next.error).toBeNull();
    });
  });

  describe("service request flow", () => {
    it("SET_SERVICE_REQUEST_MEMBER stores member and moves to service-request step", () => {
      const next = bookingReducer(initialState, {
        type: "SET_SERVICE_REQUEST_MEMBER",
        member,
      });
      expect(next.serviceRequestMember).toEqual(member);
      expect(next.step).toBe("service-request");
      expect(next.error).toBeNull();
    });

    it("SET_SERVICE_REQUEST_RESULT stores result and moves to confirm", () => {
      const result: ServiceRequestResult = { serviceRequestId: "sr_1" };
      const state: BookingState = {
        ...initialState,
        step: "service-request",
        error: "stale",
      };
      const next = bookingReducer(state, {
        type: "SET_SERVICE_REQUEST_RESULT",
        result,
      });
      expect(next.serviceRequestResult).toEqual(result);
      expect(next.step).toBe("confirm");
      expect(next.error).toBeNull();
    });
  });

  describe("RESET", () => {
    it("resets to initial state but preserves business and schedules", () => {
      const biz = { id: "b1", name: "Biz", slug: "biz" };
      const schedules = [{ id: "s1", title: "Main" }];
      const state: BookingState = {
        ...initialState,
        business: biz,
        schedules,
        step: "confirm",
        selectedServices: [service],
        result: { appointmentId: "apt_1", date: "2026-01-01", time: "10:00" },
        phoneNumber: "+15551234567",
      };
      const next = bookingReducer(state, { type: "RESET" });
      expect(next.step).toBe("schedule");
      expect(next.business).toEqual(biz);
      expect(next.schedules).toEqual(schedules);
      expect(next.selectedServices).toEqual([]);
      expect(next.result).toBeNull();
      expect(next.phoneNumber).toBe("");
      expect(next.serviceRequestResult).toBeNull();
    });
  });

  describe("appointment history (lazy-verify)", () => {
    it("starts with idle probe + no verified history", () => {
      expect(initialState.historyProbe).toEqual({
        status: "idle",
        hasUpcomingAppointments: null,
      });
      expect(initialState.verifiedHistory).toBeNull();
      expect(initialState.manageExistingChosen).toBe(false);
    });

    it("HISTORY_PROBE_SUCCEEDED stores the boolean", () => {
      const next = bookingReducer(initialState, {
        type: "HISTORY_PROBE_SUCCEEDED",
        hasUpcomingAppointments: true,
      });
      expect(next.historyProbe).toEqual({
        status: "ready",
        hasUpcomingAppointments: true,
      });
      // Probe MUST NOT auto-trigger the OTP — that's the whole point of
      // lazy-verify. manageExistingChosen stays false until the consumer
      // explicitly opts in.
      expect(next.manageExistingChosen).toBe(false);
      expect(next.verifiedHistory).toBeNull();
    });

    it("MANAGE_EXISTING_CHOSEN flips the gate without sending an OTP", () => {
      const probed = bookingReducer(initialState, {
        type: "HISTORY_PROBE_SUCCEEDED",
        hasUpcomingAppointments: true,
      });
      const next = bookingReducer(probed, { type: "MANAGE_EXISTING_CHOSEN" });
      expect(next.manageExistingChosen).toBe(true);
      // Sending the OTP is a separate action — the reducer doesn't fire
      // network calls, so HISTORY_VERIFICATION_SENT is dispatched only
      // after the hook awaits the request.
      expect(next.historyVerification.sent).toBe(false);
    });

    it("HISTORY_VERIFICATION_VERIFIED stores the full payload", () => {
      const payload = {
        hasUpcomingAppointments: true,
        upcomingAppointments: [
          {
            id: "a1",
            appointmentId: "a1",
            date: "2026-05-10",
            time: "10:00",
            formattedDatetime: "Sun, May 10 at 10:00 AM",
            isCanceled: false,
            services: [] as never[],
          },
        ],
        customerId: "cust_1",
        needCreditCard: false,
      };
      const next = bookingReducer(initialState, {
        type: "HISTORY_VERIFICATION_VERIFIED",
        payload,
      });
      expect(next.verifiedHistory).toEqual(payload);
      expect(next.historyVerification.status).toBe("verified");
    });

    it("SET_PHONE clears stale probe + history", () => {
      const dirty: BookingState = {
        ...initialState,
        historyProbe: {
          status: "ready",
          hasUpcomingAppointments: true,
        },
        manageExistingChosen: true,
        verifiedHistory: {
          hasUpcomingAppointments: true,
          upcomingAppointments: [],
          customerId: "cust_1",
          needCreditCard: false,
        },
      };
      const next = bookingReducer(dirty, {
        type: "SET_PHONE",
        phoneNumber: "+15559999999",
      });
      expect(next.historyProbe).toEqual({
        status: "idle",
        hasUpcomingAppointments: null,
      });
      expect(next.manageExistingChosen).toBe(false);
      expect(next.verifiedHistory).toBeNull();
    });
  });
});
