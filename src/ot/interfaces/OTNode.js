/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import type {OTOperation} from "./OTOperation";

export type fetchData<TKey, TState> = {
  revision: TKey,
  diffs: Array<OTOperation<TState>>,
  level: number
};

export interface OTNode<TKey, TState> {
  createCommit(
    parentCommitId: TKey,
    diffs: Array<OTOperation<TState>>,
    level: number
  ): Promise<Blob>;

  push(commitData: Blob): Promise<fetchData<TKey, TState>>;

  checkout(): Promise<fetchData<TKey, TState>>;

  fetch(currentCommitId: TKey): Promise<fetchData<TKey, TState>>;

  poll(currentCommitId: TKey): Promise<fetchData<TKey, TState>>;
}
