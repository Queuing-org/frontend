import Image from "next/image";
import Link from "next/link";

export default function RoomSearchButton() {
  return (
    <Link href="/search" aria-label="방 검색">
      <Image src="/icons/search.svg" alt="" width={18.16} height={18.05} />
    </Link>
  );
}
