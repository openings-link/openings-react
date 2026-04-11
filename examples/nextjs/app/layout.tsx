import type { Metadata } from "next";
import { Header } from "./Header";

export const metadata: Metadata = {
  title: "Openings React — Next.js Example",
  description: "Demo of @openings-link/react and @openings-link/react-ui",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0,
          background: "#fafafa",
          color: "#1a1a1a",
        }}
      >
        <Header />
        <main style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
