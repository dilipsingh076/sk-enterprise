"use client";

import type { ReactNode } from "react";
import { Box } from "@/components/ui/box";
import { cn } from "@/components/ui/cn";
import { Section } from "@/components/ui/sectioning";
import { Heading, Span } from "@/components/ui/typography";

type FormSectionProps = {
  id: string;
  title: string;
  leading?: ReactNode;
  /** Shown on the right of the title row (e.g. Bill to “Recent” chips). */
  headingAside?: ReactNode;
  children: ReactNode;
  dense?: boolean;
};

export function FormSection({ id, title, leading, headingAside, children, dense }: FormSectionProps) {
  return (
    <Section
      id={id}
      className={
        dense
          ? "scroll-mt-16 rounded-xl border border-zinc-200 bg-white p-3 sm:p-4"
          : "scroll-mt-16 rounded-xl border border-zinc-200 bg-white p-5 sm:p-6"
      }
    >
      <Box
        className={cn(
          "flex flex-col gap-2 border-b border-zinc-100 sm:flex-row sm:items-center sm:justify-between sm:gap-x-3",
          dense ? "mb-2 pb-1.5" : "mb-4 pb-3",
        )}
      >
        <Heading
          level={2}
          className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-zinc-900"
        >
          {leading ? (
            <Span className="inline-flex shrink-0 text-zinc-500 [&>svg]:h-4 [&>svg]:w-4">{leading}</Span>
          ) : null}
          <Span>{title}</Span>
        </Heading>
        {headingAside ? (
          <Box className="min-w-0 w-full flex-1 sm:w-auto sm:pl-1">{headingAside}</Box>
        ) : null}
      </Box>
      {children}
    </Section>
  );
}
