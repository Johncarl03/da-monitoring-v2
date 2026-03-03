import "./globals.css";

export const metadata = {
  title: "DA Monitoring System",
  description: "Oriental Mindoro Database",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}