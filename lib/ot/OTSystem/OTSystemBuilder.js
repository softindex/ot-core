"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OTSystemBuilder = undefined;

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _OTSystem = require("./OTSystem");

var _OTSystem2 = _interopRequireDefault(_OTSystem);

var _utils = require("../../common/utils");

var _OTOperation = require("../interfaces/OTOperation");

var _TransformResult = require("./TransformResult");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class OTSystemBuilder {

  constructor() {
    this._transformers = new _map2.default();
    this._squashers = new _map2.default();
    this._emptyPredicated = new _map2.default();
    this._inverters = new _map2.default();
  }

  build() {
    return new _OTSystem2.default(this._transformers, this._squashers, this._emptyPredicated, this._inverters);
  }

  withTransformFunction(LeftOp, RightOp, transformer) {
    (0, _utils.ensureMapValue)(this._transformers, LeftOp).set(RightOp, transformer);

    if (LeftOp !== RightOp) {
      (0, _utils.ensureMapValue)(this._transformers, RightOp).set(LeftOp, (rightOp, leftOp) => {
        const result = transformer(leftOp, rightOp);
        return _TransformResult.TransformResult.of(result.rightOps, result.leftOps);
      });
    }

    return this;
  }

  withSquashFunction(PrevOp, NextOp, squasher) {
    (0, _utils.ensureMapValue)(this._squashers, PrevOp).set(NextOp, squasher);
    return this;
  }

  withEmptyPredicate(Op, emptyPredicate) {
    this._emptyPredicated.set(Op, emptyPredicate);
    return this;
  }

  withInvertFunction(Op, inverter) {
    this._inverters.set(Op, inverter);
    return this;
  }
}
exports.OTSystemBuilder = OTSystemBuilder; /*
                                            * Copyright (с) 2019-present, SoftIndex LLC.
                                            * All rights reserved.
                                            *
                                            * This source code is licensed under the BSD-style license found in the
                                            * LICENSE file in the root directory of this source tree.
                                            */