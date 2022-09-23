import express from 'express'
// import core from './core.js'

export default class Server {
    app
    port

    constructor() {
        this.port = 3000
    }

    init() {
        this.app = express()
        this.app.get('/', (req, res) => {
            res.send('Hello World!')
            //   res.sendFile('index.html');
          //   res.sendFile(path.join(__dirname, 'index.html'))
          })
          
          this.app.listen(this.port, () => {
            console.log(`Example app listening on port ${this.port}`)
          })
    }
}
