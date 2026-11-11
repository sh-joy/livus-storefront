'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { sendContactMessageAction } from '@/app/actions/contact';
import { CONTACT_TOPICS } from '@/lib/contact-topics';

const fieldCls =
  'w-full h-11 px-4 bg-[#f4f4f4] border border-transparent focus:border-[#0d0d0d] outline-none text-[16px] text-[#0d0d0d] placeholder:text-[#7a7a7a] transition-colors';
const fontStyle = { fontFamily: "'Overused Grotesk', sans-serif" } as const;

export function ContactForm() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', orderNumber: '', topic: '', message: '', website: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [k]: e.target.value });
    if (state === 'error') setState('idle');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError('');
    const res = await sendContactMessageAction(form as Parameters<typeof sendContactMessageAction>[0]);
    if (res.success) {
      setState('sent');
    } else {
      setState('error');
      setError(res.message || 'Could not send your message.');
    }
  };

  if (state === 'sent') {
    return (
      <div className="bg-[#f4f4f4] p-8 sm:p-10 flex flex-col gap-3">
        <h2 className="t-h3 m-0">Thanks, we&apos;ve got your message</h2>
        <p className="t-body m-0 text-[#4a4a4a]">Our team usually replies within one working day by email or phone.</p>
        <button
          type="button"
          onClick={() => {
            setForm({ fullName: '', email: '', phone: '', orderNumber: '', topic: '', message: '', website: '' });
            setState('idle');
          }}
          className="lv-btn lv-btn--outline self-start mt-3"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <label className="sr-only" htmlFor="c-name">Full name</label>
      <input id="c-name" className={fieldCls} style={fontStyle} placeholder="Full name *" autoComplete="name" required value={form.fullName} onChange={set('fullName')} />
      <label className="sr-only" htmlFor="c-email">Email address</label>
      <input id="c-email" type="email" inputMode="email" className={fieldCls} style={fontStyle} placeholder="Email address *" autoComplete="email" required value={form.email} onChange={set('email')} />
      <label className="sr-only" htmlFor="c-phone">Phone number</label>
      <input id="c-phone" type="tel" inputMode="tel" className={fieldCls} style={fontStyle} placeholder="Phone number *" autoComplete="tel" required value={form.phone} onChange={set('phone')} />
      <label className="sr-only" htmlFor="c-order">Order ID (optional)</label>
      <input id="c-order" className={fieldCls} style={fontStyle} placeholder="Order ID (optional), e.g. LIV-123456" value={form.orderNumber} onChange={set('orderNumber')} />
      <div className="relative">
        <label className="sr-only" htmlFor="c-topic">Topic</label>
        <select
          id="c-topic"
          className={`${fieldCls} appearance-none pr-10 ${form.topic ? '' : 'text-[#7a7a7a]'}`}
          style={fontStyle}
          required
          value={form.topic}
          onChange={set('topic')}
        >
          <option value="" disabled>Select topic *</option>
          {CONTACT_TOPICS.map((t) => (
            <option key={t} value={t} className="text-[#0d0d0d]">{t}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 size-4 text-[#5c5c5c]" aria-hidden />
      </div>
      <label className="sr-only" htmlFor="c-message">Your message</label>
      <textarea
        id="c-message"
        className={`${fieldCls} h-auto min-h-[140px] py-3 resize-y`}
        style={fontStyle}
        placeholder="Your message *"
        required
        value={form.message}
        onChange={set('message')}
      />
      {/* Honeypot for bots: hidden from people and screen readers */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.website} onChange={set('website')} />
      <p role="status" className="t-small m-0 min-h-[21px] text-[#b42318]">{state === 'error' ? error : ''}</p>
      <button type="submit" disabled={state === 'sending'} className="lv-btn lv-btn--solid lv-btn--block disabled:opacity-60">
        {state === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
