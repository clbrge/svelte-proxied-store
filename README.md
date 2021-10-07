
# svelte-proxied-store

A fork of svelte-store using JavaScript Proxy internally. Using a Proxy Object allows
powerful use cases of stores.

A proxied Store implement the `subscribe` method, so is fully
compatible with the original Svelte store (in particular, the auto
subscriptions using the `$` notation in Svelte files).


## Installation

1. add the `svelte-proxied-store` package

```bash
npm i svelte-proxied-store
```

### Simple Usage


1. Import and declare like a normal Svelte store.

```js
const { proxied } = require ('svelte-proxied-store')

const myStore = proxied()
```

A proxied store implement 5 methods `refresh`, `set`, `get`, `assign`, `subscribe`, but only 
`subscribe` is equivalent to standard svelte store.


2. The internally stored value can only be an Object. You can
initiatize its properties individually with `set` or many properties
using `assign` :

```js
myStore.set('propertyKey', value)

myStore.assign({
     property1: 'abc',
     property2: 'xyz',
})
```

3. Contrary to normal Svelte store, notification of changes to
subscribers doesn't happen automatically when you `set` or `assign`
new properties. You need to explicitely use `refresh` to broadcast
your changes :

```js
myStore.refresh()
```

4. Finally, you can access at any time the internal value of any property in the store:

```js
myStore.get('propertyKey')
```

### Advanced Usage

You declare a store using a custom Proxy handler to allow advanced usage

```js
const { proxied } = require ('svelte-proxied-store')

const handler = 
  get: function(internal, property, receiver) {
    return internal.prop * 2
  }
}

const myStore = proxied(handler)
```

Here the `get` function will intercept any call from subscribers to
get an internal value property. An opportunity to implement any logic
you like before sending back the internal value (of any other value
preferable).



