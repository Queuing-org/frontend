"use client";

import GoogleLoginButton from "@/src/features/auth/login-with-google/ui/googleLoginButton";
import LogoutButton from "@/src/features/auth/logout/ui/logoutButton";
import NicknameEditForm from "@/src/features/user/profile/ui/NicknameEditForm";
import { useRouter } from "next/navigation";
import IsLogin from "@/src/entities/user/ui/IsLogin";
import CreateRoomTest from "@/src/features/room/create/ui/CreateRoomTest";
import FriendsList from "@/src/features/friend/list/ui/FriendsList";
import RoomsListTest from "@/src/features/room/list/ui/RoomListTest";
import UserSearchBox from "@/src/features/user/search/ui/UserSearchBox";
import FriendsRequestList from "@/src/features/friend/requests/ui/FriendsReceivedRequestList";

export default function TestPage() {
  const router = useRouter();

  return (
    <div className="bg-white p-4 space-y-4">
      <GoogleLoginButton />
      <LogoutButton />
      <div className="flex gap-4">
        <div className="flex-1">
          <NicknameEditForm />
        </div>
        <div className="flex-1">
          <UserSearchBox />
        </div>
      </div>

      <IsLogin />

      <CreateRoomTest />
      <div className="flex gap-4">
        <div className="flex-1">
          <RoomsListTest />
        </div>
        <div className="flex-1">
          <div>
            <FriendsRequestList />
          </div>
          <div className="pt-10">
            <FriendsList />
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push("/home")}
        className="border cursor-pointer"
      >
        go to home page
      </button>
    </div>
  );
}
