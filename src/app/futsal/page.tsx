import { SportLandingPage, sportLandingMetadata } from "@/components/seo/sport-landing-page";
import { SPORT_LANDINGS } from "@/lib/seo";

const landing = SPORT_LANDINGS.find((l) => l.slug === "futsal")!;

export const metadata = sportLandingMetadata(landing);

export default function FutsalSeoPage() {
  return <SportLandingPage landing={landing} />;
}
