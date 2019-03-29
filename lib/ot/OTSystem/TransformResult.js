'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TransformResult = undefined;

var _OTOperation = require('../interfaces/OTOperation');

/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

class TransformResult {

  constructor(conflictResolution, leftOps, rightOps) {
    this.conflictResolution = conflictResolution;
    this.leftOps = leftOps;
    this.rightOps = rightOps;
  }

  static of(leftOps, rightOps) {
    return new TransformResult(null, leftOps, rightOps);
  }

  static left(leftOps) {
    return new TransformResult(null, leftOps, []);
  }

  static right(rightOps) {
    return new TransformResult(null, [], rightOps);
  }

  static empty() {
    return new TransformResult(null, [], []);
  }

  hasConflict() {
    return this.conflictResolution !== null;
  }
}
exports.TransformResult = TransformResult;