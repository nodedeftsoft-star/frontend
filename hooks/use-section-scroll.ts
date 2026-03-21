import { useEffect, useState, useRef, useCallback } from "react";

interface Section {
  id: string;
  name: string;
}

interface UseSectionScrollProps {
  sections: Section[];
}

export function useSectionScroll({ sections }: UseSectionScrollProps) {
  const [activeSection, setActiveSection] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const checkActiveSection = useCallback(() => {
    if (!scrollContainerRef.current || isScrollingRef.current) return;

    const container = scrollContainerRef.current;
    const scrollPosition = container.scrollTop + 100; // Offset for better UX

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const element = document.getElementById(section.id);

      if (element) {
        const offsetTop = element.offsetTop;
        const offsetHeight = element.offsetHeight;

        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          setActiveSection(i);
          break;
        }
      }
    }
  }, [sections]);

  const scrollToSection = useCallback(
    (index: number) => {
      const section = sections[index];
      const element = document.getElementById(section.id);
      const container = scrollContainerRef.current;

      if (element && container) {
        isScrollingRef.current = true;
        setActiveSection(index);

        const targetScroll = element.offsetTop - 20; // Small offset from top

        container.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });

        // Reset scrolling flag after animation
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 600);
      }
    },
    [sections]
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      if (isScrollingRef.current) return;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        checkActiveSection();
      }, 50);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    // Initial check after a short delay
    setTimeout(checkActiveSection, 200);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [checkActiveSection]);

  return {
    activeSection,
    scrollContainerRef,
    scrollToSection,
  };
}
