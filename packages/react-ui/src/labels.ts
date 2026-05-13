/** Default label strings — override via the `labels` prop for i18n. */
export interface BookingLabels {
  selectSchedule: string;
  selectService: string;
  selectDate: string;
  selectTime: string;
  noSlots: string;
  review: string;
  bookButton: string;
  verifyTitle: string;
  verifyPrompt: string;
  confirmTitle: string;
  confirmMessage: string;
  back: string;
  loading: string;
  errorRetry: string;
  combineServices: string;
  combineServicesTitle: string;
  combineServicesSubmit: string;
  consultationRequired: string;
  consultationNotice: string;
  sendRequest: string;
  serviceRequestTitle: string;
  serviceRequestFirstName: string;
  serviceRequestLastName: string;
  serviceRequestEmail: string;
  serviceRequestPhone: string;
  serviceRequestNote: string;
  serviceRequestNotePlaceholder: string;
  serviceRequestSubmit: string;
  serviceRequestPhotos: string;
  serviceRequestPhotosAdd: string;
  serviceRequestPhotosHint: string;
  serviceRequestSent: string;
  serviceRequestSentMessage: string;
  staffInfo: string;
  findNextAvailability: string;
  noOpeningsKeepLooking: string;
  searchingNextAvailability: string;
  nextAvailabilityNoneFound: string;
  rescheduleChoiceTitle: string;
  rescheduleChoicePrompt: string;
  rescheduleNewAppointment: string;
  rescheduleExistingAppointment: string;
  rescheduleVerifyTitle: string;
  rescheduleVerifyPrompt: string;
  rescheduleListTitle: string;
  rescheduleListEmpty: string;
  rescheduleConfirmButton: string;
}

export const defaultLabels: BookingLabels = {
  selectSchedule: "Choose a schedule",
  selectService: "Service",
  selectDate: "Pick a date",
  selectTime: "Openings",
  noSlots: "No openings available for this day",
  review: "Booking summary",
  bookButton: "Confirm booking",
  verifyTitle: "Confirm your booking",
  verifyPrompt: "Enter the code we sent you",
  confirmTitle: "You're booked!",
  confirmMessage: "Your appointment has been confirmed.",
  back: "Back",
  loading: "Loading...",
  errorRetry: "Something went wrong. Try again.",
  combineServices: "＋ Custom (combine services)",
  combineServicesTitle: "Build Services",
  combineServicesSubmit: "Find Openings",
  consultationRequired: "Consultation Required",
  consultationNotice:
    "This service requires a consultation. Send a request and we'll get back to you.",
  sendRequest: "Send a Request",
  serviceRequestTitle: "Send a Request",
  serviceRequestFirstName: "First name",
  serviceRequestLastName: "Last name",
  serviceRequestEmail: "Email",
  serviceRequestPhone: "Phone (optional)",
  serviceRequestNote: "Describe your request",
  serviceRequestNotePlaceholder: "Tell us what you're looking for...",
  serviceRequestPhotos: "Reference photos (optional)",
  serviceRequestPhotosAdd: "Add",
  serviceRequestPhotosHint:
    "Up to 10 images. Large photos are resized automatically.",
  serviceRequestSubmit: "Send Request",
  serviceRequestSent: "Request Sent!",
  serviceRequestSentMessage:
    "We've received your request and will get back to you soon.",
  staffInfo: "Staff info",
  findNextAvailability: "Find Next Availability",
  noOpeningsKeepLooking:
    "No openings found for this date. Check availability on other days.",
  searchingNextAvailability: "Searching for next available days…",
  nextAvailabilityNoneFound: "No upcoming availability found.",
  rescheduleChoiceTitle: "Welcome back",
  rescheduleChoicePrompt: "You have an upcoming appointment.",
  rescheduleNewAppointment: "Make a new appointment",
  rescheduleExistingAppointment: "Reschedule an existing appointment",
  rescheduleVerifyTitle: "Verify to reschedule",
  rescheduleVerifyPrompt: "Enter the code we sent you.",
  rescheduleListTitle: "Choose an appointment",
  rescheduleListEmpty: "No upcoming appointments were found.",
  rescheduleConfirmButton: "Reschedule appointment",
};
