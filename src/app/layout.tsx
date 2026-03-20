// app/layout.tsx
import Providers from "./providers";
import "./globals.css";
import localFont from "next/font/local";

const suit = localFont({
  src: "./fonts/SUIT-Variable.woff2",
  variable: "--font-suit",
  weight: "100 900",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${suit.className} ${suit.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
