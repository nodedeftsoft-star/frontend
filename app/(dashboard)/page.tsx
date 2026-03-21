"use client";

import { useState } from "react";

import { Info } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
// import { is } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

const chartData = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 214, mobile: 140 },
  { month: "Jul", desktop: 114, mobile: 60 },
  { month: "Aug", desktop: 214, mobile: 110 },
  { month: "Sep", desktop: 104, mobile: 140 },
  { month: "Oct", desktop: 114, mobile: 90 },
  { month: "Nov", desktop: 200, mobile: 80 },
  { month: "Dec", desktop: 24, mobile: 10 },
];
const chartConfig = {
  desktop: {
    label: "Sales",
    color: "#57738E",
  },
  mobile: {
    label: "Rentals",
    color: "#C7C7C7",
  },
} satisfies ChartConfig;

interface MonthlyData {
  month: string;
  count: number;
  totalPrice: number;
}

interface YearlyData {
  year: number;
  count: number;
  totalPrice: number;
}

interface Stats {
  forRent: {
    active: number;
    monthly: MonthlyData[];
    yearly: YearlyData[];
    overall: {
      count: number;
      totalPrice: number;
    };
  };
  forSale: {
    active: number;
    monthly: MonthlyData[];
    yearly: YearlyData[];
    overall: {
      count: number;
      totalPrice: number;
    };
  };
  prospects: {
    pending: number;
    followup: number;
  };
  buyers: number;
  renters: number;
}

async function fetchStats(): Promise<Stats> {
  const res = await fetch("/api/stats");
  const data = await res.json();

  // console.log("STATS:", data.data);

  return data.data;
}

function transformToChartData(stats: Stats, period: string) {
  if (period === "Monthly") {
    const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthMap = new Map();

    // Initialize all months with 0 values
    allMonths.forEach((month) => {
      monthMap.set(month, { desktop: 0, mobile: 0 });
    });

    // Helper function to convert "2025-09" to "Sep"
    const getMonthName = (monthString: string) => {
      const monthIndex = parseInt(monthString.split("-")[1], 10) - 1;
      return allMonths[monthIndex] || monthString;
    };

    stats.forSale.monthly.forEach((item) => {
      const monthName = getMonthName(item.month);
      const existing = monthMap.get(monthName) || { desktop: 0, mobile: 0 };
      monthMap.set(monthName, { ...existing, desktop: item.totalPrice });
    });

    stats.forRent.monthly.forEach((item) => {
      const monthName = getMonthName(item.month);
      const existing = monthMap.get(monthName) || { desktop: 0, mobile: 0 };
      monthMap.set(monthName, { ...existing, mobile: item.totalPrice });
    });

    return allMonths.map((month) => ({
      month,
      desktop: monthMap.get(month)?.desktop || 0,
      mobile: monthMap.get(month)?.mobile || 0,
    }));
  } else if (period === "Yearly") {
    const yearMap = new Map();

    stats.forSale.yearly.forEach((item) => {
      yearMap.set(item.year.toString(), { ...yearMap.get(item.year.toString()), desktop: item.totalPrice });
    });

    stats.forRent.yearly.forEach((item) => {
      yearMap.set(item.year.toString(), { ...yearMap.get(item.year.toString()), mobile: item.totalPrice });
    });

    return Array.from(yearMap.entries()).map(([year, data]) => ({
      month: year,
      desktop: data.desktop || 0,
      mobile: data.mobile || 0,
    }));
  } else {
    return [
      {
        month: "Lifetime",
        desktop: stats.forSale.overall.totalPrice,
        mobile: stats.forRent.overall.totalPrice,
      },
    ];
  }
}

