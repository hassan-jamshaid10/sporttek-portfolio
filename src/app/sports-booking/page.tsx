import { SportLandingPage, sportLandingMetadata } from "@/components/seo/sport-landing-page";
import { SPORT_LANDINGS } from "@/lib/seo";

const landing = SPORT_LANDINGS.find((l) => l.slug === "sports-booking")!;

export const metadata = sportLandingMetadata(landing);

export default function SportsBookingSeoPage() {
  return <SportLandingPage landing={landing} />;
}
