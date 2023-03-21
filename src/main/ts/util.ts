export const noop = () => { /* noop */ }

export const setProto = (target: any, proto: any) => Object.setPrototypeOf(target, proto)

// https://github.com/NoHomey/bind-decorator/blob/master/src/index.ts
export function bind<T extends Function>(_: object, propertyKey: string, descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T> | void {
  if (!descriptor || (typeof descriptor.value !== 'function')) { // tslint:disable-line strict-type-predicates
    throw new TypeError(`Only methods can be decorated with @bind. <${propertyKey}> is not a method!`)
  }

  return {
    configurable: true,
    get(this: T): T {
      const bound: T = descriptor.value!.bind(this)
      // Credits to https://github.com/andreypopp/autobind-decorator for memoizing the result of bind against a symbol on the instance.
      Object.defineProperty(this, propertyKey, {
        value: bound,
        configurable: true,
        writable: true,
      })
      return bound
    },
  }
}
