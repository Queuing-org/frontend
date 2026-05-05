import type { Metadata } from "next";
import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";
import RoomPageClient from "./RoomPageClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const roomSlug = normalizeRoomSlug(slug);
  const roomPath = `/room/${encodeURIComponent(roomSlug)}`;
  const title = "큐잉";
  const description = "이 방에서 듣고 싶은 노래를 같이 틀어요.";

  return {
    title,
    description,
    alternates: {
      canonical: roomPath,
    },
    openGraph: {
      title,
      description,
      url: roomPath,
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
      title,
      description,
      images: ["/og-thumbnail.png"],
    },
  };
}

export default function RoomPage() {
  return <RoomPageClient />;
}
