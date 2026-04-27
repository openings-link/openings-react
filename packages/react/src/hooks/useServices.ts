import { useBookingContext } from "../context";
import type { Service, Member, SelectedService } from "../types";

interface UseServicesReturn {
  services: Service[];
  members: Member[];
  selectedServices: SelectedService[];
  selectService: (service: SelectedService) => void;
  removeService: (serviceId: string) => void;
  setServices: (services: SelectedService[]) => void;
  clearServices: () => void;
}

export function useServices(): UseServicesReturn {
  const { state, dispatch, callbacks } = useBookingContext();

  // Filter to business-level services (no referenceId)
  const businessServices = state.services.filter(
    (s) => s.referenceId === null || s.referenceId === undefined,
  );

  // When a member is selected, filter to only their services
  let memberServices: Service[] = [];
  if (state.selectedMemberId) {
    const member = state.members.find((m) => m.id === state.selectedMemberId);
    if (member?.teamMemberId) {
      memberServices = state.services.filter(
        (s) => s.teamMemberId === member.teamMemberId,
      );
    }
  }

  const selectService = (service: SelectedService) => {
    const fullService = state.services.find((s) => s.id === service.id);
    if (fullService) {
      callbacks.onServiceSelect?.(fullService);
    }
    dispatch({ type: "SELECT_SERVICE", service });
  };

  const removeService = (serviceId: string) => {
    dispatch({ type: "REMOVE_SERVICE", serviceId });
  };

  const setServices = (services: SelectedService[]) => {
    dispatch({ type: "SET_SERVICES", services });
  };

  const clearServices = () => {
    dispatch({ type: "CLEAR_SERVICES" });
  };

  // When a member is selected, show ONLY their services. The Openings API
  // tags each service with its owning teamMemberId, so this filter is
  // authoritative — no fallback to host-level offerings.
  const filteredServices = state.selectedMemberId
    ? memberServices
    : businessServices.length > 0
      ? businessServices
      : state.services;

  return {
    services: filteredServices,
    members: state.members,
    selectedServices: state.selectedServices,
    selectService,
    removeService,
    setServices,
    clearServices,
  };
}
