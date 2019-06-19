/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import path from 'path';

import type {OTOperation} from "./interfaces/OTOperation";
import type {OTNode, fetchData, promiseAndCancel} from "./interfaces/OTNode";
import type {JsonSerializer, json} from "../common/types/JsonSerializer";

type otNodeOptions<TKey, TState> = {
  url: string,
  diffSerializer: JsonSerializer<OTOperation<TState>>,
  keySerializer: JsonSerializer<TKey>,
  fetch?: typeof fetch
};
type otNodeCreateOptions<TState> = {
  url: string,
  serializer: JsonSerializer<OTOperation<TState>>,
  fetch?: typeof fetch
};

const jsonSerializer = {
  serialize(key: json): json {
    return key;
  },

  deserialize(json: json): json {
    return json;
  }
};

export class ClientOTNode<TKey, TState> implements OTNode<TKey, TState> {
  _url: string;
  _keySerializer: JsonSerializer<TKey>;
  _diffSerializer: JsonSerializer<OTOperation<TState>>;
  _fetch: typeof fetch;

  constructor(options: otNodeOptions<TKey, TState>) {
    this._url = options.url;
    this._diffSerializer = options.diffSerializer;
    this._keySerializer = options.keySerializer;
    this._fetch = options.fetch || window.fetch.bind(window);
  }

  static createWithJsonKey<TState>(
    options: otNodeCreateOptions<TState>
  ): ClientOTNode<json, TState> {
    return new ClientOTNode({
      url: options.url,
      diffSerializer: options.serializer,
      fetch: options.fetch,
      keySerializer: jsonSerializer
    });
  }

  async createCommit(
    parentCommitId: TKey,
    diffs: Array<OTOperation<TState>>,
    level: number
  ): Promise<Blob> {
    const response = await this._fetch(path.join(this._url, 'createCommit'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: this._keySerializer.serialize(parentCommitId),
        level,
        diffs: diffs.map(diff => this._diffSerializer.serialize(diff))
      })
    });
    return await response.blob();
  }

  async push(commitData: Blob): Promise<fetchData<TKey, TState>> {
    const response = await this._fetch(path.join(this._url, 'push'), {
      method: 'POST',
      body: commitData
    });
    const json = await response.json();
    return {
      revision: this._keySerializer.deserialize(json.id),
      level: json.level,
      diffs: json.diffs.map(diff => this._diffSerializer.deserialize(diff))
    };
  }

  async checkout(): Promise<fetchData<TKey, TState>> {
    const response = await this._fetch(path.join(this._url, 'checkout'));
    const json = await response.json();
    return {
      revision: this._keySerializer.deserialize(json.id),
      level: json.level,
      diffs: json.diffs.map(diff => this._diffSerializer.deserialize(diff))
    };
  }

  fetch(currentCommitId: TKey): Promise<fetchData<TKey, TState>> {
    return this._fetchRequest(currentCommitId, null);
  }

  poll(
    currentCommitId: TKey
  ): promiseAndCancel<fetchData<TKey, TState>> {
    const abortController = new AbortController();
    return {
      promise: this._fetchRequest(currentCommitId, abortController.signal),
      cancel() {
        abortController.abort();
      }
    };
  }

  async _fetchRequest(
    currentCommitId: TKey,
    stopPollingSignal: AbortSignal | null
  ): Promise<fetchData<TKey, TState>> {
    const serializedKey = this._keySerializer.serialize(currentCommitId);
    const url = (
      path.join(this._url, stopPollingSignal ? 'poll' : 'fetch')
      + '?id=' + encodeURIComponent(JSON.stringify(serializedKey))
    );

    const response = await this._fetch(url, {
      signal: stopPollingSignal
    });

    const json = await response.json();

    return {
      revision: this._keySerializer.deserialize(json.id),
      level: json.level,
      diffs: json.diffs.map(diff => (
        this._diffSerializer.deserialize(diff)
      ))
    };
  }
}
