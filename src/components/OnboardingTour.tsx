import { useState } from 'react';
import type { AppSettings } from '../types/settings';

const STEPS = [
  { title: 'Capture fast', body: 'Save links, titles, and notes. Use Get Tab or Alt+Shift+S for quick capture.' },
  { title: 'Organize your way', body: 'Tags, folders, colors, pin & star. Enable only what you need in Settings.' },
  { title: 'Go further', body: 'Open the Manager for search, bulk actions, stats, and export. Expand features anytime.' },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-violet-500/30 bg-slate-900 p-4 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
          Step {step + 1} of {STEPS.length}
        </p>
        <h3 className="mt-1 text-base font-bold">{STEPS[step].title}</h3>
        <p className="mt-2 text-sm text-slate-300">{STEPS[step].body}</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onComplete} className="btn-secondary flex-1 text-xs">
            Skip
          </button>
          <button
            type="button"
            onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : onComplete())}
            className="btn-primary flex-1 text-xs"
          >
            {step < STEPS.length - 1 ? 'Next' : 'Get started'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldShowOnboarding(settings: AppSettings): boolean {
  return !settings.onboardingDone;
}
