import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OpenLaw | Nigerian Constitutional Legal Assistant",
    template: "%s | OpenLaw"
  },
  description: "Get clear, accurate explanations of the Nigerian Constitution and your rights as a citizen. Powered by AI and grounded in the 1999 Constitution of the Federal Republic of Nigeria.",
  keywords: [
    "Nigerian Constitution", 
    "Legal Rights", 
    "OpenLaw", 
    "Nigeria Law Assistant", 
    "Fundamental Rights", 
    "1999 Constitution",
    "Legal Guidance Nigeria",
    "Constitutional Law"
  ],
  authors: [{ name: "OpenLaw Team" }],
  creator: "OpenLaw",
  publisher: "OpenLaw",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://openlaw.click", // Placeholder, updated by user later if needed
    title: "OpenLaw | Nigerian Constitutional Legal Assistant",
    description: "Empowering Nigerian citizens with accessible, accurate information about their constitutional rights and duties.",
    siteName: "OpenLaw",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OpenLaw - Nigerian Constitutional Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenLaw | Nigerian Constitutional Legal Assistant",
    description: "Get clear, accurate explanations of the Nigerian Constitution and your rights as a citizen.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geom:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <div className="bg-aura" />
        {children}
      </body>
    </html>
  );
}
