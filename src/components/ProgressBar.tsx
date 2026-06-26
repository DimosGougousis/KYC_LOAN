interface ProgressBarProps {
  steps: string[];
  currentIndex: number;
  completedUpTo: number;
}

export default function ProgressBar({ steps, currentIndex, completedUpTo }: ProgressBarProps) {
  const total = steps.length;
  const progressPercent = ((currentIndex) / (total - 1)) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                i < completedUpTo
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : i === currentIndex
                    ? 'bg-white border-blue-600 text-blue-600'
                    : 'bg-white border-slate-300 text-slate-400'
              }`}
            >
              {i < completedUpTo ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-1 ${i <= currentIndex ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${Math.max(2, progressPercent)}%` }}
        />
      </div>
    </div>
  );
}
