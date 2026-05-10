import * as React from "react";
import { cn } from "@/components/ui/cn";

export const Section = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"section">>(
  function Section({ className, ...props }, ref) {
    return <section ref={ref} className={cn(className)} {...props} />;
  },
);

export const Header = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"header">>(
  function Header({ className, ...props }, ref) {
    return <header ref={ref} className={cn(className)} {...props} />;
  },
);

export const Main = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"main">>(
  function Main({ className, ...props }, ref) {
    return <main ref={ref} className={cn(className)} {...props} />;
  },
);

export const Nav = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"nav">>(
  function Nav({ className, ...props }, ref) {
    return <nav ref={ref} className={cn(className)} {...props} />;
  },
);

export const Article = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"article">>(
  function Article({ className, ...props }, ref) {
    return <article ref={ref} className={cn(className)} {...props} />;
  },
);

export const Footer = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"footer">>(
  function Footer({ className, ...props }, ref) {
    return <footer ref={ref} className={cn(className)} {...props} />;
  },
);
