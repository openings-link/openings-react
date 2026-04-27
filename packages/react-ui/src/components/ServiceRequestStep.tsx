import { useState, useRef, useCallback } from "react";
import {
  useServiceRequest,
  useBookingFlow,
  formatPrice,
} from "@openings-link/react";
import type { BookingLabels } from "../labels";

interface Props {
  labels: BookingLabels;
}

interface UploadingImage {
  id: string;
  file: File;
  preview: string;
  url?: string;
  error?: string;
  uploading: boolean;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];
const MAX_IMAGES = 10;
const MAX_SIZE_MB = 5;

export function ServiceRequestStep({ labels }: Props) {
  const { member, loading, error, submitRequest, uploadImage } =
    useServiceRequest();
  const { selectedMemberId } = useBookingFlow();
  const isMemberMode = !!selectedMemberId;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [images, setImages] = useState<UploadingImage[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!member) return null;

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const remaining = MAX_IMAGES - images.length;
      const toAdd = Array.from(files).slice(0, remaining);
      if (toAdd.length === 0) return;

      const newImages: UploadingImage[] = toAdd
        .filter((f) => {
          if (!ACCEPTED_TYPES.includes(f.type)) return false;
          if (f.size > MAX_SIZE_MB * 1024 * 1024) return false;
          return true;
        })
        .map((f) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file: f,
          preview: URL.createObjectURL(f),
          uploading: true,
        }));

      setImages((prev) => [...prev, ...newImages]);

      for (const img of newImages) {
        try {
          const url = await uploadImage(img.file);
          setImages((prev) =>
            prev.map((i) =>
              i.id === img.id ? { ...i, url, uploading: false } : i,
            ),
          );
        } catch {
          setImages((prev) =>
            prev.map((i) =>
              i.id === img.id
                ? { ...i, error: "Upload failed", uploading: false }
                : i,
            ),
          );
        }
      }
    },
    [images.length, uploadImage],
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "Required";
    if (!lastName.trim()) errors.lastName = "Required";
    if (!email.trim()) {
      errors.email = "Required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email";
    }
    if (!note.trim()) errors.note = "Required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Collect successfully uploaded image URLs
    const uploadedUrls = images
      .filter((i) => i.url && !i.error)
      .map((i) => i.url!);
    await submitRequest({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phoneNumber: phone.trim() || undefined,
      note: note.trim(),
      referencePhotos: uploadedUrls.length > 0 ? uploadedUrls : undefined,
    });
  };

  const svc = member.services[0];

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${hasError ? "#dc2626" : "var(--openings-border, #e5e5e5)"}`,
    borderRadius: "var(--openings-radius, 8px)",
    background: "var(--openings-bg, #fff)",
    color: "var(--openings-text, #111)",
    fontSize: 14,
    fontFamily: "var(--openings-font, inherit)",
    boxSizing: "border-box",
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--openings-muted, #666)",
    marginBottom: 4,
  };

  return (
    <div style={{ animation: "openings-fadeIn 0.25s ease both" }}>
      {/* Member info header — hidden in member-entry mode (already on member page) */}
      {!isMemberMode && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            border: "1px solid var(--openings-border, #e5e5e5)",
            borderRadius: "var(--openings-radius, 8px)",
            marginBottom: 16,
          }}
        >
          {member.photo ? (
            <img
              src={member.photo}
              alt={member.name ?? ""}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--openings-surface, #f5f5f5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 16,
                color: "var(--openings-muted, #666)",
                flexShrink: 0,
              }}
            >
              {member.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{member.name}</div>
            {svc && (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--openings-muted, #666)",
                }}
              >
                {svc.title ?? ""}
                {svc.price != null ? ` · ${formatPrice(svc.price)}` : ""}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Note / describe request */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>{labels.serviceRequestNote}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={labels.serviceRequestNotePlaceholder}
            rows={4}
            style={{
              ...inputStyle(!!fieldErrors.note),
              resize: "vertical",
              minHeight: 80,
            }}
          />
          {fieldErrors.note && (
            <div style={{ fontSize: 12, color: "#dc2626", marginTop: 2 }}>
              {fieldErrors.note}
            </div>
          )}
        </div>

        {/* Photo upload */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>{labels.serviceRequestPhotos}</label>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {/* Thumbnail grid + add button */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {images.map((img) => (
              <div
                key={img.id}
                style={{
                  position: "relative",
                  width: 72,
                  height: 72,
                  borderRadius: 8,
                  overflow: "hidden",
                  border: img.error
                    ? "2px solid #dc2626"
                    : "1px solid var(--openings-border, #e5e5e5)",
                  animation: "openings-scaleIn 0.2s ease both",
                }}
              >
                <img
                  src={img.preview}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: img.uploading ? 0.5 : 1,
                  }}
                />
                {img.uploading && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        border: "2px solid #fff",
                        borderTopColor: "var(--openings-accent, #000)",
                        borderRadius: "50%",
                        animation: "openings-spin 0.6s linear infinite",
                      }}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    fontSize: 12,
                    lineHeight: 1,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}

            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 8,
                  border: "1px dashed var(--openings-border, #e5e5e5)",
                  background: "var(--openings-surface, #f5f5f5)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  color: "var(--openings-muted, #666)",
                  fontSize: 11,
                  fontFamily: "var(--openings-font, inherit)",
                  padding: 0,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="3" width="16" height="14" rx="2" />
                  <circle cx="7" cy="8" r="1.5" />
                  <path d="M2 14l4-4 3 3 3-4 6 5" />
                </svg>
                {labels.serviceRequestPhotosAdd}
              </button>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--openings-muted, #999)",
              marginTop: 4,
            }}
          >
            {labels.serviceRequestPhotosHint}
          </div>
        </div>

        {/* Name row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div>
            <label style={labelStyle}>{labels.serviceRequestFirstName}</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={inputStyle(!!fieldErrors.firstName)}
            />
            {fieldErrors.firstName && (
              <div style={{ fontSize: 12, color: "#dc2626", marginTop: 2 }}>
                {fieldErrors.firstName}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>{labels.serviceRequestLastName}</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={inputStyle(!!fieldErrors.lastName)}
            />
            {fieldErrors.lastName && (
              <div style={{ fontSize: 12, color: "#dc2626", marginTop: 2 }}>
                {fieldErrors.lastName}
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>{labels.serviceRequestEmail}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle(!!fieldErrors.email)}
          />
          {fieldErrors.email && (
            <div style={{ fontSize: 12, color: "#dc2626", marginTop: 2 }}>
              {fieldErrors.email}
            </div>
          )}
        </div>

        {/* Phone (optional) */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{labels.serviceRequestPhone}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle(false)}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 14px",
              marginBottom: 14,
              background: "#fef2f2",
              color: "#dc2626",
              borderRadius: "var(--openings-radius, 8px)",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "none",
            borderRadius: "var(--openings-radius, 8px)",
            background: loading
              ? "var(--openings-border, #e5e5e5)"
              : "var(--openings-accent, #000)",
            color: loading ? "var(--openings-muted, #999)" : "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "var(--openings-font, inherit)",
          }}
        >
          {loading ? labels.loading : labels.serviceRequestSubmit}
        </button>
      </form>
    </div>
  );
}
