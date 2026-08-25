"use client";

import { PropsWithChildren } from "react";
import { NextUIProvider } from "@nextui-org/react";
import { Toaster } from "@/components/ui/sonner";

/** Root client providers — NextUI theme/context + Sonner toasts. */
export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <NextUIProvider>
      {children}
      <Toaster richColors closeButton position="bottom-right" />
    </NextUIProvider>
  );
};
