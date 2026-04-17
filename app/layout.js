import "./globals.css";

export const metadata = {
  title: "Unified Employee",
  description: "Unified employee management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
