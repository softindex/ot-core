/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import {TransformResult} from './TransformResult';
import {OTOperation} from "../interfaces/OTOperation";

export type transformer<S> = ($FlowFixMe, $FlowFixMe) => TransformResult<S>;
export type squasher<S> = ($FlowFixMe, $FlowFixMe) => ?OTOperation<S>;
export type emptyPredicate<S> = ($FlowFixMe) => boolean;
export type inverter<S> = ($FlowFixMe) => OTOperation<S>;

class OTSystem<S> {
  _transformers: Map<Class<OTOperation<S>>, Map<Class<OTOperation<S>>, transformer<S>>>;
  _squashers: Map<Class<OTOperation<S>>, Map<Class<OTOperation<S>>, squasher<S>>>;
  _emptyPredicates: Map<Class<OTOperation<S>>, emptyPredicate<S>>;
  _inverters: Map<Class<OTOperation<S>>, inverter<S>>;

  constructor(transformers: Map<Class<OTOperation<S>>, Map<Class<OTOperation<S>>, transformer<S>>>,
              squashers: Map<Class<OTOperation<S>>, Map<Class<OTOperation<S>>, squasher<S>>>,
              emptyPredicates: Map<Class<OTOperation<S>>, emptyPredicate<S>>,
              inverters: Map<Class<OTOperation<S>>, inverter<S>>) {
    this._transformers = transformers;
    this._squashers = squashers;
    this._emptyPredicates = emptyPredicates;
    this._inverters = inverters;
  }

  /**
   * Is operation empty
   */
  isEmpty(op: OTOperation<S>): boolean {
    const emptyPredicate = this._emptyPredicates.get(op.constructor);

    if (!emptyPredicate) {
      return false;
    }

    return emptyPredicate(op);
  }

  /**
   * Transform two diffs
   */
  transform(leftOps: Array<OTOperation<S>>, rightOps: Array<OTOperation<S>>): TransformResult<S> {
    const transform = this._doTransform(leftOps, rightOps);

    if (transform.hasConflict()) {
      return this._resolveConflicts(leftOps, rightOps, transform);
    }

    return transform;
  }

  /**
   * Squash operations
   */
  squash(ops: Array<OTOperation<S>>): Array<OTOperation<S>> {
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
  invert(ops: Array<OTOperation<S>>): Array<OTOperation<S>> {
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
  _doTransform(leftOps: Array<OTOperation<S>>, rightOps: Array<OTOperation<S>>): TransformResult<S> {
    if (!leftOps.length && !rightOps.length) {
      return TransformResult.empty();
    }
    if (!leftOps.length) {
      return TransformResult.left(rightOps);
    }
    if (!rightOps.length) {
      return TransformResult.right(leftOps);
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

      return TransformResult.of([
        ...transform1.leftOps,
        ...transform2.leftOps
      ], transform2.rightOps);
    }

    const transform1 = this._doTransform([leftOps[0]], rightOps);
    if (transform1.hasConflict()) {
      return transform1;
    }
    const transform2 = this._doTransform(leftOps.slice(1), transform1.leftOps);
    if (transform2.hasConflict()) {
      return transform2;
    }

    return TransformResult.of(transform2.leftOps, [
      ...transform1.rightOps,
      ...transform2.rightOps
    ]);
  }

  /**
   * Resolve conflicts after "_doTransform"
   *
   * @private
   */
  _resolveConflicts(leftOps: Array<OTOperation<S>>,
                    rightOps: Array<OTOperation<S>>,
                    transform: TransformResult<S>): TransformResult<S> {
    switch (transform.conflictResolution) {
      case 'LEFT':
        return new TransformResult(
          transform.conflictResolution,
          [],
          this.squash([...this.invert(rightOps), ...leftOps])
        );
      case 'RIGHT':
        return new TransformResult(
          transform.conflictResolution,
          this.squash([...this.invert(leftOps), ...rightOps]),
          []
        );
    }

    throw new TypeError();
  }

  _applyTransformer(leftOp: OTOperation<S>, rightOp: OTOperation<S>): TransformResult<S> {
    let transformerMap = this._transformers.get(leftOp.constructor);
    let transformer = transformerMap && transformerMap.get(rightOp.constructor);

    if (!transformer) {
      throw new Error(`Not found transformer for "${leftOp.constructor.name}" and "${rightOp.constructor.name}"`);
    }

    return transformer(leftOp, rightOp)
  }

  _trySquash(prevOp: OTOperation<S>, nextOp: OTOperation<S>): ?OTOperation<S> {
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

export default OTSystem;
