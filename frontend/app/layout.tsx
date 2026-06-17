import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";


// FONT OPTIMIZATION & VARIABLE INJECTION
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


// GLOBAL METADATA DEFINITION
export const metadata: Metadata = {
  title: "RxLearn | Virtual Pharmacy Lab",
  description: "Institutional Student Portal",
};


// THE COMPONENT WRAPPER (CHILDREN PROP) - standard React pattern for Layouts
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // GLOBAL THEMING & STYLING
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#eef3f8] min-h-screen overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}