"use client";

import { Pencil, UserPlus } from "lucide-react";
import { Button } from "./button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, cloneElement, isValidElement } from "react";
import { Card } from "./card";

interface Section {
  id: string;
  name: string;
}

interface ListingOwner {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
}

interface PreviousListing {
  id?: string;
  _id?: string;
  owner?: ListingOwner;
}

interface FormSheetProps {
  buttonText: string;
  title: string;
  children: React.ReactNode;
  sections: Section[];
  icon?: boolean;
  open?: boolean;
  showIcon?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  previousListings?: PreviousListing[];
}

export default function FormSheet({
  buttonText,
  title,
  sections,
  children,
  icon,
  open,
  onOpenChange,
  onSuccess,
  showIcon=true,
  previousListings,
}: FormSheetProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [internalOpen, setInternalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use external control if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  useEffect(() => {
    // if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      if (!scrollContainerRef.current) {
        return;
      }

      const handleScroll = () => {
        if (!scrollContainerRef.current) {
          return;
        }

        const scrollPosition = scrollContainerRef.current.scrollTop + 50;

        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const element = scrollContainerRef.current.querySelector(`#${section.id}`) as HTMLElement;
          if (element) {
            const { offsetTop, offsetHeight } = element;
            if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
              setActiveSection(i);
              break;
            }
          }
        }
      };

      const scrollContainer = scrollContainerRef.current;
      scrollContainer.addEventListener("scroll", handleScroll);

      // Initial call to set the active section
      handleScroll();

      // Cleanup function
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }, 100); // 100ms delay to ensure DOM is ready

    return () => clearTimeout(timeoutId);
  }, [sections, isOpen]);

  const scrollToSection = (sectionIndex: number) => {
    if (!scrollContainerRef.current) return;

    const sectionId = sections[sectionIndex].id;
    const element = scrollContainerRef.current.querySelector(`#${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
    {showIcon &&  
    <SheetTrigger asChild>
        {icon ? (
          <Button variant="ghost">
            <Pencil size={16} color="#57738E" strokeWidth={1.75} />
          </Button>
        ) : (
          <Button className="bg-primary">
            <UserPlus /> {buttonText}
          </Button>
        )}
      </SheetTrigger>}

      <SheetContent className="p-5 w-full max-w-[min(85vw,1250px)]">
        <SheetHeader className="p-0 m-0">
          <SheetTitle className="text-[24px] font-bold">{title}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 w-full flex h-fit">
          {/* Sections Navigation */}
          <Card className="w-72 bg-white shadow-sm h-fit border-r border-gray-200">
            <nav className=" p-4">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(index)}
                  className={cn(
                    "w-full text-left px-4 py-3 text-sm transition-colors",
                    activeSection === index
                      ? " text-primary border-l-4 border-primary font-medium"
                      : "text-gray-700 hover:bg-gray-50 border-l-[1px] ml-[0.8px] border-l-black"
                  )}
                >
                  {section.name}
                </button>
              ))}
            </nav>
          </Card>

          {/* Form Content */}
          <div ref={scrollContainerRef} className="h-[90vh] w-full overflow-y-auto pl-6 pb-[500px] relative">
            {isValidElement(children)
              ? cloneElement(children as React.ReactElement<{ onSuccess?: () => void; previousListings?: PreviousListing[] }>, {
                  onSuccess,
                  previousListings
                })
              : children}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
