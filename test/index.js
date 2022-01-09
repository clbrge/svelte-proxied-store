import * as assert from 'assert'
import { proxied } from '../src/store'

describe('store', () => {
  describe('proxied', () => {
    it('creates a proxied store', () => {
      const count = proxied()
      const values = []

      const unsubscribe = count.subscribe(o => {
        if (o.v !== undefined) values.push(o.v)
      })

      count.assign({ v: 0 })
      count.emit()

      count.assign({ v: 1 })
      count.emit()

      unsubscribe()

      count.assign({ v: 2 })

      assert.deepEqual(values, [0, 1])
    })

    it('delete property a proxied store', () => {
      const count = proxied()
      const values = []

      const unsubscribe = count.subscribe(o => {
        if (o.v !== undefined) values.push(o.v)
      })

      count.assign({ v: 0 })
      count.emit()

      count.delete('v')
      count.emit()

      unsubscribe()

      assert.deepEqual(values, [0])
    })

    it('emit argument has been assigned', () => {
      const count = proxied()
      const values = []

      const unsubscribe = count.subscribe(o => {
        if (o.v !== undefined) values.push(o.v)
      })

      count.emit({ v: 'x' })

      unsubscribe()

      assert.deepEqual(values, ['x'])
    })

    it('destructure proxied store', () => {
      const { delete: deleteProperty, subscribe, assign, emit } = proxied()
      const values = []

      const unsubscribe = subscribe(o => {
        if (o.v !== undefined) values.push(o.v)
      })

      assign({ v: 0 })
      emit()

      deleteProperty('v')
      emit()

      unsubscribe()

      assert.deepEqual(values, [0])
    })

    it('creates an empty proxied store', () => {
      const store = proxied()
      const values = []

      const unsubscribe = store.subscribe(p => {
        values.push(p)
      })

      unsubscribe()

      assert.deepEqual(values, [{}])
    })

    it('basic handler that increment property by 1', () => {
      const values = []

      const store = proxied({
        get: function (internal, property) {
          internal[property]++
          return Reflect.get(internal, property)
        }
      })

      store.assign({ v: 1 })

      assert.equal(store.get('v'), 1)

      const unsubscribe1 = store.subscribe(p => {
        values.push(p.v)
      })
      const unsubscribe2 = store.subscribe(p => {
        values.push(p.v)
      })

      assert.deepEqual(values, [2, 3])

      store.emit()

      assert.deepEqual(values, [2, 3, 4, 5])

      unsubscribe1()
      unsubscribe2()

      store.emit()

      assert.deepEqual(values, [2, 3, 4, 5])
    })

    it('only calls subscriber once initially, including on resubscriptions', () => {
      const store = proxied()
      store.assign({ v: 1 })

      let count1 = 0
      let count2 = 0

      store.subscribe(() => (count1 += 1))()
      assert.equal(count1, 1)

      const unsubscribe = store.subscribe(() => (count2 += 1))
      assert.equal(count2, 1)

      unsubscribe()
    })
  })
})
