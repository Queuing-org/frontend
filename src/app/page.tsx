"use client";

import { redirect } from "next/navigation";

export default function Page() {
  return redirect("/home");
  // return <button onClick={() => redirect("/test")}>go to test page</button>;
}
