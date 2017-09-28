/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

import type {OTOperation} from "./interfaces/OTOperation";

export class OTCommit<K, S> {
  id: K;
  checkpoint: ?Array<OTOperation<S>>;
  parents: Map<K, Array<OTOperation<S>>>;

  constructor(commitId: K, checkpoint: ?Array<OTOperation<S>>, parents: Map<K, Array<OTOperation<S>>>) {
    this.id = commitId;
    this.checkpoint = checkpoint;
    this.parents = parents;
  }

  static ofRoot(commitId: K): OTCommit<K, S> {
    return new OTCommit(commitId, [], new Map());
  }

  static ofCommit(commitId: K, parentId: K, ops: Array<OTOperation<S>>): OTCommit<K, S> {
    return new OTCommit(commitId, null, new Map().set(parentId, ops));
  }

  static ofMerge(commitId: K, parents: Map<K, Array<OTOperation<S>>>): OTCommit<K, S> {
    return new OTCommit(commitId, null, parents);
  }

  static ofCheckpoint(commitId: K, parentId: K, checkpoint: Array<OTOperation<S>>): OTCommit<K, S> {
    return new OTCommit(commitId, checkpoint, new Map().set(parentId, []));
  }

  isRoot(): boolean {
    return !this.parents.size;
  }

  isCheckpoint(): boolean {
    return this.checkpoint !== null;
  }

  isMerge(): boolean {
    return this.parents.size > 1;
  }
}
