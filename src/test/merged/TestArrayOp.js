/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import type {OTOperation} from "../../ot/interfaces/OTOperation";

class TestArrayOp implements OTOperation<Set<string>> {
  string: string;
  remove: boolean;

  constructor(string: string, remove: boolean) {
    this.string = string;
    this.remove = remove;
  }

  apply(state: Set<string>) {
    if (this.remove){
      state.delete(this.string);
    }    else {
      state.add(this.string);
    }
    return state;
  }
}

export default TestArrayOp;
