/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import Queue from 'tinyqueue';
import type {OTRemote} from "./interfaces/OTRemote";
import {OTCommit} from "./OTCommit";
import type {OTOperation} from "./interfaces/OTOperation";
import OTSystemImpl from "./OTSystem/OTSystemImpl";
import {unwrap, difference} from '../common/utils';

type comparator<T> = (T, T) => number;
type predicate<T> = (T) => boolean;
type queueEntry<K, S> = {
  commitId: K,
  commit: ?OTCommit<K, S>,
  parentToChild: Array<OTOperation<S>>
};
export type findResult<K, S> = {
  childCommitId: K,
  commit: OTCommit<K, S>,
  parentToChild: Array<OTOperation<S>>
} | null;

export async function makeCheckpointForCommit<K, S>(otResolver: OTSystemImpl<S>,
                                                    remote: OTRemote<K, S>,
                                                    commitIdComparator: comparator<K>,
                                                    commitId: K): Promise<Array<OTOperation<S>>> {
  const prevCheckpointFindResult = await findCheckpoint(remote, commitIdComparator, commitId);
  if (!prevCheckpointFindResult) {
    throw new Error('No checkpoint found for HEAD');
  }

  return otResolver.squash([
    ...unwrap(prevCheckpointFindResult.commit.checkpoint), // Special found commit with checkpoint
    ...prevCheckpointFindResult.parentToChild
  ]);
}

export async function findCheckpoint<K, S>(remote: OTRemote<K, S>,
                                           commitIdComparator: comparator<K>,
                                           fromCommitId: K): Promise<findResult<K, S>> {
  return await findParentByPredicate(
    remote,
    new Set([fromCommitId]),
    commitIdComparator,
    commitId => commitIdComparator(fromCommitId, commitId) <= 0,
    commit => commit.isCheckpoint()
  );
}

export async function findParentByCommitId<K, S>(remote: OTRemote<K, S>,
                                                 startCommitIds: Set<K>,
                                                 commitIdComparator: comparator<K>,
                                                 targetCommitId: K): Promise<findResult<K, S>> {
  function loadPredicate(commitId: K): boolean {
    return commitIdComparator(commitId, targetCommitId) <= 0
  }

  function matchPredicate(commit: OTCommit<K, S>): boolean {
    return commit.id === targetCommitId;
  }

  return await findParentByPredicate(remote, startCommitIds, commitIdComparator, loadPredicate, matchPredicate);
}

