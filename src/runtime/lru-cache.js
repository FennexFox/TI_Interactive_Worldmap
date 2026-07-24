// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

export function createLruCache({limit = 128, onHit = () => {}} = {}) {
  const maxEntries = Math.max(1, Number(limit) || 1);
  const values = new Map();
  return Object.freeze({
    get(key) {
      if (!values.has(key)) return undefined;
      const value = values.get(key);
      values.delete(key);
      values.set(key, value);
      onHit(key, value);
      return value;
    },
    set(key, value) {
      values.delete(key);
      values.set(key, value);
      while (values.size > maxEntries) values.delete(values.keys().next().value);
      return value;
    },
    clear() {
      values.clear();
    },
    has(key) {
      return values.has(key);
    },
    get size() {
      return values.size;
    },
  });
}
