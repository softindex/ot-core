/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import {TransformResult} from '../ot/OTSystem/TransformResult';
import {OTSystemBuilder} from '../ot/OTSystem/OTSystemBuilder';
import TestAddOp from './TestAddOp';
import TestSetOp from './TestSetOp';

import type OTSystemImpl from '../ot/OTSystem/OTSystemImpl';

const testOTResolver: OTSystemImpl<number> = new OTSystemBuilder()
  .withTransformFunction(TestAddOp, TestAddOp, (leftOp: TestAddOp, rightOp: TestAddOp) => {
    return TransformResult.of([
      new TestAddOp(leftOp.prev + leftOp.delta, rightOp.delta)
    ], [
      new TestAddOp(rightOp.prev + rightOp.delta, leftOp.delta)
    ]);
  })
  .withTransformFunction(TestAddOp, TestSetOp, (leftOp: TestAddOp, rightOp: TestSetOp) => {
    return TransformResult.left([
      new TestSetOp(leftOp.prev + leftOp.delta, rightOp.next)
    ]);
  })
  .withTransformFunction(TestSetOp, TestSetOp, (leftOp: TestSetOp, rightOp: TestSetOp) => {
    if (leftOp.next > rightOp.next) {
      return TransformResult.left([new TestSetOp(leftOp.next, rightOp.next)]);
    }
    if (rightOp.next < leftOp.next) {
      return TransformResult.right([new TestSetOp(rightOp.next, leftOp.next)]);
    }
    return TransformResult.empty();
  })
  .withSquashFunction(TestAddOp, TestAddOp, (prevOp: TestAddOp, nextOp: TestAddOp) => {
    return new TestAddOp(prevOp.prev, prevOp.delta + nextOp.delta);
  })
  .withSquashFunction(TestSetOp, TestSetOp, (prevOp: TestSetOp, nextOp: TestSetOp) => {
    return new TestSetOp(prevOp.prev, nextOp.next);
  })
  .withSquashFunction(TestAddOp, TestSetOp, (prevOp: TestAddOp, nextOp: TestSetOp) => {
    return new TestSetOp(prevOp.prev, nextOp.next);
  })
  .withSquashFunction(TestSetOp, TestAddOp, (prevOp: TestSetOp, nextOp: TestAddOp) => {
    return new TestSetOp(prevOp.prev, prevOp.next + nextOp.delta);
  })
  .withEmptyPredicate(TestAddOp, (op: TestAddOp) => op.delta === 0)
  .withEmptyPredicate(TestSetOp, (op: TestSetOp) => op.prev === op.next)
  .withInvertFunction(TestAddOp, (op: TestAddOp) => new TestAddOp(op.prev + op.delta, -op.delta))
  .withInvertFunction(TestSetOp, (op: TestSetOp) => new TestSetOp(op.next, op.prev))
  .build();

export default testOTResolver;
