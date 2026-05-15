// ── Main widget ──
export { BookingWidget, type CompletionMode } from "./BookingWidget";

// ── Individual step components (for composable usage) ──
export { ScheduleStep } from "./components/ScheduleStep";
export { OpeningsStep } from "./components/OpeningsStep";
export { ReviewStep } from "./components/ReviewStep";
export { VerifyStep } from "./components/VerifyStep";
export { ConfirmStep } from "./components/ConfirmStep";
export { ServiceRequestStep } from "./components/ServiceRequestStep";

// ── Theme & labels ──
export { themeToCssVars, defaultTheme, type BookingTheme } from "./theme";
export { defaultLabels, type BookingLabels } from "./labels";

// ── Re-export provider for composable usage ──
export { OpeningsProvider } from "@openings-link/react";
