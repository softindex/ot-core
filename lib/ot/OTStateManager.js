"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OTStateManager = undefined;

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assert = require("assert");

var _assert2 = _interopRequireDefault(_assert);

var _OTSystem = require("./OTSystem/OTSystem");

var _OTSystem2 = _interopRequireDefault(_OTSystem);

var _OTOperation = require("./interfaces/OTOperation");

var _OTNode = require("./interfaces/OTNode");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } /*
                                                                                                 * Copyright (с) 2019-present, SoftIndex LLC.
                                                                                                 * All rights reserved.
                                                                                                 *
                                                                                                 * This source code is licensed under the BSD-style license found in the
                                                                                                 * LICENSE file in the root directory of this source tree.
                                                                                                 */

class OTStateManager {

  constructor(initState, node, otSystem) {
    this._initState = initState;
    this._otNode = node;
    this._otSystem = otSystem;

    this._invalidateInternalState();
    this._syncing = false;
  }

  addChangeListener(listener) {
    this._otNode.addChangeListener(listener);
  }

  removeChangeListener(listener) {
    this._otNode.removeChangeListener(listener);
  }

  getState() {
    return this._state;
  }

  checkout() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (_this._revision !== null) {
        return;
      }

      const { diffs, revision, level } = yield _this._otNode.checkout();
      _this._apply(diffs);
      _this._revision = revision;
      _this._level = level;
    })();
  }

  sync() {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      (0, _assert2.default)(_this2._revision !== null, 'Checkout has not been called');
      (0, _assert2.default)(!_this2._syncing, 'You can use run only one sync at time');

      _this2._syncing = true;

      try {
        if (_this2._pendingCommit === null) {
          yield _this2._pull();
        } else {
          yield _this2._push();
        }

        if (_this2._workingOperations.length) {
          yield _this2._commit();
          yield _this2._push();
        }
      } finally {
        _this2._syncing = false;
      }
    })();
  }

  reset() {
    const operations = [...this._pendingCommitOperations, ...this._workingOperations];

    this._apply(this._otSystem.invert(operations));

    this._workingOperations = [];
    this._pendingCommitOperations = [];
    this._pendingCommit = null;
  }

  add(operations) {
    try {
      for (const op of operations) {
        if (!this._otSystem.isEmpty(op)) {
          this._workingOperations.push(op);
          this._state = op.apply(this._state);
        }
      }
    } catch (e) {
      this._invalidateInternalState();
      throw e;
    }
  }

  getRevision() {
    return this._revision;
  }

  _pull() {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (_this3._revision === null) {
        throw new Error('Need to call "checkout" first');
      }

      const { diffs, revision, level } = yield _this3._otNode.fetch(_this3._revision);

      const transformed = _this3._otSystem.transform(_this3._otSystem.squash(_this3._workingOperations), _this3._otSystem.squash(diffs));

      _this3._apply(transformed.leftOps);

      _this3._workingOperations = transformed.rightOps;
      _this3._revision = revision;
      _this3._level = level;
    })();
  }

  _commit() {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (_this4._pendingCommit !== null) {
        throw new Error('Need to call "_push" first');
      }

      const workingOperations = [..._this4._workingOperations];
      const diffs = _this4._otSystem.squash(_this4._workingOperations);

      if (_this4._revision === null) {
        throw new Error('Need to call "checkout" first');
      }

      _this4._pendingCommit = yield _this4._otNode.createCommit(_this4._revision, diffs, _this4._level + 1);
      _this4._pendingCommitOperations = workingOperations;
      _this4._workingOperations = _this4._workingOperations.slice(workingOperations.length);
    })();
  }

  _push() {
    var _this5 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (_this5._level === null) {
        throw new Error('Need to call "checkout" first');
      }
      if (_this5._pendingCommit === null) {
        throw new Error('Need to call "_commit" first');
      }

      const level = _this5._level;

      _this5._revision = yield _this5._otNode.push(_this5._pendingCommit);
      _this5._pendingCommit = null;
      _this5._level = level + 1;
    })();
  }

  _apply(operations) {
    try {
      for (const op of operations) {
        this._state = op.apply(this._state);
      }
    } catch (e) {
      this._invalidateInternalState();
      throw e;
    }
  }

  _invalidateInternalState() {
    this._level = null;
    this._revision = null;
    this._workingOperations = [];
    this._pendingCommitOperations = [];
    this._pendingCommit = null;
    this._state = this._initState();
  }
}
exports.OTStateManager = OTStateManager;