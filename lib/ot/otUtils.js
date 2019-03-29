"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.merge = exports.findParentByPredicate = exports.findParentByCommitId = exports.findCheckpoint = exports.makeCheckpointForCommit = undefined;

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let makeCheckpointForCommit = exports.makeCheckpointForCommit = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (otResolver, remote, commitIdComparator, commitId) {
    const prevCheckpointFindResult = yield findCheckpoint(remote, commitIdComparator, commitId);
    if (!prevCheckpointFindResult) {
      throw new Error('No checkpoint found for HEAD');
    }

    return otResolver.squash([...(0, _utils.unwrap)(prevCheckpointFindResult.commit.checkpoint), // Special found commit with checkpoint
    ...prevCheckpointFindResult.parentToChild]);
  });

  return function makeCheckpointForCommit(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
})();

let findCheckpoint = exports.findCheckpoint = (() => {
  var _ref2 = (0, _asyncToGenerator3.default)(function* (remote, commitIdComparator, fromCommitId) {
    return yield findParentByPredicate(remote, new _set2.default([fromCommitId]), commitIdComparator, function (commitId) {
      return commitIdComparator(fromCommitId, commitId) <= 0;
    }, function (commit) {
      return commit.isCheckpoint();
    });
  });

  return function findCheckpoint(_x5, _x6, _x7) {
    return _ref2.apply(this, arguments);
  };
})();

let findParentByCommitId = exports.findParentByCommitId = (() => {
  var _ref3 = (0, _asyncToGenerator3.default)(function* (remote, startCommitIds, commitIdComparator, targetCommitId) {
    function loadPredicate(commitId) {
      return commitIdComparator(commitId, targetCommitId) <= 0;
    }

    function matchPredicate(commit) {
      return commit.id === targetCommitId;
    }

    return yield findParentByPredicate(remote, startCommitIds, commitIdComparator, loadPredicate, matchPredicate);
  });

  return function findParentByCommitId(_x8, _x9, _x10, _x11) {
    return _ref3.apply(this, arguments);
  };
})();

let findParentByPredicate = exports.findParentByPredicate = (() => {
  var _ref4 = (0, _asyncToGenerator3.default)(function* (remote, startCommitIds, commitIdComparator, loadPredicate, matchPredicate) {
    const queue = new _tinyqueue2.default([...startCommitIds].map(function (commitId) {
      return {
        commitId,
        commit: null,
        parentToChild: []
      };
    }), function (a, b) {
      return commitIdComparator(a.commitId, b.commitId);
    });

    const visited = new _set2.default();
    const found = new _set2.default();

    while (queue.length) {
      const node = (0, _utils.unwrap)(queue.pop()); // Checked queue.length
      const commitId = node.commitId;

      visited.add(commitId);

      const commit = node.commit || (yield remote.getCommit(commitId));
      if (!commit) {
        continue;
      }

      if (matchPredicate(commit)) {
        return {
          childCommitId: commitId,
          commit,
          parentToChild: node.parentToChild
        };
      }

      for (const [parentCommitId, diff] of commit.parents) {
        if (loadPredicate(parentCommitId) && !found.has(parentCommitId)) {
          found.add(parentCommitId);

          const parentCommit = yield remote.getCommit(parentCommitId);
          if (!parentCommit) {
            continue;
          }

          const parentNode = {
            commitId,
            parentToChild: diff ? [...diff, ...node.parentToChild] : node.parentToChild,
            commit: parentCommit
          };

          if (matchPredicate(parentNode.commit)) {
            return {
              childCommitId: commitId,
              commit: parentNode.commit,
              parentToChild: parentNode.parentToChild
            };
          }

          queue.push(parentNode);
        }
      }
    }

    return null;
  });

  return function findParentByPredicate(_x12, _x13, _x14, _x15, _x16) {
    return _ref4.apply(this, arguments);
  };
})();

let merge = exports.merge = (() => {
  var _ref5 = (0, _asyncToGenerator3.default)(function* (otResolver, otRemote, commitIdComparator, startNodes) {
    if (startNodes.size === 0) {
      return new _map2.default();
    }

    const loadCommitQueue = new _tinyqueue2.default([...startNodes], commitIdComparator);
    const commits = new _map2.default();
    const visited = new _set2.default();

    let nodes = startNodes;
    let mergeResult = doMerge(nodes, otResolver, new _map2.default(), commits);
    while (mergeResult === null) {
      const commitId = loadCommitQueue.pop();
      if (commitId === undefined) {
        throw new Error(`Can't merge. Root not found in remote`);
      }

      const commit = yield otRemote.getCommit(commitId);
      if (!commit) {
        continue;
      }

      commits.set(commitId, commit.parents);
      nodes = withoutSubnodes(nodes, commits);

      for (const parentNode of commit.parents.keys()) {
        if (!commits.has(parentNode)) {
          visited.add(parentNode);
          loadCommitQueue.push(parentNode);
        }
      }

      mergeResult = doMerge(nodes, otResolver, new _map2.default(), commits);
    }

    const result = new _map2.default();
    for (const startNode of startNodes) {
      const pathToNode = (0, _utils.unwrap)(findPathToNode(startNode, mergeResult, commits));
      result.set(startNode, otResolver.squash(pathToNode));
    }
    return result;
  });

  return function merge(_x17, _x18, _x19, _x20) {
    return _ref5.apply(this, arguments);
  };
})();

exports.commitsToGraphviz = commitsToGraphviz;

var _tinyqueue = require("tinyqueue");

var _tinyqueue2 = _interopRequireDefault(_tinyqueue);

var _OTRemote = require("./interfaces/OTRemote");

var _OTCommit = require("./OTCommit");

var _OTOperation = require("./interfaces/OTOperation");

