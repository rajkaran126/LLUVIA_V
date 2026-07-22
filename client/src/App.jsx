import { useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

function Avatar({ employee, large = false }) {
  const initials = employee.name.split(' ').map((part) => part[0]).join('');
  const size = large ? 'h-20 w-20 text-2xl' : 'h-14 w-14 text-base';
  return employee.avatar_url ? (
    <img className={size + ' shrink-0 rounded-2xl object-cover shadow-sm'} src={employee.avatar_url} alt={employee.name + "'s profile"} />
  ) : (
    <div className={size + ' grid shrink-0 place-items-center rounded-2xl bg-indigo-100 font-bold text-indigo-700'}>{initials}</div>
  );
}

function EmployeeCard({ employee, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(employee)}
      className="group flex w-full flex-col rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
      aria-label={'View ' + employee.name + "'s details"}>
      <div className="flex items-start gap-4">
        <Avatar employee={employee} />
        <div className="min-w-0 pt-0.5"><h2 className="truncate text-lg font-semibold text-slate-900">{employee.name}</h2><p className="mt-1 truncate text-sm text-slate-500">{employee.role}</p></div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{employee.department}</span>
        <span className="text-sm font-medium text-indigo-600 transition group-hover:translate-x-0.5">View profile <span aria-hidden="true">→</span></span>
      </div>
    </button>
  );
}

function EmployeeModal({ employee, onClose }) {
  useEffect(() => {
    const handleKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);
  if (!employee) return null;
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="employee-name" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex justify-end"><button type="button" className="-mr-2 -mt-2 grid h-10 w-10 place-items-center rounded-full text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100" onClick={onClose} aria-label="Close employee details">×</button></div>
        <div className="-mt-2 flex flex-col items-center text-center">
          <Avatar employee={employee} large />
          <h2 id="employee-name" className="mt-4 text-2xl font-bold text-slate-900">{employee.name}</h2><p className="mt-1 text-slate-500">{employee.role}</p>
          <span className="mt-3 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">{employee.department}</span>
        </div>
        <dl className="mt-7 divide-y divide-slate-100 rounded-2xl border border-slate-100 px-4">
          <div className="flex gap-4 py-4"><dt className="w-8 text-lg" aria-label="Email">✉</dt><dd className="min-w-0 break-all text-sm font-medium text-slate-700"><a className="hover:text-indigo-600" href={'mailto:' + employee.email}>{employee.email}</a></dd></div>
          <div className="flex gap-4 py-4"><dt className="w-8 text-lg" aria-label="Phone">☎</dt><dd className="text-sm font-medium text-slate-700"><a className="hover:text-indigo-600" href={'tel:' + employee.phone}>{employee.phone}</a></dd></div>
        </dl>
      </section>
    </div>
  );
}

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    fetch(API_URL + '/employees', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error || 'Could not load directory.');
        return response.json();
      })
      .then((data) => { setEmployees(data); setStatus('ready'); })
      .catch((error) => { if (error.name !== 'AbortError') setStatus('error'); });
    return () => controller.abort();
  }, []);

  const filteredEmployees = useMemo(() => {
    const term = query.trim().toLowerCase();
    return employees.filter(({ name, department }) => !term || name.toLowerCase().includes(term) || department.toLowerCase().includes(term));
  }, [employees, query]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-5 sm:px-8"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-200">N</div><div><p className="text-lg font-bold tracking-tight text-slate-900">Northstar</p><p className="text-xs font-medium text-slate-500">Internal Directory</p></div></div></header>
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-2xl"><p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">Our people</p><h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Meet the team behind Northstar.</h1><p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">Find the right teammate, learn what they do, and get in touch.</p></div>
        <div className="mt-9 flex flex-col gap-4 border-y border-slate-200 py-5 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-md"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" placeholder="Search name or department" /></label>
          {status === 'ready' && <p className="text-sm text-slate-500"><span className="font-semibold text-slate-700">{filteredEmployees.length}</span> {filteredEmployees.length === 1 ? 'person' : 'people'} found</p>}
        </div>
        {status === 'loading' && <div className="grid grid-cols-1 gap-5 pt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-3xl bg-slate-200" />)}</div>}
        {status === 'error' && <div className="mt-10 rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center"><p className="text-lg font-semibold text-rose-900">We couldn’t load the directory.</p><p className="mt-2 text-sm text-rose-700">Make sure the API is running, then refresh this page.</p></div>}
        {status === 'ready' && filteredEmployees.length === 0 && <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><p className="text-lg font-semibold text-slate-800">No teammates found</p><p className="mt-2 text-sm text-slate-500">Try a different name or department.</p><button type="button" onClick={() => setQuery('')} className="mt-5 font-semibold text-indigo-600 hover:text-indigo-800">Clear search</button></div>}
        {status === 'ready' && filteredEmployees.length > 0 && <section aria-label="Employees" className="grid grid-cols-1 gap-5 pt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredEmployees.map((employee) => <EmployeeCard key={employee.id} employee={employee} onSelect={setSelected} />)}</section>}
      </div>
      <EmployeeModal employee={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
