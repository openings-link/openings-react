import { useCallback } from "react";
import { useBookingContext } from "../context";
import type { MemberOpenings, ServiceRequestResult } from "../types";

interface UseServiceRequestReturn {
  member: MemberOpenings | null;
  result: ServiceRequestResult | null;
  loading: boolean;
  error: string | null;
  startRequest: (member: MemberOpenings) => void;
  submitRequest: (input: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    note?: string;
    userPhotos?: string[];
    referencePhotos?: string[];
  }) => Promise<void>;
  uploadImage: (file: File) => Promise<string>;
}

export function useServiceRequest(): UseServiceRequestReturn {
  const { state, dispatch, apiClient, callbacks } = useBookingContext();

  const startRequest = useCallback(
    (member: MemberOpenings) => {
      dispatch({ type: "SET_SERVICE_REQUEST_MEMBER", member });
    },
    [dispatch],
  );

  const submitRequest = useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber?: string;
      note?: string;
      userPhotos?: string[];
      referencePhotos?: string[];
    }) => {
      if (!state.business || !state.serviceRequestMember) return;

      const member = state.serviceRequestMember;
      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "SET_ERROR", error: null });

      try {
        const result = await apiClient.createServiceRequest({
          businessId: state.business.id,
          userId: member.userId ?? undefined,
          teamMemberId: member.teamMemberId ?? undefined,
          scheduleId: member.schedule?.id,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phoneNumber: input.phoneNumber,
          note: input.note,
          userPhotos: input.userPhotos,
          referencePhotos: input.referencePhotos,
          serviceIds: state.selectedServices.map((s) => s.id),
          serviceTitles: state.selectedServices.map((s) => s.title),
        });
        dispatch({ type: "SET_SERVICE_REQUEST_RESULT", result });
        callbacks.onServiceRequestComplete?.(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to send request";
        dispatch({ type: "SET_ERROR", error: message });
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [
      state.business,
      state.serviceRequestMember,
      state.selectedServices,
      apiClient,
      dispatch,
      callbacks,
    ],
  );

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(",")[1];
            const result = await apiClient.uploadImage({
              filename: file.name,
              filetype: file.type,
              base64String: base64,
            });
            resolve(result.url);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    },
    [apiClient],
  );

  return {
    member: state.serviceRequestMember,
    result: state.serviceRequestResult,
    loading: state.loading,
    error: state.error,
    startRequest,
    submitRequest,
    uploadImage,
  };
}
