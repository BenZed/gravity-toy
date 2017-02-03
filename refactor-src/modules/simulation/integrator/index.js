const isBrowser = typeof window !== 'undefined'

export default isBrowser
  ? require('./parent-browser').default
  : require('./parent-node').default
