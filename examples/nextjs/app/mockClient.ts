import type { ApiClient } from "@openings-link/react";

/* ─────────────────────────────────────────────────
 * Shared fixture data — Demo Barbershop
 * Mirrors the live demo at openings.link/demo
 * ───────────────────────────────────────────────── */

const SCHEDULES = [
  {
    id: "sched_east_village",
    title: "East Village",
    address: "154 Orchard St, New York, NY 10002, USA",
  },
  {
    id: "sched_soho",
    title: "SoHo",
    address: "129 Grand St, New York, NY 10013, USA",
  },
];

const MEMBERS = [
  {
    id: "mem_john",
    userId: null,
    teamMemberId: "tm_john",
    username: "john",
    name: "John",
    photo: null,
    bio: null,
  },
  {
    id: "mem_amy",
    userId: null,
    teamMemberId: "tm_amy",
    username: "amy",
    name: "Amy",
    photo: null,
    bio: null,
  },
  {
    id: "mem_rose",
    userId: null,
    teamMemberId: "tm_rose",
    username: "rose",
    name: "Rose",
    photo: null,
    bio: null,
  },
  {
    id: "mem_noah",
    userId: null,
    teamMemberId: "tm_noah",
    username: "noah",
    name: "Noah",
    photo: null,
    bio: null,
  },
  {
    id: "mem_natalie",
    userId: null,
    teamMemberId: "tm_natalie",
    username: "natalie",
    name: "Natalie",
    photo: null,
    bio: null,
  },
];

const SERVICES = [
  {
    id: "svc_short_haircut",
    title: "Short Haircut",
    description: "Classic short cut with styling",
    price: 4500,
    duration: 45,
    up: false,
  },
  {
    id: "svc_medium_haircut",
    title: "Medium Haircut",
    description: "Shoulder-length cut with shampoo and styling",
    price: 5000,
    duration: 50,
    up: false,
  },
  {
    id: "svc_long_haircut",
    title: "Long Haircut",
    description: "Full-length cut, shampoo, and blow-dry",
    price: 6000,
    duration: 60,
    up: false,
  },
  {
    id: "svc_color",
    title: "Color",
    description: "From highlights to full transformations",
    price: 10000,
    duration: 120,
    up: false,
    hasConsultation: true,
  },
];

/** Each staff member offers different services */
const MEMBER_SERVICES: Record<string, typeof SERVICES> = {
  mem_john: [SERVICES[0], SERVICES[1], SERVICES[2], SERVICES[3]],
  mem_amy: [SERVICES[0], SERVICES[1], SERVICES[2], SERVICES[3]],
  mem_rose: [SERVICES[0], SERVICES[1], SERVICES[2], SERVICES[3]],
  mem_noah: [SERVICES[0], SERVICES[1], SERVICES[2]],
  mem_natalie: [SERVICES[0], SERVICES[1], SERVICES[2], SERVICES[3]],
};

/** Staff assigned to each location */
const SCHEDULE_MEMBERS: Record<string, typeof MEMBERS> = {
  sched_east_village: [MEMBERS[0], MEMBERS[1], MEMBERS[3]], // John, Amy, Noah
  sched_soho: [MEMBERS[1], MEMBERS[2], MEMBERS[0], MEMBERS[4]], // Amy, Rose, John, Natalie
};

const TIME_BLOCKS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "13:00",
  "13:30",
  "14:00",
  "15:00",
  "15:30",
];

/* ─── Shared booking stubs ─── */

const bookingStubs = {
his  async probeAppointmentHistory({ phoneNumber }: { phoneNumber: string }) {
    // Demo trigger: any phone ending in "00" pretends to have an existing
    // appointment so the secondary CTA can be exercised in the demo.
    return { hasUpcomingAppointments: phoneNumber.trim().endsWith("00") };
  },
  async getAppointmentHistory({
    verificationCode,
  }: {
    verificationCode: string;
  }) {
    if (verificationCode !== "1234") {
      throw new Error("Invalid verification code");
    }
    return {
      hasUpcomingAppointments: true,
      customerId: "cust_demo_001",
      needCreditCard: false,
      upcomingAppointments: [
        {
          id: "apt_demo_history_1",
          appointmentId: "apt_demo_history_1",
          date: "2026-05-12",
          time: "10:00",
          formattedDatetime: "Tue, May 12 at 10:00 AM",
          duration: 45,
          price: 4500,
          isCanceled: false,
          services: [] as never[],
        },
      ],
    };
  },
  async fetchNextAvailability() {
    return [];
  },
  async sendVerification() {
    return { status: "sent", method: "sms" as const };
  },
  async verifyCode() {
    return { verified: true };
  },
  async createCustomer() {
    return { ok: true };
  },
  async createAppointment(_input: { date: string; time: string }) {
    return {
      appointmentId: "apt_demo_" + Date.now(),
      date: _input.date,
      time: _input.time,
    };
  },
  async createServiceRequest() {
    return { serviceRequestId: "sr_demo_" + Date.now() };
  },
  async uploadImage() {
    return { url: "https://placehold.co/400x400?text=Uploaded" };
  },
};

