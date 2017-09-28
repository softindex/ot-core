/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *  
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import {difference} from '../common/utils';
import type {OTRemote} from "../ot/interfaces/OTRemote";
import {OTCommit} from "../ot/OTCommit";

class TestOTRemote<S> implements OTRemote<string, S> {
  _commits: Map<string, OTCommit<string, S>>;
  _parents: Set<string>;
  _lastCheckpointCommitId: string | null;
  _maxId: number;

  constructor() {
    this._commits = new Map();
    this._parents = new Set();
    this._lastCheckpointCommitId = null;
    this._maxId = 0;
  }

  async createId(): Promise<string> {
    return (++this._maxId).toString();
  }

  async push(commits: Array<OTCommit<string, S>>): Promise<void> {
    for (const commit of commits) {
      this._commits.set(commit.id, commit);

      for (const [parentCommitId] of commit.parents) {
        this._parents.add(parentCommitId);
      }

      if (commit.isCheckpoint()) {
        this._lastCheckpointCommitId = commit.id;
      }
    }
  }

  async getHeads(): Promise<Set<string>> {
    return difference(this._commits.keys(), this._parents);
  }

  async getCheckpoint(): Promise<string | null> {
    return this._lastCheckpointCommitId;
  }

  async getCommit(commitId: string): Promise<OTCommit<string, S>> {
    const commit = this._commits.get(commitId);

    if (!commit) {
      throw new Error(`Unknown commit "${commitId}"`);
    }

    return commit;
  }

  addChangeListener() {}
  removeChangeListener() {}
}

export default TestOTRemote;
