// app/layout.tsx
import type { Metadata } from "next";
import Providers from "./providers";
import SsgoiProvider from "./ssgoi-provider";
import "./globals.css";
import localFont from "next/font/local";

const suit = localFont({
  src: "./fonts/SUIT-Variable.woff2",
  variable: "--font-suit",
  weight: "100 900",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://local.queuing.patulus.com:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "큐잉",
  title: "큐잉",
  description: "같이 노래 듣는 시간, 큐잉에서 시작해요.",
  openGraph: {
    siteName: "큐잉",
    type: "website",
    images: [
      {
        url: "/og-thumbnail.png",
        width: 1200,
        height: 630,
        alt: "큐잉",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-thumbnail.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${suit.className} ${suit.variable}`}>
        <SsgoiProvider>
          <div style={{ position: "relative", minHeight: "100vh" }}>
            <Providers>{children}</Providers>
          </div>
        </SsgoiProvider>
      </body>
    </html>
  );
}
