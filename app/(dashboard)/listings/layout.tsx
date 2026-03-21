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
import { FileText, HandCoins, MapPinHouse } from "lucide-react";
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
      { label: "Listing Agent Portal", href: "#" },
    ];

    if (segments.includes("listing-sales")) {
      breadcrumbs.push({ label: "Listing Sales", href: "/listings/listing-sales" });

      if (segments.includes("convert-lead")) {
        breadcrumbs.push({ label: "Convert Lead", href: "#" });
      } else if (params.id && !segments.includes("find-prospects")) {
        breadcrumbs.push({ label: "Listing Details", href: `/listings/listing-sales/${params.id}` });
      } else if (segments.includes("find-prospects")) {
        breadcrumbs.push({ label: "Listing Details", href: `/listings/listing-sales/${params.id}` });
        breadcrumbs.push({ label: "Find Prospects", href: "#" });
      }
    } else if (segments.includes("listing-rentals")) {
      breadcrumbs.push({ label: "Listing Rentals", href: "/listings/listing-rentals" });

      if (segments.includes("convert-lead")) {
        breadcrumbs.push({ label: "Convert Lead", href: "#" });
      } else if (params.id && !segments.includes("find-prospects")) {
        breadcrumbs.push({ label: "Listing Details", href: `/listings/listing-rentals/${params.id}` });
      } else if (segments.includes("find-prospects")) {
        breadcrumbs.push({ label: "Listing Details", href: `/listings/listing-rentals/${params.id}` });
        breadcrumbs.push({ label: "Find Prospects", href: "#" });
      }
    } else if (segments.includes("prospect-logs")) {
      breadcrumbs.push({ label: "Prospect Logs", href: "/listings/prospect-logs" });

      if (params.id) {
        breadcrumbs.push({ label: "Prospect Details", href: `/listings/prospect-logs/${params.id}` });
      }
    }

    return breadcrumbs;
  };

  const menu = [
    {
      title: "Listing - Sales",
      url: "/listings/listing-sales",
      icon: HandCoins,
      isActive: pathname.startsWith("/listings/listing-sales"),
    },
    {
      title: "Listing - Rentals",
      url: "/listings/listing-rentals",
      icon: MapPinHouse,
      isActive: pathname.startsWith("/listings/listing-rentals"),
    },
    {
      title: "Prospect Logs",
      url: "/listings/prospect-logs",
      icon: FileText,
      isActive: pathname.startsWith("/listings/prospect-logs"),
    },
  ];

  return (
    <div
      className={`flex ${
        isMobile ? "flex-col" : "flex-row"
      } w-full min-h-screen max-h-[calc(100vh-64px)] overflow-hidden`}
    >
      <div
        className={`${
          state === "collapsed" ? "w-[50px]" : "w-[200px]"
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
      <div className={`${`grid grid-cols-1 gap-2 md:hidden`}`}>
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
      <div className="flex-1 px-4  border-r-black border-r-2 overflow-y-scroll">
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
