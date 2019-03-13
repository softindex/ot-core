/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import assert from 'assert';
import EventEmitter from 'events';
import {serial} from '../common/utils';

import type OTSystem from "./OTSystem/OTSystem";
import type {OTOperation} from "./interfaces/OTOperation";
import type {OTNode, fetchData} from "./interfaces/OTNode";

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
  _eventEmitter: EventEmitter = new EventEmitter();
  _poll: Promise<void> | null = null;

  constructor(
    initState: provider<TState>,
    node: OTNode<TKey, TState>,
    otSystem: OTSystem<TState>
  ) {
    this._initState = initState;
    this._otNode = node;
    this._otSystem = otSystem;

    this._invalidateInternalState();
  }

  getState(): TState {
    return this._state;
  }

  getRevision(): TKey | null {
    return this._revision;
  }

  addChangeListener(listener: TState => void): void {
    this._eventEmitter.addListener('change', listener);

    if (this._revision !== null) {
      this._startPolling();
    }
  }

  removeChangeListener(listener: TState => void): void {
    this._eventEmitter.removeListener('change', listener);
  }

  async checkout() {
    // Ignore if already initialized
    if (this._revision !== null) {
      return;
    }

    const {diffs, revision, level} = await this._otNode.checkout();

    // Fix for two parallel checkout calling
    if (this._revision !== null) {
      return;
    }

    this._apply(diffs);
    this._revision = revision;
    this._level = level;

    this._startPolling();
  }

  sync = serial(async (): Promise<void> => {
    assert(this._revision !== null, 'Checkout has not been called');

    if (this._pendingCommit === null) {
      await this._pull(commitId => this._otNode.fetch(commitId));
    } else {
      await this._push();
    }

    if (this._workingOperations.length) {
      await this._commit();
      await this._push();
    }
  });

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

    this._eventEmitter.emit('change', this._state);
  }

  async _pull(
    fetchFunction: TKey => Promise<fetchData<TKey, TState>>
  ): Promise<void> {
    if (this._revision === null) {
      throw new Error('Need to call "checkout" first');
    }

    const prevRevision = this._revision;
    const fetchData = await fetchFunction(this._revision);

    if (prevRevision !== this._revision) {
      return;
    }

    this._applyFetchData(fetchData);
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
    this._workingOperations = this._workingOperations.slice(workingOperations.length);
  }

  async _push(): Promise<void> {
    if (this._level === null) {
      throw new Error('Need to call "checkout" first');
    }
    if (this._pendingCommit === null) {
      throw new Error('Need to call "_commit" first');
    }

    const fetchData = await this._otNode.push(this._pendingCommit);
    this._applyFetchData(fetchData);
    this._pendingCommit = null;
  }

  _applyFetchData(fetchData: fetchData<TKey, TState>): void {
    const transformed = this._otSystem.transform(
      this._otSystem.squash(this._workingOperations),
      this._otSystem.squash(fetchData.diffs)
    );

    this._apply(transformed.leftOps);

    this._workingOperations = transformed.rightOps;
    this._revision = fetchData.revision;
    this._level = fetchData.level;
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
    this._pendingCommit = null;
    this._state = this._initState();
  }

  _startPolling(): void {
    if (this._eventEmitter.listenerCount('change') === 0) {
      return;
    }

    this._poll = this._pull(commitId => {
      return this._otNode.poll(commitId)
    })
      .then(() => {
        this._eventEmitter.emit('change', this._state);
        this._startPolling();
      })
      .catch(() => this._startPolling());
  }
}
