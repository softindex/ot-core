/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import {OTOperation} from '../ot/interfaces/OTOperation';

class TestAddOp implements OTOperation<number> {
  delta: number;
  prev: number;

  constructor(prev: number, delta: number) {
    this.prev = prev;
    this.delta = delta;
  }

  apply(state: number) {
    return state + this.delta;
  }
}

export default TestAddOp;
