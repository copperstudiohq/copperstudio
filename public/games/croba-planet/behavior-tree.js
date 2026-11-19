/** Small reactive behavior trees. All clocks and memory belong to the caller;
 * evaluating a tree never uses wall time, timers, randomness or hidden state.
 * @typedef {'success'|'failure'|'running'} BehaviorStatus
 * @typedef {{id:string,children?:readonly BehaviorNode[],tick:(context:object)=>BehaviorStatus}} BehaviorNode
 */
export const SUCCESS = "success", FAILURE = "failure", RUNNING = "running";
const statuses = new Set([SUCCESS, FAILURE, RUNNING]);
function node(id, run, children) {
  if (typeof id !== "string" || !id || typeof run !== "function") throw new TypeError("Behavior nodes need a name and a tick function.");
  return Object.freeze({ id, ...(children ? { children: Object.freeze([...children]) } : {}), tick(context) {
    const result = run(context);
    if (!statuses.has(result)) throw new TypeError(`Behavior ${id} returned an invalid status: ${result}`);
    return result;
  } });
}
export function condition(id, test) { return node(id, (context) => test(context) ? SUCCESS : FAILURE); }
export function action(id, run) { return node(id, run); }
/** Reactive priorities allow a newly close threat to interrupt searching immediately. */
export function selector(id, ...children) {
  return node(id, (context) => {
    for (const child of children) { const result = child.tick(context); if (result !== FAILURE) return result; }
    return FAILURE;
  }, children);
}
export function sequence(id, ...children) {
  return node(id, (context) => {
    for (const child of children) { const result = child.tick(context); if (result !== SUCCESS) return result; }
    return SUCCESS;
  }, children);
}
