"use client";

import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Loader2, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { sidebarConfig } from "./_data/sidebar.data";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, logout, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const getInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, []);

  const navItems = useMemo(
    () =>
      sidebarConfig.filter((item) => item.roles.includes(role || "student")),
    [role],
  );

  const isAdmin = role === "admin";

  const pageTitle = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last || last === "admin" || last === "dashboard")
      return isAdmin ? "Admin Console" : "Dashboard";
    return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }, [pathname, isAdmin]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        {/* Role-based Collapsible Sidebar */}
        <Sidebar
          collapsible="icon"
          className="border-r border-border bg-sidebar"
        >
          <SidebarHeader className="border-b border-border py-4 px-3 flex flex-row items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              {isAdmin ? (
                <Sparkles className="h-5 w-5" />
              ) : (
                <GraduationCap className="h-5 w-5" />
              )}
            </div>
            <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="font-semibold leading-none text-foreground text-sm">
                Quiz System
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                {isAdmin ? "Admin Console" : "Student Portal"}
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent className="py-2">
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent className="mt-1">
                <SidebarMenu>
                  {navItems.map((item) => {
                    // Active: exact match OR starts with url (but prevent /admin matching /admin/categories)
                    const isActive =
                      pathname === item.url ||
                      (item.url !== "/admin" &&
                        item.url !== "/dashboard" &&
                        pathname.startsWith(item.url + "/"));
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          <Link
                            href={item.url}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="group-data-[collapsible=icon]:hidden">
                              {item.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-border p-3 bg-sidebar">
            <div className="flex items-center gap-3 mb-3 group-data-[collapsible=icon]:hidden">
              <Avatar className="h-8 w-8 shrink-0 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-foreground text-sm truncate leading-none">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground truncate mt-0.5">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="hidden group-data-[collapsible=icon]:flex justify-center mb-2">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full gap-2 text-xs font-medium border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">
                Sign out
              </span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col overflow-hidden bg-background">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
            <SidebarTrigger className="p-1.5 rounded-md border border-border hover:bg-muted transition-colors" />
            <div className="h-5 w-px bg-border" />
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              {pageTitle}
            </h1>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
    </TooltipProvider>
  );
}
