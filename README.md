
# svelte-proxied-store

A fork of svelte-store that specialize in handling Javascript Object.

A proxied Store implement the `subscribe` method that is fully
compatible with the original Svelte store (in particular, the auto
subscriptions using the `$` notation in Svelte files).

There are a few differences:

1. The store are writable but not using the classic `set` or `update`
functions. Instead, you can update properties' value of the stored
Object using `assign` (works like `Object.assign`).

2. Subscribers only receive new values when you explicitely call
`emit`, not automatically after `assign`.

3. The store use [JavaScript
Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
internally and you can pass a custom handler to intercept and redefine
fundamental operations for the stored Object. This allow some powerful
magic (examples below).


## Installation

Add the `svelte-proxied-store` package

```bash
npm i svelte-proxied-store
```

### Simple Usage


Import and declare like a normal Svelte store except that you cannot
initialize with a value, it's always an empty JavaScript Object.

```js
const { proxied } = require ('svelte-proxied-store')

const myStore = proxied()
```

A proxied store implement 6 methods `subscribe`, `assign`, `emit`,
`get`, `delete` and `deleteAll`. Only is strictly equivalent to
standard svelte store.

The stored Object properties can be assigned new values using `assign` :

```js
myStore.assign({
  property1: 'abc',
  property2: 'xyz',
})
```

You may delete a property from the stored Object using `delete` :

```js
myStore.delete('propertyName')
```

Or remove all properties using `deleteAll` :

```js
myStore.deleteAll()
```

Contrary to normal Svelte store, notification of changes to
subscribers doesn't happen automatically when you `assign` new
property values. You need to explicitely use `emit` to broadcast your
changes to subscribers:

```js
myStore.emit()
```

4. Finally, you can access at any time the internal value of any
property of the stored Object (it won't be handled by the Proxy
Hanlder, contrary to `$myStore.propertyKey`)

```js
myStore.get('propertyKey')
```

### Advanced Usage

You declare a store using a custom Proxy handler to allow advanced usage :

```js
const { proxied } = require ('svelte-proxied-store')

const handler = 
  get: function(internal, property, receiver) {
    return internal.prop * 2
  }
}

const myStore = proxied(handler)
```

The handler above will intercept any `get` call from subscribers
(including when you use the notation `$myStore.propertyKey`).

This is opportunity to implement any logic you like before sending
back the internal value (of any other value preferable).





