# svelte-proxied-store

`svelte-proxied-store` is a fork of [`svelte/store`](https://svelte.dev/docs#run-time-svelte-store) with a focus on handling JavaScript Objects more effectively. It retains compatibility with the original Svelte store through the `subscribe` method, ensuring that auto-subscription using the `$` notation in Svelte files works as expected.

However, there are some key differences between `svelte-proxied-store` and the standard Svelte store:

1. **Object-only state**: A proxied store's state can only be a [JavaScript Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object), consisting of a collection of properties. JavaScript primitive values (Boolean, Null, Undefined, Number, String) are not allowed. The state Object is created automatically at store initialization without any properties.

2. **Writable with `assign`**: While a proxied store is writable, it does not use the standard Svelte store `set` or `update` methods. Instead, you can only update one or more of its state properties' values using `assign`. The Object itself never changes, only its properties and values.

3. **Explicit `emit` calls**: In a proxied store, all active subscription functions are called only when you explicitly call `emit`, not automatically after updates (for example, using the `assign` method).

4. **JavaScript Proxy for advanced use cases**: The store utilizes [JavaScript Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) internally, allowing you to pass a custom handler to intercept and redefine fundamental operations for the stored state Object. This enables powerful and advanced use cases (examples below).

## Advantages of the Proxy approach

For developers unfamiliar with JavaScript Proxy, it may seem like an unnecessary complication. However, it brings some significant advantages that can improve your application's performance and flexibility:

- **Optimized updates**: By using `assign` to update individual properties, you avoid the need to create new objects for every state update. This can reduce memory usage and improve performance.

- **Fine-grained control**: The Proxy-based approach allows you to have more control over when subscriptions are updated. By explicitly calling `emit`, you can batch multiple updates together and minimize the number of updates sent to subscribers.

- **Extendable behavior**: The custom handler feature enables powerful enhancements to the stored state Object. You can intercept and redefine fundamental operations, allowing for advanced use cases such as validation, logging, or computed properties.

Even if you don't need the advanced features provided by the custom handler, `svelte-proxied-store` can still be an efficient and convenient way to manage your application's state when working with JavaScript Objects.


## Installation

To install `svelte-proxied-store`, follow these simple steps:

1. Add the `svelte-proxied-store` package to your project:

```bash
npm install svelte-proxied-store
```

2. Import  `svelte-proxied-store` in your Svelte components or JavaScript files:

```js
import { proxied } from 'svelte-proxied-store';
```

Start using `svelte-proxied-store` in your application by creating and managing proxied stores as needed.


### Simple Usage

To use `svelte-proxied-store`, first import and create a proxied store. Note that unlike a standard Svelte store, you cannot initialize it with a value; it always starts as an empty JavaScript Object.

```js
const myStore = proxied()
```

A proxied store provides 6 methods: `subscribe`, `assign`, `emit`,
`get`, `delete` and `deleteAll`. The `subscribe` method works exactly like a standard Svelte store.

To assign new values to the stored Object properties, use the `assign` method (which works similarly to `Object.assign`):

```js
myStore.assign({
  property1: 'abc',
  property2: 'xyz',
})
```

To delete a property from the stored Object, use the `delete` method:

```js
myStore.delete('<propertyName>')
```

To remove all properties from the stored Object, use the `deleteAll` method:

```js
myStore.deleteAll()
```

Unlike standard Svelte stores, changes to subscribers are not automatically notified when you `assign` new property values or `delete` them. To broadcast changes to subscribers, you must explicitly use the `emit` method:


```js
myStore.emit()
```

As a convenient shortcut, if you pass an Object as an argument to `emit`, it will first be sent to `assign` before broadcasting the changes:

```js
myStore.emit({
  property1: 'abc',
  property2: 'xyz',
})
```

Finally, you can access the internal value of any property in the stored state Object at any time using the `get` method. Note that this direct property value access will bypass the Proxy Handler, unlike using accessors like $myStore.propertyName.

```js
myStore.get('<propertyName>')
```

This approach with `svelte-proxied-store` allows for more precise control over state updates and provides additional flexibility when working with complex data structures or operations. Even without utilizing a custom Proxy Handler, the proxied store can still be beneficial for managing application state.

### Derived stores with proxied stores

Proxied stores can be used to create derived stores, just like standard Svelte stores. You can combine multiple writable or proxied stores to build complex derived stores.
Creating Derived Stores from Proxied Stores

To create a derived store from a proxied store, use the `derived` function from the Svelte store module. The derived store will automatically update whenever any of its source stores emit changes.

Here's an example that demonstrates creating a derived store from two proxied stores:

```js
import { derived } from 'svelte/store'
import { proxied } from 'svelte-proxied-store'

const identity = proxied()
const job = proxied()

identity.assign({ firstname: 'John', lastname: 'Doe' })
job.assign({ state: 'running', id: 'xyz' })

const status = derived(
  [identity, job],
  ([$identity, $job]) => `${$identity.firstname} ${$identity.lastName}'s job is ${$job.state}`
)

// Usage in a Svelte component
/*
<script>
  import { status } from './stores.js'
</script>

<p>Status: {$status}</p>
*/
```


### Advanced Usage

You can create a proxied store with a custom Proxy handler for more advanced use cases:

```js
import { proxied } from 'svelte-proxied-store'

const handler = {
  get: function(internal, property, receiver) {
    return internal.prop * 2
  }
}

