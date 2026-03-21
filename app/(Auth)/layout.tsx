"use client";

import { useEffect, useState } from "react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const testimonials = [
    {
      name: "Tina Alvares, Buyer's Agent, NYC",
      quote:
        "“closR completely changed how we handle buyers. The matching logic is super accurate, and the new Kanban view helps our team track progress without missing a beat.”",
    },
    {
      name: "Shalini Patel, Leasing Agent, Brooklyn",
      quote:
        "“The ability to match listings to qualified renters in one click saved me hours every week. closR's filters are super intuitive.”",
    },
    {
      name: "Mike Bhatia, Managing Broker, New York",
      quote:
        "“We onboarded 3 new agents last month, and closR made it seamless. The guided flows and notes system kept everything organized across sales and rentals.”",
    },
    {
      name: "Jordan Wu, Real Estate Operations Lead, Bronx",
      quote:
        "“closR helped us centralize our activity logs and reduce back-and-forth. Now, we know exactly where each prospect stands—without juggling spreadsheets.”",
    },
    {
      name: "Emily Nguyen, Lead Agent, Queens",
      quote:
        "“We love how clean and modern closR looks. It doesn't feel like clunky software—our team actually enjoys using it every day.”",
    },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const selectedTestimonial = testimonials[index];

  return (
    <div className="flex flex-col md:flex-row items-center justify-center h-screen w-screen">
      <div
        className="flex flex-col items-center justify-center h-screen w-full md:w-[40%] bg-cover bg-center relative"
        style={{
          backgroundImage: "url(/auth_image.webp)",
          backgroundSize: "cover",
        }}
      >
        <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-b from-black to-primary opacity-70" />
        <div className="absolute top-5 left-10 px-2 py-1 bg-primary text-white text-xl font-bold rounded-md">closR</div>
        <div className="absolute bottom-10 left-10 w-[85%] px-4 py-2 text-white text-sm font-bold rounded-md transition-all duration-500">
          <h1 className="text-md font-normal w-full truncate whitespace-nowrap">{selectedTestimonial.quote}</h1>
          <p className="text-sm font-bold w-full text-center">- {selectedTestimonial.name}</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center h-screen w-[90%] md:w-[60%] p-4">{children}</div>
    </div>
  );
}
