/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *  
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import {
  ensureMapValue,
  difference,
  unwrap
} from "../utils";

describe('ensureMapValue', () => {
  it('Should create Map for "foo" key', () => {
    const map = new Map();
    ensureMapValue(map, 'foo').set('bar', 'ok');

    expect(unwrap(map.get('foo')).get('bar')).toBe('ok');
  });

  it('Should use old "foo" key', () => {
    const value = new Map();
    value.set('a', 'b');
    const map = new Map();
    map.set('foo', value);
    ensureMapValue(map, 'foo').set('bar', 'ok');

    expect(unwrap(map.get('foo')).get('a')).toBe('b');
    expect(unwrap(map.get('foo')).get('bar')).toBe('ok');
  });
});

describe('difference', () => {
  it('Should find difference', () => {
    const result = difference([1, 2, 3, 4], new Set([3, 2]));
    expect(result).toEqual(new Set([1, 4]));
  });
});

describe('unwrap', () => {
  it('Unwrap 0 should return 0', () => {
    expect(unwrap(0)).toBe(0);
  });

  it('Unwrap empty string should return empty string', () => {
    expect(unwrap('')).toBe('');
  });

  it('Unwrap object should return this object', () => {
    const value = {};
    expect(unwrap(value)).toBe(value);
  });

  it('Unwrap null should throw error', () => {
    let error;
    try {
      unwrap(null);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(TypeError);
  });

  it('Unwrap undefined should throw error', () => {
    let error;
    try {
      unwrap(undefined);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(TypeError);
  });
});
