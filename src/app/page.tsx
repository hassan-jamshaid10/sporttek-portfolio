import { redirect } from "next/navigation";

/** sporttek.pk (/) opens the player web app. */
export default function HomePage() {
  redirect("/play");
}
