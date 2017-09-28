/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import assert from 'assert';

import type OTSystem from "./OTSystem/OTSystem";
import type {OTOperation} from "./interfaces/OTOperation";
import type {OTNode} from "./interfaces/OTNode";

type provider<T> = () => T;

export class OTStateManager<TKey, TState> {
  _initState: provider<TState>;
  _otNode: OTNode<TKey, TState>;
  _otSystem: OTSystem<TState>;

  _state: TState;
  _revision: TKey | null;
  _level: number | null;
  _workingOperations: Array<OTOperation<TState>>;
  _pendingCommit: Blob | null;
  _pendingCommitOperations: Array<OTOperation<TState>>;
  _syncing: boolean;

  constructor(
    initState: provider<TState>,
    node: OTNode<TKey, TState>,
    otSystem: OTSystem<TState>
  ) {
    this._initState = initState;
    this._otNode = node;
    this._otSystem = otSystem;

    this._invalidateInternalState();
    this._syncing = false;
  }

  addChangeListener(listener: () => void): void {
    this._otNode.addChangeListener(listener);
  }

  removeChangeListener(listener: () => void): void {
    this._otNode.removeChangeListener(listener);
  }

  getState(): TState {
    return this._state;
  }

  async checkout() {
    if (this._revision !== null) {
      return;
    }

    const {diffs, revision, level} = await this._otNode.checkout();
    this._apply(diffs);
    this._revision = revision;
    this._level = level;
  }

  async sync(): Promise<void> {
    assert(this._revision !== null, 'Checkout has not been called');
    assert(!this._syncing, 'You can use run only one sync at time');

    this._syncing = true;

    try {
      if (this._pendingCommit === null) {
        await this._pull();
      } else {
        await this._push();
      }

      if (this._workingOperations.length) {
        await this._commit();
        await this._push();
      }
    } finally {
      this._syncing = false;
    }
  }

  reset(): void {
    const operations = [
      ...this._pendingCommitOperations,
      ...this._workingOperations
    ];

    this._apply(this._otSystem.invert(operations));

    this._workingOperations = [];
    this._pendingCommitOperations = [];
    this._pendingCommit = null;
  }

  add(operations: Array<OTOperation<TState>>): void {
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
  }

  getRevision() {
    return this._revision;
  }

  async _pull(): Promise<void> {
    if (this._revision === null) {
      throw new Error('Need to call "checkout" first');
    }

    const {diffs, revision, level} = await this._otNode.fetch(this._revision);

    const transformed = this._otSystem.transform(
      this._otSystem.squash(this._workingOperations),
      this._otSystem.squash(diffs)
    );

    this._apply(transformed.leftOps);

    this._workingOperations = transformed.rightOps;
    this._revision = revision;
    this._level = level;
  }

  async _commit(): Promise<void> {
    if (this._pendingCommit !== null) {
      throw new Error('Need to call "_push" first');
    }

    const workingOperations = [...this._workingOperations];
    const diffs = this._otSystem.squash(this._workingOperations);

    if (this._revision === null) {
      throw new Error('Need to call "checkout" first');
    }

    this._pendingCommit = await this._otNode.createCommit(
      this._revision,
      diffs,
      this._level + 1
    );
    this._pendingCommitOperations = workingOperations;
    this._workingOperations = this._workingOperations.slice(workingOperations.length);
  }

  async _push(): Promise<void> {
    if (this._level === null) {
      throw new Error('Need to call "checkout" first');
    }
    if (this._pendingCommit === null) {
      throw new Error('Need to call "_commit" first');
    }

    const level = this._level;

    this._revision = await this._otNode.push(this._pendingCommit);
    this._pendingCommit = null;
    this._level = level + 1;
  }

  _apply(operations: Array<OTOperation<TState>>): void {
    try {
      for (const op of operations) {
        this._state = op.apply(this._state);
      }
    } catch (e) {
      this._invalidateInternalState();
      throw e;
    }
  }

  _invalidateInternalState(): void {
    this._level = null;
    this._revision = null;
    this._workingOperations = [];
    this._pendingCommitOperations = [];
    this._pendingCommit = null;
    this._state = this._initState();
  }
}
