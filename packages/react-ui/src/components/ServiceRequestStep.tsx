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
// Hard cap on the original file the user selects. We still try to compress
// anything under this limit down to a payload that fits common serverless
// body limits (~4 MB after base64 encoding).
const MAX_INPUT_SIZE_MB = 25;
// Target compressed output size before base64 encoding. ~2.5 MB binary becomes
// ~3.4 MB base64, comfortably under Vercel's 4.5 MB serverless limit.
const TARGET_OUTPUT_BYTES = 2.5 * 1024 * 1024;
// Largest edge after resizing. Plenty of detail for reference photos.
const MAX_DIMENSION = 2048;
// MIME types we can re-encode through a canvas. Animated GIFs and HEIC/HEIF
// pass through unchanged (canvas would lose animation / can't decode).
const COMPRESSIBLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Downscale + recompress an image in the browser so phone photos (often 5-10 MB)
 * fit serverless request body limits. Falls back to the original file on any
 * failure so we never block the user from uploading.
 */
async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE_TYPES.has(file.type)) return file;
  if (typeof document === "undefined") return file;

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = dataUrl;
    });

    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(img.width, img.height),
    );
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    // Step quality down until we hit the target size. JPEG output is far
    // smaller than PNG for photo content.
    const qualities = [0.85, 0.75, 0.65, 0.55];
    let best: Blob | null = null;
    for (const q of qualities) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", q),
      );
      if (!blob) continue;
      best = blob;
      if (blob.size <= TARGET_OUTPUT_BYTES) break;
    }
    if (!best || best.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([best], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

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
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!member) return null;

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const remaining = MAX_IMAGES - images.length;
      const toAdd = Array.from(files).slice(0, remaining);
      if (toAdd.length === 0) return;

      const rejected: string[] = [];
      const accepted = toAdd.filter((f) => {
        if (!ACCEPTED_TYPES.includes(f.type)) {
          rejected.push(`${f.name}: unsupported file type`);
          return false;
        }
        if (f.size > MAX_INPUT_SIZE_MB * 1024 * 1024) {
          rejected.push(`${f.name}: larger than ${MAX_INPUT_SIZE_MB} MB`);
          return false;
        }
        return true;
      });

      setRejectionMessage(rejected.length > 0 ? rejected.join("; ") : null);

      const newImages: UploadingImage[] = accepted.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: f,
        preview: URL.createObjectURL(f),
        uploading: true,
      }));

      setImages((prev) => [...prev, ...newImages]);

      for (const img of newImages) {
        try {
          const compressed = await compressImage(img.file);
          const url = await uploadImage(compressed);
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
          {rejectionMessage && (
            <div
              role="alert"
              style={{
                fontSize: 12,
                color: "#dc2626",
                marginTop: 4,
              }}
            >
              {rejectionMessage}
            </div>
          )}
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
