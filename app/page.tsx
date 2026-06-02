import { ChatWidget } from "@/components/chat/chat-widget";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_32%),linear-gradient(135deg,#f7fafc_0%,#ffffff_48%,#edf7ff_100%)] px-6 py-12 text-bright-ink dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.12),transparent_30%),linear-gradient(135deg,#08111f_0%,#0c1830_58%,#10233f_100%)] dark:text-white">
      <section className="mx-auto flex min-h-[72vh] max-w-5xl flex-col justify-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-bright-blue dark:text-bright-cyan">
          Brightscale AI
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-normal sm:text-6xl">
          Production-ready AI support for high-intent website visitors.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          This demo page hosts the Brightscale chat widget. Drop the component
          into your company site to answer service questions, qualify leads, and
          route prospects toward a free consultation.
        </p>
      </section>
      <ChatWidget />
    </main>
  );
}
