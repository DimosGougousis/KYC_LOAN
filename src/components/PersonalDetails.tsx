import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getPersonaDefaults } from '../data/personaDefaults';

const schema = z.object({
  firstName: z.string().min(1, 'Required').max(100),
  lastName: z.string().min(1, 'Required').max(100),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  nationality: z.string().length(2, 'Use 2-letter ISO country code'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Use +country format, e.g. +447700900123'),
  addressLine1: z.string().min(1, 'Required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'Required'),
  postcode: z.string().min(1, 'Required'),
  country: z.string().length(2, 'Use 2-letter ISO country code'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  workflowId: string;
  onStateChange: (state: { stage: string; sub: string }) => void;
}

interface FormFieldProps {
  label: string;
  name: string;
  error?: { message?: string };
  hint?: string;
  required?: boolean;
  className?: string;
  type?: string;
  register: any;
}

function FormField({ label, name, error, hint, required, className, type = 'text', register }: FormFieldProps) {
  const id = `field-${name}`;
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
      </label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <input
        id={id}
        type={type}
        {...register(name)}
        className={`rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          error ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-blue-300'
        }`}
      />
      {error && <p className="text-xs text-red-600">{error.message}</p>}
    </div>
  );
}

function DocUpload({ docType, label, onComplete }: { docType: string; label: string; onComplete: (d: any) => void }) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus('uploading');
    for (let i = 0; i <= 100; i += 20) {
      setProgress(i);
      await new Promise((r) => setTimeout(r, 80));
    }
    setStatus('processing');
    await new Promise((r) => setTimeout(r, 600));
    const doc = { documentId: `doc-${Date.now()}`, type: docType, status: 'processing' };
    onComplete(doc);
    setStatus('done');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
    >
      <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>
      {status === 'idle' && (
        <>
          <p className="text-xs text-slate-500 mb-3">Drag and drop, or</p>
          <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-blue-600 font-medium hover:underline">
            Choose file
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </>
      )}
      {status === 'uploading' && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-2">Uploading... {progress}%</p>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {status === 'processing' && <p className="text-xs text-slate-500 mt-2 animate-pulse">Verifying document…</p>}
      {status === 'done' && <p className="text-xs text-green-600 mt-2 font-medium">✓ Document received</p>}
    </div>
  );
}

export default function PersonalDetails({ workflowId, onStateChange }: Props) {
  const defaults = getPersonaDefaults();
  const [doc1, setDoc1] = useState<any>(null);
  const [doc2, setDoc2] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: defaults.firstName,
      lastName: defaults.lastName,
      dob: defaults.dob,
      nationality: defaults.nationality,
      email: defaults.email,
      phone: defaults.phone,
      addressLine1: defaults.addressLine1,
      addressLine2: defaults.addressLine2,
      city: defaults.city,
      postcode: defaults.postcode,
      country: defaults.country,
    },
  });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch(`/workflow/${workflowId}/personal-details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalDetails: data, documents: [doc1, doc2].filter(Boolean) }),
      });
      const json = await res.json();
      onStateChange(json.state);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <section>
          <h2 className="text-base font-semibold text-slate-800 mb-4">Personal information</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First name" name="firstName" register={register} error={errors.firstName} required />
            <FormField label="Last name" name="lastName" register={register} error={errors.lastName} required />
            <FormField label="Date of birth" name="dob" register={register} error={errors.dob} required hint="Use YYYY-MM-DD" />
            <FormField label="Nationality (ISO code)" name="nationality" register={register} error={errors.nationality} required hint="e.g. GB, US, DE" />
            <FormField label="Email address" name="email" register={register} error={errors.email} required type="email" className="col-span-2" />
            <FormField label="Phone number" name="phone" register={register} error={errors.phone} required hint="+447700900123" type="tel" className="col-span-2" />
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-800 mb-4">Address</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Address line 1" name="addressLine1" register={register} error={errors.addressLine1} required className="col-span-2" />
            <FormField label="Address line 2 (optional)" name="addressLine2" register={register} error={errors.addressLine2} className="col-span-2" />
            <FormField label="City" name="city" register={register} error={errors.city} required />
            <FormField label="Postcode" name="postcode" register={register} error={errors.postcode} required />
            <FormField label="Country (ISO code)" name="country" register={register} error={errors.country} required hint="e.g. GB" />
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-800 mb-4">Identity documents</h2>
          <p className="text-sm text-slate-500 mb-4">Upload a clear, unobstructed photo of each document. Both are required.</p>
          <div className="grid grid-cols-2 gap-4">
            <DocUpload docType="passport" label="Passport or national ID" onComplete={setDoc1} />
            <DocUpload docType="proof-of-address" label="Proof of address (utility bill, bank statement)" onComplete={setDoc2} />
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {submitting ? 'Submitting…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}