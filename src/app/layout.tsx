import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fills.io"),
  title: {
    default: "Fills — AI Mood Board & Interior Design Brief Generator",
    template: "%s · Fills",
  },
  description:
    "Fills turns a one-line brief into a complete editorial mood board — palette, materials, lighting, furniture — in five minutes. An AI interior design tool built by a working architect.",
  keywords: [
    "AI mood board generator",
    "AI interior design",
    "interior design brief generator",
    "mood board maker",
    "interior design tool",
    "AI design tool",
    "architecture mood board",
    "moodboard generator for designers",
  ],
  applicationName: "Fills",
  authors: [{ name: "Fills" }],
  alternates: { canonical: "https://fills.io" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "https://fills.io",
    siteName: "Fills",
    title: "Fills — AI Mood Board & Interior Design Brief Generator",
    description:
      "Turn a one-line brief into a complete editorial mood board — palette, materials, lighting, furniture — in five minutes. Built by a working architect.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fills — AI Mood Board & Interior Design Brief Generator",
    description:
      "Turn a one-line brief into a complete editorial mood board in five minutes. Built by a working architect.",
  },
};

// Structured data — helps Google (and AI Overviews) understand what Fills is.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Fills",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  url: "https://fills.io",
  description:
    "An AI mood board and interior design brief generator. Turn a one-line brief into a complete editorial mood board — palette, materials, lighting, furniture — in five minutes. Built by a working architect.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  creator: {
    "@type": "Organization",
    name: "Fills",
    url: "https://fills.io",
  },
};

// Pre-paint script: applies saved theme before React hydrates to avoid flash.
const themeInitScript = `
(function(){
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark') document.documentElement.classList.add('theme-dark');
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
