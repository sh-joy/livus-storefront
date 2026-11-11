'use client';

import { useEffect, useState } from 'react';
import { Loader2, Mail, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  getAdminContactMessagesAction,
  setContactMessageStatusAction,
  type ContactMessageRow,
} from '@/app/actions/contact';

const STATUSES = ['New', 'Replied', 'Closed'] as const;
type Status = (typeof STATUSES)[number];

export default function AdminMessagesPage() {
  const [rows, setRows] = useState<ContactMessageRow[] | null>(null);
  const [tableReady, setTableReady] = useState(true);
  const [filter, setFilter] = useState<'All' | Status>('All');

  useEffect(() => {
    getAdminContactMessagesAction()
      .then((r) => {
        setRows(r.rows);
        setTableReady(r.tableReady);
      })
      .catch(() => setRows([]));
  }, []);

  const updateStatus = async (id: string, status: Status) => {
    setRows((prev) => (prev || []).map((m) => (m.id === id ? { ...m, status } : m)));
    await setContactMessageStatusAction(id, status);
  };

  const visible = (rows || []).filter((m) => filter === 'All' || m.status === filter);
  const newCount = (rows || []).filter((m) => m.status === 'New').length;

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="size-5" /> Messages {newCount > 0 && <Badge>{newCount} new</Badge>}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Messages sent from the Contact page. Reply by email or phone, then mark them Replied or Closed.
          </p>
        </div>
        <div className="flex gap-1">
          {(['All', ...STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`text-xs px-3 h-8 border rounded-md ${filter === s ? 'bg-foreground text-background' : 'bg-background hover:bg-muted'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {!tableReady && (
        <div className="flex gap-2 items-start rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>
            The messages table doesn&apos;t exist in this database yet. Run <code>drizzle/manual/0006_promo_popup.sql</code> once (Neon → SQL
            Editor). Until then, messages are only emailed to the support address (if email is set up).
          </span>
        </div>
      )}

      {rows === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading messages…
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages{filter !== 'All' ? ` marked ${filter}` : ''} yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold">
                      {m.fullName} <span className="font-normal text-muted-foreground">· {m.topic}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <a className="underline" href={`mailto:${m.email}`}>{m.email}</a> ·{' '}
                      <a className="underline" href={`tel:${m.phone}`}>{m.phone}</a>
                      {m.orderNumber ? <> · Order {m.orderNumber}</> : null} · {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <select
                    value={m.status}
                    onChange={(e) => updateStatus(m.id, e.target.value as Status)}
                    className="text-xs h-8 border rounded-md px-2 bg-background"
                    aria-label="Message status"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <p className="text-sm whitespace-pre-wrap">{m.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
