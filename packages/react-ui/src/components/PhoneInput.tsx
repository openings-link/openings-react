import { useState, useRef, useEffect } from "react";

/* ── Country data (curated, sorted alphabetically) ── */

interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", dial: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Switzerland", dial: "+41", flag: "🇨🇭" },
  { code: "AT", name: "Austria", dial: "+43", flag: "🇦🇹" },
  { code: "SE", name: "Sweden", dial: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", dial: "+47", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", dial: "+45", flag: "🇩🇰" },
  { code: "FI", name: "Finland", dial: "+358", flag: "🇫🇮" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪" },
  { code: "PL", name: "Poland", dial: "+48", flag: "🇵🇱" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", dial: "+52", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
  { code: "CO", name: "Colombia", dial: "+57", flag: "🇨🇴" },
  { code: "CL", name: "Chile", dial: "+56", flag: "🇨🇱" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", dial: "+82", flag: "🇰🇷" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭" },
  { code: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭" },
  { code: "VN", name: "Vietnam", dial: "+84", flag: "🇻🇳" },
  { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "IL", name: "Israel", dial: "+972", flag: "🇮🇱" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "🇹🇷" },
  { code: "RU", name: "Russia", dial: "+7", flag: "🇷🇺" },
  { code: "UA", name: "Ukraine", dial: "+380", flag: "🇺🇦" },
];

/* ── Phone formatting patterns by country code ── */
// Each pattern is a string of digit group sizes, e.g. "3-3-4" means XXX-XXX-XXXX
const FORMAT_PATTERNS: Record<string, string> = {
  US: "3-3-4", // (213) 507-8305
  CA: "3-3-4",
  GB: "4-3-3", // 7911 123 456
  AU: "3-3-3", // 412 345 678
  DE: "3-3-4", // 151 234 5678
  FR: "1-2-2-2-2", // 6 12 34 56 78
  IT: "3-3-4",
  ES: "3-3-3", // 612 345 678
  PT: "3-3-3",
  NL: "1-2-2-2-2",
  BE: "3-2-2-2",
  CH: "2-3-2-2",
  AT: "3-3-4",
  SE: "2-3-3-2",
  NO: "3-2-3",
  DK: "2-2-2-2",
  FI: "2-3-4",
  IE: "2-3-4",
  PL: "3-3-3",
  BR: "2-5-4", // 11 91234-5678
  MX: "2-4-4",
  AR: "2-4-4",
  CO: "3-3-4",
  CL: "1-4-4",
  JP: "2-4-4", // 90 1234 5678
  KR: "2-4-4", // 10 1234 5678
  CN: "3-4-4",
  IN: "5-5", // 91234 56789
  PH: "3-3-4",
  TH: "2-3-4",
  VN: "2-3-4",
  ID: "3-4-4",
  MY: "2-3-4",
  SG: "4-4", // 9123 4567
  NZ: "2-3-4",
  ZA: "2-3-4",
  NG: "3-3-4",
  EG: "3-3-4",
  SA: "2-3-4",
  AE: "2-3-4",
  IL: "2-3-4",
  TR: "3-3-2-2",
  RU: "3-3-2-2", // 912 345-67-89
  UA: "2-3-2-2",
};

function formatNational(digits: string, countryCode: string): string {
  const pattern = FORMAT_PATTERNS[countryCode];
  if (!pattern || digits.length === 0) return digits;

  const groups = pattern.split("-").map(Number);
  let result = "";
  let pos = 0;

  for (let i = 0; i < groups.length && pos < digits.length; i++) {
    if (i > 0) result += " ";
    result += digits.slice(pos, pos + groups[i]);
    pos += groups[i];
  }

  // Append any remaining digits
  if (pos < digits.length) {
    result += " " + digits.slice(pos);
  }

  return result;
}

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "Phone number",
  style,
}: PhoneInputProps) {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Strip dial code from display value and format
  const rawNational = value.startsWith(country.dial)
    ? value.slice(country.dial.length)
    : value.replace(/^\+\d+/, "");
  const nationalDigits = rawNational.replace(/[^\d]/g, "");
  const displayValue = formatNational(nationalDigits, country.code);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  useEffect(() => {
    if (dropdownOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [dropdownOpen]);

  const filteredCountries = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase()),
      )
    : COUNTRIES;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, "");
    onChange(country.dial + digits);
  };

  const selectCountry = (c: Country) => {
    setCountry(c);
    setDropdownOpen(false);
    setSearch("");
    // Update the full number with the new dial code
    const digits = nationalDigits;
    onChange(c.dial + digits);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", ...style }}>
      <div
        style={{
          display: "flex",
          border: "1px solid var(--openings-border, #e5e5e5)",
          borderRadius: "var(--openings-radius, 8px)",
          overflow: "hidden",
          background: "var(--openings-bg, #fff)",
        }}
      >
        {/* Country selector */}
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "12px 8px 12px 14px",
            border: "none",
            borderRight: "1px solid var(--openings-border, #e5e5e5)",
            background: "var(--openings-surface, #f9f9f9)",
            cursor: "pointer",
            fontSize: 15,
            fontFamily: "var(--openings-font, inherit)",
            color: "var(--openings-text, #111)",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <span>{country.flag}</span>
          <span style={{ fontSize: 14 }}>{country.dial}</span>
          <span
            style={{
              fontSize: 8,
              color: "var(--openings-muted, #999)",
              marginLeft: 2,
            }}
          >
            ▼
          </span>
        </button>

        {/* Phone input */}
        <input
          type="tel"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoComplete="tel-national"
          style={{
            flex: 1,
            padding: "12px 14px",
            border: "none",
            outline: "none",
            fontFamily: "var(--openings-font, inherit)",
            fontSize: 16,
            color: "var(--openings-text, #111)",
            background: "transparent",
            minWidth: 0,
          }}
        />
      </div>

      {/* Dropdown */}
      {dropdownOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "var(--openings-bg, #fff)",
            border: "1px solid var(--openings-border, #e5e5e5)",
            borderRadius: "var(--openings-radius, 8px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            zIndex: 20,
            maxHeight: 280,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search */}
          <div
            style={{
              padding: "8px 10px",
              borderBottom: "1px solid var(--openings-border, #e5e5e5)",
            }}
          >
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries…"
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid var(--openings-border, #e5e5e5)",
                borderRadius: 6,
                fontSize: 14,
                fontFamily: "var(--openings-font, inherit)",
                color: "var(--openings-text, #111)",
                background: "var(--openings-bg, #fff)",
                outline: "none",
                boxSizing: "border-box" as const,
              }}
            />
          </div>

          {/* Country list */}
          <div style={{ overflow: "auto", flex: 1 }}>
            {filteredCountries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCountry(c)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  background:
                    c.code === country.code
                      ? "var(--openings-surface, #f5f5f5)"
                      : "transparent",
                  cursor: "pointer",
                  fontSize: 14,
                  fontFamily: "var(--openings-font, inherit)",
                  color: "var(--openings-text, #111)",
                  textAlign: "left",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>{c.flag}</span>
                <span style={{ flex: 1 }}>{c.name}</span>
                <span
                  style={{ color: "var(--openings-muted, #999)", fontSize: 13 }}
                >
                  {c.dial}
                </span>
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div
                style={{
                  padding: "16px 14px",
                  textAlign: "center",
                  color: "var(--openings-muted, #999)",
                  fontSize: 14,
                }}
              >
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
