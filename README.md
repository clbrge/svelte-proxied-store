
# svelte-proxied-store

A fork of svelte-store that specializes in handling Javascript Object.

A proxied Store implements the `subscribe` method that is fully
compatible with the original Svelte store. Thus the auto subscription
using the `$` notation in Svelte files will behave as expected.

But there are four major differences:

1. A proxied store state can only be a Javascript Object, i.e. a
collection of properties, not a Javascript primitive value (Boolean,
Null, Undefined, Number, String). The state Object is created
automatically at initialization with no properties.

2. A proxied store is writable but not using the standard Svelte store
`set` or `update` functions. Instead, you can only update one or more
of the properties' values using `assign`. The Object itself never
changes, only its properties.

3. All of a proxied store's active subscription functions are called
whenever when you explicitely call `emit`, not automatically after
updates using the `assign` method.

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
import { proxied } from 'svelte-proxied-store'

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

As a syntaxic sugar, if you pass an Object as argument to `emit`, that
argument is will first send to `assign` before the broadcast:

```js
myStore.emit({
  property1: 'abc',
  property2: 'xyz',
})
```

Finally, you may access at any time the internal value of any
property of the stored Object (it won't be handled by the Proxy
Hanlder, contrary to `$myStore.propertyKey`)

```js
myStore.get('propertyKey')
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

The handler above will intercept any `get` call from subscribers
(including when you use the notation `$myStore.propertyKey`).

This is an opportunity to implement any logic you like before sending
back the internal value (of any other value preferable).


## Examples


If you have more power examples usage for proxied store, let us know!


## key/values stores

When stores are used to keep tracks of a collections of keys/values, a common pattern is 
to update and delete keys would be:

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

This pattern works but proxied stores are handling this scenario is a
much more natural way:

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
`myProxiedStore.get('propertyKey')` also opens up less convoluted ways
to access the current state for key/values stores.


## Contextual store properties values

Being able to use a Proxy handler to determine the state depending on
some context and using any kind of librairies or specific code to
computate that value open new possibilities to use proxied store.

This example below implemented a simple translation engine (using
internally the `i18next` library) to translate automatically across
you application when the language is changed:

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

## Cache systems

You can also use a proxy handler to automatically and transparently
load values when a Svelte page in your application subscribe to a
particular property like (for exampe using the `$` prefix Svelte
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
loaded only when requested by a page in your application and never
requested a second times.

In the following code, the very simple cache system is implemented
using proxied store, and asynchronously load the data for each id when
they are not defined:

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
