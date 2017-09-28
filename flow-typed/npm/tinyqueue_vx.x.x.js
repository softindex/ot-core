declare module 'tinyqueue' {
  declare export default class Queue<T> {
    constructor(Array<T>, (T, T) => number): Queue<T>;
    pop(): T | void;
    push(T): void;
    length: number;
  }
}
