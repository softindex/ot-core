/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow


import type {OTOperation} from "./OTOperation";
import {TransformResult} from "../OTSystem/TransformResult";

export interface OTSystem<S> {
  isEmpty(op: OTOperation<S>): boolean;

  transform(leftOps: Array<OTOperation<S>>, rightOps: Array<OTOperation<S>>): TransformResult<S>;

  squash(ops: Array<OTOperation<S>>): Array<OTOperation<S>>;

  invert(ops: Array<OTOperation<S>>): Array<OTOperation<S>>;
}
