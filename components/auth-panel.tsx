import AuthTestimonial from "@/components/auth-testimonial";

export default function AuthPanel({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 bg-fond-page p-2">
      <div className="relative flex flex-1 overflow-hidden rounded-3xl bg-[linear-gradient(180deg,#5e1016_0%,#8b1822_25%,#b83a45_50%,#e39aa1_75%,#f7dfe1_100%)] p-2">
        <div className="relative z-10 flex w-full flex-col rounded-2xl bg-fond-page shadow-[0_24px_48px_-12px_rgba(94,16,22,0.12)] lg:w-[58%]">
          {children}
        </div>

        <div className="relative hidden flex-1 lg:block">
          <div className="pointer-events-none absolute -right-40 -top-40 size-[596px] rounded-full border border-texte-inverse/10" />
          <div className="pointer-events-none absolute -right-24 -top-24 size-[440px] rounded-full border border-texte-inverse/10" />
          <div className="pointer-events-none absolute -right-8 -top-8 size-[300px] rounded-full border border-texte-inverse/10" />
          <AuthTestimonial />
        </div>
      </div>
    </main>
  );
}
