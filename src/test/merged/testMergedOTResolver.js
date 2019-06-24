/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import TestAddOp from '../TestAddOp';
import TestSetOp from '../TestSetOp';
import {OTSystemBuilder} from "../../ot/OTSystem/OTSystemBuilder";
import {TransformResult} from "../../ot/OTSystem/TransformResult";
import type {OTSystem} from "../../ot/interfaces/OTSystem";
import MergedOTSystem from "../../ot/OTSystem/MergedOTSystem";
import type {OTOperation} from "../../ot/interfaces/OTOperation";
import TestArrayOp from "./TestArrayOp";

const testAddOTResolver: OTSystem<number> = new OTSystemBuilder()
  .withTransformFunction(TestAddOp, TestAddOp, (leftOp: TestAddOp, rightOp: TestAddOp) => {
    return TransformResult.of([
      new TestAddOp(leftOp.prev + leftOp.delta, rightOp.delta)
    ], [
      new TestAddOp(rightOp.prev + rightOp.delta, leftOp.delta)
    ]);
  })
  .withSquashFunction(TestAddOp, TestAddOp, (prevOp: TestAddOp, nextOp: TestAddOp) => {
    return new TestAddOp(prevOp.prev, prevOp.delta + nextOp.delta);
  })
  .withEmptyPredicate(TestAddOp, (op: TestAddOp) => op.delta === 0)
  .withInvertFunction(TestAddOp, (op: TestAddOp) => new TestAddOp(op.prev + op.delta, -op.delta))
  .build();

const testSetOTResolver: OTSystem<number> = new OTSystemBuilder()
  .withTransformFunction(TestSetOp, TestSetOp, (leftOp: TestSetOp, rightOp: TestSetOp) => {
    if (leftOp.next > rightOp.next) {
      return TransformResult.left([new TestSetOp(leftOp.next, rightOp.next)]);
    }
    if (rightOp.next < leftOp.next) {
      return TransformResult.right([new TestSetOp(rightOp.next, leftOp.next)]);
    }
    return TransformResult.empty();
  })
  .withSquashFunction(TestSetOp, TestSetOp, (prevOp: TestSetOp, nextOp: TestSetOp) => {
    return new TestSetOp(prevOp.prev, nextOp.next);
  })
  .withEmptyPredicate(TestSetOp, (op: TestSetOp) => op.prev === op.next)
  .withInvertFunction(TestSetOp, (op: TestSetOp) => new TestSetOp(op.next, op.prev))
  .build();

const testArrayOTResolver: OTSystem<Set<string>> = new OTSystemBuilder()
  .withTransformFunction(TestArrayOp, TestArrayOp, (leftOp: TestArrayOp, rightOp: TestArrayOp) => {
    return TransformResult.of([rightOp], [leftOp]);
  })
  .withSquashFunction(TestArrayOp, TestArrayOp, (prevOp: TestArrayOp, nextOp: TestArrayOp) => {
    if (prevOp.string !== nextOp.string) return null;
    if (prevOp.remove !== nextOp.remove) return new TestArrayOp("", true);
    return prevOp;
  })
  .withEmptyPredicate(TestArrayOp, (op: TestArrayOp) => op.string === "")
  .withInvertFunction(TestArrayOp, (op: TestArrayOp) => new TestArrayOp(op.string, !op.remove))
  .build();


export class State {
  number1: number = 0;
  number2: number = 0;
  strings: Set<string> = new Set();
}

export class MultiOp implements OTOperation<State> {
  ops1: Array<TestAddOp>;
  ops2: Array<TestSetOp>;
  ops3: Array<TestArrayOp>;

  constructor(ops1: Array<TestAddOp>, ops2: Array<TestSetOp>, ops3: Array<TestArrayOp>) {
    this.ops1 = ops1;
    this.ops2 = ops2;
    this.ops3 = ops3;
  }

  apply(state: State): State {
    this.ops1.forEach(op => state.number1 = op.apply(state.number1));
    this.ops2.forEach(op => state.number2 = op.apply(state.number2));
    this.ops3.forEach(op => state.strings = op.apply(state.strings));
    return state;
  }
}

export const testMergedOTResolver: OTSystem<State> = MergedOTSystem.merge3((a1, a2, a3) => new MultiOp(a1, a2, a3),
  multiOp => multiOp.ops1, testAddOTResolver,
  multiOp => multiOp.ops2, testSetOTResolver,
  multiOp => multiOp.ops3, testArrayOTResolver
);
