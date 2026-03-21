"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/store/user";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function PageHeader() {
  const user = useUser();
  const pathname = usePathname();

  let pageTitle: string;
  let pageImage: string;

  if (pathname === "/") {
    pageTitle = `Hello, ${user?.firstname || user?.username}`;
    pageImage = "/dashboard-ill.svg";
  } else if (pathname?.startsWith("/leads")) {
    pageTitle = "Leads";
    pageImage = "/leads-ill.svg";
  } else if (pathname?.startsWith("/listings")) {
    pageTitle = "Listing Agent Portal";
    pageImage = "/listings_ill.svg";
  } else if (pathname?.startsWith("/buyers")) {
    pageTitle = "Buyer's Agent Portal";
    pageImage = "/buyer_ill.svg";
  } else if (pathname?.startsWith("/matches")) {
    pageTitle = "Matches";
    pageImage = "/matches-ill.svg";
  } else if (pathname?.startsWith("/contacts")) {
    pageTitle = "My Contacts";
    pageImage = "/contacts-ill.svg";
  } else if (pathname?.startsWith("/settings")) {
    pageTitle = "Account Settings";
    pageImage = "/dashboard-ill.svg";
  } else {
    pageTitle = `Hello, ${user?.firstname || user?.username}`;
    pageImage = "/buyer_ill.svg";
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border">
      <div className="flex items-center gap-2 px-4 w-full relative">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
        </div>
        <Image
          src={pageImage}
          alt="page illustration"
          width={320}
          height={320}
          className="hidden md:block h-16 w-auto absolute right-0"
        />
      </div>
    </header>
  );
}
