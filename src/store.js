const subscriberQueue = []

function noop () {}

const defaultHandler = {
  get: function (internal, property) {
    return Reflect.get(internal, property)
  }
}

function proxied (handler = defaultHandler) {
  let active = false
  const internal = {}
  const proxy = new Proxy(internal, handler)
  const subscribers = []
  function get (property) {
    return Reflect.get(internal, property)
  }
  function assign (object) {
    Object.assign(internal, object)
  }
  function deleteProperty (property) {
    Reflect.deleteProperty(internal, property)
  }
  function deleteAll () {
    for (const property of Object.getOwnPropertyNames(internal)) {
      Reflect.deleteProperty(internal, property)
    }
  }
  function emit (object) {
    if (object) assign(object)
    if (active) {
      // store is active
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
  function subscribe (run, invalidate = noop) {
    const subscriber = [run, invalidate]
    subscribers.push(subscriber)
    if (subscribers.length === 1) {
      active = true
    }
    run(proxy)
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
