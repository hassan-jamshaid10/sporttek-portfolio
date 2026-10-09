import { Sora } from "next/font/google";
import { LoginStage } from "@/components/play/login-stage";
import { PlayLoginForm } from "@/components/play/login-form";
import "./login-stage.css";

/** Same Sora wiring as sporttek-panel/(auth)/login/page.tsx */
const sora = Sora({ subsets: ["latin"], weight: ["400", "600", "800"] });

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  return (
    <div className={`${sora.className} min-h-dvh`}>
      <LoginStage>
        <PlayLoginForm next={next} />
      </LoginStage>
    </div>
  );
}

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/play";
  }
  return value;
}
