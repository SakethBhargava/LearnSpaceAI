"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sparkles,
  LogOut,
  LayoutDashboard,
  CheckSquare,
  Compass,
  BarChart2,
  BookOpen,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";

export function Header({ user: initialUser }: { user?: any }) {
  const [currentUser, setCurrentUser] = useState<any>(initialUser || null);
  const [activeTopic, setActiveTopic] = useState<string>("No Active Topic");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const fetchActiveTopic = async (userId: string) => {
    const { data } = await supabase
      .from("user_topics")
      .select("title")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.title) {
      setActiveTopic(data.title);
    }
  };

  useEffect(() => {
    async function initUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUser(user);
        fetchActiveTopic(user.id);
      }
    }

    initUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user || null;
        setCurrentUser(user);
        if (user) fetchActiveTopic(user.id);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (
      currentUser &&
      (pathname === "/learning-path" ||
        pathname === "/dashboard" ||
        pathname === "/quiz")
    ) {
      fetchActiveTopic(currentUser.id);
    }
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const userInitial = currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : "U";

  const navItems = [
    { name: "Todos", href: "/todos", icon: CheckSquare },
    { name: "Learning Path", href: "/learning-path", icon: Compass },
    { name: "Tests & Quiz", href: "/quiz", icon: HelpCircle },
    { name: "Performance", href: "/performance", icon: BarChart2 },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card px-3 sm:px-6 h-[65px] flex items-center transition-colors w-full max-w-full overflow-hidden">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Left: Logo & Active Topic */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 font-black text-base sm:text-xl text-foreground hover:opacity-90 shrink-0 transition-opacity"
          >
            <div className="p-1 sm:p-1.5 bg-primary rounded-lg text-white shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className="truncate">
              LearnSpace<span className="text-primary">AI</span>
            </span>
          </Link>

          {currentUser && (
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-background border border-border text-xs font-medium">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Topic:</span>
              <span className="text-primary font-semibold max-w-[140px] truncate">
                {activeTopic}
              </span>
            </div>
          )}
        </div>

        {/* Center: Desktop Navigation */}
        {currentUser && (
          <nav className="hidden lg:flex items-center gap-1 text-xs font-medium bg-background/60 p-1 rounded-xl border border-border">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-border/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right: Theme Toggle, User Profile / Auth Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <ThemeToggle />

          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 p-1 sm:p-1.5 rounded-full bg-background border border-border">
                <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                  {userInitial}
                </div>
                <span className="hidden lg:inline text-xs font-medium text-foreground pr-2 max-w-[120px] truncate">
                  {currentUser.email}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                title="Sign Out"
                className="hidden lg:flex text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-border bg-card shrink-0"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                ) : (
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link href="/login">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-medium shrink-0"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="sm"
                  className="rounded-xl h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-semibold shrink-0 shadow-sm"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Solid Mobile Drawer */}
      {currentUser && mobileMenuOpen && (
        <div className="lg:hidden fixed top-[65px] left-0 w-full bg-card border-b border-border p-4 sm:p-5 shadow-2xl space-y-4 z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border text-xs">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Active Topic:</span>
            </div>
            <span className="text-primary font-bold truncate max-w-[180px]">
              {activeTopic}
            </span>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground bg-background/50 hover:bg-muted/80"
                  }`}
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {currentUser.email}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSignOut}
              className="rounded-xl gap-2 text-xs shrink-0"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
