import type { Metadata } from "next";
import HomeScreen from "@/src/widgets/home/ui/HomeScreen";

export const metadata: Metadata = {
  title: "큐잉",
  description: "듣고 싶은 노래를 같이 틀고, 같은 순간을 들어요.",
  openGraph: {
    title: "같이 노래 들어요",
    description: "듣고 싶은 노래를 같이 틀고, 같은 순간을 들어요.",
    url: "/home",
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
    title: "같이 노래 들어요",
    description: "듣고 싶은 노래를 같이 틀고, 같은 순간을 들어요.",
    images: ["/og-thumbnail.png"],
  },
};

export default function Home() {
  return (
    <div className="bg-white">
      <HomeScreen />
    </div>
  );
}