/* ═══════════════════════════════════════════════════
 * Multi-location client — 2 schedules, 5 staff
 * ═══════════════════════════════════════════════════ */

export const multiLocationClient: ApiClient = {
  async fetchBusiness() {
    return {
      id: "biz_demo",
      name: "Demo Barbershop",
      slug: "demo",
      domain: null,
      logo: null,
      timezone: "America/New_York",
      cancellationPolicyEnabled: false,
      cancellationPolicyHours: null,
      verificationMethod: "SMS",
    };
  },

  async fetchSchedules() {
    return SCHEDULES;
  },

  async fetchScheduleDetail(scheduleId) {
    const schedule = SCHEDULES.find((s) => s.id === scheduleId) ?? SCHEDULES[0];
    const scheduleMembers = SCHEDULE_MEMBERS[schedule.id] ?? MEMBERS;
    const memberSpecificServices = scheduleMembers.flatMap((m) => {
      const memberSvcs = MEMBER_SERVICES[m.id] ?? [];
      return memberSvcs.map((s) => ({
        ...s,
        id: `${s.id}_${m.id}`,
        referenceId: s.id,
        teamMemberId: m.teamMemberId,
        userId: m.userId,
      }));
    });
    return {
      schedule,
      members: scheduleMembers,
      services: [...SERVICES, ...memberSpecificServices],
    };
  },

  async fetchMemberOpenings(_businessId, scheduleId) {
    const schedule = SCHEDULES.find((s) => s.id === scheduleId) ?? SCHEDULES[0];
    const scheduleMembers = SCHEDULE_MEMBERS[schedule.id] ?? MEMBERS;
    return scheduleMembers.map((m, i) => {
      const memberSvcs = MEMBER_SERVICES[m.id] ?? SERVICES;
      return {
        userId: m.userId,
        teamMemberId: m.teamMemberId,
        username: m.username,
        name: m.name ?? m.username,
        schedule: {
          id: schedule.id,
          title: schedule.title,
          address: schedule.address,
        },
        openings: TIME_BLOCKS.slice(i, i + 6),
        services: memberSvcs.map((s) => ({
          id: s.id,
          title: s.title,
          duration: s.duration,
          price: s.price,
          hasConsultation: s.hasConsultation,
        })),
      };
    });
  },

  ...bookingStubs,
};

/* ═══════════════════════════════════════════════════
 * Single-location client — 1 schedule (East Village)
 * Skips the schedule picker automatically.
 * ═══════════════════════════════════════════════════ */

export const singleLocationClient: ApiClient = {
  async fetchBusiness() {
    return {
      id: "biz_demo",
      name: "Demo Barbershop",
      slug: "demo",
      domain: null,
      logo: null,
      timezone: "America/New_York",
      cancellationPolicyEnabled: false,
      cancellationPolicyHours: null,
      verificationMethod: "SMS",
    };
  },

  async fetchSchedules() {
    return [SCHEDULES[0]]; // Only East Village
  },

  async fetchScheduleDetail() {
    const schedule = SCHEDULES[0];
    const scheduleMembers = SCHEDULE_MEMBERS[schedule.id]!;
    const memberSpecificServices = scheduleMembers.flatMap((m) => {
      const memberSvcs = MEMBER_SERVICES[m.id] ?? [];
      return memberSvcs.map((s) => ({
        ...s,
        id: `${s.id}_${m.id}`,
        referenceId: s.id,
        teamMemberId: m.teamMemberId,
        userId: m.userId,
      }));
    });
    return {
      schedule,
      members: scheduleMembers,
      services: [...SERVICES, ...memberSpecificServices],
    };
  },

  async fetchMemberOpenings() {
    const schedule = SCHEDULES[0];
    const scheduleMembers = SCHEDULE_MEMBERS[schedule.id]!;
    return scheduleMembers.map((m, i) => {
      const memberSvcs = MEMBER_SERVICES[m.id] ?? SERVICES;
      return {
        userId: m.userId,
        teamMemberId: m.teamMemberId,
        username: m.username,
        name: m.name ?? m.username,
        schedule: {
          id: schedule.id,
          title: schedule.title,
          address: schedule.address,
        },
        openings: TIME_BLOCKS.slice(i, i + 6),
        services: memberSvcs.map((s) => ({
          id: s.id,
          title: s.title,
          duration: s.duration,
          price: s.price,
          hasConsultation: s.hasConsultation,
        })),
      };
    });
  },

  ...bookingStubs,
};
