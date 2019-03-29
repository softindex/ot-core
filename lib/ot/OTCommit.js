"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OTCommit = undefined;

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _OTOperation = require("./interfaces/OTOperation");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class OTCommit {

  constructor(commitId, checkpoint, parents) {
    this.id = commitId;
    this.checkpoint = checkpoint;
    this.parents = parents;
  }

  static ofRoot(commitId) {
    return new OTCommit(commitId, [], new _map2.default());
  }

  static ofCommit(commitId, parentId, ops) {
    return new OTCommit(commitId, null, new _map2.default().set(parentId, ops));
  }

  static ofMerge(commitId, parents) {
    return new OTCommit(commitId, null, parents);
  }

  static ofCheckpoint(commitId, parentId, checkpoint) {
    return new OTCommit(commitId, checkpoint, new _map2.default().set(parentId, []));
  }

  isRoot() {
    return !this.parents.size;
  }

  isCheckpoint() {
    return this.checkpoint !== null;
  }

  isMerge() {
    return this.parents.size > 1;
  }
}
exports.OTCommit = OTCommit; /*
                              * Copyright (с) 2019-present, SoftIndex LLC.
                              * All rights reserved.
                              *
                              * This source code is licensed under the BSD-style license found in the
                              * LICENSE file in the root directory of this source tree.
                              */