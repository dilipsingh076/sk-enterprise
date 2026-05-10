"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const link =
  "rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900";
const active = "bg-zinc-200 text-zinc-900 hover:bg-zinc-200";

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-3 py-2 sm:px-4">
        <Link href="/bill" className="text-sm font-semibold text-zinc-900">
          e-bill
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main">
          <Link href="/bill" className={`${link} ${pathname === "/bill" ? active : ""}`}>
            Invoice
          </Link>
          <Link href="/bills" className={`${link} ${pathname === "/bills" ? active : ""}`}>
            Bills
          </Link>
          <Link href="/profile" className={`${link} ${pathname === "/profile" ? active : ""}`}>
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}
