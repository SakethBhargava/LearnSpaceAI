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
} from "lucide-react";

export function Header({ user: initialUser }: { user?: any }) {
  const [currentUser, setCurrentUser] = useState<any>(initialUser || null);
  const [activeTopic, setActiveTopic] = useState<string>("No Active Topic");
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // 1. Load active topic helper
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

  // 2. Fetch session once on mount & subscribe to auth changes
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
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 3. Re-check topic ONLY when navigating to routes where topics change
  useEffect(() => {
    if (currentUser && (pathname === "/learning-path" || pathname === "/dashboard")) {
      fetchActiveTopic(currentUser.id);
    }
  }, [pathname]);

  // 4. Smooth Client-Side Sign Out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push("/");
    router.refresh();
  };

  const userInitial = currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : "U";

  const navItems = [
    { name: "Todos", href: "/todos", icon: CheckSquare },
    { name: "Learning Path", href: "/learning-path", icon: Compass },
    { name: "Performance", href: "/performance", icon: BarChart2 },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur px-4 sm:px-6 h-[65px] flex items-center transition-colors">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Logo & Active Topic */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-black text-lg sm:text-xl text-foreground hover:opacity-90 shrink-0 transition-opacity"
          >
            <div className="p-1.5 bg-primary rounded-lg text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <span>
              LearnSpace<span className="text-primary">AI</span>
            </span>
          </Link>

          {currentUser && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-background border border-border text-xs font-medium">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Topic:</span>
              <span className="text-primary font-semibold max-w-[150px] truncate">
                {activeTopic}
              </span>
            </div>
          )}
        </div>

        {/* Center: Navigation */}
        {currentUser && (
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium bg-background/60 p-1 rounded-xl border border-border">
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

        {/* Right: Theme Toggle & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 p-1.5 rounded-full bg-background border border-border">
                <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {userInitial}
                </div>
                <span className="hidden sm:inline text-xs font-medium text-foreground pr-2">
                  {currentUser.email}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                title="Sign Out"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button size="sm" variant="outline">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}