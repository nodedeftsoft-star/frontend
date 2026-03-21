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
import { BanknoteArrowDown, MapPinHouse } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import React from "react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { state, isMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [
      { label: "Home", href: "/" },
      { label: "Buyer's Agent Portal", href: "#" },
    ];

    if (segments.includes("buyer")) {
      breadcrumbs.push({ label: "Buyer", href: "/buyers/buyer" });

      if (segments.includes("find-matches")) {
        breadcrumbs.push({ label: "Buyer's Profile", href: `/buyers/buyer/${params.id}` });
        breadcrumbs.push({ label: "Find Matches", href: "#" });
      }
    } else if (segments.includes("renter")) {
      breadcrumbs.push({ label: "Renter", href: "/buyers/renter" });

      if (segments.includes("find-matches")) {
        breadcrumbs.push({ label: "Renter's Profile", href: `/buyers/renter/${params.id}` });
        breadcrumbs.push({ label: "Find Matches", href: "#" });
      }
    }

    if (segments.includes("convert-lead")) {
      const lastSegment = segments[segments.length - 1];
      breadcrumbs.push({ label: "Convert Lead", href: `/buyers/buyer/convert-lead/${lastSegment}` });
    }

    return breadcrumbs;
  };

  const menu = [
    {
      title: "Buyer",
      url: "/buyers/buyer",
      icon: BanknoteArrowDown,
      isActive: pathname.startsWith("/buyers/buyer"),
    },
    {
      title: "Renter",
      url: "/buyers/renter",
      icon: MapPinHouse,
      isActive: pathname.startsWith("/buyers/renter"),
    },
  ];

  return (
    <div className={`flex ${isMobile ? "flex-col" : "flex-row"} w-full min-h-screen max-h-[calc(100vh-64px)]  `}>
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
      <div className="flex-1 px-4 border-r-black border-r-2 overflow-y-scroll ">
        <div className="py-4 text-neutral-400">
          {" "}
          <Breadcrumb>
            <BreadcrumbList>
              {getBreadcrumbs().map((crumb, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < getBreadcrumbs().length - 1 && <BreadcrumbSeparator className="hidden md:block" />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {children}
      </div>
    </div>
  );
}
