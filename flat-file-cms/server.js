import express from 'express'
import cors from 'cors'
import path, { resolve } from 'path'
import { translate } from './core.js'

export default class Server {
  app
  port
  dir

  constructor(port = 3000) {
    this.app = null
    this.port = port
    this.dir = resolve('')
  }

  start() {
    this.app = express()

    this.app.use(cors())

    this.app.get('/', (req, res) => {
      translate(req.query)
      return res.sendFile(path.join(this.dir, 'index.html'))
    })

    this.app.listen(this.port, () => {
      console.log(`Example app listening on port ${this.port}`)
    })
  }

  stop() {
    this.app = null
  }
}
