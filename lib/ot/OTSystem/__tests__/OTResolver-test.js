'use strict';

var _TransformResult = require('../TransformResult');

var _testOTResolver = require('../../../test/testOTResolver');

var _testOTResolver2 = _interopRequireDefault(_testOTResolver);

var _TestAddOp = require('../../../test/TestAddOp');

var _TestAddOp2 = _interopRequireDefault(_TestAddOp);

var _TestSetOp = require('../../../test/TestSetOp');

var _TestSetOp2 = _interopRequireDefault(_TestSetOp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *  
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('transform', () => {
  it('Add operations should transform properly', () => {
    const left = [new _TestAddOp2.default(0, 2), new _TestAddOp2.default(2, 1)];
    const right = [new _TestAddOp2.default(0, 1), new _TestAddOp2.default(1, 10), new _TestAddOp2.default(11, 100)];

    const result = _testOTResolver2.default.transform(left, right);

    expect(result).toEqual(_TransformResult.TransformResult.of([new _TestAddOp2.default(3, 1), new _TestAddOp2.default(4, 10), new _TestAddOp2.default(14, 100)], [new _TestAddOp2.default(111, 2), new _TestAddOp2.default(113, 1)]));
  });

  it('Add and Set operations should transform properly', () => {
    const left = [new _TestAddOp2.default(0, 2), new _TestSetOp2.default(2, 1), new _TestAddOp2.default(1, 2), new _TestAddOp2.default(3, 10)];
    const right = [new _TestSetOp2.default(0, -20), new _TestAddOp2.default(-20, 30), new _TestAddOp2.default(10, 10)];

    const result = _testOTResolver2.default.transform(left, right);

    expect(result).toEqual(_TransformResult.TransformResult.of([new _TestSetOp2.default(13, -20), new _TestAddOp2.default(-20, 30), new _TestAddOp2.default(10, 10)], []));
  });
});

describe('Squash', () => {
  it('Should squash operations', () => {
    const ops = [new _TestAddOp2.default(0, 2), new _TestSetOp2.default(2, 1), new _TestAddOp2.default(1, 2), new _TestAddOp2.default(3, 10)];

    const result = _testOTResolver2.default.squash(ops);

    expect(result).toEqual([new _TestSetOp2.default(0, 13)]);
  });
});