const myStore = proxied(handler)
```


The custom handler above intercepts any `get` call from subscribers (including when you use the notation `$myStore.propertyName`). This provides an opportunity to implement custom logic before returning the internal value or any other desired value.

For example, with the custom handler in the code snippet, when a subscriber accesses a property, the value is automatically doubled before being returned. This can be useful for scenarios where you need to perform some transformations on the data before providing it to subscribers.

Keep in mind that the custom handler can be as simple or as complex as needed, giving you the flexibility to control how the internal state is accessed or modified.

To fully understand and leverage the power of custom Proxy handlers, familiarize yourself with the Proxy API and its various traps for handling different operations.

Remember that using a custom handler is optional, and you can still use the proxied store without one for simpler use cases.

## Examples

In the examples section, we will explore four practical and powerful use cases of `svelte-proxied-store` to demonstrate its capabilities in handling a variety of situations. These examples showcase different aspects of `svelte-proxied-store` and illustrate how it can be used to create and manage complex store structures effectively.

1. *Key/Values Stores*: This example demonstrates how to create a simple key-value store using `svelte-proxied-store`. This type of store allows you to easily manage and access data based on keys, offering a flexible and efficient way to store and retrieve information.

2. *Store with Contextual Properties Values*: In this example, we explore how to create a store with contextual property values, which allows for dynamic and context-specific data access. By using `svelte-proxied-store`, you can create stores that adapt their values based on the current context, making them more versatile and powerful.

3. *Cache Systems*: This example showcases how to implement a cache system using `svelte-proxied-store`. Cache systems are essential for improving the performance of data-intensive applications, and with `svelte-proxied-store`, you can create efficient cache systems that are easy to manage and maintain.

4. *`ethers-svelte`*: In this advanced example, we examine the `ethers-svelte` package, which leverages the power of `svelte-proxied-store` to create a flexible and powerful interface for interacting with Ethereum smart contracts and the Ethereum network. This example demonstrates how Proxy features can be used to create dynamic sub-stores, access control, lazy initialization, and custom subscription handling.

By exploring these examples, you will gain a deeper understanding of how `svelte-proxied-store` can be employed in various scenarios to enhance your Svelte applications.

If you have other powerful examples or use cases of proxied stores, let us know! We'd love to see how you're using it to enhance your applications.


### key/values stores

In situations where stores are used to manage a collection of key-value pairs, a common pattern for updating and deleting keys might look like this:


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

While this pattern works, proxied stores offer a more concise and intuitive approach to handle such scenarios:

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

The proxied store also provides direct access to deep values using the syntax `myProxiedStore.get('propertyName')`, which allows for more straightforward and less convoluted code when accessing the current state of key-value stores. This approach simplifies the management of key-value pairs in your Svelte applications, making it easier to maintain and update the state.


### Store with contextual properties values

Utilizing a Proxy handler to determine the state based on context can open up new use cases for proxied stores. This approach allows you to integrate various libraries or custom code to compute values dynamically.

The example below demonstrates a simple translation engine that leverages the `i18next` library. This engine automatically translates content throughout your application when a global language context is changed:

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

You can then use this store in your Svelte files to automatically display translated content based on the current language context:

```html
<script>
  import { _ } from './lang.js'
</script>
    <a href="/about">{$_['About]}</a>
    <a href="/faq">{$_['FAQ']}</a>
```

This approach showcases the flexibility of proxied stores in handling dynamic and context-dependent values, which can be particularly useful for applications that require internationalization or other context-aware features.

### Cache systems

Proxied stores can be used to automatically and transparently load values when a Svelte page in your application subscribes to a particular property (for example, using the `$` prefix Svelte notation). This approach is ideal for creating simple or complex cache systems where data is loaded only when requested by a page and never requested a second time.

```html
<script>
  import ComponentX from './ComponentX.svelte'
  import cache from './cache.js'
</script>

{#each [ 23, 45, 67 ] as id}

  <ComponentX {id} data={$cache[id]} />

{/each}
```


In the following code, a simple cache system is implemented using a proxied store. It asynchronously loads the data for each `id` when they are not yet defined in the store:

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

When using this advanced approach, it is important to ensure that you have the correct conditions in place to avoid an infinite loop (e.g., page subscribes to property 'x' -> proxy calls the loading data for 'x' -> emit() after load -> the proxy has no correct stop conditions, and so on). With careful implementation, this strategy can be an effective way to optimize data loading in your application.


### ethers-svelte and svelte-web3

The [ethers-svelte](https://www.npmjs.com/package/ethers-svelte) package demonstrates another advanced usage of the `svelte-proxied-store`. By leveraging the Proxy feature, it can provide a more powerful and flexible interface to interact with Ethereum smart contracts and the Ethereum network.

The package [has several advanced usages](https://github.com/clbrge/ethers-svelte/blob/main/src/stores.js) of Proxies and `svelte-proxied-store`:

1. Dynamic sub-stores: By using a Proxy for the `makeEvmStores` function, the package creates and manages sub-stores dynamically based on the input name. This allows for creating multiple EVM store instances while sharing the same interface.

2. Access control and validation: The Proxy traps in `makeEvmStores` help control access to properties and methods, ensuring that only valid store properties are accessed. This improves the robustness of the code by providing a clear and controlled interface.

3. Lazy initialization of contract instances: The derived store for `contracts` is responsible for creating contract instances only when the EVM store is connected. By using a Proxy, the package can efficiently manage the state and initialization of contract instances, ensuring optimal resource usage.

4. Custom subscription handling: The package forces a subscription on the `$contracts` store, ensuring that it's always defined via the Proxy. This helps maintain the correct state and behavior across different components.

[svelte-web3](https://www.npmjs.com/package/svelte-web3) use similar advanced capabilities of the `svelte-proxied-store` package by utilizing Proxy features to provide a powerful and flexible interface for a different Ethereum lib.


