import Api from '../api'

// eslint-disable-next-line wrap-iife
void async function start () {

  const api = new Api()

  try {

    await api.initialize()
    await api.start()

  } catch (err) {

    if (api.feathers.listener)
      api.feathers.listener.close()

    process.exit(1)
  }

}()
