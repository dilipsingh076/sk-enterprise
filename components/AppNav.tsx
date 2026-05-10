"use client";

import { FileText, LayoutList, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { AppLink } from "@/components/ui/link";
import { Box } from "@/components/ui/box";
import { Header, Nav } from "@/components/ui/sectioning";
import { Span } from "@/components/ui/typography";
import { cn } from "@/components/ui/cn";

const linkBase =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900";
const linkActive = "bg-zinc-200 text-zinc-900 shadow-sm hover:bg-zinc-200";

export function AppNav() {
  const pathname = usePathname();

  return (
    <Header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <Box className="mx-auto flex w-full items-center justify-between gap-4 px-3 py-2.5 sm:px-4">
        <AppLink
          href="/bill"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-900"
        >
          <Span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white">
            e
          </Span>
          <Span className="hidden sm:inline">e-bill</Span>
        </AppLink>
        <Nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Main">
          <AppLink href="/bill" className={cn(linkBase, pathname === "/bill" ? linkActive : "")}>
            <FileText className="h-3.5 w-3.5 opacity-80" aria-hidden />
            Invoice
          </AppLink>
          <AppLink href="/bills" className={cn(linkBase, pathname === "/bills" ? linkActive : "")}>
            <LayoutList className="h-3.5 w-3.5 opacity-80" aria-hidden />
            Bills
          </AppLink>
          <AppLink href="/profile" className={cn(linkBase, pathname === "/profile" ? linkActive : "")}>
            <UserRound className="h-3.5 w-3.5 opacity-80" aria-hidden />
            Profile
          </AppLink>
        </Nav>
      </Box>
    </Header>
  );
}
