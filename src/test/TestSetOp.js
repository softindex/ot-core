/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *  
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import {OTOperation} from '../ot/interfaces/OTOperation';

class TestSetOp implements OTOperation<number> {
  prev: number;
  next: number;

  constructor(prev: number, next: number) {
    this.prev = prev;
    this.next = next;
  }

  apply(state: number): number {
    return this.next;
  }
}

export default TestSetOp;
