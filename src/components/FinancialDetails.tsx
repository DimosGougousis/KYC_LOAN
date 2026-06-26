import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getPersonaDefaults } from '../data/personaDefaults';

const schema = z.object({
  employmentType: z.enum(['employed', 'self-employed', 'contractor', 'retired', 'unemployed']),
  employerName: z.string().optional(),
  jobTitle: z.string().optional(),
  annualIncome: z.number().min(0),
  payFrequency: z.enum(['weekly', 'fortnightly', 'monthly', 'annual']),
  monthlyRent: z.number().min(0),
  existingDebt: z.number().min(0),
  otherExpenses: z.number().min(0),
});

type FormData = z.infer<typeof schema>;

interface Props {
  workflowId: string;
  onStateChange: (state: { stage: string; sub: string }) => void;
}

interface FormFieldProps {
  label: string;
  error?: { message?: string };
  register: any;
  name: string;
  required?: boolean;
  type?: string;
  options?: { valueAsNumber?: boolean };
}

function FormField({ label, error, register, name, required, type = 'text', options }: FormFieldProps) {
  const id = `field-${name}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        {...register(name, options)}
        className={`rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          error ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-blue-300'
        }`}
      />
      {error && <p className="text-xs text-red-600">{error.message}</p>}
    </div>
  );
}

export default function FinancialDetails({ workflowId, onStateChange }: Props) {
  const defaults = getPersonaDefaults();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employmentType: defaults.employmentType as FormData['employmentType'],
      annualIncome: defaults.annualIncome,
      payFrequency: 'monthly',
      monthlyRent: defaults.monthlyRent,
      existingDebt: defaults.existingDebt,
      otherExpenses: defaults.otherExpenses,
    },
  });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch(`/workflow/${workflowId}/financial-details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      onStateChange(json.state);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Employment</h2>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Employment Type</label>
          <select {...register('employmentType')} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
            <option value="employed">Employed (full-time or part-time)</option>
            <option value="self-employed">Self-employed</option>
            <option value="contractor">Contractor</option>
            <option value="retired">Retired</option>
            <option value="unemployed">Not currently employed</option>
          </select>
        </div>
        <FormField label="Employer name (optional)" name="employerName" register={register} error={errors.employerName} />
        <FormField label="Job title (optional)" name="jobTitle" register={register} error={errors.jobTitle} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Income</h2>
        <FormField label="Annual income (€)" name="annualIncome" register={register} error={errors.annualIncome} required type="number" options={{ valueAsNumber: true }} />
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Pay frequency</label>
          <select {...register('payFrequency')} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
            <option value="weekly">Weekly</option>
            <option value="fortnightly">Fortnightly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual / lump sum</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Monthly outgoings</h2>
        <FormField label="Monthly rent or mortgage (€)" name="monthlyRent" register={register} error={errors.monthlyRent} required type="number" options={{ valueAsNumber: true }} />
        <FormField label="Existing debt repayments (€)" name="existingDebt" register={register} error={errors.existingDebt} required type="number" options={{ valueAsNumber: true }} />
        <FormField label="Other expenses (€)" name="otherExpenses" register={register} error={errors.otherExpenses} required type="number" options={{ valueAsNumber: true }} />
      </div>

      <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
        {submitting ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}