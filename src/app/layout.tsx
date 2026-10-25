import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas — Professional Car Rental Management System & SaaS Platform",
  description:
    "End-to-end car rental ERP and SaaS platform featuring fleet management, reservation wizard, conflict prevention, digital contracts, inspections, and financial analytics.",
  keywords: ["car rental software", "fleet management", "car rental erp", "vehicle leasing", "car rental saas"],
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
