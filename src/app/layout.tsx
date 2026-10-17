import type { Metadata } from "next";
import { getAppUrl } from "@/config/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: "bodh. | Make difficult ideas easy to grasp",
  description: "A calmer way to learn computer science.",
  openGraph: {
    title: "bodh. | Make difficult ideas easy to grasp",
    description: "A calmer way to learn computer science.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
