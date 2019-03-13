'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OTStateManager = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _utils = require('../common/utils');

var _OTSystem = require('./OTSystem/OTSystem');

var _OTSystem2 = _interopRequireDefault(_OTSystem);

var _OTOperation = require('./interfaces/OTOperation');

var _OTNode = require('./interfaces/OTNode');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } /*
                                                                                                 * Copyright (с) 2019-present, SoftIndex LLC.
                                                                                                 * All rights reserved.
                                                                                                 *
                                                                                                 * This source code is licensed under the BSD-style license found in the
                                                                                                 * LICENSE file in the root directory of this source tree.
                                                                                                 */

class OTStateManager {

  constructor(initState, node, otSystem) {
    var _this = this;

    this._eventEmitter = new _events2.default();
    this._poll = null;
    this.sync = (0, _utils.serial)((0, _asyncToGenerator3.default)(function* () {
      (0, _assert2.default)(_this._revision !== null, 'Checkout has not been called');

      if (_this._pendingCommit === null) {
        yield _this._pull(function (commitId) {
          return _this._otNode.fetch(commitId);
        });
      } else {
        yield _this._push();
      }

      if (_this._workingOperations.length) {
        yield _this._commit();
        yield _this._push();
      }
    }));

    this._initState = initState;
    this._otNode = node;
    this._otSystem = otSystem;

    this._invalidateInternalState();
  }

  getState() {
    return this._state;
  }

  getRevision() {
    return this._revision;
  }

  addChangeListener(listener) {
    this._eventEmitter.addListener('change', listener);

    if (this._revision !== null) {
      this._startPolling();
    }
  }

  removeChangeListener(listener) {
    this._eventEmitter.removeListener('change', listener);
  }

  checkout() {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      // Ignore if already initialized
      if (_this2._revision !== null) {
        return;
      }

      const { diffs, revision, level } = yield _this2._otNode.checkout();

      // Fix for two parallel checkout calling
      if (_this2._revision !== null) {
        return;
      }

      _this2._apply(diffs);
      _this2._revision = revision;
      _this2._level = level;

      _this2._startPolling();
    })();
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

    this._eventEmitter.emit('change', this._state);
  }

  _pull(fetchFunction) {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (_this3._revision === null) {
        throw new Error('Need to call "checkout" first');
      }

      const prevRevision = _this3._revision;
      const fetchData = yield fetchFunction(_this3._revision);

      if (prevRevision !== _this3._revision) {
        return;
      }

      _this3._applyFetchData(fetchData);
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

      const fetchData = yield _this5._otNode.push(_this5._pendingCommit);
      _this5._applyFetchData(fetchData);
      _this5._pendingCommit = null;
    })();
  }

  _applyFetchData(fetchData) {
    const transformed = this._otSystem.transform(this._otSystem.squash(this._workingOperations), this._otSystem.squash(fetchData.diffs));

    this._apply(transformed.leftOps);

    this._workingOperations = transformed.rightOps;
    this._revision = fetchData.revision;
    this._level = fetchData.level;
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
    this._pendingCommit = null;
    this._state = this._initState();
  }

  _startPolling() {
    if (this._eventEmitter.listenerCount('change') === 0) {
      return;
    }

    this._poll = this._pull(commitId => {
      return this._otNode.poll(commitId);
    }).then(() => {
      this._eventEmitter.emit('change', this._state);
      this._startPolling();
    }).catch(() => this._startPolling());
  }
}
exports.OTStateManager = OTStateManager;