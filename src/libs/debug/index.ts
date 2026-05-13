import ReconnectingWebSocket, { CloseEvent } from 'reconnecting-websocket'
import fs from 'fs'

export interface ISelect<T = string> {
  label: string
  value: T
}

let selectedAccount: ISelect | null = null

const onOpen = (account: ISelect | null) => {
  if (!account) {
    return
  }
  console.log(`Debug stream opened for account ${account.value}`)
}

const onError = () => {
  console.error('Something went wrong! Check your connection and try again.')
}

const onClose = (e: CloseEvent) => {
  // 999 = closed websocket connection by switching account
  if (e.code !== 4999) {
    console.error(`Connection was closed. [code: ${e.code}]`)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onMessage = (event: any) => {
  // Ping returns just account address, if we get that
  // response we don't need to log anything
  if (event.data !== selectedAccount?.value) {
    const message = event.data.replace(/\0/g, '').trim()
    if (message.includes('HookInfo') || message.includes('HookTrace')) {
      console.log(message)
      fs.appendFileSync('debug.log', `${message}\n`)
    }
  }
}

let socket: ReconnectingWebSocket | null = null

export const addListeners = (account: ISelect | null) => {
  if (account?.value && socket?.url.endsWith(account.value)) {
    return
  }
  selectedAccount = account

  if (account?.value) {
    if (socket) {
      socket.removeEventListener('open', () => onOpen(account))
      socket.removeEventListener('close', onClose)
      socket.removeEventListener('error', onError)
      socket.removeEventListener('message', onMessage)
    }

    socket = new ReconnectingWebSocket(
      `${process.env.HOOKS_DEBUG_HOST}/${account.value}`
    )

    socket.addEventListener('open', () => onOpen(account))
    socket.addEventListener('close', onClose)
    socket.addEventListener('error', onError)
    socket.addEventListener('message', onMessage)
  }
}

export const removeListeners = () => {
  if (socket) {
    socket.close(4999)
    socket.removeEventListener('open', () => onOpen(null))
    socket.removeEventListener('close', onClose)
    socket.removeEventListener('error', onError)
    socket.removeEventListener('message', onMessage)
  }
}
