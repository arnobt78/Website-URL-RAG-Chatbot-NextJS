"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** shadcn-style Sonner toaster — dark theme aligned with chat UI. */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-zinc-900 group-[.toaster]:text-zinc-50 group-[.toaster]:border-zinc-700 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-zinc-400",
          actionButton: "group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-900",
          cancelButton: "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-400",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
