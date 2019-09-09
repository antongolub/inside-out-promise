import {factory, InsideOutPromise, TPromiseState} from '../../main/ts'
import * as Bluebird from 'bluebird'
import {noop} from '../../main/ts/util'

describe('factory', () => {
  afterAll(() => factory.Promise = Promise)

  it('returns proper instance', () => {
    const p = factory()

    expect(factory).toEqual(expect.any(Function))
    expect(p).toBeInstanceOf(InsideOutPromise)
    expect(p).toBeInstanceOf(Promise)
  })

  it('handles options argument', () => {
    expect(factory.Promise).toBe(Promise)
    const opts = {
      executor: jest.fn(),
    }
    const p = factory(opts)

    expect(p.promise).toBeInstanceOf(InsideOutPromise)
    expect(opts.executor).toHaveBeenNthCalledWith(1, expect.any(Function), expect.any(Function))
  })

  it('allows override default Promise impl', () => {
    expect(factory.Promise).toBe(Promise)

    factory.Promise = Bluebird
    const p = factory()

    expect(p.promise).toBeInstanceOf(Bluebird)
    expect(p).toBeInstanceOf(Bluebird)
    expect(InsideOutPromise.Promise).toBe(Bluebird)
  })
})

describe('InsideOutPromise', () => {
  describe('constructor', () => {
    it('returns proper instance', () => {
      const p = new InsideOutPromise()

      expect(p).toBeInstanceOf(InsideOutPromise)
      expect(p).toBeInstanceOf(Promise)
      expect(p.promise).toBeInstanceOf(Promise)
    })

    it('invokes executor if passed', () => {
      const fn = jest.fn()
      const p = new InsideOutPromise(fn)

      expect(fn).toHaveBeenNthCalledWith(1, expect.any(Function), expect.any(Function))
      expect(p).toBeInstanceOf(InsideOutPromise)
    })
  })
  describe('proto', () => {
    it('#then returns a new promise', () => {
      const p = new InsideOutPromise()
      const n = p.then()

      expect(n).toBeInstanceOf(Promise)
      expect(n).not.toBe(p.promise)
    })

    it('#catch returns a new promise', () => {
      const p = new InsideOutPromise()
      const n = p.catch(console.error)

      expect(n).toBeInstanceOf(Promise)
      expect(n).not.toBe(p.promise)
    })

    it('#resolve resolves the promise and returns its ref as a result', async() => {
      const data = 'foo'
      const p = new InsideOutPromise()
      const n = p.resolve(data)
      const resolved = await p.promise

      expect(p.state).toBe(TPromiseState.FULFILLED)
      expect(p.status).toBe(TPromiseState.FULFILLED)
      expect(p.result).toBe(data)
      expect(p.value).toBe(data)
      expect(p.isPending()).toBeFalsy()
      expect(p.isRejected()).toBeFalsy()
      expect(p.isFulfilled()).toBeTruthy()
      expect(p.isResolved()).toBeTruthy()
      expect(n).toBe(p.promise)
      expect(resolved).toBe(data)
    })

    it('#reject rejects the promise and returns its ref as a result', async done => {
      const reason = new Error('bar')
      const p = new InsideOutPromise()
      const n = p.reject(reason)
      try {
        await p.promise
      }
      catch (err) {
        expect(err).toBe(reason)
        expect(n).toBe(p.promise)
        expect(p.state).toBe(TPromiseState.REJECTED)
        expect(p.status).toBe(TPromiseState.REJECTED)
        expect(p.result).toBe(reason)
        expect(p.value).toBe(reason)
        expect(p.isPending()).toBeFalsy()
        expect(p.isRejected()).toBeTruthy()
        expect(p.isFulfilled()).toBeFalsy()
        expect(p.isResolved()).toBeTruthy()

        done()
      }
    })

    it('exposes promise state', () => {
      const p = new InsideOutPromise()

      expect(p.state).toBe(TPromiseState.PENDING)
      expect(p.status).toBe(TPromiseState.PENDING)
      expect(p.result).toBeUndefined()
      expect(p.value).toBeUndefined()
      expect(p.isPending()).toBeTruthy()
      expect(p.isRejected()).toBeFalsy()
      expect(p.isFulfilled()).toBeFalsy()
      expect(p.isResolved()).toBeFalsy()
    })

    describe('#finally', () => {
      const f5y = Promise.prototype.finally

      afterAll(() => {
        // @ts-ignore
        Promise.prototype.finally = f5y
      })

      it('uses this.promise.finally if exists', async() => {
        const p = new InsideOutPromise()
        const f = p.finally(() => {
          foo = 'baz'
        })
        let foo = 'bar'

        setTimeout(() => p.resolve(null), 5)

        await p.promise

        expect(f).toBeInstanceOf(Promise)
        expect(foo).toBe('baz')
        expect(p.result).toBeNull()
      })

      it('relies on then(), catch() otherwise', async() => {
        const p = new InsideOutPromise()
        // @ts-ignore
        Promise.prototype.finally = null

        let foo = 'bar'

        const f = p.finally(() => {
          foo = 'baz'
        })

        setTimeout(() => p.resolve(null), 5)

        await p.promise

        expect(f).toBeInstanceOf(Promise)
        expect(foo).toBe('baz')
        expect(p.result).toBeNull()
      })
    })

    describe('then', () => {
      it('supports crazy chaining & inheritance', async() => {
        const p1 = new InsideOutPromise()
        const p2 = p1.then(data => data)
        const p3 = p2.then(data => data).resolve('foo')

        const v1 = await(p1)
        const v2 = await(p2)
        const v3 = await(p3)

        expect(p1).toBeInstanceOf(InsideOutPromise)
        expect(p2).toBeInstanceOf(InsideOutPromise)
        expect(p3).toBeInstanceOf(InsideOutPromise)
        expect(p1).toBeInstanceOf(Promise)
        expect(p2).toBeInstanceOf(Promise)
        expect(p3).toBeInstanceOf(Promise)
        expect(v1).toBe('foo')
        expect(v2).toBe('foo')
        expect(v3).toBe('foo')
      })
    })

  })
  describe('static', () => {
    it('Promise refs to the native Promise by default', () => {
      expect(InsideOutPromise.Promise).toBe(Promise)
    })

    it('#normalizeOpts returns TNormalizedPromiseFactoryOpts', () => {
      const executor = () => { /* noop */ }

      expect(InsideOutPromise.normalizeOpts()).toEqual({
        Promise,
        executor: noop,
      })

      expect(InsideOutPromise.normalizeOpts(executor, {Promise: Bluebird})).toEqual({
        Promise: Bluebird,
        executor,
      })
    })
  })
})
