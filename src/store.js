const subscriberQueue = []

function noop () {}

const defaultHandler = {
  // Default proxy handler
  get: function (internal, property) {
    return Reflect.get(internal, property)
  }
}

function proxied (handler = defaultHandler) {
  let active = false
  const internal = {} // The internal state object
  const proxy = new Proxy(internal, handler) // The proxy object
  const subscribers = [] // Array of subscriber functions

  // Returns the value of the specified property
  function get (property) {
    if (typeof property !== 'string') {
      throw new Error('get: property must be a string')
    }
    return Reflect.get(internal, property)
  }

  // Assigns the properties of the given object to the internal state
  function assign (object) {
    if (typeof object !== 'object' || object === null) {
      throw new Error('assign: object must be a non-null object')
    }
    Object.assign(internal, object)
  }

  // Deletes the specified property from the internal state
  function deleteProperty (property) {
    if (typeof property !== 'string') {
      throw new Error('deleteProperty: property must be a string')
    }
    Reflect.deleteProperty(internal, property)
  }

  // Deletes all properties from the internal state
  function deleteAll () {
    for (const property of Object.getOwnPropertyNames(internal)) {
      Reflect.deleteProperty(internal, property)
    }
  }

  // Emits changes to the internal state and notifies subscribers
  function emit (object) {
    if (object && typeof object !== 'object') {
      throw new Error('emit: object must be an object when provided')
    }
    if (object) {
      assign(object)
    }
    if (active) {
      // Handling the subscriber queue
      const runQueue = !subscriberQueue.length
      for (let i = 0; i < subscribers.length; i += 1) {
        const s = subscribers[i]
        s[1]()
        subscriberQueue.push(s, proxy)
      }
      if (runQueue) {
        for (let i = 0; i < subscriberQueue.length; i += 2) {
          subscriberQueue[i][0](subscriberQueue[i + 1])
        }
        subscriberQueue.length = 0
      }
    }
  }

  // Subscribes a function to changes in the internal state
  function subscribe (run, invalidate = noop) {
    if (typeof run !== 'function') {
      throw new Error('subscribe: run must be a function')
    }
    if (typeof invalidate !== 'function') {
      throw new Error(
        'subscribe: invalidate must be a function or not provided'
      )
    }
    const subscriber = [run, invalidate]
    const index = subscribers.indexOf(subscriber)
    if (index === -1) {
      subscribers.push(subscriber)
      if (subscribers.length === 1) {
        active = true
      }
      run(proxy)
    }
    // Returns a cleanup function to remove the subscriber
    return () => {
      const index = subscribers.indexOf(subscriber)
      if (index !== -1) {
        subscribers.splice(index, 1)
      }
      if (subscribers.length === 0) {
        active = false
      }
    }
  }

  return {
    get,
    assign,
    delete: deleteProperty,
    deleteAll,
    deleteProperty,
    emit,
    subscribe
  }
}

export { proxied }