export default function Page() {
  const [active, setActive] = useState("Monthly");

  const {
    data: stats,
    isLoading: isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchStats,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const tabs = ["Monthly", "Yearly", "Lifetime"];

  const currentChartData = stats ? transformToChartData(stats, active) : chartData;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6 py-6 md:py-10 overflow-y-scroll h-full">
        <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center">
          <div className="animate-pulse bg-gray-200 h-6 md:h-8 w-32 rounded"></div>
          <div className="flex items-center justify-between gap-2 bg-[#F9F9F9] border border-[#E5E8EB] rounded-lg w-full md:w-[295px] h-[42px] p-[5px]">
            {tabs.map((tab) => (
              <div
                key={tab}
                className="flex-1 md:w-[95px] h-[32px] rounded-lg flex justify-center items-center bg-gray-100 animate-pulse"
              ></div>
            ))}
          </div>
        </div>

        <Card className="min-h-[350px] md:h-[410px]">
          <CardHeader className="flex flex-col md:flex-row gap-4 md:gap-0">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
              </div>
              <div className="animate-pulse bg-gray-200 h-5 md:h-6 w-32 md:w-40 rounded"></div>
            </div>

            <Separator orientation="vertical" className="hidden md:block mx-8" />
            <Separator className="md:hidden" />

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
                <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
              </div>
              <div className="animate-pulse bg-gray-200 h-5 md:h-6 w-32 md:w-40 rounded"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] md:h-[270px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
              <div className="text-gray-400 text-sm md:text-base">Loading chart...</div>
            </div>
          </CardContent>
        </Card>

        <section className="flex flex-col md:flex-row gap-4 justify-between mt-4 md:mt-8">
          <Card className="w-full md:w-[48%] p-4 md:p-6">
            <div className="animate-pulse bg-gray-200 h-5 md:h-6 w-40 md:w-48 rounded mb-3"></div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-0">
              <div className="w-full md:w-[50%] flex justify-between items-end pt-2 md:pt-4 pb-4 md:pb-6">
                <div>
                  <div className="flex items-center gap-2 md:gap-4 mb-2">
                    <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                    <div className="w-4 h-4 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="animate-pulse bg-gray-200 h-6 md:h-8 w-10 md:w-12 rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-4 md:h-5 w-8 md:w-10 rounded"></div>
                  </div>
                </div>
                <div className="animate-pulse bg-gray-200 w-12 md:w-16 h-6 md:h-8 rounded"></div>
              </div>

              <Separator orientation="vertical" className="hidden md:block mx-8" />
              <Separator className="md:hidden" />

              <div className="w-full md:w-[50%] flex justify-between items-end pt-2 md:pt-4 pb-4 md:pb-6">
                <div>
                  <div className="flex items-center gap-2 md:gap-4 mb-2">
                    <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
                    <div className="w-4 h-4 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="animate-pulse bg-gray-200 h-6 md:h-8 w-10 md:w-12 rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-4 md:h-5 w-8 md:w-10 rounded"></div>
                  </div>
                </div>
                <div className="animate-pulse bg-gray-200 w-12 md:w-16 h-6 md:h-8 rounded"></div>
              </div>
            </div>
          </Card>
          <Card className="w-full md:w-[48%] p-4 md:p-6">
            <div className="animate-pulse bg-gray-200 h-5 md:h-6 w-40 md:w-48 rounded mb-3"></div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-0">
              <div className="w-full md:w-[50%] flex justify-between items-end pt-2 md:pt-4 pb-4 md:pb-6">
                <div>
                  <div className="flex items-center gap-2 md:gap-4 mb-2">
                    <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                    <div className="w-4 h-4 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="animate-pulse bg-gray-200 h-6 md:h-8 w-10 md:w-12 rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-4 md:h-5 w-8 md:w-10 rounded"></div>
                  </div>
                </div>
                <div className="animate-pulse bg-gray-200 w-12 md:w-16 h-6 md:h-8 rounded"></div>
              </div>

              <Separator orientation="vertical" className="hidden md:block mx-8" />
              <Separator className="md:hidden" />

              <div className="w-full md:w-[50%] flex justify-between items-end pt-2 md:pt-4 pb-4 md:pb-6">
                <div>
                  <div className="flex items-center gap-2 md:gap-4 mb-2">
                    <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
                    <div className="w-4 h-4 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="animate-pulse bg-gray-200 h-6 md:h-8 w-10 md:w-12 rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-4 md:h-5 w-8 md:w-10 rounded"></div>
                  </div>
                </div>
                <div className="animate-pulse bg-gray-200 w-12 md:w-16 h-6 md:h-8 rounded"></div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6 py-6 md:py-10">
        <div className="flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
        </div>
        <Card className="min-h-[350px] md:h-[410px] flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-red-500 mb-4">
              <svg className="w-10 h-10 md:w-12 md:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-light-text-secondary mb-2 text-sm md:text-base">Failed to load dashboard data</p>
            <p className="text-xs md:text-sm text-gray-500">Please try refreshing the page</p>
          </div>
        </Card>
        <section className="flex flex-col md:flex-row gap-4 justify-between mt-4 md:mt-8">
          <Card className="w-full md:w-[48%] p-6 flex items-center justify-center min-h-[100px]">
            <p className="text-light-text-secondary text-sm md:text-base">Unable to load statistics</p>
          </Card>
          <Card className="w-full md:w-[48%] p-6 flex items-center justify-center min-h-[100px]">
            <p className="text-light-text-secondary text-sm md:text-base">Unable to load statistics</p>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 p-4 md:p-6 py-4 md:py-6 pb-[100px] md:pb-[200px] overflow-y-scroll h-full">
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center">
        <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center justify-between gap-2 bg-[#F9F9F9] border border-[#E5E8EB] rounded-lg w-full md:w-[295px] h-[42px] p-[5px]">
          {tabs.map((tab) => (
            <div
              key={tab}
              className={`flex-1 md:w-[95px] cursor-pointer h-[32px] rounded-lg flex justify-center items-center text-sm md:text-base ${
                active === tab
                  ? "bg-white border border-[#E5E8EB] text-light-text shadow-sm"
                  : "hover:bg-accent text-light-text-secondary"
              }`}
              onClick={() => setActive(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      <Card className="min-h-[350px] md:h-[410px]">
        <CardHeader className="flex flex-col md:flex-row gap-4 md:gap-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm md:text-base text-light-text-secondary">Closed Sale</span>
              <div className="w-4 h-4 rounded-full bg-[#57738E]" />
            </div>
            <p className="text-sm md:text-base text-light-text-secondary">
              <span className="font-bold text-light-text">
                {stats
                  ? stats.forSale.overall.totalPrice.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })
                  : 0}
              </span>{" "}
              from <span className="text-light-text">{stats ? stats.forSale.overall.count : 0} sales</span>
            </p>
          </div>

          <Separator orientation="vertical" className="hidden md:block mx-8" />
          <Separator className="md:hidden" />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm md:text-base text-light-text-secondary">Closed Rentals</span>
              <div className="w-4 h-4 rounded-full bg-[#C7C7C7]" />
            </div>
            <p className="text-sm md:text-base text-light-text-secondary">
              <span className="font-bold text-light-text">
                {stats
                  ? stats.forRent.overall.totalPrice.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })
                  : 0}
              </span>{" "}
              from <span className="text-light-text">{stats ? stats.forRent.overall.count : 0} rentals</span>
            </p>
          </div>
        </CardHeader>
        <Separator />
        <CardContent>
          <ChartContainer className="h-[220px] md:h-[270px] w-full" config={chartConfig}>
            <BarChart accessibilityLayer data={currentChartData}>
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => {
                  if (active === "Monthly") {
                    return value.slice(0, 3);
                  }
                  return value;
                }}
              />
              <YAxis
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `$${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 100000) {
                    return `$${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 10000) {
                    return `$${Math.floor(value / 1000)}k`;
                  } else if (value >= 1000) {
                    return `$${Math.floor(value / 1000)}k`;
                  } else {
                    return `$${value}`;
                  }
                }}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" className="gap-2" />} />
              <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
              <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <section className="flex flex-col md:flex-row gap-4 justify-between">
        <Card className="w-full md:w-[49%] p-4 md:p-6">
          <p className="text-lg md:text-xl font-bold text-light-text mb-3">Buyer&apos;s Agent Statistics</p>
          <div className="flex flex-col md:flex-row gap-4 md:gap-0">
            <div className="w-full md:w-[50%] flex justify-between items-end pt-2 md:pt-4 pb-4 md:pb-6">
              <div>
                <div className="flex items-center gap-2 md:gap-4 mb-2">
                  <span className="text-sm md:text-base text-light-text">Active Buyers</span>{" "}
                  <Info color="#57738E" size={16} />
                </div>
                <div className="flex gap-2 items-end">
                  <p className="text-light-text font-bold text-xl md:text-2xl">{stats ? stats.buyers : 73}</p>
                  {/* <div className="flex gap-1 items-center pb-[3px]">
                    <Image width={16} height={16} src={"/statup.svg"} alt="stat-up" />
                    <p className="text-[#179254] text-sm">2.4%</p>
                  </div> */}
                </div>
              </div>

              <Image className=" lg:block" src={"/statgraphgreen.svg"} width={65} height={32} alt="graph" />
            </div>

            <Separator orientation="vertical" className="hidden md:block mx-8" />
            <Separator className="md:hidden" />

            <div className="w-full md:w-[50%] flex justify-between items-end pt-2 md:pt-4 pb-4 md:pb-6">
              <div>
                <div className="flex items-center gap-2 md:gap-4 mb-2">
                  <span className="text-sm md:text-base text-light-text">Active Renters</span>{" "}
                  <Info color="#57738E" size={16} />
                </div>
                <div className="flex gap-2 items-end">
                  <p className="text-light-text font-bold text-xl md:text-2xl">{stats ? stats.renters : 73}</p>
                  {/* <div className="flex gap-1 items-center pb-[3px]">
                    <Image width={16} height={16} src={"/statup.svg"} alt="stat-up" />
                    <p className="text-[#179254] text-sm">4.4%</p>
                  </div> */}
                </div>
              </div>

              <Image className=" lg:block" src={"/statgraphgreen.svg"} width={65} height={32} alt="graph" />
            </div>
          </div>
        </Card>
        <Card className="w-full md:w-[49%] p-4 md:p-6">
          <p className="text-lg md:text-xl font-bold text-light-text mb-3">Listing Agent Statistics</p>
          <div className="flex flex-col md:flex-row gap-4 md:gap-0">
            <div className="w-full md:w-[50%] flex justify-between items-end pt-2 md:pt-4 pb-4 md:pb-6">
              <div>
                <div className="flex items-center gap-2 md:gap-4 mb-2">
                  <span className="text-sm md:text-base text-light-text">Active Sales</span>{" "}
                  <Info color="#57738E" size={16} />
                </div>
                <div className="flex gap-2 items-end">
                  <p className="text-light-text font-bold text-xl md:text-2xl">{stats ? stats.forSale.active : 73}</p>
                  {/* <div className="flex gap-1 items-center pb-[3px]">
                    <Image width={16} height={16} src={"/statup.svg"} alt="stat-up" />
                    <p className="text-[#179254] text-sm">6.4%</p>
                  </div> */}
                </div>
              </div>

              <Image className=" lg:block" src={"/statgraphgreen.svg"} width={65} height={32} alt="graph" />
            </div>

            <Separator orientation="vertical" className="hidden md:block mx-8" />
            <Separator className="md:hidden" />

            <div className="w-full md:w-[50%] flex justify-between items-end pt-2 md:pt-4 pb-4 md:pb-6">
              <div>
                <div className="flex items-center gap-2 md:gap-4 mb-2">
                  <span className="text-sm md:text-base text-light-text">Active Rentals</span>{" "}
                  <Info color="#57738E" size={16} />
                </div>
                <div className="flex gap-2 items-end">
                  <p className="text-light-text font-bold text-xl md:text-2xl">{stats ? stats.forRent.active : 73}</p>
                  {/* <div className="flex gap-1 items-center pb-[3px]">
                    <Image width={16} height={16} src={"/statdown.svg"} alt="stat-up" />
                    <p className="text-[#E35B4F] text-sm">4.4%</p>
                  </div> */}
                </div>
              </div>

              <Image className=" lg:block" src={"/statgraphgreen.svg"} width={65} height={32} alt="graph" />
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
