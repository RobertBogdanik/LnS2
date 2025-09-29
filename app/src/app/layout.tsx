import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "LnS2",
  description: "Miłego liczenia!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className='antialiased'>
        <div>{children}</div>

        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
