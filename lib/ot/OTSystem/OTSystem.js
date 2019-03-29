'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _TransformResult = require('./TransformResult');

var _OTOperation = require('../interfaces/OTOperation');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } /*
                                                                                                 * Copyright (с) 2019-present, SoftIndex LLC.
                                                                                                 * All rights reserved.
                                                                                                 *
                                                                                                 * This source code is licensed under the BSD-style license found in the
                                                                                                 * LICENSE file in the root directory of this source tree.
                                                                                                 */

class OTSystem {

  constructor(transformers, squashers, emptyPredicates, inverters) {
    this._transformers = transformers;
    this._squashers = squashers;
    this._emptyPredicates = emptyPredicates;
    this._inverters = inverters;
  }

  /**
   * Is operation empty
   */
  isEmpty(op) {
    const emptyPredicate = this._emptyPredicates.get(op.constructor);

    if (!emptyPredicate) {
      return false;
    }

    return emptyPredicate(op);
  }

  /**
   * Transform two diffs
   */
  transform(leftOps, rightOps) {
    const transform = this._doTransform(leftOps, rightOps);

    if (transform.hasConflict()) {
      return this._resolveConflicts(leftOps, rightOps, transform);
    }

    return transform;
  }

  /**
   * Squash operations
   */
  squash(ops) {
    if (!this._squashers.size || !ops.length) {
      return ops;
    }

    const result = [ops[0]];

    for (let i = 1; i < ops.length; i++) {
      let prevOp = result[result.length - 1];
      if (this.isEmpty(prevOp)) {
        result.pop();
        prevOp = result[result.length - 1];
      }

      const nextOp = ops[i];

      if (!prevOp) {
        result.push(nextOp);
        continue;
      }

      const squashed = this._trySquash(prevOp, nextOp);

      if (!squashed) {
        result.push(nextOp);
        continue;
      }

      result[result.length - 1] = squashed;
    }

    if (this.isEmpty(result[result.length - 1])) {
      result.pop();
    }

    return result;
  }

  /**
   * Invert operations
   */
  invert(ops) {
    const result = [];

    for (let i = ops.length; i--;) {
      const op = ops[i];
      const inverter = this._inverters.get(op.constructor);

      if (!inverter) {
        throw new Error(`Not found inverter for "${op.constructor.name}`);
      }

      result.push(inverter(op));
    }

    return result;
  }

  /**
   * Transform two diffs without conflict resolving
   *
   * @private
   */
  _doTransform(leftOps, rightOps) {
    if (!leftOps.length && !rightOps.length) {
      return _TransformResult.TransformResult.empty();
    }
    if (!leftOps.length) {
      return _TransformResult.TransformResult.left(rightOps);
    }
    if (!rightOps.length) {
      return _TransformResult.TransformResult.right(leftOps);
    }

    if (leftOps.length === 1) {
      const transform1 = this._applyTransformer(leftOps[0], rightOps[0]);
      if (transform1.hasConflict()) {
        return transform1;
      }

      const transform2 = this._doTransform(transform1.rightOps, rightOps.slice(1));
      if (transform2.hasConflict()) {
        return transform2;
      }

      return _TransformResult.TransformResult.of([...transform1.leftOps, ...transform2.leftOps], transform2.rightOps);
    }

    const transform1 = this._doTransform([leftOps[0]], rightOps);
    if (transform1.hasConflict()) {
      return transform1;
    }
    const transform2 = this._doTransform(leftOps.slice(1), transform1.leftOps);
    if (transform2.hasConflict()) {
      return transform2;
    }

    return _TransformResult.TransformResult.of(transform2.leftOps, [...transform1.rightOps, ...transform2.rightOps]);
  }

  /**
   * Resolve conflicts after "_doTransform"
   *
   * @private
   */
  _resolveConflicts(leftOps, rightOps, transform) {
    switch (transform.conflictResolution) {
      case 'LEFT':
        return new _TransformResult.TransformResult(transform.conflictResolution, [], this.squash([...this.invert(rightOps), ...leftOps]));
      case 'RIGHT':
        return new _TransformResult.TransformResult(transform.conflictResolution, this.squash([...this.invert(leftOps), ...rightOps]), []);
    }

    throw new TypeError();
  }

  _applyTransformer(leftOp, rightOp) {
    let transformerMap = this._transformers.get(leftOp.constructor);
    let transformer = transformerMap && transformerMap.get(rightOp.constructor);

    if (!transformer) {
      throw new Error(`Not found transformer for "${leftOp.constructor.name}" and "${rightOp.constructor.name}"`);
    }

    return transformer(leftOp, rightOp);
  }

  _trySquash(prevOp, nextOp) {
    const findPrev = this._squashers.get(prevOp.constructor);
    if (!findPrev) {
      return null;
    }

    const squasher = findPrev.get(nextOp.constructor);
    if (!squasher) {
      return null;
    }

    return squasher(prevOp, nextOp);
  }
}

exports.default = OTSystem;