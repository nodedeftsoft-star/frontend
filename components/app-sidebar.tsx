"use client";

import * as React from "react";
import { CircleUserRound, Contact, GitBranchIcon, HomeIcon, ShoppingBag, SquareTerminal, User } from "lucide-react";

import { NavMain } from "@/components/nav-main";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useUser } from "@/store/user";
import { useSubscription } from "@/context/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";

// This is sample data.

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const pathname = usePathname();
  const user = useUser();
  const { hasActiveSubscription, subscription, loading: subLoading } = useSubscription();

  const data = {
    user: [
      {
        title: user?.firstname || user?.username || "",
        url: "/settings",
        icon: CircleUserRound,
        isActive: pathname.startsWith("/settings"),
      },
    ],

    navMain: [
      {
        title: "Dashboard",
        url: "/",
        icon: SquareTerminal,
        isActive: pathname == "/",
      },
      {
        title: "Leads",
        url: "/leads/buyer",
        icon: User,
        isActive: pathname.startsWith("/leads"),
      },
      {
        title: "Buyer's Agent",
        url: "/buyers/buyer",
        icon: ShoppingBag,
        isActive: pathname.startsWith("/buyers"),
      },
      {
        title: "Listing Agent",
        url: "/listings/listing-sales",
        icon: HomeIcon,
        isActive: pathname.startsWith("/listings"),
      },
      {
        title: "Matches",
        url: "/matches/sales",
        icon: GitBranchIcon,
        isActive: pathname.startsWith("/matches"),
      },
      {
        title: "My Contacts",
        url: "/contacts",
        icon: Contact,
        isActive: pathname.startsWith("/contacts"),
      },
    ],
  };
  return (
    <Sidebar collapsible="icon" {...props} className="w-[200px] max-w-[200px]">
      <SidebarHeader
        className={` ${
          state === "collapsed" ? "h-16 justify-center items-center " : "h-20 justify-center items-start "
        } border-b border-border flex flex-col gap-2 `}
      >
        <div
          className={`flex h-8 ${
            state === "collapsed" ? "w-8 rounded-lg" : "w-20 rounded-md"
          } items-center justify-center bg-primary text-white  transition-all duration-300 cursor-pointer hover:opacity-90`}
          onClick={() => (window.location.href = "/")}
        >
          {state === "collapsed" ? (
            <h1 className="text-2xl font-bold transition-all duration-300">C</h1>
          ) : (
            <h1 className="text-2xl font-bold transition-all duration-300">closR</h1>
          )}
        </div>
        {state !== "collapsed" && !subLoading && (
          <div className="flex gap-2 items-center">
            <Badge
              variant={hasActiveSubscription ? "outline" : "secondary"}
              className={`text-sm px-2 py-0.2 cursor-pointer rounded-[4px] h-fit hover:opacity-80 transition-opacity ${
                hasActiveSubscription
                  ? "border-[1px] border-neutral-300 bg-transparent text-neutral-600"
                  : "border-[1px] border-neutral-400"
              }`}
              onClick={() => (window.location.href = "/settings")}
            >
              {hasActiveSubscription ? (subscription?.status === "trialing" ? "Pro (Trial)" : "Pro") : "Free"}
            </Badge>

            {!hasActiveSubscription ? (
              <Button
                variant={"ghost"}
                className="text-xs px-2 py-0.5 hover:bg-transparent cursor-pointer"
                onClick={() => (window.location.href = "/pricing")}
              >
                Upgrade to Pro
              </Button>
            ) : null}
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="mb-5">
        <NavMain items={data.user} />
      </SidebarFooter>
      {/* <SidebarRail /> */}
    </Sidebar>
  );
}
