/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import {OTCommit} from "../OTCommit";
import type {OTOperation} from "./OTOperation";

export interface OTRemote<K, S> {
  createId(parents: Map<K, Array<OTOperation<S>>>): Promise<K>;
  push(commits: Array<OTCommit<K, S>>): Promise<void>;
  getHeads(): Promise<Set<K>>;
  getCheckpoint(): Promise<K | null>;
  getCommit(commitId: K): Promise<OTCommit<K, S> | null>;
  addChangeListener(listener: () => void): void;
  removeChangeListener(listener: () => void): void;
}
