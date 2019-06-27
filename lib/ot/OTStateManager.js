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

const DEFAULT_RETRY_TIMEOUT = 1000;

class OTStateManager {

  constructor(initState, node, otSystem, retryTimeout = DEFAULT_RETRY_TIMEOUT) {
    var _this = this;

    this._revision = null;
    this._level = null;
    this._workingOperations = [];
    this._pendingCommit = null;
    this._eventEmitter = new _events2.default();
    this._stopPolling = null;
    this._retryTimeoutId = null;
    this.sync = (0, _utils.serial)((0, _asyncToGenerator3.default)(function* () {
      (0, _assert2.default)(_this._revision !== null, 'Checkout has not been called');

      if (_this._pendingCommit === null) {
        yield _this._pull();
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
    this._state = this._initState();
    this._retryTimeout = retryTimeout;
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

    if (this._eventEmitter.listenerCount('change') === 0) {
      this._stop();
    }
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
    for (const op of operations) {
      if (!this._otSystem.isEmpty(op)) {
        this._workingOperations.push(op);
        this._state = op.apply(this._state);
      }
    }

    this._eventEmitter.emit('change', this._state);
  }

  _pull() {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (_this3._revision === null) {
        throw new Error('Need to call "checkout" first');
      }

      const fetchData = yield _this3._otNode.fetch(_this3._revision);
      _this3._applyFetchData(fetchData);
    })();
  }

  _poll() {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (_this4._revision === null) {
        throw new Error('Need to call "checkout" first');
      }

      const prevRevision = _this4._revision;
      const polling = _this4._otNode.poll(_this4._revision);
      _this4._stopPolling = polling.cancel;

      let fetchData;
      try {
        fetchData = yield polling.promise;
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }

        throw err;
      } finally {
        _this4._stopPolling = null;
      }

      if (!_this4.sync.isRunning() && prevRevision === _this4._revision) {
        _this4._applyFetchData(fetchData);
      }
    })();
  }

  _commit() {
    var _this5 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (_this5._pendingCommit !== null) {
        throw new Error('Need to call "_push" first');
      }

      const workingOperations = [..._this5._workingOperations];
      const diffs = _this5._otSystem.squash(_this5._workingOperations);

      if (_this5._revision === null) {
        throw new Error('Need to call "checkout" first');
      }

      _this5._pendingCommit = yield _this5._otNode.createCommit(_this5._revision, diffs, _this5._level + 1);
      _this5._workingOperations = _this5._workingOperations.slice(workingOperations.length);
    })();
  }

  _push() {
    var _this6 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      if (_this6._level === null) {
        throw new Error('Need to call "checkout" first');
      }
      if (_this6._pendingCommit === null) {
        throw new Error('Need to call "_commit" first');
      }

      const fetchData = yield _this6._otNode.push(_this6._pendingCommit);
      _this6._applyFetchData(fetchData);
      _this6._pendingCommit = null;
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
    for (const op of operations) {
      this._state = op.apply(this._state);
    }
  }

  _startPolling() {
    if (this._eventEmitter.listenerCount('change') === 0 || this._stopPolling) {
      return;
    }

    this._poll().then(() => {
      this._eventEmitter.emit('change', this._state);
      this._startPolling();
    }).catch(err => {
      console.error(err);

      this._retryTimeoutId = setTimeout(() => {
        this._startPolling();
      }, this._retryTimeout);
    });
  }

  _stop() {
    clearTimeout(this._retryTimeoutId);

    if (this._stopPolling) {
      this._stopPolling();
    }
  }
}
exports.OTStateManager = OTStateManager;