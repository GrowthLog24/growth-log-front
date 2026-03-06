import type { Metadata } from "next";
import { Header, Footer } from "@/presentation/components/layout";
import { eventRepository } from "@/infrastructure/repositories/eventRepository";
import { siteConfigRepository } from "@/infrastructure/repositories/siteConfigRepository";
import { TimetableClient } from "./TimetableClient";

export const metadata: Metadata = {
  title: "행사 타임테이블 | Growth Log",
  description: "Growth Log 행사 타임테이블",
};

export const dynamic = "force-dynamic";

export default async function TimetablePage() {
  const [events, siteConfig] = await Promise.all([
    eventRepository.getAllActive(),
    siteConfigRepository.getSiteConfig(),
  ]);

  const currentGeneration = siteConfig?.currentGeneration ?? 0;
  const serializedEvents = JSON.parse(JSON.stringify(events));

  return (
    <>
      <Header />
      <main className="flex-1">
        <TimetableClient events={serializedEvents} currentGeneration={currentGeneration} />
      </main>
      <Footer />
    </>
  );
}
