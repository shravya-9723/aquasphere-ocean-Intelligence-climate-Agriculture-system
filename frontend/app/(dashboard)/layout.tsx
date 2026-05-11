"use client";

import dynamic from "next/dynamic";


const ClimateScene = dynamic(() => import("@/components/climate-scene"), {
  ssr: false,
});


export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <ClimateScene />
      </div>
      <div className="relative z-10">{children}</div>
    </main>
  );
}
