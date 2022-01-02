
# svelte-proxied-store

A fork of
[`svelte/store`](https://svelte.dev/docs#run-time-svelte-store) that
specializes in handling Javascript Object.

A proxied Store implements the `subscribe` method that is fully
compatible with the original Svelte store. Thus the auto subscription
using the `$` notation in Svelte files behaves as expected.

But there are four major differences:

1. A proxied store state can only be a [Javascript
Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object),
i.e. a collection of properties, not a Javascript primitive value
(Boolean, Null, Undefined, Number, String). The state Object is
created automatically at store initialization with no properties.

2. A proxied store is writable but not using the standard Svelte store
`set` or `update` methods. Instead, you can only update one or more of
its state properties' values using `assign`. The Object itself never
changes, only its properties and values.

3. All of a proxied store's active subscription functions are called
only when you explicitly call `emit`, and not automatically after
updates (for example using the `assign` method).

4. The store use [JavaScript
Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
internally and you can pass a custom handler to intercept and redefine
fundamental operations for the stored state Object. This allow some
powerful magic (examples below).


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
import { proxied } from 'svelte-proxied-store'

const myStore = proxied()
```

A proxied store implements 6 methods: `subscribe`, `assign`, `emit`,
`get`, `delete` and `deleteAll`. Only `subscribe` works exactly like
the one of a standard Svelte store.

The stored Object properties can be assigned new values using `assign`
(it works like `Object.assign`):

```js
myStore.assign({
  property1: 'abc',
  property2: 'xyz',
})
```

You may delete a property from the stored Object using `delete`:

```js
myStore.delete('<propertyName>')
```

Or remove all properties using `deleteAll` :

```js
myStore.deleteAll()
```

Contrary to normal Svelte stores, notification of changes to
subscribers doesn't happen automatically when you `assign` new
property values or `delete` them. You need to explicitly use `emit` to
broadcast your changes to subscribers:

```js
myStore.emit()
```

As a syntactic sugar, if you pass an Object as argument to `emit`, that
argument is first send to `assign` before the broadcast:

```js
myStore.emit({
  property1: 'abc',
  property2: 'xyz',
})
```

Finally, you may access at any time the internal value of any property
of the stored state Object (This direct property's value access will
bypass the Proxy Handler, contrary to using accessors like
`$myStore.propertyName`)

```js
myStore.get('<propertyName>')
```

### Derived stores with proxied stores

You can use proxied stores to create standard derived stores. You can also
combined several stores writable or proxied to build complex derived stores.

### Advanced Usage

You may create a proxied store using a custom Proxy handler to allow
advanced usage :

```js
import { proxied } from 'svelte-proxied-store'

const handler = 
  get: function(internal, property, receiver) {
    return internal.prop * 2
  }
}

const myStore = proxied(handler)
```

The handler above intercepts any `get` call from subscribers
(including when you use the notation `$myStore.propertyName`).

This is an opportunity to implement any logic you like before sending
back the internal value (of any other value preferable).


## Examples


If you have power example usages of proxied stores, let us know!


### key/values stores

When stores are used to keep tracks of a collections of keys/values, a common pattern is 
to update and delete keys could be:

```js
import { writable } from 'svelte/store'

const standardSvelteStore = ({
  key1: 'value1',
  key2: 'another_value'
})

// ... later in your app we need to update one property and add a new one

standardSvelteStore.update(state => {
  return {
    ...state,
    key1: 'new value',
    key3: 'abc'
  }
})

// ... deleting property key2

standardSvelteStore.update(state => {
  return {
    ...state,
    key2: undefined
  }
})
```

This pattern works but proxied stores are handling this type of
scenario is a much more concise and natural way:

```js
import { proxied } from 'svelte-proxied-store'

const myProxiedStore = proxied()

myProxiedStore.emit({
  key1: 'value1',
  key2: 'another_value'
})

// ... later in your app we need to update one property and add a new one

myProxiedStore.emit({
  key1: 'new value',
  key3: 'abc'
})

// ... deleting property key2

myProxiedStore.deleteProperty('key2')
```

Direct access to deep values using the syntax
`myProxiedStore.get('propertyName')` also opens up less convoluted
code to access the current state for key/values stores.


### Store with contextual properties values

Being able to use a Proxy handler to determine the state depending on
some context potentially using any kind of libraries or specific code
to compute that value opens new usage of proxied stores.

This example below implemented a simple translation engine (using
internally the `i18next` library) to translate automatically across
you application when a language context is globally changed:

```js
// ./lang.js file

import i18next from 'i18next'
import { proxied } from 'svelte-proxied-store'

i18next.init({
  lng: 'en', // if you're using a language detector, do not define the lng option
  debug: true,
  resources: {
    en: { translation: { "FAQ": "FAQ", "About": "About" } },
    zh: { translation: { "FAQ": "常问问题", "About": "关于" } }
  }
})

export const _ = proxied({
  get: (target, key) => i18next.t(key)
})

export const changeLocale = async locale => {
  await i18next.changeLanguage(locale)
  _.emit()
}
```

Usage in your Svelte files:

```html
<script>
  import { _ } from './lang.js'
</script>
    <a href="/about">{$_['About]}</a>
    <a href="/faq">{$_['FAQ']}</a>
```

### Cache systems

You can also use a proxy handler to automatically and transparently
load values when a Svelte page in your application subscribe to a
particular property (for example using the `$` prefix Svelte
notation):

```html
<script>
  import cache from './cache.js'
</script>

{#each [ 23, 45, 67 ] as id}

  <ComponentX {id} data={$cache[id]} />

{/each}
```

This is ideal to create simple or complex cache system where data is
loaded only when requested by a page (that is to say, when the
property is accessed) in your application and never requested a second
times.

In the following code, the very simple cache system is implemented
using proxied store, and asynchronously load the data for each `id` when
they are not yet defined in the store:

```js
// ./cache.js file
import { proxied } from 'svelte-proxied-store'

import { myLoadFunction } from '$lib/api'

const cacheStore = () => {
  let store

  let fetch = async (id) => {
    try {
      const res = await myLoadFunction(id)
      // do not broadcast when value do not change
      if (JSON.stringify(res.data) !== JSON.stringify(store.get(id))) {
        store.emit({
          [id]: res.data
        })
      }
    } catch (e) {
      // avoid loop when failure
      store.assign({
        [id]: 'cannot load'
      }) 
    }
  }

  const handler = {
    get: function(target, id) {
      // you could implement here more complex logic to test if a property needs to be fetched again
      if (!target[id]) fetch(id)
      return target[prop]
    }
  }
  store = proxied(handler)

  return {
    subscribe: store.subscribe
  }
}

const cache = cacheStore()

export default cache
```

Be very careful with this kind of advanced usage to have correct
conditions in place to avoid an infinite loop (page subscribe to
property 'x' -> proxy call the loading data for 'x' -> emit() after
load -> the proxy has no correct stop conditions, etc).
