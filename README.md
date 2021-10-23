
# svelte-proxied-store

A fork of svelte-store that specialize in handling Javascript Object.

A proxied Store implement the `subscribe` method that is fully
compatible with the original Svelte store. Thus the auto subscription
using the `$` notation in Svelte files will behave as expected. Also,
you may use one or more proxied Store as argument to create standard
derived Svelte stores.

But there are major differences:

1. A proxied store state can only be a Javascript Object, i.e. a
collection of properties, not a primitive value (Boolean, Null,
Undefined, Number, String).

2. A proxied store is writable but not using the classic `set` or
`update` functions. Instead, you can only update one or more of the
properties' values using `assign`. The Object itself never changes,
only its properties.

3. All of a proxied store's active subscription functions are called
whenever when you explicitely call `emit`, not automatically after
`assign`.

4. The store use [JavaScript
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


Import and declare it like a normal Svelte store, except that you
cannot initialize it with a value, it's always an empty JavaScript
Object.

```js
const { proxied } = require ('svelte-proxied-store')

const myStore = proxied()
```

A proxied store implement 6 methods: `subscribe`, `assign`, `emit`,
`get`, `delete` and `deleteAll`. Only `subscribe` works identically
like with a standard Svelte store.

The stored Object properties can be assigned new values using `assign`
(works like `Object.assign`):

```js
myStore.assign({
  property1: 'abc',
  property2: 'xyz',
})
```

You may delete a property from the stored Object using `delete`:

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

Finally, you may access at any time the internal value of any
property of the stored Object (it won't be handled by the Proxy
Hanlder, contrary to `$myStore.propertyKey`)

```js
myStore.get('propertyKey')
```

### Advanced Usage

You may create a proxied store using a custom Proxy handler to allow
advanced usage :

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

This is an opportunity to implement any logic you like before sending
back the internal value (of any other value preferable).





