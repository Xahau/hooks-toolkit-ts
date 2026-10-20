const HOST = process.env.HOST ?? '0.0.0.0'
const PORT = process.env.PORT ?? '6006'
const serverUrl = `ws://${HOST}:${PORT}`

export default serverUrl
