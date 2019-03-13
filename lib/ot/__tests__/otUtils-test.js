'use strict';

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _utils = require('../../common/utils');

var _otUtils = require('../otUtils');

var _OTCommit = require('../OTCommit');

var _TestOTRemote = require('../../test/TestOTRemote');

var _TestOTRemote2 = _interopRequireDefault(_TestOTRemote);

var _TestAddOp = require('../../test/TestAddOp');

var _TestAddOp2 = _interopRequireDefault(_TestAddOp);

var _commitIdComparator = require('../../test/commitIdComparator');

var _commitIdComparator2 = _interopRequireDefault(_commitIdComparator);

var _testOTResolver = require('../../test/testOTResolver');

var _testOTResolver2 = _interopRequireDefault(_testOTResolver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('makeCheckpointForCommit', () => {
  const remote = new _TestOTRemote2.default();

  const checkpoint1 = _OTCommit.OTCommit.ofCommit('a1', '*', [new _TestAddOp2.default(0, 1)]);
  checkpoint1.checkpoint = [new _TestAddOp2.default(0, 1)];
  const checkpoint2 = _OTCommit.OTCommit.ofCommit('a2', 'a1', [new _TestAddOp2.default(1, 2)]);
  checkpoint2.checkpoint = [new _TestAddOp2.default(0, 1), new _TestAddOp2.default(1, 2)];
  const commits = [_OTCommit.OTCommit.ofRoot('*'), checkpoint1, checkpoint2, _OTCommit.OTCommit.ofCommit('a3', 'a2', [new _TestAddOp2.default(3, 1)]), _OTCommit.OTCommit.ofCommit('b1', 'a1', [new _TestAddOp2.default(1, 3)]), _OTCommit.OTCommit.ofCommit('b2', 'b1', [new _TestAddOp2.default(4, 4)]), _OTCommit.OTCommit.ofCommit('c1', 'b1', [new _TestAddOp2.default(4, 5)]), _OTCommit.OTCommit.ofCommit('c2', 'c1', [new _TestAddOp2.default(9, 6)]), _OTCommit.OTCommit.ofCommit('c3', 'c2', []), new _OTCommit.OTCommit('z', null, new _map2.default())];

  beforeAll((0, _asyncToGenerator3.default)(function* () {
    yield remote.push(commits);
  }));

  it('Should make checkpoint for node', (0, _asyncToGenerator3.default)(function* () {
    const checkpoint = yield (0, _otUtils.makeCheckpointForCommit)(_testOTResolver2.default, remote, _commitIdComparator2.default, 'a3');
    expect(checkpoint).toEqual([new _TestAddOp2.default(0, 4)]);
  }));

  it('Should throw error if checkpoint not found', (0, _asyncToGenerator3.default)(function* () {
    let error;
    try {
      yield (0, _otUtils.makeCheckpointForCommit)(_testOTResolver2.default, remote, _commitIdComparator2.default, 'z');
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(Error);
    expect((0, _utils.unwrap)(error).message).toBe('No checkpoint found for HEAD');
  }));
}); /*
     * Copyright (с) 2019-present, SoftIndex LLC.
     * All rights reserved.
     *  
     * This source code is licensed under the BSD-style license found in the
     * LICENSE file in the root directory of this source tree.
     */

describe('findCheckpoint', () => {
  const remote = new _TestOTRemote2.default();

  const checkpoint1 = _OTCommit.OTCommit.ofCommit('a1', '*', [new _TestAddOp2.default(0, 1)]);
  checkpoint1.checkpoint = [new _TestAddOp2.default(0, 1)];
  const checkpoint2 = _OTCommit.OTCommit.ofCommit('a2', 'a1', [new _TestAddOp2.default(1, 2)]);
  checkpoint2.checkpoint = [new _TestAddOp2.default(0, 1), new _TestAddOp2.default(1, 2)];
  const commits = [_OTCommit.OTCommit.ofRoot('*'), checkpoint1, checkpoint2, _OTCommit.OTCommit.ofCommit('a3', 'a2', [new _TestAddOp2.default(3, 1)]), _OTCommit.OTCommit.ofCommit('b1', 'a1', [new _TestAddOp2.default(1, 3)]), _OTCommit.OTCommit.ofCommit('b2', 'b1', [new _TestAddOp2.default(4, 4)]), _OTCommit.OTCommit.ofCommit('c1', 'b1', [new _TestAddOp2.default(4, 5)]), _OTCommit.OTCommit.ofCommit('c2', 'c1', [new _TestAddOp2.default(9, 6)]), _OTCommit.OTCommit.ofCommit('c3', 'c2', [])];

  beforeAll((0, _asyncToGenerator3.default)(function* () {
    yield remote.push(commits);
  }));

  it('Should find checkpoint for node', (0, _asyncToGenerator3.default)(function* () {
    const result = (0, _utils.unwrap)((yield (0, _otUtils.findCheckpoint)(remote, _commitIdComparator2.default, 'c3')));
    expect(result.commit).toBe(checkpoint1);
    expect(result.parentToChild).toEqual([new _TestAddOp2.default(1, 3), new _TestAddOp2.default(4, 5), new _TestAddOp2.default(9, 6)]);
  }));

  it('Should find checkpoint for root', (0, _asyncToGenerator3.default)(function* () {
    const result = (0, _utils.unwrap)((yield (0, _otUtils.findCheckpoint)(remote, _commitIdComparator2.default, '*')));
    expect(result.commit).toBe(commits[0]);
    expect(result.parentToChild).toEqual([]);
  }));

  it('Should find second checkpoint for node', (0, _asyncToGenerator3.default)(function* () {
    const result = (0, _utils.unwrap)((yield (0, _otUtils.findCheckpoint)(remote, _commitIdComparator2.default, 'a3')));
    expect(result.commit).toBe(checkpoint2);
    expect(result.parentToChild).toEqual([new _TestAddOp2.default(3, 1)]);
  }));
});

describe('findParentByPredicate', () => {
  const remote = new _TestOTRemote2.default();

  const commits = [_OTCommit.OTCommit.ofRoot('*'), _OTCommit.OTCommit.ofCommit('a1', '*', [new _TestAddOp2.default(0, 1)]), _OTCommit.OTCommit.ofCommit('a2', 'a1', [new _TestAddOp2.default(1, 2)]), _OTCommit.OTCommit.ofCommit('b1', 'a1', [new _TestAddOp2.default(1, 3)]), _OTCommit.OTCommit.ofCommit('b2', 'b1', [new _TestAddOp2.default(4, 4)]), _OTCommit.OTCommit.ofCommit('c1', 'b1', [new _TestAddOp2.default(4, 5)]), _OTCommit.OTCommit.ofCommit('c2', 'c1', [new _TestAddOp2.default(9, 6)]), _OTCommit.OTCommit.ofCommit('c3', 'c2', [])];

  beforeAll((0, _asyncToGenerator3.default)(function* () {
    yield remote.push(commits);
  }));

  it('Should find root node', (0, _asyncToGenerator3.default)(function* () {
    const heads = new _set2.default(['a2', 'b2', 'c2']);

    function loadPredicate(commitId) {
      return (0, _commitIdComparator2.default)(commitId, 'b1') <= 0;
    }

    function matchPredicate(commit) {
      return commit.id === 'b1';
    }

    const result = (0, _utils.unwrap)((yield (0, _otUtils.findParentByPredicate)(remote, heads, _commitIdComparator2.default, loadPredicate, matchPredicate)));

    expect(result.commit).toBe(commits[3]);
    expect(result.parentToChild).toEqual([new _TestAddOp2.default(4, 5), new _TestAddOp2.default(9, 6)]);
  }));

  it('Should find leaf node', (0, _asyncToGenerator3.default)(function* () {
    const heads = new _set2.default(['a2', 'b2', 'c3']);

    function loadPredicate(commitId) {
      return (0, _commitIdComparator2.default)(commitId, 'a2') <= 0;
    }

    function matchPredicate(commit) {
      return commit.id === 'a2';
    }

    const result = (0, _utils.unwrap)((yield (0, _otUtils.findParentByPredicate)(remote, heads, _commitIdComparator2.default, loadPredicate, matchPredicate)));

    expect(result.commit).toBe(commits[2]);
    expect(result.parentToChild).toEqual([]);
  }));

  it('Should return null if node not found', (0, _asyncToGenerator3.default)(function* () {
    const heads = new _set2.default(['a2', 'b2', 'c3']);

    function loadPredicate(commitId) {
      return (0, _commitIdComparator2.default)(commitId, 'x') <= 0;
    }

    function matchPredicate(commit) {
      return commit.id === 'x';
    }

    const result = yield (0, _otUtils.findParentByPredicate)(remote, heads, _commitIdComparator2.default, loadPredicate, matchPredicate);

    expect(result).toBe(null);
  }));
});

describe('otUtils.merge', () => {
  it('Merge empty set should return empty map', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default());

    expect(mergeResult.size).toBe(0);
  }));

  /**
   * [B]
   *  |
   *  +1
   *  |
   *  A
   */
  it('Merge one node should return empty merge', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    yield remote.push([_OTCommit.OTCommit.ofCommit('A', 'B', [new _TestAddOp2.default(0, 1)])]);

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['B']));

    expect(mergeResult.size).toBe(1);
    expect(mergeResult.get('B')).toEqual([]);
  }));

  /**
   * [C]
   *  |
   * +10
   *  |
   *  B
   *  |
   *  +1
   *  |
   * [A]
   */
  it('Merge already merged line', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    yield remote.push([_OTCommit.OTCommit.ofCommit('B', 'A', [new _TestAddOp2.default(0, 1)]), _OTCommit.OTCommit.ofCommit('C', 'B', [new _TestAddOp2.default(0, 10)])]);

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['A', 'C']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('A')).toEqual([new _TestAddOp2.default(0, 11)]);
    expect(mergeResult.get('C')).toEqual([]);
  }));

  /**
   * [D]=11          [E]=1100
   *   \             /
   *   +10        +1000
   *     \         /
   *      B=1     C=100
   *       \     /
   *       +1  +100
   *         \ /
   *          A=0
   */
  it('Merge V form tree', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    yield remote.push([_OTCommit.OTCommit.ofCommit('B', 'A', [new _TestAddOp2.default(0, 1)]), _OTCommit.OTCommit.ofCommit('D', 'B', [new _TestAddOp2.default(1, 10)]), _OTCommit.OTCommit.ofCommit('C', 'A', [new _TestAddOp2.default(0, 100)]), _OTCommit.OTCommit.ofCommit('E', 'C', [new _TestAddOp2.default(100, 1000)])]);

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['D', 'E']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('D')).toEqual([new _TestAddOp2.default(11, 1100)]);
    expect(mergeResult.get('E')).toEqual([new _TestAddOp2.default(1100, 11)]);
  }));

  /**
   *     [E]=14
   *      |
   *     +10
   *      |
   *      C=4    [D]=-4
   *     / \     /
   *   +1  +3  -5
   *   /     \ /
   * [A]=3   [B]=1
   */
  it('Merge A, B nodes and D, E subnodes', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    const cParents = new _map2.default();
    cParents.set('A', [new _TestAddOp2.default(3, 1)]);
    cParents.set('B', [new _TestAddOp2.default(1, 3)]);
    yield remote.push([_OTCommit.OTCommit.ofMerge('C', cParents), _OTCommit.OTCommit.ofCommit('D', 'B', [new _TestAddOp2.default(1, -5)]), _OTCommit.OTCommit.ofCommit('E', 'C', [new _TestAddOp2.default(4, 10)])]);

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['A', 'B', 'D', 'E']));

    expect(mergeResult.size).toBe(4);
    expect(mergeResult.get('E')).toEqual([new _TestAddOp2.default(14, -5)]);
    expect(mergeResult.get('D')).toEqual([new _TestAddOp2.default(-4, 13)]);
    expect(mergeResult.get('A')).toEqual([new _TestAddOp2.default(3, 6)]);
    expect(mergeResult.get('B')).toEqual([new _TestAddOp2.default(1, 8)]);
  }));

  it('Merge triple form tree', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    yield remote.push([_OTCommit.OTCommit.ofCommit('A', '*', [new _TestAddOp2.default(0, 1)]), _OTCommit.OTCommit.ofCommit('B', '*', [new _TestAddOp2.default(0, 10)]), _OTCommit.OTCommit.ofCommit('C', '*', [new _TestAddOp2.default(0, 100)])]);

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['A', 'B', 'C']));

    expect(mergeResult.size).toBe(3);
    expect(mergeResult.get('A')).toEqual([new _TestAddOp2.default(1, 110)]);
    expect(mergeResult.get('B')).toEqual([new _TestAddOp2.default(10, 101)]);
    expect(mergeResult.get('C')).toEqual([new _TestAddOp2.default(100, 11)]);
  }));

  /**
   * [C]=4   [D]=11  [E]=40
   *   \     / \     /
   *   +3  +10 +1  +30
   *     \ /     \ /
   *      A=1     B=10
   */
  it('Merge W form graph', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    const eParents = new _map2.default();
    eParents.set('A', [new _TestAddOp2.default(1, 10)]);
    eParents.set('B', [new _TestAddOp2.default(10, 1)]);
    yield remote.push([_OTCommit.OTCommit.ofCommit('C', 'A', [new _TestAddOp2.default(1, 3)]), _OTCommit.OTCommit.ofMerge('D', eParents), _OTCommit.OTCommit.ofCommit('E', 'B', [new _TestAddOp2.default(10, 30)])]);

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['C', 'D', 'E']));

    expect(mergeResult.size).toBe(3);
    expect(mergeResult.get('C')).toEqual([new _TestAddOp2.default(4, 40)]);
    expect(mergeResult.get('D')).toEqual([new _TestAddOp2.default(11, 33)]);
    expect(mergeResult.get('E')).toEqual([new _TestAddOp2.default(40, 4)]);
  }));

  /**
   * [C]=3   [D]=3
   *  |\     /|
   *  | +1 +2 |
   *  |  \ /  |
   * +2   X  +1
   *  |  / \  |
   *  | /   \ |
   *  |/     \|
   *  A=1    B=2
   */
  it('Merge equal merges of two nodes', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    const cParents = new _map2.default();
    cParents.set('A', [new _TestAddOp2.default(1, 2)]);
    cParents.set('B', [new _TestAddOp2.default(2, 1)]);
    const dParents = new _map2.default();
    dParents.set('A', [new _TestAddOp2.default(1, 2)]);
    dParents.set('B', [new _TestAddOp2.default(2, 1)]);
    yield remote.push([_OTCommit.OTCommit.ofMerge('C', cParents), _OTCommit.OTCommit.ofMerge('D', dParents)]);

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['C', 'D']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('C')).toEqual([]);
    expect(mergeResult.get('D')).toEqual([]);
  }));

  it('Merge three equal merges on three nodes', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    const dParents = new _map2.default();
    dParents.set('A', [new _TestAddOp2.default(1, 5)]);
    dParents.set('B', [new _TestAddOp2.default(2, 4)]);
    dParents.set('C', [new _TestAddOp2.default(3, 3)]);
    const eParents = new _map2.default();
    eParents.set('A', [new _TestAddOp2.default(1, 5)]);
    eParents.set('B', [new _TestAddOp2.default(2, 4)]);
    eParents.set('C', [new _TestAddOp2.default(3, 3)]);
    const fParents = new _map2.default();
    fParents.set('A', [new _TestAddOp2.default(1, 5)]);
    fParents.set('B', [new _TestAddOp2.default(2, 4)]);
    fParents.set('C', [new _TestAddOp2.default(3, 3)]);
    yield remote.push([_OTCommit.OTCommit.ofMerge('D', dParents), _OTCommit.OTCommit.ofMerge('E', eParents), _OTCommit.OTCommit.ofMerge('F', eParents)]);

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['D', 'E', 'F']));

    expect(mergeResult.size).toBe(3);
    expect(mergeResult.get('D')).toEqual([]);
    expect(mergeResult.get('E')).toEqual([]);
    expect(mergeResult.get('F')).toEqual([]);
  }));

  /**
   * [E]=11    [F]=111
   *  |\       /|\
   *  | \   +10 | \
   *  |  +1  /  |  \
   *  |   \ /   |   \
   * +10   X  +101   \
   *  |   / \   |    +11
   *  |  /   \  |      \
   *  | /     \ |       \
   *  |/       \|        \
   *  B=1       C=10      D=100
   *            |        /
   *            |       /
   *            |      /
   *           +10    /
   *            |  +100
   *            |   /
   *            |  /
   *            | /
   *            |/
   *            A=0
   */
  it('Merge full merge and submerge', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    const eParents = new _map2.default();
    eParents.set('B', [new _TestAddOp2.default(1, 10)]);
    eParents.set('C', [new _TestAddOp2.default(10, 1)]);
    const fParents = new _map2.default();
    fParents.set('B', [new _TestAddOp2.default(1, 110)]);
    fParents.set('C', [new _TestAddOp2.default(10, 101)]);
    fParents.set('D', [new _TestAddOp2.default(100, 11)]);
    yield remote.push([_OTCommit.OTCommit.ofCommit('C', 'A', [new _TestAddOp2.default(0, 10)]), _OTCommit.OTCommit.ofCommit('D', 'A', [new _TestAddOp2.default(0, 100)]), _OTCommit.OTCommit.ofMerge('E', eParents), _OTCommit.OTCommit.ofMerge('F', fParents)]);

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['E', 'F']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('E')).toEqual([new _TestAddOp2.default(11, 100)]);
    expect(mergeResult.get('F')).toEqual([]);
  }));

  /**
   *            [G]=116     [J]=1115
   *            /|\         /|\
   *           / | \   +1102 | \
   *          /  | +14    /  |  \
   *         /   |   \   /   |   \
   *        /    |    \ /    |    \
   *       /   +103    X  +1013    \
   *      /      |    / \    |      \
   *   +112      |   /   \   |      +113
   *    /        |  /     \  |        \
   *   /         | /       \ |         \
   *  /          |/         \|          \
   * C=4         D=13        E=102       F=1002
   *  \         /             \         /
   *   \       /               \       /
   *   +1    +10              +100  +1000
   *     \   /                   \   /
   *      \ /                     \ /
   *       A=3                     B=2
   */
  it('Merge two submerges', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    const gParents = new _map2.default();
    gParents.set('C', [new _TestAddOp2.default(4, 112)]);
    gParents.set('D', [new _TestAddOp2.default(13, 103)]);
    gParents.set('E', [new _TestAddOp2.default(102, 14)]);
    const jParents = new _map2.default();
    jParents.set('D', [new _TestAddOp2.default(13, 1102)]);
    jParents.set('E', [new _TestAddOp2.default(102, 1013)]);
    jParents.set('F', [new _TestAddOp2.default(1002, 113)]);
    yield remote.push([_OTCommit.OTCommit.ofCommit('C', 'A', [new _TestAddOp2.default(3, 1)]), _OTCommit.OTCommit.ofCommit('D', 'A', [new _TestAddOp2.default(3, 10)]), _OTCommit.OTCommit.ofCommit('E', 'B', [new _TestAddOp2.default(2, 100)]), _OTCommit.OTCommit.ofCommit('F', 'B', [new _TestAddOp2.default(2, 1000)]), _OTCommit.OTCommit.ofMerge('G', gParents), _OTCommit.OTCommit.ofMerge('J', jParents)]);

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['G', 'J']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('G')).toEqual([new _TestAddOp2.default(116, 1000)]);
    expect(mergeResult.get('J')).toEqual([new _TestAddOp2.default(1115, 1)]);
  }));

  /**
   * [E]=6   [F]=15  [G]=105
   *   \     /       /
   *   +1  +10    +100
   *     \ /       /
   *      C=5     D=5
   *      |\     /|
   *      | +2  / |
   *      |  \ /  |
   *     +3   X  +2
   *      |  / \  |
   *      | /  +3 |
   *      |/     \|
   *      A=2     B=3
   */
  it('Merge having equal merges parents', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    const cParents = new _map2.default();
    cParents.set('A', [new _TestAddOp2.default(2, 3)]);
    cParents.set('B', [new _TestAddOp2.default(3, 2)]);
    const dParents = new _map2.default();
    dParents.set('A', [new _TestAddOp2.default(2, 3)]);
    dParents.set('B', [new _TestAddOp2.default(3, 2)]);
    yield remote.push([_OTCommit.OTCommit.ofMerge('C', cParents), _OTCommit.OTCommit.ofMerge('D', dParents), _OTCommit.OTCommit.ofCommit('E', 'C', [new _TestAddOp2.default(5, 1)]), _OTCommit.OTCommit.ofCommit('F', 'C', [new _TestAddOp2.default(5, 10)]), _OTCommit.OTCommit.ofCommit('G', 'D', [new _TestAddOp2.default(5, 100)])]);

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['E', 'F', 'G']));

    expect(mergeResult.size).toBe(3);
    expect(mergeResult.get('E')).toEqual([new _TestAddOp2.default(6, 110)]);
    expect(mergeResult.get('F')).toEqual([new _TestAddOp2.default(15, 101)]);
    expect(mergeResult.get('G')).toEqual([new _TestAddOp2.default(105, 11)]);
  }));

  /**
   *            [I]=106     [J]=1015
   *             |           |
   *            -10        -100
   *             |           |
   *             G=116       H=1115
   *            /|\         /|\
   *           / | \   +1102 | \
   *          /  | +14    /  |  \
   *         /   |   \   /   |   \
   *        /    |    \ /    |    \
   *       /   +103    X  +1013    \
   *      /      |    / \    |      \
   *   +112      |   /   \   |      +113
   *    /        |  /     \  |        \
   *   /         | /       \ |         \
   *  /          |/         \|          \
   * C=4         D=13        E=102       F=1002
   *  \         /             \         /
   *   \       /               \       /
   *   +1    +10              +100  +1000
   *     \   /                   \   /
   *      \ /                     \ /
   *       A=3                     B=2
   */
  it('Merge two submerges', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    const gParents = new _map2.default();
    gParents.set('C', [new _TestAddOp2.default(4, 112)]);
    gParents.set('D', [new _TestAddOp2.default(13, 103)]);
    gParents.set('E', [new _TestAddOp2.default(102, 14)]);
    const hParents = new _map2.default();
    hParents.set('D', [new _TestAddOp2.default(13, 1102)]);
    hParents.set('E', [new _TestAddOp2.default(102, 1013)]);
    hParents.set('F', [new _TestAddOp2.default(1002, 113)]);
    yield remote.push([_OTCommit.OTCommit.ofCommit('C', 'A', [new _TestAddOp2.default(3, 1)]), _OTCommit.OTCommit.ofCommit('D', 'A', [new _TestAddOp2.default(3, 10)]), _OTCommit.OTCommit.ofCommit('E', 'B', [new _TestAddOp2.default(2, 100)]), _OTCommit.OTCommit.ofCommit('F', 'B', [new _TestAddOp2.default(2, 1000)]), _OTCommit.OTCommit.ofCommit('I', 'G', [new _TestAddOp2.default(116, -10)]), _OTCommit.OTCommit.ofCommit('J', 'H', [new _TestAddOp2.default(1115, -100)]), _OTCommit.OTCommit.ofMerge('G', gParents), _OTCommit.OTCommit.ofMerge('H', hParents)]);

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['I', 'J']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('I')).toEqual([new _TestAddOp2.default(106, 900)]);
    expect(mergeResult.get('J')).toEqual([new _TestAddOp2.default(1015, -9)]);
  }));

  /**
   *      [F]=103     [G]=104
   *      / \         / \
   *     /   \       /   \
   *   +1   +102  +103   +1
   *   /       \   /       \
   *  /         \ /         \
   * C=102       D=1         E=103
   *  \          |           |
   *   \         |           |
   *    \        |           |
   *     \       |           |
   *      \      |           |
   *      +2     |           |
   *        \    |           |
   *         \   |           |
   *          \  |           |
   *           \ |           |
   *            \|           |
   *             |           +3
   *             |\          |
   *             | \         |
   *             |  \        |
   *             |   \       |
   *             |    \      |
   *             |     \     |
   *             |      \    |
   *             |       \   |
   *             |        \  |
   *             |         \ |
   *             |          \|
   *             +1          B=100
   *             |          /
   *             |         /
   *             |        /
   *             |       /
   *             |      /
   *             |     /
   *             |    /
   *             |  +100
   *             |  /
   *             | /
   *             |/
   *             A=0
   */
  it('Merge of merges should check operations', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    const fParents = new _map2.default();
    fParents.set('C', [new _TestAddOp2.default(102, 1)]);
    fParents.set('D', [new _TestAddOp2.default(1, 102)]);
    const gParents = new _map2.default();
    gParents.set('D', [new _TestAddOp2.default(1, 103)]);
    gParents.set('E', [new _TestAddOp2.default(103, 1)]);
    yield remote.push([_OTCommit.OTCommit.ofCommit('D', 'A', [new _TestAddOp2.default(0, 1)]), _OTCommit.OTCommit.ofCommit('B', 'A', [new _TestAddOp2.default(0, 100)]), _OTCommit.OTCommit.ofCommit('C', 'B', [new _TestAddOp2.default(100, 2)]), _OTCommit.OTCommit.ofCommit('E', 'B', [new _TestAddOp2.default(100, 3)]), _OTCommit.OTCommit.ofMerge('F', fParents), _OTCommit.OTCommit.ofMerge('G', gParents)]);

    const mergeResult = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['F', 'G']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('F')).toEqual([new _TestAddOp2.default(103, 3)]);
    expect(mergeResult.get('G')).toEqual([new _TestAddOp2.default(104, 2)]);
  }));

  /**
   *         [F]=16
   *          |
   *          +5
   *          |
   * [C]=4    D=11  [E]=40
   *   \     / \     /
   *   +3  +10 +1  +30
   *     \ /     \ /
   *      A=1     B=10
   */
  it('Should merge in different order', (0, _asyncToGenerator3.default)(function* () {
    const remote = new _TestOTRemote2.default();
    const eParents = new _map2.default();
    eParents.set('A', [new _TestAddOp2.default(1, 10)]);
    eParents.set('B', [new _TestAddOp2.default(10, 1)]);
    yield remote.push([_OTCommit.OTCommit.ofCommit('C', 'A', [new _TestAddOp2.default(1, 3)]), _OTCommit.OTCommit.ofMerge('D', eParents), _OTCommit.OTCommit.ofCommit('E', 'B', [new _TestAddOp2.default(10, 30)]), _OTCommit.OTCommit.ofCommit('F', 'D', [new _TestAddOp2.default(11, 5)])]);

    const mergeResult1 = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['F', 'C', 'E']));
    const mergeResult2 = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['F', 'E', 'C']));
    const mergeResult3 = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['E', 'F', 'C']));
    const mergeResult4 = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['E', 'C', 'F']));
    const mergeResult5 = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['C', 'E', 'F']));
    const mergeResult6 = yield (0, _otUtils.merge)(_testOTResolver2.default, remote, _commitIdComparator2.default, new _set2.default(['C', 'F', 'E']));

    expect(mergeResult1.size).toBe(3);
    expect(mergeResult1.get('C')).toEqual([new _TestAddOp2.default(4, 45)]);
    expect(mergeResult1.get('F')).toEqual([new _TestAddOp2.default(16, 33)]);
    expect(mergeResult1.get('E')).toEqual([new _TestAddOp2.default(40, 9)]);
    expect(mergeResult2).toEqual(mergeResult1);
    expect(mergeResult3).toEqual(mergeResult1);
    expect(mergeResult4).toEqual(mergeResult1);
    expect(mergeResult5).toEqual(mergeResult1);
    expect(mergeResult6).toEqual(mergeResult1);
  }));
});