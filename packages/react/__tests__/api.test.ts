import { describe, it, expect, vi, beforeEach } from "vitest";
import { createApiClient } from "../src/api";

/* ─── Mock fetch ─── */

const BASE = "https://api.test.com";

function mockFetch(data: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(data),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("createApiClient", () => {
  describe("fetchBusiness", () => {
    it("calls the correct endpoint and unwraps data", async () => {
      const biz = { id: "b1", name: "Test", slug: "test" };
      globalThis.fetch = mockFetch({ ok: true, data: biz });

      const client = createApiClient(BASE);
      const result = await client.fetchBusiness("test");

      expect(result).toEqual(biz);
      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/v1/salons/by-slug?slug=test`,
        expect.objectContaining({ headers: {} }),
      );
    });
  });

  describe("fetchSchedules", () => {
    it("returns schedule items array", async () => {
      const schedules = [{ id: "s1", title: "Main" }];
      globalThis.fetch = mockFetch({
        ok: true,
        data: { items: schedules },
      });

      const client = createApiClient(BASE);
      const result = await client.fetchSchedules("b1");

      expect(result).toEqual(schedules);
    });
  });

  describe("fetchMemberOpenings", () => {
    it("sends services as JSON in query params", async () => {
      const openings = [{ userId: "u1", name: "Alex", slots: ["09:00"] }];
      globalThis.fetch = mockFetch({ ok: true, data: openings });

      const client = createApiClient(BASE);
      await client.fetchMemberOpenings("b1", "s1", "2026-04-10", [
        { serviceId: "svc1" },
      ]);

      const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(calledUrl).toContain("services=");
      expect(calledUrl).toContain("svc1");
    });
  });

  describe("createServiceRequest", () => {
    it("posts to the correct endpoint with body", async () => {
      const result = { serviceRequestId: "sr_1" };
      globalThis.fetch = mockFetch({ ok: true, data: result });

      const client = createApiClient(BASE);
      const res = await client.createServiceRequest({
        businessId: "b1",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@test.com",
        serviceIds: ["svc1"],
        serviceTitles: ["Haircut"],
        note: "Looking for a trim",
        userPhotos: ["https://cdn.test/photo1.jpg"],
      });

      expect(res).toEqual(result);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE}/v1/service-requests/public`);
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body);
      expect(body.salonId).toBe("b1");
      expect(body.firstName).toBe("Jane");
      expect(body.note).toBe("Looking for a trim");
      expect(body.userPhotos).toEqual(["https://cdn.test/photo1.jpg"]);
    });

    it("omits optional fields when not provided", async () => {
      globalThis.fetch = mockFetch({
        ok: true,
        data: { serviceRequestId: "sr_2" },
      });

      const client = createApiClient(BASE);
      await client.createServiceRequest({
        businessId: "b1",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@test.com",
        serviceIds: [],
        serviceTitles: [],
      });

      const body = JSON.parse(
        (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(body.note).toBeUndefined();
      expect(body.phoneNumber).toBeUndefined();
      expect(body.userPhotos).toBeUndefined();
      expect(body.referencePhotos).toBeUndefined();
    });
  });

  describe("createCustomer", () => {
    it("returns the customer id from the booking customer endpoint", async () => {
      globalThis.fetch = mockFetch({
        ok: true,
        data: { customerId: "cust_1", alreadyExists: true },
      });

      const client = createApiClient(BASE);
      const result = await client.createCustomer({
        businessId: "b1",
        userId: "u1",
        firstName: "Jane",
        lastName: "Doe",
        phoneNumber: "+15551234567",
      });

      expect(result).toEqual({ customerId: "cust_1", alreadyExists: true });
    });
  });

  describe("fetchAppointmentHistory", () => {
    it("returns only safe lookup signals from the public history endpoint", async () => {
      const history = {
        customerId: "cust_1",
        needCreditCard: false,
        hasUpcomingAppointments: true,
        verificationPurpose: "rescheduleLookup:b1:cust_1",
        upcomingAppointments: [],
      };
      globalThis.fetch = mockFetch({ ok: true, data: history });

      const client = createApiClient(BASE);
      const result = await client.fetchAppointmentHistory("+15551234567", "b1");

      expect(result).toEqual(history);
      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/v1/appointments/history/%2B15551234567?salonId=b1`,
        expect.objectContaining({ headers: {} }),
      );
    });

    it("supports privacy-safe lookup by email", async () => {
      const history = {
        customerId: "cust_1",
        needCreditCard: false,
        hasUpcomingAppointments: true,
        verificationPurpose: "rescheduleLookup:b1:cust_1",
        upcomingAppointments: [],
      };
      globalThis.fetch = mockFetch({ ok: true, data: history });

      const client = createApiClient(BASE);
      const result = await client.fetchAppointmentHistoryByEmail(
        "jane@test.com",
        "b1",
      );

      expect(result).toEqual(history);
      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/v1/appointments/history/by-email?email=jane%40test.com&salonId=b1`,
        expect.objectContaining({ headers: {} }),
      );
    });

    it("fetches appointment details only through verified history", async () => {
      const history = {
        customerId: "cust_1",
        needCreditCard: false,
        hasUpcomingAppointments: true,
        upcomingAppointments: [
          {
            appointmentId: "apt_1",
            date: "2026-05-10",
            time: "10:00",
            formattedDatetime: "Sun, May 10 at 10:00 AM",
          },
        ],
      };
      globalThis.fetch = mockFetch({ ok: true, data: history });

      const client = createApiClient(BASE);
      const result = await client.fetchVerifiedAppointmentHistory({
        businessId: "b1",
        phoneNumber: "+15551234567",
        code: "123456",
      });

      expect(result).toEqual(history);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE}/v1/appointments/history/verified`);
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({
        salonId: "b1",
        phoneNumber: "+15551234567",
        code: "123456",
      });
    });
  });

  describe("verification", () => {
    it("defaults to the booking purpose", async () => {
      globalThis.fetch = mockFetch({ ok: true, data: { status: "sent" } });

      const client = createApiClient(BASE);
      await client.sendVerification({
        phoneNumber: "+15551234567",
        businessId: "b1",
      });

      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(JSON.parse(init.body)).toMatchObject({ purpose: "booking:b1" });
    });

    it("allows callers to use an API-provided verification purpose", async () => {
      globalThis.fetch = mockFetch({ ok: true, data: { verified: true } });

      const client = createApiClient(BASE);
      await client.verifyCode({
        phoneNumber: "+15551234567",
        businessId: "b1",
        code: "123456",
        purpose: "rescheduleLookup:b1:cust_1",
      });

      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(JSON.parse(init.body)).toMatchObject({
        code: "123456",
        purpose: "rescheduleLookup:b1:cust_1",
      });
    });
  });

  describe("createAppointment", () => {
    it("fills date and time from the submitted booking when the API returns only an appointment id", async () => {
      globalThis.fetch = mockFetch({
        ok: true,
        data: { appointmentId: "apt_1" },
      });

      const client = createApiClient(BASE);
      const result = await client.createAppointment({
        businessId: "b1",
        userId: "u1",
        scheduleId: "sch_1",
        customerId: "cust_1",
        services: [{ id: "svc_1" }],
        date: "2026-05-10",
        time: "10:00",
        metadata: {
          source: "openings-react",
          embedId: "checkout-page",
        },
      });

      expect(result).toEqual({
        appointmentId: "apt_1",
        date: "2026-05-10",
        time: "10:00",
      });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE}/v1/appointments/create`);
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body);
      expect(body.date).toBe("2026-05-10");
      expect(body.time).toBe("10:00");
      expect(body.metadata).toEqual({
        source: "openings-react",
        embedId: "checkout-page",
      });
    });
  });

  describe("rescheduleAppointment", () => {
    it("passes the verified code to the public reschedule endpoint", async () => {
      globalThis.fetch = mockFetch({
        ok: true,
        data: { appointmentId: "apt_2" },
      });

      const client = createApiClient(BASE);
      const result = await client.rescheduleAppointment({
        businessId: "b1",
        userId: "u1",
        scheduleId: "sch_1",
        rescheduleAppointmentId: "apt_1",
        services: [{ id: "svc_1" }],
        date: "2026-05-11",
        time: "11:00",
        verificationCode: "123456",
        phoneNumber: "+15551234567",
      });

      expect(result).toEqual({
        appointmentId: "apt_2",
        date: "2026-05-11",
        time: "11:00",
      });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE}/v1/appointments/reschedule`);
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toMatchObject({
        rescheduleAppointmentId: "apt_1",
        verificationCode: "123456",
        phoneNumber: "+15551234567",
      });
    });
  });

  describe("uploadImage", () => {
    it("posts base64 image data", async () => {
      const result = { url: "https://cdn.test/uploaded.jpg" };
      globalThis.fetch = mockFetch({ ok: true, data: result });

      const client = createApiClient(BASE);
      const res = await client.uploadImage({
        filename: "photo.jpg",
        filetype: "image/jpeg",
        base64String: "aGVsbG8=",
      });

      expect(res).toEqual(result);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe(`${BASE}/v1/media/upload-public`);
      expect(init.method).toBe("POST");
    });
  });

  describe("error handling", () => {
    it("throws with error message from API", async () => {
      globalThis.fetch = mockFetch(
        { error: { message: "Rate limited" } },
        false,
        429,
      );

      const client = createApiClient(BASE);
      await expect(client.fetchBusiness("test")).rejects.toThrow(
        "Rate limited",
      );
    });

    it("throws with status code when no message", async () => {
      globalThis.fetch = mockFetch({}, false, 500);

      const client = createApiClient(BASE);
      await expect(client.fetchBusiness("test")).rejects.toThrow("HTTP 500");
    });

    it("throws with message field from API", async () => {
      globalThis.fetch = mockFetch({ message: "Not found" }, false, 404);

      const client = createApiClient(BASE);
      await expect(client.fetchBusiness("test")).rejects.toThrow("Not found");
    });
  });

  describe("Content-Type handling", () => {
    it("does not set Content-Type on GET requests", async () => {
      globalThis.fetch = mockFetch({ ok: true, data: {} });

      const client = createApiClient(BASE);
      await client.fetchBusiness("test");

      const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
        .headers;
      expect(headers["Content-Type"]).toBeUndefined();
    });

    it("sets Content-Type on POST requests", async () => {
      globalThis.fetch = mockFetch({
        ok: true,
        data: { serviceRequestId: "sr_1" },
      });

      const client = createApiClient(BASE);
      await client.createServiceRequest({
        businessId: "b1",
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
        serviceIds: [],
        serviceTitles: [],
      });

      const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
        .headers;
      expect(headers["Content-Type"]).toBe("application/json");
    });
  });
});