var _OTSystem = require("./OTSystem/OTSystem");

var _OTSystem2 = _interopRequireDefault(_OTSystem);

var _utils = require("../common/utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } /*
                                                                                                 * Copyright (с) 2019-present, SoftIndex LLC.
                                                                                                 * All rights reserved.
                                                                                                 *
                                                                                                 * This source code is licensed under the BSD-style license found in the
                                                                                                 * LICENSE file in the root directory of this source tree.
                                                                                                 */

function findPathToNode(parentNode, childNode, commits, visited = new _set2.default()) {
  if (parentNode === childNode) {
    return [];
  }

  const commit = commits.get(childNode);
  if (commit) {
    for (const [nextNode, ops] of commit) {
      if (!visited.has(nextNode)) {
        visited.add(nextNode);
        const nextOps = findPathToNode(parentNode, nextNode, commits, visited);
        if (nextOps) {
          return [...nextOps, ...ops];
        }
      }
    }
  }

  return null;
}

function getOps(startNode, opsState, commits) {
  let result = opsState.get(startNode);
  if (result === undefined) {
    const parents = commits.get(startNode);
    if (!parents || parents.size === 0) {
      return new _set2.default([startNode]);
    }

    result = new _set2.default(parents.size === 1 ? [startNode] : []);
    for (const parent of parents.keys()) {
      [...getOps(parent, opsState, commits)].forEach(op => (0, _utils.unwrap)(result).add(op));
    }

    opsState.set(startNode, result);
  }
  return result;
}

function withoutSubnodes(startNodes, commits) {
  const result = new _set2.default(startNodes);
  const nodes = new _set2.default(startNodes);
  for (const node of nodes) {
    const parents = commits.get(node);
    if (parents) {
      for (const parent of parents.keys()) {
        result.delete(parent);
        nodes.add(parent);
      }
    }
  }
  return result;
}

function doMerge(startNodes, otResolver, opsState, commits) {
  if (startNodes.size === 1) {
    return [...startNodes][0];
  }

  if (startNodes.size > 2) {
    for (const node of startNodes) {
      const parents = commits.get(node);
      if (!parents) {
        return null;
      }
      if (parents.size === 1) {
        const submergeNodes = withoutSubnodes((0, _utils.difference)([...startNodes, ...parents.keys()], new _set2.default([node])), commits);
        const submerge = doMerge(submergeNodes, otResolver, opsState, commits);
        if (submerge === null) {
          return null;
        }
        return doMerge(new _set2.default([submerge, node]), otResolver, opsState, commits);
      }
    }

    const [mergeWithNode] = [...startNodes]; // Get first element
    const submerge = doMerge((0, _utils.difference)(startNodes, new _set2.default([mergeWithNode])), otResolver, opsState, commits);
    if (submerge === null) {
      return null;
    }
    return doMerge(new _set2.default([submerge, mergeWithNode]), otResolver, opsState, commits);
  }

  const [leftNode, rightNode] = [...startNodes];

  const parentsLeftNode = commits.get(leftNode);
  const parentsRightNode = commits.get(rightNode);
  if (!parentsRightNode || !parentsLeftNode) {
    return null;
  }

  if (parentsLeftNode.size > 1 && parentsRightNode.size > 1) {
    // Merge & Merge
    const leftNodeOps = getOps(leftNode, opsState, commits);
    const rightNodeOps = getOps(rightNode, opsState, commits);
    const needLeftOps = (0, _utils.difference)(rightNodeOps, leftNodeOps);
    const needRightOps = (0, _utils.difference)(leftNodeOps, rightNodeOps);

    if (needLeftOps.size === 0 && needRightOps.size === 0) {
      // Similar merges
      const newCommitId = {};
      const newCommit = new _map2.default();
      newCommit.set(leftNode, []);
      newCommit.set(rightNode, []);
      commits.set(newCommitId, newCommit);
      return newCommitId;
    }

    if (needLeftOps.size === 0 && needRightOps.size > 0) {
      return doMerge(new _set2.default([rightNode, leftNode]), otResolver, opsState, commits);
    }

    const submerge = doMerge(new _set2.default([leftNode, ...needLeftOps]), otResolver, opsState, commits);
    if (submerge === null) {
      return null;
    }
    return doMerge(new _set2.default([submerge, rightNode]), otResolver, opsState, commits);
  }

  if (parentsLeftNode.size === 1 && parentsRightNode.size > 1) {
    return doMerge(new _set2.default([rightNode, leftNode]), otResolver, opsState, commits);
  }

  // So parentsRightNode.size === 1
  const [parentRightNode, rightOp] = (0, _utils.unwrap)(parentsRightNode.entries().next().value);
  const path = findPathToNode(parentRightNode, leftNode, commits);
  if (path === null) {
    const submerge = doMerge(new _set2.default([leftNode, parentRightNode]), otResolver, opsState, commits);
    if (submerge === null) {
      return null;
    }
    return doMerge(new _set2.default([submerge, rightNode]), otResolver, opsState, commits);
  }

  const transform = otResolver.transform(otResolver.squash(path), rightOp);
  const newCommitId = {};
  const newCommit = new _map2.default();
  newCommit.set(leftNode, transform.leftOps);
  newCommit.set(rightNode, transform.rightOps);
  commits.set(newCommitId, newCommit);
  return newCommitId;
}

function commitsToGraphviz(commits) {
  let text = 'digraph {\n';
  for (const [id, { parents }] of commits) {
    for (const [parentId, diff] of parents) {
      text += `  ${(0, _stringify2.default)(parentId)} -> ${(0, _stringify2.default)(id)}` + `[label="${(0, _stringify2.default)(diff).replace(/"/g, `\\"`)}"]\n`;
    }
  }
  return text + '}';
}