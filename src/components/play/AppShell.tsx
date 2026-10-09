"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LayoutList, Map } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { PlayHeaderNotifications } from "@/components/play/header-notifications";
import { PlayThemeProvider, usePlayTheme } from "@/components/play/theme-provider";
import { PlayThemeToggle } from "@/components/play/theme-toggle";
import { PlayUserMenu } from "@/components/play/user-menu";
import { PlayWordmark } from "@/components/play/play-wordmark";
import { Button } from "@/components/ui/button";
import { FavouritesProvider, useFavourites } from "@/hooks/use-favourites";
import { ensurePlayHomeBoot } from "@/lib/play-home-boot";
import { clearPlayMe, loadPlayMe, peekPlayMe, writePlayMe } from "@/lib/play-me";
import { cn } from "@/lib/utils";
import type { Me } from "@/lib/types";

type PlayUi = {
  showMap: boolean;
  setShowMap: (value: boolean) => void;
  me: Me | null;
  authChecked: boolean;
  refreshMe: () => Promise<void>;
};

const PlayUiContext = createContext<PlayUi | null>(null);

export function usePlayUi() {
  const ctx = useContext(PlayUiContext);
  if (!ctx) throw new Error("usePlayUi requires AppShell");
  return ctx;
}

export function AppShell({
  children,
  hideHeaderActions = false,
  flush = false,
}: {
  children: ReactNode;
  hideHeaderActions?: boolean;
  flush?: boolean;
}) {
  return (
    <PlayThemeProvider>
      <AppShellInner hideHeaderActions={hideHeaderActions} flush={flush}>
        {children}
      </AppShellInner>
    </PlayThemeProvider>
  );
}

function AppShellInner({
  children,
  hideHeaderActions = false,
  flush = false,
}: {
  children: ReactNode;
  hideHeaderActions?: boolean;
  flush?: boolean;
}) {
  const { theme } = usePlayTheme();
  const pathname = usePathname();
  const [showMap, setShowMap] = useState(false);
  const cached = peekPlayMe();
  const [me, setMe] = useState<Me | null>(() => cached?.me ?? null);
  const [authChecked, setAuthChecked] = useState(() => cached != null);

  const refreshMe = useCallback(async (force = false) => {
    const next = await loadPlayMe({ force });
    setMe(next);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    void refreshMe(false);
  }, [refreshMe]);

  // Prefetch home catalog in parallel with auth so the shell can dismiss with data ready.
  useEffect(() => {
    void ensurePlayHomeBoot();
  }, []);

  useEffect(() => {
    if (pathname !== "/play" && showMap) setShowMap(false);
  }, [pathname, showMap]);

  if (!authChecked) {
    return <BrandLoader label="Loading SportTek" />;
  }

  const onHome = pathname === "/play";

  return (
    <PlayUiContext.Provider
      value={{
        showMap,
        setShowMap,
        me,
        authChecked,
        refreshMe: async () => {
          await refreshMe(true);
        },
      }}
    >
      <FavouritesProvider>
        <ShellReadyGate>
          <div
            className={cn(
              "play-root min-h-dvh bg-white text-[#17354F] dark:bg-[#0F1C28] dark:text-white",
              theme === "dark" && "dark",
            )}
          >
            <div className="flex min-h-dvh flex-col">
              <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-[#17354F]/90">
                <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-8 lg:px-10">
                  <PlayWordmark className="min-w-0" />

                  {!hideHeaderActions ? (
                    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                      {onHome ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 sm:h-10 sm:w-10"
                          title={showMap ? "Venues" : "Map"}
                          aria-label={showMap ? "Show venue list" : "Show map"}
                          onClick={() => setShowMap(!showMap)}
                        >
                          {showMap ? <LayoutList size={17} /> : <Map size={17} />}
                        </Button>
                      ) : null}

                      <PlayThemeToggle className="h-9 w-9 sm:h-10 sm:w-10" />

                      <PlayHeaderNotifications loggedIn={Boolean(me)} />

                      <span
                        className="mx-0.5 hidden h-8 w-px bg-black/10 sm:mx-1 sm:block dark:bg-white/15"
                        aria-hidden
                      />

                      {me ? (
                        <PlayUserMenu
                          me={me}
                          onLoggedOut={() => {
                            clearPlayMe();
                            writePlayMe(null);
                            setMe(null);
                          }}
                        />
                      ) : (
                        <Button
                          asChild
                          size="sm"
                          className="h-9 gap-1 px-3 text-xs sm:h-10 sm:gap-1.5 sm:pl-4 sm:pr-3 sm:text-sm"
                        >
                          <Link href={`/play/login?next=${encodeURIComponent(pathname)}`}>
                            Login
                            <ArrowRight size={14} strokeWidth={2.6} aria-hidden />
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              </header>

              <main
                className={cn(
                  "mx-auto w-full flex-1",
                  flush || showMap
                    ? "max-w-none p-0"
                    : "max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10",
                )}
              >
                {children}
              </main>
            </div>
          </div>
        </ShellReadyGate>
      </FavouritesProvider>
    </PlayUiContext.Provider>
  );
}

/** Hold the panel-style fullscreen loader until favourites + home catalog are ready. */
function ShellReadyGate({ children }: { children: ReactNode }) {
  const { ready: favouritesReady } = useFavourites();
  const [homeReady, setHomeReady] = useState(false);
  /** Once true, stay painted — later fav/me refreshes must not flash the boot loader. */
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void ensurePlayHomeBoot().then(() => {
      if (!cancelled) setHomeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (favouritesReady && homeReady) setBooted(true);
  }, [favouritesReady, homeReady]);

  if (!booted) {
    return <BrandLoader label="Loading SportTek" />;
  }

  return <>{children}</>;
}
