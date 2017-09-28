/*
 * Copyright (с) 2019-present, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow

export type json = {[string]: json} | number | string | boolean | null;

export interface JsonSerializer<T> {
  serialize(T): json;
  deserialize(json): T;
}