export async function findParentByPredicate<K, S>(remote: OTRemote<K, S>,
                                                  startCommitIds: Set<K>,
                                                  commitIdComparator: comparator<K>,
                                                  loadPredicate: predicate<K>,
                                                  matchPredicate: predicate<OTCommit<K, S>>): Promise<findResult<K, S>> {
  const queue: Queue<queueEntry<K, S>> = new Queue([...startCommitIds].map(commitId => {
    return {
      commitId,
      commit: null,
      parentToChild: []
    };
  }), (a, b) => {
    return commitIdComparator(a.commitId, b.commitId);
  });

  const visited = new Set();
  const found = new Set();

  while (queue.length) {
    const node = unwrap(queue.pop()); // Checked queue.length
    const commitId = node.commitId;

    visited.add(commitId);

    const commit = node.commit || await remote.getCommit(commitId);
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

        const parentCommit = await remote.getCommit(parentCommitId);
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
}

type commits<S> = Map<$FlowFixMe, Map<$FlowFixMe, Array<OTOperation<S>>>>;

function findPathToNode<S>(parentNode: $FlowFixMe,
                           childNode: $FlowFixMe | {},
                           commits: commits<S>,
                           visited: Set<$FlowFixMe> = new Set()): Array<OTOperation<S>> | null {
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

function getOps<S>(startNode: $FlowFixMe,
                   opsState: Map<$FlowFixMe, Set<$FlowFixMe>>,
                   commits: commits<S>): Set<$FlowFixMe> {
  let result = opsState.get(startNode);
  if (result === undefined) {
    const parents = commits.get(startNode);
    if (!parents || parents.size === 0) {
      return new Set([startNode]);
    }

    result = new Set(parents.size === 1 ? [startNode] : []);
    for (const parent of parents.keys()) {
      [...getOps(parent, opsState, commits)]
        .forEach(op => unwrap(result).add(op));
    }

    opsState.set(startNode, result);
  }
  return result;
}

function withoutSubnodes<S>(startNodes: Set<$FlowFixMe>,
                            commits: commits<S>): Set<$FlowFixMe> {
  const result = new Set(startNodes);
  const nodes = new Set(startNodes);
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

function doMerge<S>(startNodes: Set<$FlowFixMe>,
                    otResolver: OTSystemImpl<S>,
                    opsState: Map<$FlowFixMe, Set<$FlowFixMe>>,
                    commits: commits<S>): $FlowFixMe | null {
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
        const submergeNodes = withoutSubnodes(difference([...startNodes, ...parents.keys()], new Set([node])), commits);
        const submerge = doMerge(submergeNodes, otResolver, opsState, commits);
        if (submerge === null) {
          return null;
        }
        return doMerge(new Set([submerge, node]), otResolver, opsState, commits);
      }
    }

    const [mergeWithNode] = [...startNodes]; // Get first element
    const submerge = doMerge(difference(startNodes, new Set([mergeWithNode])), otResolver, opsState, commits);
    if (submerge === null) {
      return null;
    }
    return doMerge(new Set([submerge, mergeWithNode]), otResolver, opsState, commits);
  }

  const [leftNode, rightNode] = [...startNodes];

  const parentsLeftNode = commits.get(leftNode);
  const parentsRightNode = commits.get(rightNode);
  if (!parentsRightNode || !parentsLeftNode) {
    return null;
  }

  if (parentsLeftNode.size > 1 && parentsRightNode.size > 1) { // Merge & Merge
    const leftNodeOps = getOps(leftNode, opsState, commits);
    const rightNodeOps = getOps(rightNode, opsState, commits);
    const needLeftOps = difference(rightNodeOps, leftNodeOps);
    const needRightOps = difference(leftNodeOps, rightNodeOps);

    if (needLeftOps.size === 0 && needRightOps.size === 0) { // Similar merges
      const newCommitId = {};
      const newCommit = new Map();
      newCommit.set(leftNode, []);
      newCommit.set(rightNode, []);
      commits.set(newCommitId, newCommit);
      return newCommitId;
    }

    if (needLeftOps.size === 0 && needRightOps.size > 0) {
      return doMerge(new Set([rightNode, leftNode]), otResolver, opsState, commits);
    }

    const submerge = doMerge(new Set([leftNode, ...needLeftOps]), otResolver, opsState, commits);
    if (submerge === null) {
      return null;
    }
    return doMerge(new Set([submerge, rightNode]), otResolver, opsState, commits);
  }

  if (parentsLeftNode.size === 1 && parentsRightNode.size > 1) {
    return doMerge(new Set([rightNode, leftNode]), otResolver, opsState, commits);
  }

  // So parentsRightNode.size === 1
  const [parentRightNode, rightOp] = unwrap(parentsRightNode.entries().next().value);
  const path = findPathToNode(parentRightNode, leftNode, commits);
  if (path === null) {
    const submerge = doMerge(new Set([leftNode, parentRightNode]), otResolver, opsState, commits);
    if (submerge === null) {
      return null;
    }
    return doMerge(new Set([submerge, rightNode]), otResolver, opsState, commits);
  }

  const transform = otResolver.transform(otResolver.squash(path), rightOp);
  const newCommitId = {};
  const newCommit = new Map();
  newCommit.set(leftNode, transform.leftOps);
  newCommit.set(rightNode, transform.rightOps);
  commits.set(newCommitId, newCommit);
  return newCommitId;
}

export async function merge<K, S>(otResolver: OTSystemImpl<S>,
                                  otRemote: OTRemote<K, S>,
                                  commitIdComparator: comparator<K>,
                                  startNodes: Set<K>): Promise<Map<K, Array<OTOperation<S>>>> {
  if (startNodes.size === 0) {
    return new Map();
  }

  const loadCommitQueue = new Queue([...startNodes], commitIdComparator);
  const commits = new Map();
  const visited = new Set();

  let nodes = startNodes;
  let mergeResult = doMerge(nodes, otResolver, new Map(), commits);
  while (mergeResult === null) {
    const commitId = loadCommitQueue.pop();
    if (commitId === undefined) {
      throw new Error(`Can't merge. Root not found in remote`);
    }

    const commit = await otRemote.getCommit(commitId);
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

    mergeResult = doMerge(nodes, otResolver, new Map(), commits);
  }

  const result = new Map();
  for (const startNode of startNodes) {
    const pathToNode = unwrap(findPathToNode(startNode, mergeResult, commits));
    result.set(startNode, otResolver.squash(pathToNode));
  }
  return result;
}

export function commitsToGraphviz<K, S>(commits: Map<K, OTCommit<K, S>>): string {
  let text = 'digraph {\n';
  for (const [id, {parents}] of commits) {
    for (const [parentId, diff] of parents) {
      text += `  ${JSON.stringify(parentId)} -> ${JSON.stringify(id)}` +
        `[label="${JSON.stringify(diff).replace(/"/g, `\\"`)}"]\n`;
    }
  }
  return text + '}';
}
