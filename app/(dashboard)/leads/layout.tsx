"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BanknoteArrowDown, HandCoins, HousePlus, MapPinHouse } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { state, isMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  const menu = [
    {
      title: "Buyer",
      url: "/leads/buyer",
      icon: BanknoteArrowDown,
      isActive: pathname.startsWith("/leads/buyer"),
    },
    {
      title: "Renter",
      url: "/leads/renter",
      icon: MapPinHouse,
      isActive: pathname.startsWith("/leads/renter"),
    },
    {
      title: "Seller",
      url: "/leads/seller",
      icon: HandCoins,
      isActive: pathname.startsWith("/leads/seller"),
    },
    {
      title: "Landlord",
      url: "/leads/landlord",
      icon: HousePlus,
      isActive: pathname.startsWith("/leads/landlord"),
    },
  ];

  return (
    <div className={`flex ${isMobile ? "flex-col" : "flex-row"} w-full min-h-screen max-h-[calc(100vh-64px)]`}>
      <div
        className={`${
          state === "collapsed" ? "w-[50px]" : "w-[150px]"
        } border-r-[1px] border-neutral-200 pt-4 md:flex   hidden flex-col
				`}
      >
        {menu.map((item, index) => (
          <React.Fragment key={index}>
            {state === "collapsed" || isMobile ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className={`cursor-pointer gap-3 m-0 border-none rounded-none text-md hover:bg-transparent hover:text-primary w-full justify-start ${
                      state === "collapsed" ? "h-10" : "h-14"
                    } bg-transparent text-black ${
                      item.isActive
                        ? "border-l-[2px] border-primary bg-[#f0f6ff] text-[#3C8DFF] hover:bg-[#f0f6ff] hover:text-[#3C8DFF] opacity-100"
                        : ""
                    }`}
                    onClick={() => router.push(item.url)}
                  >
                    {item.icon && <item.icon />}
                    {state === "collapsed" ? null : <span>{item.title}</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
                  {item.title}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                className={`cursor-pointer text-neutral-400 gap-3 m-0 border-none shadow-none rounded-none text-md hover:bg-transparent hover:text-primary w-full justify-start ${"h-14"} bg-transparent ${
                  item.isActive
                    ? "border-l-[2px] border-primary bg-[#f0f6ff] text-[#3C8DFF] hover:bg-[#f0f6ff] hover:text-[#3C8DFF] opacity-100"
                    : ""
                }`}
                onClick={() => router.push(item.url)}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Button>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className={`${`grid grid-cols-2 gap-2 md:hidden`}`}>
        {menu.map((item, index) => (
          <div key={index} className="col-span-1">
            <Button
              className={`cursor-pointer text-neutral-400 gap-3 m-0 border-none shadow-none rounded-none text-md hover:bg-transparent hover:text-primary w-full justify-start ${"h-10"} bg-transparent ${
                item.isActive
                  ? "border-l-[2px] border-primary bg-[#f0f6ff] text-[#3C8DFF] hover:bg-[#f0f6ff] hover:text-[#3C8DFF] opacity-100"
                  : ""
              }`}
              onClick={() => router.push(item.url)}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </Button>
          </div>
        ))}
      </div>
      <div className="flex-1 px-4  border-r-black border-r-2 overflow-y-scroll ">
        <div className="py-4 text-neutral-400">
          {" "}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href="/leads">Leads</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/leads/${pathname.split("/")[2]}`} className="capitalize">
                  {pathname.split("/")[2]} - Leads
                </BreadcrumbLink>
              </BreadcrumbItem>
              {/* Add Lead's Profile breadcrumb when viewing individual lead */}
              {pathname.split("/").length > 3 && pathname.split("/")[3] && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#" className="text-gray-900">
                      Lead&apos;s Profile
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {children}
      </div>
    </div>
  );
}
