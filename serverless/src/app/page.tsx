"use client";

import { VotiComplessivoApp } from "@/components/voti-complessivo-app";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  return (
    <>
      <VotiComplessivoApp />
      <Toaster position="top-right" />
    </>
  );
}
