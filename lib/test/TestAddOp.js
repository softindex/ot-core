'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _OTOperation = require('../ot/interfaces/OTOperation');

class TestAddOp {

  constructor(prev, delta) {
    this.prev = prev;
    this.delta = delta;
  }

  apply(state) {
    return state + this.delta;
  }
} /*
   * Copyright (с) 2019-present, SoftIndex LLC.
   * All rights reserved.
   *
   * This source code is licensed under the BSD-style license found in the
   * LICENSE file in the root directory of this source tree.
   */

exports.default = TestAddOp;