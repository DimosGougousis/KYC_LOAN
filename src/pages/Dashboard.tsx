export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-blue-700 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-200 uppercase tracking-wide font-medium">BIAN Onboarding</p>
            <h1 className="text-xl font-bold text-white mt-0.5">Workflow Story Dashboard</h1>
          </div>
          <a href="/" className="text-xs text-blue-200 hover:text-white transition-colors">Exit dashboard</a>
        </div>
      </header>
      <div className="max-w-5xl mx-auto p-6">
        <p className="text-slate-500 text-sm">Dashboard loading…</p>
      </div>
    </div>
  );
}
