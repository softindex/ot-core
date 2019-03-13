'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

exports.ensureMapValue = ensureMapValue;
exports.difference = difference;
exports.unwrap = unwrap;
exports.isEqual = isEqual;
exports.serial = serial;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

function ensureMapValue(map, key) {
  let value = map.get(key);

  if (!value) {
    value = new _map2.default();
    map.set(key, value);
  }

  return value;
}

function difference(a, b) {
  const result = new _set2.default();

  for (const item of a) {
    if (!b.has(item)) {
      result.add(item);
    }
  }

  return result;
}

function unwrap(value) {
  if (value === null || value === undefined) {
    throw new TypeError('Value can not be empty');
  }
  return value;
}

function isEqual(a, b) {
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

function serial(fn) {
  let currentPromise = null;
  let nextPromise = null;
  let resolveNext = null;
  let rejectNext = null;

  return function start() {
    if (currentPromise) {
      if (!nextPromise) {
        nextPromise = new _promise2.default((resolve, reject) => {
          resolveNext = resolve;
          rejectNext = reject;
        });
      }
      return nextPromise;
    }

    currentPromise = fn();

    currentPromise.finally(() => {
      currentPromise = null;
      if (nextPromise !== null) {
        start().then(resolveNext).catch(rejectNext);
        resolveNext = null;
        rejectNext = null;
        nextPromise = null;
      }
    });

    return currentPromise;
  };
}