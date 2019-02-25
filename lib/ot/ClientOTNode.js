'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ClientOTNode = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _OTOperation = require('./interfaces/OTOperation');

var _OTNode = require('./interfaces/OTNode');

var _JsonSerializer = require('../common/interfaces/JsonSerializer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } /*
                                                                                                 * Copyright (с) 2019-present, SoftIndex LLC.
                                                                                                 * All rights reserved.
                                                                                                 *
                                                                                                 * This source code is licensed under the BSD-style license found in the
                                                                                                 * LICENSE file in the root directory of this source tree.
                                                                                                 */

const jsonSerializer = {
  serialize(key) {
    return key;
  },

  deserialize(json) {
    return json;
  }
};

class ClientOTNode {

  constructor(options) {
    this._url = options.url;
    this._diffSerializer = options.diffSerializer;
    this._keySerializer = options.keySerializer;
    this._fetch = options.fetch || window.fetch.bind(window);
    this._eventEmitter = new _events2.default();
  }

  static createWithJsonKey(options) {
    return new ClientOTNode({
      url: options.url,
      diffSerializer: options.serializer,
      fetch: options.fetch,
      keySerializer: jsonSerializer
    });
  }

  createCommit(parentCommitId, diffs, level) {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const response = yield _this._fetch(_path2.default.join(_this._url, 'createCommit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: (0, _stringify2.default)({
          id: _this._keySerializer.serialize(parentCommitId),
          level,
          diffs: diffs.map(function (diff) {
            return _this._diffSerializer.serialize(diff);
          })
        })
      });
      return yield response.blob();
    })();
  }

  push(commitData) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const response = yield _this2._fetch(_path2.default.join(_this2._url, 'push'), {
        method: 'POST',
        body: commitData
      });
      return _this2._keySerializer.deserialize((yield response.json()));
    })();
  }

  checkout() {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const response = yield _this3._fetch(_path2.default.join(_this3._url, 'checkout'));
      const json = yield response.json();
      return {
        revision: _this3._keySerializer.deserialize(json.id),
        level: json.level,
        diffs: json.diffs.map(function (diff) {
          return _this3._diffSerializer.deserialize(diff);
        })
      };
    })();
  }

  fetch(currentCommitId) {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const serializedKey = _this4._keySerializer.serialize(currentCommitId);
      const response = yield _this4._fetch(_path2.default.join(_this4._url, 'fetch') + '?id=' + encodeURIComponent((0, _stringify2.default)(serializedKey)));
      const json = yield response.json();
      return {
        revision: _this4._keySerializer.deserialize(json.id),
        level: json.level,
        diffs: json.diffs.map(function (diff) {
          return _this4._diffSerializer.deserialize(diff);
        })
      };
    })();
  }

  addChangeListener(listener) {
    this._eventEmitter.addListener('change', listener);
  }

  removeChangeListener(listener) {
    this._eventEmitter.removeListener('change', listener);
  }
}
exports.ClientOTNode = ClientOTNode;