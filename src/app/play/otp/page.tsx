"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** OTP is part of the panel-style login stage on /play/login. */
export default function OtpRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/play/login");
  }, [router]);
  return null;
}
