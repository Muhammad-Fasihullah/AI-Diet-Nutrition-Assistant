"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  MessageCircle,
  Camera,
  ChefHat,
  LogOut,
  Salad,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Chat", icon: MessageCircle },
  { href: "/food-analysis", label: "Food Analysis", icon: Camera },
  { href: "/recipe-generator", label: "Recipe Generator", icon: ChefHat },
  { href: "/profile", label: "My Profile", icon: User },
];

interface SidebarProps {
  userName?: string;
  userEmail?: string;
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast({ title: "Logged out", description: "See you next time!" });
    router.push("/auth/login");
    router.refresh();
  }

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-border flex flex-col z-40 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b">
        <div className="p-2 bg-brand-100 rounded-lg">
          <Salad className="h-6 w-6 text-brand-600" />
        </div>
        <div>
          <p className="font-bold text-sm text-foreground leading-tight">AI Diet</p>
          <p className="text-xs text-muted-foreground">Nutrition Assistant</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-brand-50 text-brand-700 border border-brand-200"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-brand-600")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User + Logout */}
      <div className="px-3 py-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-brand-100 text-brand-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail || ""}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
