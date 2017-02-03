import { receiveMessage, setTickScheduler, setMessageSender } from './child-common'

setTickScheduler(process.nextTick.bind(process))

setMessageSender(process.send.bind(process))

process.on('message', receiveMessage)
