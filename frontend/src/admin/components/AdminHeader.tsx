import { Bell, LogOut, Moon, Settings, Sun, User, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminNotifications } from "@/lib/api";
import { signOutAdmin } from "../AdminLogin";

const DISMISSED_KEY = "coolman-dismissed-notifications";

export default function AdminHeader() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setNotificationsEnabled(true), 500);
    return () => window.clearTimeout(timer);
  }, []);
  const notificationsQuery = useQuery({ queryKey: ["admin-notifications"], queryFn: fetchAdminNotifications, enabled: notificationsEnabled, refetchInterval: 10000 });
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const notifications = (notificationsQuery.data ?? []).filter((notification) => !dismissedIds.includes(notification.id));
  const clearNotifications = () => {
    const ids = notifications.map((notification) => notification.id);
    setDismissedIds((current) => {
      const next = [...new Set([...current, ...ids])];
      try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
      } catch {
        // Storage blocked — notifications stay cleared for this session only.
      }
      return next;
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 overflow-visible border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger aria-label="Toggle admin sidebar" title="Toggle admin sidebar" />

      <div className="flex-1" />

      <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 overflow-visible" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && <Badge className="absolute -right-0.5 -top-0.5 z-10 flex h-4 min-w-4 items-center justify-center px-0 text-[10px]">
              {notifications.length > 9 ? "9+" : notifications.length}
            </Badge>
            }
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {notifications.length === 0 && <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>}
          {notifications.map((notification) => <DropdownMenuItem key={notification.id}>{notification.message}</DropdownMenuItem>)}
          {notifications.length > 0 && <DropdownMenuItem onClick={clearNotifications} className="border-t border-border font-medium text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Clear notifications</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-primary/10" aria-label="Admin menu">
            <User className="h-4 w-4 text-primary" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate("/admin-dashboard/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Store Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { signOutAdmin(); navigate("/"); }}>
            <LogOut className="mr-2 h-4 w-4" /> Exit to Store
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
