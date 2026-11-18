// Three-way merge: apply only this client's changes to the latest document.
// Keyed lists keep independent edits, insertions and removals from other clients.
export const cloneData = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const keyed = list => Array.isArray(list) && list.every(item => object(item) && typeof item.id === 'string');
export function mergeChanges(base, local, remote) {
  if (equal(base, local)) return cloneData(remote);
  if (keyed(base) && keyed(local) && keyed(remote)) {
    const before = new Map(base.map(item => [item.id, item]));
    const after = new Map(local.map(item => [item.id, item]));
    const result = new Map(remote.map(item => [item.id, cloneData(item)]));
    for (const item of base) if (!after.has(item.id)) result.delete(item.id);
    for (const item of local) {
      if (!before.has(item.id)) result.set(item.id, cloneData(item));
      else if (result.has(item.id)) result.set(item.id, mergeChanges(before.get(item.id), item, result.get(item.id)));
    }
    const reordered = !equal(base.map(item => item.id), local.map(item => item.id));
    const order = reordered ? [...local.map(item => item.id), ...remote.map(item => item.id)] : remote.map(item => item.id);
    for (const item of local) order.push(item.id);
    return [...new Set(order)].filter(id => result.has(id)).map(id => result.get(id));
  }
  if (object(base) && object(local) && (object(remote) || remote === undefined)) {
    // Do not recreate a subtree removed remotely while it was being edited.
    if (remote === undefined) return undefined;
    const result = cloneData(remote);
    for (const key of new Set([...Object.keys(base), ...Object.keys(local)])) {
      if (equal(base[key], local[key])) continue;
      if (!(key in local)) delete result[key];
      else if (!(key in base)) result[key] = object(local[key]) && object(remote[key]) ? mergeChanges({}, local[key], remote[key]) : cloneData(local[key]);
      else {
        const value = mergeChanges(base[key], local[key], remote[key]);
        if (value === undefined) delete result[key]; else result[key] = value;
      }
    }
    return result;
  }
  return cloneData(local);
}
