'use strict'

process.env.VUE_ENV = 'server'

const fs = require('fs')
const path = require('path')
const express = require('express')
const serialize = require('serialize-javascript')
const createBundleRenderer = require('vue-server-renderer').createBundleRenderer

const renderer = createBundleRenderer(fs.readFileSync('./dist/server-bundle.js', 'utf-8'), {
  cache: {
    max: 10000
  }
})

const app = express()

app.use(express.static(path.resolve(__dirname, 'dist')))

app.get('*', (req, res) => {
  const start = Date.now()
  const context = { url: req.url }
  const renderStream = renderer.renderToStream(context)
  let firstChunk = true

  res.write('<!DOCTYPE html><body>')
 
  renderStream.on('data', chunk => {
    if (firstChunk) {
      // send down initial store state
      if (context.initialState) {
        res.write(`<script>window.__INITIAL_STATE__=${
          serialize(context.initialState, { isJSON: true })
        }</script>`)
      }
      firstChunk = false
    }
    res.write(chunk)
  })

  renderStream.on('end', () => {
    console.log('request used: ' + (Date.now() - start) + 'ms')
    res.end(`<script src="/client-bundle.js"></script></body>`)
  })

  renderStream.on('error', err => {
    throw err
  })
})

app.listen(3000, () => {
  console.log('ready at localhost:3000')
})
