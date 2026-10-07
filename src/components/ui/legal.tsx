import type { ReactNode } from "react";
import { Container } from "./primitives";

export function LegalPage({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-ivory pb-24 pt-24 sm:pt-32">
      <Container className="max-w-[44rem]">
        <h1 className="text-[1.875rem] font-extrabold tracking-[-0.04em] text-navy sm:text-[2.25rem]">{title}</h1>
        {intro && <div className="mt-4 text-muted">{intro}</div>}
        <div className="mt-10 space-y-10">{children}</div>
      </Container>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="text-[1.25rem] font-bold text-navy">{title}</h2>
      <div className="mt-3 space-y-2 text-ink/90">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden="true" className="mt-[0.8em] h-px w-2.5 shrink-0 bg-navy/40" />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}
