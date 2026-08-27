import { cn } from '@/utils/cn';

export interface StepperStep {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: StepperStep[];
  /** Zero-based index of the active step. Steps after it render as upcoming. */
  currentStep: number;
  className?: string;
}

/**
 * Vertical wizard stepper rendered inside the dark left rail of create_reservation.
 * Colors assume the `bg-primary text-on-primary` rail context.
 */
export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <ol className={cn('list-none m-0 p-0', className)}>
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isLast = idx === steps.length - 1;
        return (
          <li key={step.label} className={cn('relative', !isLast && 'pb-10')}>
            {!isLast && <div aria-hidden="true" className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-outline-variant/30" />}
            <div className="relative flex items-start">
              <div className="h-8 flex items-center">
                {isActive ? (
                  <span className="w-8 h-8 bg-secondary rounded-full flex justify-center items-center text-on-primary font-semibold ring-4 ring-primary z-10">
                    {idx + 1}
                  </span>
                ) : (
                  <span className="w-8 h-8 bg-primary border-2 border-outline-variant/50 rounded-full flex justify-center items-center text-on-primary/50 font-semibold z-10">
                    {idx + 1}
                  </span>
                )}
              </div>
              <div className="ml-4">
                <h3 className={cn('font-label-lg text-label-lg', isActive ? 'text-secondary-fixed' : 'text-on-primary/50')}>{step.label}</h3>
                {step.description && (
                  <p className={cn('font-body-sm text-body-sm mt-1', isActive ? 'text-on-primary/70' : 'text-on-primary/30')}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
