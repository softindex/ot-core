/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

export function ensureMapValue<K1, K2, V>(map: Map<K1, Map<K2, V>>, key: K1): Map<K2, V> {
  let value = map.get(key);

  if (!value) {
    value = new Map();
    map.set(key, value);
  }

  return value;
}

export function difference<T>(a: Iterable<T>, b: Set<T>): Set<T> {
  const result = new Set();

  for (const item of a) {
    if (!b.has(item)) {
      result.add(item);
    }
  }

  return result;
}

export function unwrap<T>(value: ?T): T {
  if (value === null || value === undefined) {
    throw new TypeError('Value can not be empty');
  }
  return value;
}

export function isEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) {
    return false;
  }

  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }

  return true;
}
