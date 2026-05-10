"use client";

type FormSectionProps = {
  id: string;
  title: string;
  children: React.ReactNode;
};

export function FormSection({ id, title, children }: FormSectionProps) {
  return (
    <section id={id} className="scroll-mt-16 rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
      <h2 className="mb-4 border-b border-zinc-100 pb-3 text-sm font-semibold text-zinc-900">{title}</h2>
      {children}
    </section>
  );
}
