import { SportLandingPage, sportLandingMetadata } from "@/components/seo/sport-landing-page";
import { SPORT_LANDINGS } from "@/lib/seo";

const landing = SPORT_LANDINGS.find((l) => l.slug === "padel")!;

export const metadata = sportLandingMetadata(landing);

export default function PadelSeoPage() {
  return <SportLandingPage landing={landing} />;
}
