import { ArrowRight, BrainCircuit, CalendarDays, Video } from "lucide-react";

function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 md:px-12">
        <a href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Video size={20} />
          </span>
          <span className="text-xl">MeetOrbit</span>
        </a>

        <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
          Development preview
        </span>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Meetings, made intelligent
          </p>

          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Every meeting.
            <span className="block text-indigo-600">One orbit of knowledge.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Create meeting rooms, bring people together, and turn conversations
            into searchable knowledge and actionable outcomes.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled
              title="Meeting room creation will be implemented in Phase 3"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white opacity-80"
            >
              <Video size={18} />
              Create a meeting room
            </button>

            <button
              type="button"
              disabled
              title="Scheduling will be implemented in Phase 3"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700"
            >
              <CalendarDays size={18} />
              Schedule a meeting
            </button>
          </div>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Video className="mb-4 text-indigo-600" size={28} />
            <h2 className="font-semibold">Meeting rooms</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create rooms and invite participants to collaborate.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <BrainCircuit className="mb-4 text-indigo-600" size={28} />
            <h2 className="font-semibold">AI intelligence</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Turn conversations into summaries and decisions.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ArrowRight className="mb-4 text-indigo-600" size={28} />
            <h2 className="font-semibold">Action center</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep follow-up tasks and important outcomes organized.
            </p>
          </article>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-6 text-center text-sm text-slate-500">
        MeetOrbit · Built for better meetings
      </footer>
    </main>
  );
}

export default App;