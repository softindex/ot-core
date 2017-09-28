/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

function commitIdComparator(a: string, b: string): number {
  return b.localeCompare(a);
}

export default commitIdComparator;
