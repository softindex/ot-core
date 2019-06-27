'use strict';

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('ensureMapValue', () => {
  it('Should create Map for "foo" key', () => {
    const map = new _map2.default();
    (0, _utils.ensureMapValue)(map, 'foo').set('bar', 'ok');

    expect((0, _utils.unwrap)(map.get('foo')).get('bar')).toBe('ok');
  });

  it('Should use old "foo" key', () => {
    const value = new _map2.default();
    value.set('a', 'b');
    const map = new _map2.default();
    map.set('foo', value);
    (0, _utils.ensureMapValue)(map, 'foo').set('bar', 'ok');

    expect((0, _utils.unwrap)(map.get('foo')).get('a')).toBe('b');
    expect((0, _utils.unwrap)(map.get('foo')).get('bar')).toBe('ok');
  });
}); /*
     * Copyright (с) 2019-present, SoftIndex LLC.
     * All rights reserved.
     *  
     * This source code is licensed under the BSD-style license found in the
     * LICENSE file in the root directory of this source tree.
     */

describe('difference', () => {
  it('Should find difference', () => {
    const result = (0, _utils.difference)([1, 2, 3, 4], new _set2.default([3, 2]));
    expect(result).toEqual(new _set2.default([1, 4]));
  });
});

describe('unwrap', () => {
  it('Unwrap 0 should return 0', () => {
    expect((0, _utils.unwrap)(0)).toBe(0);
  });

  it('Unwrap empty string should return empty string', () => {
    expect((0, _utils.unwrap)('')).toBe('');
  });

  it('Unwrap object should return this object', () => {
    const value = {};
    expect((0, _utils.unwrap)(value)).toBe(value);
  });

  it('Unwrap null should throw error', () => {
    let error;
    try {
      (0, _utils.unwrap)(null);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(TypeError);
  });

  it('Unwrap undefined should throw error', () => {
    let error;
    try {
      (0, _utils.unwrap)(undefined);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(TypeError);
  });
});