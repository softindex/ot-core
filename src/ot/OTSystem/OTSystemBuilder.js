/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import OTSystem from "./OTSystem";
import {ensureMapValue} from '../../common/utils';
import {OTOperation} from "../interfaces/OTOperation";

import type {transformer, squasher, emptyPredicate, inverter} from './OTSystem';
import {TransformResult} from "./TransformResult";

export class OTSystemBuilder<S> {
  _transformers: Map<Class<OTOperation<S>>, Map<Class<OTOperation<S>>, transformer<S>>>;
  _squashers: Map<Class<OTOperation<S>>, Map<Class<OTOperation<S>>, squasher<S>>>;
  _emptyPredicated: Map<Class<OTOperation<S>>, emptyPredicate<S>>;
  _inverters: Map<Class<OTOperation<S>>, inverter<S>>;

  constructor() {
    this._transformers = new Map();
    this._squashers = new Map();
    this._emptyPredicated = new Map();
    this._inverters = new Map();
  }

  build(): OTSystem<S> {
    return new OTSystem(this._transformers, this._squashers, this._emptyPredicated, this._inverters);
  }

  withTransformFunction(LeftOp: Class<OTOperation<S>>, RightOp: Class<OTOperation<S>>, transformer: transformer<S>): OTSystemBuilder<S> {
    ensureMapValue(this._transformers, LeftOp).set(RightOp, transformer);

    if (LeftOp !== RightOp) {
      ensureMapValue(this._transformers, RightOp).set(LeftOp, (rightOp, leftOp) => {
        const result = transformer(leftOp, rightOp);
        return TransformResult.of(result.rightOps, result.leftOps);
      });
    }

    return this;
  }

  withSquashFunction(PrevOp: Class<OTOperation<S>>, NextOp: Class<OTOperation<S>>, squasher: squasher<S>): OTSystemBuilder<S> {
    ensureMapValue(this._squashers, PrevOp).set(NextOp, squasher);
    return this;
  }

  withEmptyPredicate(Op: Class<OTOperation<S>>, emptyPredicate: emptyPredicate<S>): OTSystemBuilder<S> {
    this._emptyPredicated.set(Op, emptyPredicate);
    return this;
  }

  withInvertFunction(Op: Class<OTOperation<S>>, inverter: inverter<S>): OTSystemBuilder<S> {
    this._inverters.set(Op, inverter);
    return this;
  }
}
