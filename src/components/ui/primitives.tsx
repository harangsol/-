import type { ComponentProps, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-[1120px] px-5 sm:px-8", className)}>{children}</div>;
}

type Tone = "ivory" | "paper" | "navy";

export function Section({
  id,
  tone = "ivory",
  className,
  labelledBy,
  children,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  labelledBy?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx(
        "py-20 sm:py-28",
        tone === "ivory" && "bg-ivory",
        tone === "paper" && "bg-paper",
        tone === "navy" && "on-navy bg-navy text-on-navy",
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children, onNavy }: { children: ReactNode; onNavy?: boolean }) {
  return (
    <p
      className={cx(
        "mb-5 text-base font-semibold tracking-[0.02em]",
        onNavy ? "text-[#9fd0a7]" : "text-green",
      )}
    >
      {children}
    </p>
  );
}

export function SectionTitle({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 id={id} className={cx("pre-line text-[1.75rem] font-bold sm:text-[2.5rem]", className)}>
      {children}
    </h2>
  );
}

export const buttonStyles = {
  base: "inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-[10px] px-6 text-[1.0625rem] font-semibold tracking-[-0.01em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
  primary: "bg-green text-white hover:bg-green-deep active:bg-green-deep",
  navy: "bg-navy text-white hover:bg-navy-soft",
  light: "bg-ivory text-navy hover:bg-white",
  outline: "border border-navy/25 bg-transparent text-navy hover:border-navy hover:bg-white/60",
  outlineOnNavy: "border border-white/30 bg-transparent text-white hover:border-white hover:bg-white/5",
  ghost: "text-navy underline-offset-4 hover:underline",
};

export type ButtonVariant = Exclude<keyof typeof buttonStyles, "base">;

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cx(buttonStyles.base, buttonStyles[variant], className);
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={cx("size-[1.1em]", className)} fill="none">
      <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}
