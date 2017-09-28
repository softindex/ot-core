/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *  
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import {unwrap} from "../../common/utils";
import {findParentByPredicate, merge, findCheckpoint, makeCheckpointForCommit} from '../otUtils';
import {OTCommit} from '../OTCommit';
import TestOTRemote from '../../test/TestOTRemote';
import TestAddOp from '../../test/TestAddOp';
import commitIdComparator from '../../test/commitIdComparator';
import testOTResolver from '../../test/testOTResolver';

describe('makeCheckpointForCommit', () => {
  const remote = new TestOTRemote();

  const checkpoint1 = OTCommit.ofCommit('a1', '*', [new TestAddOp(0, 1)]);
  checkpoint1.checkpoint = [new TestAddOp(0, 1)];
  const checkpoint2 = OTCommit.ofCommit('a2', 'a1', [new TestAddOp(1, 2)]);
  checkpoint2.checkpoint = [new TestAddOp(0, 1), new TestAddOp(1, 2)];
  const commits = [
    OTCommit.ofRoot('*'),
    checkpoint1,
    checkpoint2,
    OTCommit.ofCommit('a3', 'a2', [new TestAddOp(3, 1)]),
    OTCommit.ofCommit('b1', 'a1', [new TestAddOp(1, 3)]),
    OTCommit.ofCommit('b2', 'b1', [new TestAddOp(4, 4)]),
    OTCommit.ofCommit('c1', 'b1', [new TestAddOp(4, 5)]),
    OTCommit.ofCommit('c2', 'c1', [new TestAddOp(9, 6)]),
    OTCommit.ofCommit('c3', 'c2', []),
    new OTCommit('z', null, new Map())
  ];

  beforeAll(async () => {
    await remote.push(commits);
  });

  it('Should make checkpoint for node', async () => {
    const checkpoint = await makeCheckpointForCommit(testOTResolver, remote, commitIdComparator, 'a3');
    expect(checkpoint).toEqual([
      new TestAddOp(0, 4)
    ]);
  });

  it('Should throw error if checkpoint not found', async () => {
    let error;
    try {
      await makeCheckpointForCommit(testOTResolver, remote, commitIdComparator, 'z');
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(Error);
    expect(unwrap(error).message).toBe('No checkpoint found for HEAD');
  });
});

describe('findCheckpoint', () => {
  const remote = new TestOTRemote();

  const checkpoint1 = OTCommit.ofCommit('a1', '*', [new TestAddOp(0, 1)]);
  checkpoint1.checkpoint = [new TestAddOp(0, 1)];
  const checkpoint2 = OTCommit.ofCommit('a2', 'a1', [new TestAddOp(1, 2)]);
  checkpoint2.checkpoint = [new TestAddOp(0, 1), new TestAddOp(1, 2)];
  const commits = [
    OTCommit.ofRoot('*'),
    checkpoint1,
    checkpoint2,
    OTCommit.ofCommit('a3', 'a2', [new TestAddOp(3, 1)]),
    OTCommit.ofCommit('b1', 'a1', [new TestAddOp(1, 3)]),
    OTCommit.ofCommit('b2', 'b1', [new TestAddOp(4, 4)]),
    OTCommit.ofCommit('c1', 'b1', [new TestAddOp(4, 5)]),
    OTCommit.ofCommit('c2', 'c1', [new TestAddOp(9, 6)]),
    OTCommit.ofCommit('c3', 'c2', [])
  ];

  beforeAll(async () => {
    await remote.push(commits);
  });

  it('Should find checkpoint for node', async () => {
    const result = unwrap(await findCheckpoint(remote, commitIdComparator, 'c3'));
    expect(result.commit).toBe(checkpoint1);
    expect(result.parentToChild).toEqual([
      new TestAddOp(1, 3),
      new TestAddOp(4, 5),
      new TestAddOp(9, 6)
    ]);
  });

  it('Should find checkpoint for root', async () => {
    const result = unwrap(await findCheckpoint(remote, commitIdComparator, '*'));
    expect(result.commit).toBe(commits[0]);
    expect(result.parentToChild).toEqual([]);
  });

  it('Should find second checkpoint for node', async () => {
    const result = unwrap(await findCheckpoint(remote, commitIdComparator, 'a3'));
    expect(result.commit).toBe(checkpoint2);
    expect(result.parentToChild).toEqual([
      new TestAddOp(3, 1)
    ]);
  });
});

describe('findParentByPredicate', () => {
  const remote = new TestOTRemote();

  const commits = [
    OTCommit.ofRoot('*'),
    OTCommit.ofCommit('a1', '*', [new TestAddOp(0, 1)]),
    OTCommit.ofCommit('a2', 'a1', [new TestAddOp(1, 2)]),
    OTCommit.ofCommit('b1', 'a1', [new TestAddOp(1, 3)]),
    OTCommit.ofCommit('b2', 'b1', [new TestAddOp(4, 4)]),
    OTCommit.ofCommit('c1', 'b1', [new TestAddOp(4, 5)]),
    OTCommit.ofCommit('c2', 'c1', [new TestAddOp(9, 6)]),
    OTCommit.ofCommit('c3', 'c2', [])
  ];

  beforeAll(async () => {
    await remote.push(commits);
  });

  it('Should find root node', async () => {
    const heads = new Set(['a2', 'b2', 'c2']);

    function loadPredicate(commitId: string): boolean {
      return commitIdComparator(commitId, 'b1') <= 0;
    }

    function matchPredicate(commit: OTCommit<string, number>): boolean {
      return commit.id === 'b1';
    }

    const result = unwrap(
      await findParentByPredicate(remote, heads, commitIdComparator, loadPredicate, matchPredicate)
    );

    expect(result.commit).toBe(commits[3]);
    expect(result.parentToChild).toEqual([
      new TestAddOp(4, 5),
      new TestAddOp(9, 6)
    ]);
  });

  it('Should find leaf node', async () => {
    const heads = new Set(['a2', 'b2', 'c3']);

    function loadPredicate(commitId: string): boolean {
      return commitIdComparator(commitId, 'a2') <= 0;
    }

    function matchPredicate(commit: OTCommit<string, number>): boolean {
      return commit.id === 'a2';
    }

    const result = unwrap(
      await findParentByPredicate(remote, heads, commitIdComparator, loadPredicate, matchPredicate)
    );

    expect(result.commit).toBe(commits[2]);
    expect(result.parentToChild).toEqual([]);
  });

  it('Should return null if node not found', async () => {
    const heads = new Set(['a2', 'b2', 'c3']);

    function loadPredicate(commitId: string): boolean {
      return commitIdComparator(commitId, 'x') <= 0;
    }

    function matchPredicate(commit: OTCommit<string, number>): boolean {
      return commit.id === 'x';
    }

    const result = await findParentByPredicate(remote, heads, commitIdComparator, loadPredicate, matchPredicate);

    expect(result).toBe(null);
  });
});

describe('otUtils.merge', () => {
  it('Merge empty set should return empty map', async () => {
    const remote = new TestOTRemote();

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set());

    expect(mergeResult.size).toBe(0);
  });

  /**
   * [B]
   *  |
   *  +1
   *  |
   *  A
   */
  it('Merge one node should return empty merge', async () => {
    const remote = new TestOTRemote();
    await remote.push([
      OTCommit.ofCommit('A', 'B', [new TestAddOp(0, 1)])
    ]);

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set(['B']));

    expect(mergeResult.size).toBe(1);
    expect(mergeResult.get('B')).toEqual([]);
  });

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
  it('Merge already merged line', async () => {
    const remote = new TestOTRemote();
    await remote.push([
      OTCommit.ofCommit('B', 'A', [new TestAddOp(0, 1)]),
      OTCommit.ofCommit('C', 'B', [new TestAddOp(0, 10)]),
    ]);

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set(['A', 'C']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('A')).toEqual([new TestAddOp(0, 11)]);
    expect(mergeResult.get('C')).toEqual([]);
  });

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
  it('Merge V form tree', async () => {
    const remote = new TestOTRemote();
    await remote.push([
      OTCommit.ofCommit('B', 'A', [new TestAddOp(0, 1)]),
      OTCommit.ofCommit('D', 'B', [new TestAddOp(1, 10)]),
      OTCommit.ofCommit('C', 'A', [new TestAddOp(0, 100)]),
      OTCommit.ofCommit('E', 'C', [new TestAddOp(100, 1000)]),
    ]);

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set(['D', 'E']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('D')).toEqual([new TestAddOp(11, 1100)]);
    expect(mergeResult.get('E')).toEqual([new TestAddOp(1100, 11)]);
  });

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
  it('Merge A, B nodes and D, E subnodes', async () => {
    const remote = new TestOTRemote();
    const cParents = new Map();
    cParents.set('A', [new TestAddOp(3, 1)]);
    cParents.set('B', [new TestAddOp(1, 3)]);
    await remote.push([
      OTCommit.ofMerge('C', cParents),
      OTCommit.ofCommit('D', 'B', [new TestAddOp(1, -5)]),
      OTCommit.ofCommit('E', 'C', [new TestAddOp(4, 10)])
    ]);

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set(['A', 'B', 'D', 'E']));

    expect(mergeResult.size).toBe(4);
    expect(mergeResult.get('E')).toEqual([new TestAddOp(14, -5)]);
    expect(mergeResult.get('D')).toEqual([new TestAddOp(-4, 13)]);
    expect(mergeResult.get('A')).toEqual([new TestAddOp(3, 6)]);
    expect(mergeResult.get('B')).toEqual([new TestAddOp(1, 8)]);
  });

  it('Merge triple form tree', async () => {
    const remote = new TestOTRemote();
    await remote.push([
      OTCommit.ofCommit('A', '*', [new TestAddOp(0, 1)]),
      OTCommit.ofCommit('B', '*', [new TestAddOp(0, 10)]),
      OTCommit.ofCommit('C', '*', [new TestAddOp(0, 100)]),
    ]);

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set(['A', 'B', 'C']));

    expect(mergeResult.size).toBe(3);
    expect(mergeResult.get('A')).toEqual([new TestAddOp(1, 110)]);
    expect(mergeResult.get('B')).toEqual([new TestAddOp(10, 101)]);
    expect(mergeResult.get('C')).toEqual([new TestAddOp(100, 11)]);
  });

  /**
   * [C]=4   [D]=11  [E]=40
   *   \     / \     /
   *   +3  +10 +1  +30
   *     \ /     \ /
   *      A=1     B=10
   */
  it('Merge W form graph', async () => {
    const remote = new TestOTRemote();
    const eParents = new Map();
    eParents.set('A', [new TestAddOp(1, 10)]);
    eParents.set('B', [new TestAddOp(10, 1)]);
    await remote.push([
      OTCommit.ofCommit('C', 'A', [new TestAddOp(1, 3)]),
      OTCommit.ofMerge('D', eParents),
      OTCommit.ofCommit('E', 'B', [new TestAddOp(10, 30)])
    ]);

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set(['C', 'D', 'E']));

    expect(mergeResult.size).toBe(3);
    expect(mergeResult.get('C')).toEqual([new TestAddOp(4, 40)]);
    expect(mergeResult.get('D')).toEqual([new TestAddOp(11, 33)]);
    expect(mergeResult.get('E')).toEqual([new TestAddOp(40, 4)]);
  });

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
  it('Merge equal merges of two nodes', async () => {
    const remote = new TestOTRemote();
    const cParents = new Map();
    cParents.set('A', [new TestAddOp(1, 2)]);
    cParents.set('B', [new TestAddOp(2, 1)]);
    const dParents = new Map();
    dParents.set('A', [new TestAddOp(1, 2)]);
    dParents.set('B', [new TestAddOp(2, 1)]);
    await remote.push([
      OTCommit.ofMerge('C', cParents),
      OTCommit.ofMerge('D', dParents)
    ]);

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set(['C', 'D']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('C')).toEqual([]);
    expect(mergeResult.get('D')).toEqual([]);
  });


  it('Merge three equal merges on three nodes', async () => {
    const remote = new TestOTRemote();
    const dParents = new Map();
    dParents.set('A', [new TestAddOp(1, 5)]);
    dParents.set('B', [new TestAddOp(2, 4)]);
    dParents.set('C', [new TestAddOp(3, 3)]);
    const eParents = new Map();
    eParents.set('A', [new TestAddOp(1, 5)]);
    eParents.set('B', [new TestAddOp(2, 4)]);
    eParents.set('C', [new TestAddOp(3, 3)]);
    const fParents = new Map();
    fParents.set('A', [new TestAddOp(1, 5)]);
    fParents.set('B', [new TestAddOp(2, 4)]);
    fParents.set('C', [new TestAddOp(3, 3)]);
    await remote.push([
      OTCommit.ofMerge('D', dParents),
      OTCommit.ofMerge('E', eParents),
      OTCommit.ofMerge('F', eParents)
    ]);

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set(['D', 'E', 'F']));

    expect(mergeResult.size).toBe(3);
    expect(mergeResult.get('D')).toEqual([]);
    expect(mergeResult.get('E')).toEqual([]);
    expect(mergeResult.get('F')).toEqual([]);
  });

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
  it('Merge full merge and submerge', async () => {
    const remote = new TestOTRemote();
    const eParents = new Map();
    eParents.set('B', [new TestAddOp(1, 10)]);
    eParents.set('C', [new TestAddOp(10, 1)]);
    const fParents = new Map();
    fParents.set('B', [new TestAddOp(1, 110)]);
    fParents.set('C', [new TestAddOp(10, 101)]);
    fParents.set('D', [new TestAddOp(100, 11)]);
    await remote.push([
      OTCommit.ofCommit('C', 'A', [new TestAddOp(0, 10)]),
      OTCommit.ofCommit('D', 'A', [new TestAddOp(0, 100)]),
      OTCommit.ofMerge('E', eParents),
      OTCommit.ofMerge('F', fParents)
    ]);

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set(['E', 'F']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('E')).toEqual([new TestAddOp(11, 100)]);
    expect(mergeResult.get('F')).toEqual([]);
  });

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
  it('Merge two submerges', async () => {
    const remote = new TestOTRemote();
    const gParents = new Map();
    gParents.set('C', [new TestAddOp(4, 112)]);
    gParents.set('D', [new TestAddOp(13, 103)]);
    gParents.set('E', [new TestAddOp(102, 14)]);
    const jParents = new Map();
    jParents.set('D', [new TestAddOp(13, 1102)]);
    jParents.set('E', [new TestAddOp(102, 1013)]);
    jParents.set('F', [new TestAddOp(1002, 113)]);
    await remote.push([
      OTCommit.ofCommit('C', 'A', [new TestAddOp(3, 1)]),
      OTCommit.ofCommit('D', 'A', [new TestAddOp(3, 10)]),
      OTCommit.ofCommit('E', 'B', [new TestAddOp(2, 100)]),
      OTCommit.ofCommit('F', 'B', [new TestAddOp(2, 1000)]),
      OTCommit.ofMerge('G', gParents),
      OTCommit.ofMerge('J', jParents)
    ]);

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set(['G', 'J']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('G')).toEqual([new TestAddOp(116, 1000)]);
    expect(mergeResult.get('J')).toEqual([new TestAddOp(1115, 1)]);
  });

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
  it('Merge having equal merges parents', async () => {
    const remote = new TestOTRemote();
    const cParents = new Map();
    cParents.set('A', [new TestAddOp(2, 3)]);
    cParents.set('B', [new TestAddOp(3, 2)]);
    const dParents = new Map();
    dParents.set('A', [new TestAddOp(2, 3)]);
    dParents.set('B', [new TestAddOp(3, 2)]);
    await remote.push([
      OTCommit.ofMerge('C', cParents),
      OTCommit.ofMerge('D', dParents),
      OTCommit.ofCommit('E', 'C', [new TestAddOp(5, 1)]),
      OTCommit.ofCommit('F', 'C', [new TestAddOp(5, 10)]),
      OTCommit.ofCommit('G', 'D', [new TestAddOp(5, 100)])
    ]);

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set(['E', 'F', 'G']));

    expect(mergeResult.size).toBe(3);
    expect(mergeResult.get('E')).toEqual([new TestAddOp(6, 110)]);
    expect(mergeResult.get('F')).toEqual([new TestAddOp(15, 101)]);
    expect(mergeResult.get('G')).toEqual([new TestAddOp(105, 11)]);
  });

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
  it('Merge two submerges', async () => {
    const remote = new TestOTRemote();
    const gParents = new Map();
    gParents.set('C', [new TestAddOp(4, 112)]);
    gParents.set('D', [new TestAddOp(13, 103)]);
    gParents.set('E', [new TestAddOp(102, 14)]);
    const hParents = new Map();
    hParents.set('D', [new TestAddOp(13, 1102)]);
    hParents.set('E', [new TestAddOp(102, 1013)]);
    hParents.set('F', [new TestAddOp(1002, 113)]);
    await remote.push([
      OTCommit.ofCommit('C', 'A', [new TestAddOp(3, 1)]),
      OTCommit.ofCommit('D', 'A', [new TestAddOp(3, 10)]),
      OTCommit.ofCommit('E', 'B', [new TestAddOp(2, 100)]),
      OTCommit.ofCommit('F', 'B', [new TestAddOp(2, 1000)]),
      OTCommit.ofCommit('I', 'G', [new TestAddOp(116, -10)]),
      OTCommit.ofCommit('J', 'H', [new TestAddOp(1115, -100)]),
      OTCommit.ofMerge('G', gParents),
      OTCommit.ofMerge('H', hParents)
    ]);

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set(['I', 'J']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('I')).toEqual([new TestAddOp(106, 900)]);
    expect(mergeResult.get('J')).toEqual([new TestAddOp(1015, -9)]);
  });

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
  it('Merge of merges should check operations', async () => {
    const remote = new TestOTRemote();
    const fParents = new Map();
    fParents.set('C', [new TestAddOp(102, 1)]);
    fParents.set('D', [new TestAddOp(1, 102)]);
    const gParents = new Map();
    gParents.set('D', [new TestAddOp(1, 103)]);
    gParents.set('E', [new TestAddOp(103, 1)]);
    await remote.push([
      OTCommit.ofCommit('D', 'A', [new TestAddOp(0, 1)]),
      OTCommit.ofCommit('B', 'A', [new TestAddOp(0, 100)]),
      OTCommit.ofCommit('C', 'B', [new TestAddOp(100, 2)]),
      OTCommit.ofCommit('E', 'B', [new TestAddOp(100, 3)]),
      OTCommit.ofMerge('F', fParents),
      OTCommit.ofMerge('G', gParents)
    ]);

    const mergeResult = await merge(testOTResolver, remote, commitIdComparator, new Set(['F', 'G']));

    expect(mergeResult.size).toBe(2);
    expect(mergeResult.get('F')).toEqual([new TestAddOp(103, 3)]);
    expect(mergeResult.get('G')).toEqual([new TestAddOp(104, 2)]);
  });

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
  it('Should merge in different order', async () => {
    const remote = new TestOTRemote();
    const eParents = new Map();
    eParents.set('A', [new TestAddOp(1, 10)]);
    eParents.set('B', [new TestAddOp(10, 1)]);
    await remote.push([
      OTCommit.ofCommit('C', 'A', [new TestAddOp(1, 3)]),
      OTCommit.ofMerge('D', eParents),
      OTCommit.ofCommit('E', 'B', [new TestAddOp(10, 30)]),
      OTCommit.ofCommit('F', 'D', [new TestAddOp(11, 5)])
    ]);

    const mergeResult1 = await merge(testOTResolver, remote, commitIdComparator, new Set(['F', 'C', 'E']));
    const mergeResult2 = await merge(testOTResolver, remote, commitIdComparator, new Set(['F', 'E', 'C']));
    const mergeResult3 = await merge(testOTResolver, remote, commitIdComparator, new Set(['E', 'F', 'C']));
    const mergeResult4 = await merge(testOTResolver, remote, commitIdComparator, new Set(['E', 'C', 'F']));
    const mergeResult5 = await merge(testOTResolver, remote, commitIdComparator, new Set(['C', 'E', 'F']));
    const mergeResult6 = await merge(testOTResolver, remote, commitIdComparator, new Set(['C', 'F', 'E']));

    expect(mergeResult1.size).toBe(3);
    expect(mergeResult1.get('C')).toEqual([new TestAddOp(4, 45)]);
    expect(mergeResult1.get('F')).toEqual([new TestAddOp(16, 33)]);
    expect(mergeResult1.get('E')).toEqual([new TestAddOp(40, 9)]);
    expect(mergeResult2).toEqual(mergeResult1);
    expect(mergeResult3).toEqual(mergeResult1);
    expect(mergeResult4).toEqual(mergeResult1);
    expect(mergeResult5).toEqual(mergeResult1);
    expect(mergeResult6).toEqual(mergeResult1);
  });
});
