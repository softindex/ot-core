/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import TestAddOp from '../../../test/TestAddOp';
import TestSetOp from '../../../test/TestSetOp';
import {MultiOp, State, testMergedOTResolver} from "../../../test/merged/testMergedOTResolver";
import TestArrayOp from "../../../test/merged/TestArrayOp";

describe('Squash', () => {
  it('Should squash operations1', () => {
    const opsAdd1 = [
      new TestAddOp(0, 3),
      new TestAddOp(3, 1),
      new TestAddOp(4, 10)
    ];
    const opsAdd2 = [
      new TestAddOp(14, 6),
      new TestAddOp(20, 124),
      new TestAddOp(144, -54)
    ];
    const opsSet1 = [
      new TestSetOp(0, 34),
      new TestSetOp(34, 4),
      new TestSetOp(4, 23)
    ];
    const opsSet2 = [
      new TestSetOp(23, 12),
      new TestSetOp(12, 45),
      new TestSetOp(45, 63)
    ];
    const opsArr1 = [
      new TestArrayOp('a', false),
      new TestArrayOp('a', true),
      new TestArrayOp('b', false)
    ];
    const opsArr2 = [
      new TestArrayOp('g', false),
      new TestArrayOp('g', true),
      new TestArrayOp('ff', false)
    ];

    let multiOps = [new MultiOp(opsAdd1, opsSet1, opsArr1), new MultiOp(opsAdd2, opsSet2, opsArr2)];

    const result = testMergedOTResolver.squash(multiOps);
    expect(result).toEqual([new MultiOp(
      [new TestAddOp(0, 90)],
      [new TestSetOp(0, 63)],
      [new TestArrayOp('b', false), new TestArrayOp('ff', false)]
    )]);
  });

  it('Should squash operations2', () => {
    const opsAdd1 = [];
    const opsAdd2 = [];
    const opsSet1 = [];
    const opsSet2 = [];
    const opsArr1 = [
      new TestArrayOp('a', false),
      new TestArrayOp('a', true),
      new TestArrayOp('b', false)
    ];
    const opsArr2 = [
      new TestArrayOp('g', false),
      new TestArrayOp('g', true),
      new TestArrayOp('ff', false)
    ];

    let multiOps = [new MultiOp(opsAdd1, opsSet1, opsArr1), new MultiOp(opsAdd2, opsSet2, opsArr2)];

    const result = testMergedOTResolver.squash(multiOps);
    expect(result).toEqual([new MultiOp(
      [],
      [],
      [new TestArrayOp('b', false), new TestArrayOp('ff', false)]
    )]);
  });
});

describe('Empty', () => {
  it('Should be non empty', () => {
    const opsAdd = [new TestAddOp(4, 10)];
    const opsSet = [new TestSetOp(4, 23)];
    const opsArr = [new TestArrayOp('b', false)];

    const isEmpty = testMergedOTResolver.isEmpty(new MultiOp(opsAdd, opsSet, opsArr));
    expect(isEmpty).toEqual(false);
  });
  it('Should also be non empty', () => {
    const opsAdd = [];
    const opsSet = [new TestSetOp(4, 23)];
    const opsArr = [];

    const result = testMergedOTResolver.isEmpty(new MultiOp(opsAdd, opsSet, opsArr));
    expect(result).toEqual(false);
  });
  it('Should be empty if no ops', () => {
    const opsAdd = [];
    const opsSet = [];
    const opsArr = [];

    const isEmpty = testMergedOTResolver.isEmpty(new MultiOp(opsAdd, opsSet, opsArr));
    expect(isEmpty).toEqual(true);
  });
  it('Should be empty ops are empty', () => {
    const opsAdd = [];
    const opsSet = [new TestSetOp(123, 123)];
    const opsArr = [];

    const isEmpty = testMergedOTResolver.isEmpty(new MultiOp(opsAdd, opsSet, opsArr));
    expect(isEmpty).toEqual(true);
  });
});

describe('Invert', () => {
  it('Should invert operations', () => {
    const opsAdd1 = [
      new TestAddOp(0, 3),
      new TestAddOp(3, 1),
      new TestAddOp(4, 10)
    ];
    const opsAdd2 = [
      new TestAddOp(14, 6),
      new TestAddOp(20, 124),
      new TestAddOp(144, -54)
    ];
    const opsSet1 = [
      new TestSetOp(0, 34),
      new TestSetOp(34, 4),
      new TestSetOp(4, 23)
    ];
    const opsSet2 = [
      new TestSetOp(23, 12),
      new TestSetOp(12, 45),
      new TestSetOp(45, 63)
    ];
    const opsArr1 = [
      new TestArrayOp('a', false),
      new TestArrayOp('a', true),
      new TestArrayOp('b', false)
    ];
    const opsArr2 = [
      new TestArrayOp('g', false),
      new TestArrayOp('g', true),
      new TestArrayOp('ff', false)
    ];

    let multiOps = [new MultiOp(opsAdd1, opsSet1, opsArr1), new MultiOp(opsAdd2, opsSet2, opsArr2)];

    const result = testMergedOTResolver.squash(multiOps);
    expect(result).toEqual([new MultiOp(
      [new TestAddOp(0, 90)],
      [new TestSetOp(0, 63)],
      [new TestArrayOp('b', false), new TestArrayOp('ff', false)]
    )]);
  });
});

describe('Transform', () => {
  it('Should transform operations', () => {
    const opsAddLeft = [
      new TestAddOp(0, 1),
      new TestAddOp(1, 3),
      new TestAddOp(4, 6)
    ];
    const opsAddRight = [
      new TestAddOp(0, 15),
      new TestAddOp(15, 30),
      new TestAddOp(45, 45)
    ];

    const opsSetLeft = [
      new TestSetOp(0, 34),
      new TestSetOp(34, 4),
      new TestSetOp(4, 23)
    ];
    const opsSetRight = [
      new TestSetOp(0, 12),
      new TestSetOp(12, 4),
      new TestSetOp(4, 63)
    ];

    const opsArrLeft = [
      new TestArrayOp('a', false),
      new TestArrayOp('b', false)
    ];
    const opsArrRight = [
      new TestArrayOp('b', false),
      new TestArrayOp('cc', false),
    ];

    const leftOps = [new MultiOp(opsAddLeft, opsSetLeft, opsArrLeft)];
    const rightOps = [new MultiOp(opsAddRight, opsSetRight, opsArrRight)];

    let stateLeft = new State();
    let stateRight = new State();

    leftOps.forEach(op => op.apply(stateLeft));
    rightOps.forEach(op => op.apply(stateRight));

    const result = testMergedOTResolver.transform(leftOps, rightOps);
    result.leftOps.forEach(op => op.apply(stateLeft));
    result.rightOps.forEach(op => op.apply(stateRight));

    expect(stateLeft).toEqual(stateRight);

    expect(stateLeft.number1).toEqual(100);
    expect(stateLeft.number2).toEqual(63);
    expect(stateLeft.strings.size).toEqual(3);

    const expectedStrings = ['a', 'b', 'cc'];
    expectedStrings.forEach(el => expect(stateLeft.strings).toContain(el));
  });
});

