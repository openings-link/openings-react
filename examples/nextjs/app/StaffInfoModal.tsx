"use client";

import type { MemberOpenings } from "@openings-link/react";

interface Props {
  member: MemberOpenings | null;
  onClose: () => void;
}

/**
 * Example host-supplied mini-profile modal for `onStaffInfoClick`.
 *
 * In a real app you'd fetch the full bio / portfolio / reviews from your
 * backend here — the widget itself stays lean. `onStaffInfoClick` is the
 * hook point: if you don't pass it, the info icon isn't rendered.
 */
export function StaffInfoModal({ member, onClose }: Props) {
  if (!member) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 14,
          }}
        >
          {member.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photo}
              alt={member.name}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 600,
                color: "#888",
              }}
            >
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{member.name}</div>
            <div style={{ fontSize: 13, color: "#888" }}>
              @{member.username}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>
          This is your own mini-profile UI. Fetch the full bio, portfolio
          photos, reviews, etc. from your backend and render them here.
        </p>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            padding: "10px 16px",
            border: "none",
            borderRadius: 8,
            background: "#111",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
