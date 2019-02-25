'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TransformResult = require('../ot/OTSystem/TransformResult');

var _OTSystemBuilder = require('../ot/OTSystem/OTSystemBuilder');

var _TestAddOp = require('./TestAddOp');

var _TestAddOp2 = _interopRequireDefault(_TestAddOp);

var _TestSetOp = require('./TestSetOp');

var _TestSetOp2 = _interopRequireDefault(_TestSetOp);

var _OTSystem = require('../ot/OTSystem/OTSystem');

var _OTSystem2 = _interopRequireDefault(_OTSystem);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const testOTResolver = new _OTSystemBuilder.OTSystemBuilder().withTransformFunction(_TestAddOp2.default, _TestAddOp2.default, (leftOp, rightOp) => {
  return _TransformResult.TransformResult.of([new _TestAddOp2.default(leftOp.prev + leftOp.delta, rightOp.delta)], [new _TestAddOp2.default(rightOp.prev + rightOp.delta, leftOp.delta)]);
}).withTransformFunction(_TestAddOp2.default, _TestSetOp2.default, (leftOp, rightOp) => {
  return _TransformResult.TransformResult.left([new _TestSetOp2.default(leftOp.prev + leftOp.delta, rightOp.next)]);
}).withTransformFunction(_TestSetOp2.default, _TestSetOp2.default, (leftOp, rightOp) => {
  if (leftOp.next > rightOp.next) {
    return _TransformResult.TransformResult.left([new _TestSetOp2.default(leftOp.next, rightOp.next)]);
  }
  if (rightOp.next < leftOp.next) {
    return _TransformResult.TransformResult.right([new _TestSetOp2.default(rightOp.next, leftOp.next)]);
  }
  return _TransformResult.TransformResult.empty();
}).withSquashFunction(_TestAddOp2.default, _TestAddOp2.default, (prevOp, nextOp) => {
  return new _TestAddOp2.default(prevOp.prev, prevOp.delta + nextOp.delta);
}).withSquashFunction(_TestSetOp2.default, _TestSetOp2.default, (prevOp, nextOp) => {
  return new _TestSetOp2.default(prevOp.prev, nextOp.next);
}).withSquashFunction(_TestAddOp2.default, _TestSetOp2.default, (prevOp, nextOp) => {
  return new _TestSetOp2.default(prevOp.prev, nextOp.next);
}).withSquashFunction(_TestSetOp2.default, _TestAddOp2.default, (prevOp, nextOp) => {
  return new _TestSetOp2.default(prevOp.prev, prevOp.next + nextOp.delta);
}).withEmptyPredicate(_TestAddOp2.default, op => op.delta === 0).withEmptyPredicate(_TestSetOp2.default, op => op.prev === op.next).withInvertFunction(_TestAddOp2.default, op => new _TestAddOp2.default(op.prev + op.delta, -op.delta)).withInvertFunction(_TestSetOp2.default, op => new _TestSetOp2.default(op.next, op.prev)).build(); /*
                                                                                                                                                                                                                                                                                                                                             * Copyright (с) 2019-present, SoftIndex LLC.
                                                                                                                                                                                                                                                                                                                                             * All rights reserved.
                                                                                                                                                                                                                                                                                                                                             *
                                                                                                                                                                                                                                                                                                                                             * This source code is licensed under the BSD-style license found in the
                                                                                                                                                                                                                                                                                                                                             * LICENSE file in the root directory of this source tree.
                                                                                                                                                                                                                                                                                                                                             */

exports.default = testOTResolver;