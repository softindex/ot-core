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
import type {OTSystem} from "../interfaces/OTSystem";

export type constructor2<S> = (Array<$FlowFixMe>, Array<$FlowFixMe>) => OTOperation<S>;
export type constructor3<S> = (Array<$FlowFixMe>, Array<$FlowFixMe>, Array<$FlowFixMe>) => OTOperation<S>;
export type constructor4<S> = (Array<$FlowFixMe>, Array<$FlowFixMe>, Array<$FlowFixMe>, Array<$FlowFixMe>) => OTOperation<S>;
export type getter<S, O> = $FlowFixMe => Array<OTOperation<O>>;

export class MergedOTSystem<S, S1, S2> implements OTSystem<S> {
  _constructor: constructor2<S>;
  _getter1: getter<S, S1>;
  _otSystem1: OTSystem<S1>;
  _getter2: getter<S, S2>;
  _otSystem2: OTSystem<S2>;

  constructor(constructor: constructor2<S>,
              getter1: getter<S, S1>,
              otSystem1: OTSystem<S1>,
              getter2: getter<S, S2>,
              otSystem2: OTSystem<S2>
  ) {
    this._constructor = constructor;
    this._getter1 = getter1;
    this._otSystem1 = otSystem1;
    this._getter2 = getter2;
    this._otSystem2 = otSystem2;
  }

  static merge2<S, S1, S2>(constructor: constructor2<S>,
                           getter1: getter<S, S1>,
                           otSystem1: OTSystem<S1>,
                           getter2: getter<S, S2>,
                           otSystem2: OTSystem<S2>): OTSystem<S> {
    return new MergedOTSystem(constructor, getter1, otSystem1, getter2, otSystem2);
  }

  static merge3<S, S1, S2, S3>(constructor: constructor3<S>,
                               getter1: getter<S, S1>,
                               otSystem1: OTSystem<S1>,
                               getter2: getter<S, S2>,
                               otSystem2: OTSystem<S2>,
                               getter3: getter<S, S3>,
                               otSystem3: OTSystem<S3>): OTSystem<S> {

    const premerged = this.merge2(Helper.create,
      helper => helper.ops1, otSystem1,
      helper => helper.ops2, otSystem2);


    return this.merge2((helpers, ops) => {
        let helper = extractHelper(helpers);
        return constructor(helper.ops1, helper.ops2, ops);
      },
      multiOP => combine(getter1(multiOP), getter2(multiOP), Helper.create), premerged,
      getter3, otSystem3);
  }

  static merge4<S, S1, S2, S3, S4>(constructor: constructor4<S>,
                                   getter1: getter<S, S1>,
                                   otSystem1: OTSystem<S1>,
                                   getter2: getter<S, S2>,
                                   otSystem2: OTSystem<S2>,
                                   getter3: getter<S, S3>,
                                   otSystem3: OTSystem<S3>,
                                   getter4: getter<S, S4>,
                                   otSystem4: OTSystem<S4>): OTSystem<S> {

    const premerged1 = this.merge2(Helper.create,
      helper => helper.ops1, otSystem1,
      helper => helper.ops2, otSystem2);

    const premerged2 = this.merge2(Helper.create,
      helper => helper.ops1, otSystem3,
      helper => helper.ops2, otSystem4);

    return this.merge2((helpers1, helpers2) => {
        let helper1 = extractHelper(helpers1);
        let helper2 = extractHelper(helpers2);
        return constructor(helper1.ops1, helper1.ops2, helper2.ops1, helper2.ops2)
      },
      multiOp => combine(getter1(multiOp), getter2(multiOp), Helper.create), premerged1,
      multiOp => combine(getter3(multiOp), getter4(multiOp), Helper.create), premerged2);
  }

  /**
   * Is operation empty
   */
  isEmpty(op: OTOperation<S>): boolean {
    for (let operation of this._getter1(op)) {
      if (!this._otSystem1.isEmpty(operation)) {
        return false;
      }
    }
    for (let operation of this._getter2(op)) {
      if (!this._otSystem2.isEmpty(operation)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Transform two diffs
   */
  transform(leftOps: Array<OTOperation<S>>, rightOps: Array<OTOperation<S>>): TransformResult<S> {
    let leftOps1 = this._collect(leftOps, this._getter1);
    let leftOps2 = this._collect(leftOps, this._getter2);
    let rightOps1 = this._collect(rightOps, this._getter1);
    let rightOps2 = this._collect(rightOps, this._getter2);

    let transform1 = this._otSystem1.transform(leftOps1, rightOps1);
    let transform2 = this._otSystem2.transform(leftOps2, rightOps2);

    let left = combine(transform1.leftOps, transform2.leftOps, this._constructor);
    let right = combine(transform1.rightOps, transform2.rightOps, this._constructor);

    return TransformResult.of(left, right);
  }

  /**
   * Squash operations
   */
  squash(ops: Array<OTOperation<S>>): Array<OTOperation<S>> {
    if (ops.length === 0) return ops;
    let squashed1 = this._otSystem1.squash(this._collect(ops, this._getter1));
    let squashed2 = this._otSystem2.squash(this._collect(ops, this._getter2));
    return combine(squashed1, squashed2, this._constructor);
  }

  /**
   * Invert operations
   */
  invert(ops: Array<OTOperation<S>>): Array<OTOperation<S>> {
    if (ops.length === 0) return ops;
    let inverted1 = this._otSystem1.invert(this._collect(ops, this._getter1));
    let inverted2 = this._otSystem2.invert(this._collect(ops, this._getter2));
    return combine(inverted1, inverted2, this._constructor);
  }

  _collect<OP>(ops: Array<OTOperation<S>>, getter: OTOperation<S> => Array<OTOperation<OP>>): Array<OTOperation<OP>> {
    let result: Array<OTOperation<OP>> = [];
    ops.map(el => getter(el)).forEach(ops => result.push(...ops));
    return result;
  }
}

// region helpers
function combine<S, S1, S2>(ops1: Array<S1>, ops2: Array<S2>, constructor: (Array<S1>, Array<S2>) => S): Array<S> {
  if (ops1.length === 0 && ops2.length === 0) {
    return [];
  } else {
    return [constructor(ops1, ops2)];
  }
}

function extractHelper<S, S1, S2>(helpers: Array<Helper<S, S1, S2>>): Helper<S, S1, S2> {
  if (helpers.length > 1) {
    throw new Error('Invalid state, there can only be one or zero helpers');
  }
  return helpers.length === 0 ? new Helper([], []) : helpers[0];
}

class Helper<S, S1, S2> implements OTOperation<S> {
  ops1: Array<OTOperation<S1>>;
  ops2: Array<OTOperation<S2>>;

  constructor(ops1: Array<OTOperation<S1>>, ops2: Array<OTOperation<S2>>) {
    this.ops1 = ops1;
    this.ops2 = ops2;
  }

  static create(ops1: Array<OTOperation<S1>>, ops2: Array<OTOperation<S2>>) {
    return new Helper(ops1, ops2);
  }

  apply(state: S): S {
    throw new Error('Helper class');
  }
}

// endregion
