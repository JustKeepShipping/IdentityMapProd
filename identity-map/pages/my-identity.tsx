import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import type { IdentityDraftItem, Lens } from '@/lib/types';

// Util: load/store participantId from localStorage (Inc-1 join flow should set it)
const useParticipantId = () => {
  const [pid, setPid] = useState<string | null>(null);
  useEffect(() => {
    const id = window.localStorage.getItem('participantId');
    setPid(id);
  }, []);
  return pid;
};

const lenses: Lens[] = ['GIVEN', 'CHOSEN', 'CORE'];

export default function MyIdentityPage() {
  const participantId = useParticipantId();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState<boolean>(false);

  const canUse = Boolean(participantId);

  const counts = useMemo(() => {
    const c: Record<string, number> = { GIVEN: 0, CHOSEN: 0, CORE: 0 };
    items.forEach((i) => (c[i.lens] = (c[i.lens] ?? 0) + 1));
    return c;
  }, [items]);

  const fetchItems = async () => {
    if (!participantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/identity/list?participantId=${participantId}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'fetch_failed');
      setItems(json.items);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [participantId]);

  const onAdd = async (lens: Lens, type: 'tag' | 'text', value: string, weight: 1 | 2 | 3, label?: string) => {
    if (!participantId) return;
    setError(null);
    try {
      const res = await fetch('/api/identity/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, items: [{ lens, type, value, weight, label }] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'save_failed');
      await fetchItems();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const onToggleVisible = async () => {
    if (!participantId) return;
    try {
      const res = await fetch('/api/participant/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, isVisible: !visible }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'save_failed');
      setVisible(json.isVisible);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const onDelete = async () => {
    if (!participantId) return;
    if (!confirm('Delete all your data? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/identity/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId }),
      });
      if (!res.ok) throw new Error('delete_failed');
      window.localStorage.removeItem('participantId');
      window.location.href = '/';
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!canUse) {
    return (
      <main className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold">My Identity</h1>
        <p className="mt-4">You need to join a session first.</p>
        <a className="text-blue-600 underline" href="/">Go to Join</a>
      </main>
    );
  }

  return (
    <>
      <Head><title>My Identity</title></Head>
      <main className="p-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold">My Identity</h1>
        <p className="text-sm text-gray-600">Add items to each lens. We’ll use this later to find common ground and differences across the group.</p>

        <section className="mt-4 p-3 border rounded">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={visible} onChange={onToggleVisible} />
            <span>Visible to others (opt-in)</span>
          </label>
        </section>

        {lenses.map((lens) => (
          <LensEditor key={lens} lens={lens} count={counts[lens]} onAdd={onAdd} items={items.filter((i) => i.lens === lens)} />
        ))}

        <div className="mt-6 flex justify-between items-center">
          <button className="px-3 py-2 border rounded" onClick={fetchItems} disabled={loading}>Refresh</button>
          <button className="px-3 py-2 border rounded text-red-700" onClick={onDelete}>Delete my data</button>
        </div>

        {error && <p className="mt-4 text-red-600">{error}</p>}
      </main>
    </>
  );
}

function LensEditor({ lens, count, onAdd, items }: { lens: Lens; count: number; onAdd: any; items: any[] }) {
  const [type, setType] = useState<'tag' | 'text'>('tag');
  const [value, setValue] = useState('');
  const [weight, setWeight] = useState<1 | 2 | 3>(1);
  const [label, setLabel] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    await onAdd(lens, type, value.trim(), weight, label || undefined);
    setValue('');
  };

  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold">{lens} <span className="text-gray-500 text-sm">({count})</span></h2>
      <form onSubmit={submit} className="mt-2 flex flex-col gap-2">
        <div className="flex gap-2">
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="border px-2 py-1 rounded">
            <option value="tag">Tag</option>
            <option value="text">Text</option>
          </select>
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'tag' ? 'e.g., parent' : 'Short phrase'} className="flex-1 border px-2 py-1 rounded" />
          <select value={weight} onChange={(e) => setWeight(Number(e.target.value) as any)} className="border px-2 py-1 rounded w-20">
            <option value={1}>W1</option>
            <option value={2}>W2</option>
            <option value={3}>W3</option>
          </select>
        </div>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="(Optional) group/label" className="border px-2 py-1 rounded" />
        <button className="self-start px-3 py-1 border rounded">Add</button>
      </form>

      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((i) => (
          <li key={i.id} className="px-2 py-1 border rounded text-sm">
            <span className="font-mono mr-1">{i.type}</span>
            {i.value}
            <span className="ml-2 text-xs">W{i.weight}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
