import Image from "next/image";

export default function RoomSearchButton() {
  return (
    <button type="button" aria-label="방 검색 열기">
      <Image src="/icons/search.svg" alt="" width={18.16} height={18.05} />
    </button>
  );
}
