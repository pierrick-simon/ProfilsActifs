import AuthTestimonial from "@/components/auth-testimonial";

export default function AuthPanel({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 bg-fond-page p-2">
      <div className="relative flex flex-1 overflow-hidden rounded-3xl bg-[linear-gradient(180deg,#122368_0%,#182f8b_25%,#2547d0_50%,#97baff_75%,#d5e2ff_100%)] p-2">
        <div className="relative z-10 flex w-full flex-col rounded-2xl bg-fond-page shadow-[0_24px_48px_-12px_rgba(18,35,104,0.12)] lg:w-[58%]">
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
