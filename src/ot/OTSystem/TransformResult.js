/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import {OTOperation} from '../interfaces/OTOperation';

type conflictResolution = 'LEFT' | 'RIGHT';

export class TransformResult<S> {
  conflictResolution: ?conflictResolution;
  leftOps: Array<OTOperation<S>>;
  rightOps: Array<OTOperation<S>>;

  constructor(conflictResolution: ?conflictResolution, leftOps: Array<OTOperation<S>>, rightOps: Array<OTOperation<S>>) {
    this.conflictResolution = conflictResolution;
    this.leftOps = leftOps;
    this.rightOps = rightOps;
  }

  static of(leftOps: Array<OTOperation<S>>, rightOps: Array<OTOperation<S>>): TransformResult<S> {
    return new TransformResult(null, leftOps, rightOps);
  }

  static left(leftOps: Array<OTOperation<S>>): TransformResult<S> {
    return new TransformResult(null, leftOps, []);
  }

  static right(rightOps: Array<OTOperation<S>>): TransformResult<S> {
    return new TransformResult(null, [], rightOps);
  }

  static empty(): TransformResult<S> {
    return new TransformResult(null, [], []);
  }

  hasConflict(): boolean {
    return this.conflictResolution !== null;
  }
}
