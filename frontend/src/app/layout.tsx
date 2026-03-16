import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Internet Toolkit",
  description: "DNS, BGP, mail, TLS, and reachability diagnostics in one place",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-navy-900">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
