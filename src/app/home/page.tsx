import { permanentRedirect } from "next/navigation";

export default function HomeCompatibilityRedirect() {
  permanentRedirect("/");
}
