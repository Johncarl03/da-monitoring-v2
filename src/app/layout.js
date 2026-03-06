import React from 'react';
import "./globals.css"; // Siguraduhin na imported ang CSS mo

export const metadata = {
  title: "RSBSA Monitoring System",
  description: "Oriental Mindoro Administrative Portal",
  icons: {
    icon: "/da-logo.png", // Ito ang papalit sa itim na logo sa browser tab
    shortcut: "/da-logo.png",
    apple: "/da-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Dito papasok ang lahat ng pages mo gaya ng Login at Importer */}
        {children}
      </body>
    </html>
  );
}