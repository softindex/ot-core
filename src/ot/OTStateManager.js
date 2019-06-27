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

const DEFAULT_RETRY_TIMEOUT = 1000;

export class OTStateManager<TKey, TState> {
  _initState: provider<TState>;
  _otNode: OTNode<TKey, TState>;
  _otSystem: OTSystem<TState>;
  _retryTimeout: number;

  _state: TState;
  _revision: TKey | null = null;
  _level: number | null = null;
  _workingOperations: Array<OTOperation<TState>> = [];
  _pendingCommit: Blob | null = null;
  _eventEmitter: EventEmitter = new EventEmitter();
  _stopPolling: null | () => void = null;
  _retryTimeoutId: TimeoutID | null = null;

  constructor(
    initState: provider<TState>,
    node: OTNode<TKey, TState>,
    otSystem: OTSystem<TState>,
    retryTimeout: number = DEFAULT_RETRY_TIMEOUT
  ) {
    this._initState = initState;
    this._otNode = node;
    this._otSystem = otSystem;
    this._state = this._initState();
    this._retryTimeout = retryTimeout;
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

    if (this._eventEmitter.listenerCount('change') === 0) {
      this._stop();
    }
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
      await this._pull();
    } else {
      await this._push();
    }

    if (this._workingOperations.length) {
      await this._commit();
      await this._push();
    }
  });

  add(operations: Array<OTOperation<TState>>): void {
    for (const op of operations) {
      if (!this._otSystem.isEmpty(op)) {
        this._workingOperations.push(op);
        this._state = op.apply(this._state);
      }
    }

    this._eventEmitter.emit('change', this._state);
  }

  async _pull(): Promise<void> {
    if (this._revision === null) {
      throw new Error('Need to call "checkout" first');
    }

    const fetchData = await this._otNode.fetch(this._revision);
    this._applyFetchData(fetchData);
  }

  async _poll(): Promise<void> {
    if (this._revision === null) {
      throw new Error('Need to call "checkout" first');
    }

    const prevRevision = this._revision;
    const polling = this._otNode.poll(this._revision);
    this._stopPolling = polling.cancel;

    let fetchData;
    try {
      fetchData = await polling.promise;
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }

      throw err;
    } finally {
      this._stopPolling = null;
    }

    if (!this.sync.isRunning() && prevRevision === this._revision) {
      this._applyFetchData(fetchData);
    }
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
    for (const op of operations) {
      this._state = op.apply(this._state);
    }
  }

  _startPolling(): void {
    if (this._eventEmitter.listenerCount('change') === 0 || this._stopPolling) {
      return;
    }

    this._poll()
      .then(() => {
        this._eventEmitter.emit('change', this._state);
        this._startPolling();
      })
      .catch((err) => {
        console.error(err);

        this._retryTimeoutId = setTimeout(() => {
          this._startPolling();
        }, this._retryTimeout);
      });
  }

  _stop() {
    clearTimeout(this._retryTimeoutId);

    if (this._stopPolling) {
      this._stopPolling();
    }
  }
}
