"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _utils = require("../common/utils");

var _OTRemote = require("../ot/interfaces/OTRemote");

var _OTCommit = require("../ot/OTCommit");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class TestOTRemote {

  constructor() {
    this._commits = new _map2.default();
    this._parents = new _set2.default();
    this._lastCheckpointCommitId = null;
    this._maxId = 0;
  }

  createId() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      return (++_this._maxId).toString();
    })();
  }

  push(commits) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      for (const commit of commits) {
        _this2._commits.set(commit.id, commit);

        for (const [parentCommitId] of commit.parents) {
          _this2._parents.add(parentCommitId);
        }

        if (commit.isCheckpoint()) {
          _this2._lastCheckpointCommitId = commit.id;
        }
      }
    })();
  }

  getHeads() {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      return (0, _utils.difference)(_this3._commits.keys(), _this3._parents);
    })();
  }

  getCheckpoint() {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      return _this4._lastCheckpointCommitId;
    })();
  }

  getCommit(commitId) {
    var _this5 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const commit = _this5._commits.get(commitId);

      if (!commit) {
        throw new Error(`Unknown commit "${commitId}"`);
      }

      return commit;
    })();
  }

  addChangeListener() {}
  removeChangeListener() {}
} /*
   * Copyright (с) 2019-present, SoftIndex LLC.
   * All rights reserved.
   *  
   * This source code is licensed under the BSD-style license found in the
   * LICENSE file in the root directory of this source tree.
   */

exports.default = TestOTRemote;