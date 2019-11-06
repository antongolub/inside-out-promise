import {
  IPromise,
  IPromiseConstructor,
} from '@qiwi/substrate-types'

export type TPromiseExecutor<TValue = any, TReason = any> = (resolve: (value: TValue) => void, reject: (reason: TReason) => void) => void

declare module '@qiwi/substrate-types' {
  interface IPromiseConstructor {
    readonly [Symbol.species]: any
  }
}

export enum TPromiseState {
  PENDING = 'Pending',
  FULFILLED = 'Fulfilled',
  REJECTED = 'Rejected',
}

export interface TInsideOutPromise<TValue = any, TReason = never> extends IPromise<TValue, TReason> {
  promise: TInsideOutPromise<TValue, TReason>,
  resolve: (value: TValue) => TInsideOutPromise<TValue, TReason>,
  reject: (reason: any) => TInsideOutPromise<TValue, TReason>,
  then: (onSuccess?: (value: TValue) => any, onReject?: (reason: any) => any) => TInsideOutPromise<TValue, TReason>,
  catch: (onReject: (reason: any) => any) => TInsideOutPromise<TValue, TReason>,
  finally: (handler?: () => any) => TInsideOutPromise<TValue, TReason>,
  readonly [Symbol.toStringTag]: string,
  readonly [Symbol.species]: any,

  state: TPromiseState,
  status: TPromiseState,

  result: any,
  value: any,
  reason: any,

  isRejected: () => boolean,
  isFulfilled: () => boolean,
  isPending: () => boolean,
  isResolved: () => boolean,
}

export {
  IPromise,
  IPromiseConstructor,
}

export type TPromiseFactoryOpts = {
  executor?: TPromiseExecutor,
  Promise?: any
}

export type TNormalizedPromiseFactoryOpts = {
  executor: TPromiseExecutor,
  Promise: any
}

export interface IPromiseFactory {
  (executor?: TPromiseExecutor, opts?: TPromiseFactoryOpts): TInsideOutPromise,
  (opts?: TPromiseFactoryOpts): TInsideOutPromise,
  Promise?: any
}
