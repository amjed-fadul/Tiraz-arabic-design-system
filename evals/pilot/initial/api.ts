export interface Customer { id: string; name: string; email: string }
export const initialCustomer: Customer = { id: 'CUS-0082', name: 'شركة النور للتجارة والخدمات اللوجستية الدولية', email: 'billing+international-accounts@alnoor.example.com' };
export const initialPreferences: Record<string, boolean> = { billing: true, reminders: false, product: false };
export interface Context { signal: AbortSignal }
type Operation = 'customer' | 'preferences' | 'invoice';
interface Call { operation: Operation; payload: unknown; aborted: boolean }
// Deterministic local service for the pilot. UI code still awaits a real Promise
// and passes AbortSignal; the evaluator can hold/fail requests without UI timers.
const calls: Call[] = [];
let next: 'success' | 'fail' | 'hold' = 'success';
const pending: { resolve: () => void; reject: (error: Error) => void }[] = [];
async function request(operation: Operation, payload: unknown, { signal }: Context) {
 signal.throwIfAborted();
 const call: Call = { operation, payload: structuredClone(payload), aborted: false };
 calls.push(call);
 const mode = next; next = 'success';
 if (mode === 'fail') throw new Error('Pilot service rejected the request');
 if (mode === 'hold') await new Promise<void>((resolve, reject) => {
   const abort = () => { call.aborted = true; reject(new DOMException('Cancelled', 'AbortError')); };
   signal.addEventListener('abort', abort, { once: true });
   const cleanup = () => signal.removeEventListener('abort', abort);
   pending.push({ resolve: () => { cleanup(); resolve(); }, reject: error => { cleanup(); reject(error); } });
 });
 signal.throwIfAborted();
}
export const api = {
 saveCustomer: (customer: Customer, context: Context) => request('customer', customer, context),
 savePreferences: (value: Record<string, boolean>, context: Context) => request('preferences', value, context),
 runInvoiceAction: (action: string, invoiceId: string, context: Context) => request('invoice', {action, invoiceId}, context),
};
declare global { interface Window { __pilot: { calls: Call[]; next: (mode: typeof next) => void; resolve: () => void; reject: () => void } } }
window.__pilot = { calls, next: mode => { next = mode; }, resolve: () => pending.shift()?.resolve(), reject: () => pending.shift()?.reject(new Error('Pilot service rejected the held request')) };
