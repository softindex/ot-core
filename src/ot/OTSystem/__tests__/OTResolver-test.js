/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *  
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import {TransformResult} from '../TransformResult';
import testOTResolver from '../../../test/testOTResolver';
import TestAddOp from '../../../test/TestAddOp';
import TestSetOp from '../../../test/TestSetOp';

describe('transform', () => {
  it('Add operations should transform properly', () => {
    const left = [
      new TestAddOp(0, 2),
      new TestAddOp(2, 1)
    ];
    const right = [
      new TestAddOp(0, 1),
      new TestAddOp(1, 10),
      new TestAddOp(11, 100)
    ];

    const result = testOTResolver.transform(left, right);

    expect(result).toEqual(TransformResult.of([
      new TestAddOp(3, 1),
      new TestAddOp(4, 10),
      new TestAddOp(14, 100)
    ], [
      new TestAddOp(111, 2),
      new TestAddOp(113, 1)
    ]));
  });

  it('Add and Set operations should transform properly', () => {
    const left = [
      new TestAddOp(0, 2),
      new TestSetOp(2, 1),
      new TestAddOp(1, 2),
      new TestAddOp(3, 10)
    ];
    const right = [
      new TestSetOp(0, -20),
      new TestAddOp(-20, 30),
      new TestAddOp(10, 10),
    ];

    const result = testOTResolver.transform(left, right);

    expect(result).toEqual(TransformResult.of([
      new TestSetOp(13, -20),
      new TestAddOp(-20, 30),
      new TestAddOp(10, 10)
    ], []));
  });
});

describe('Squash', () => {
  it('Should squash operations', () => {
    const ops = [
      new TestAddOp(0, 2),
      new TestSetOp(2, 1),
      new TestAddOp(1, 2),
      new TestAddOp(3, 10)
    ];

    const result = testOTResolver.squash(ops);

    expect(result).toEqual([
      new TestSetOp(0, 13)
    ]);
  });
});
