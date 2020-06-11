const puppeteer = require('puppeteer')
const express = require("express")
const cors = require('cors')
const fetch = require('node-fetch')
const morgan = require('morgan')
const fs = require('fs')

const app = express()
app.use(cors())
app.use(express.json({limit: '50mb'}))
app.use(morgan('common'))

const router = express.Router()

let _tailwind = null

router.get('', (req, res) => {
  res.json({ ok: "ok" })
})

async function generate(data, css) {
  data = `<html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500&display=swap" rel="stylesheet">
        <link href="https://unpkg.com/tailwindcss@1.4.6/dist/tailwind.min.css" rel="stylesheet">
        <style>
          ${css}
        </style>
      </head>
      <body>
        ${data}
      </body>
    </html>`
  try {
    const b = await puppeteer.launch({ args: ["--no-sandbox"] })
    const p = await b.newPage()
    
    await p.setContent(data, { waitUntil: 'networkidle2' })
    const pdf = await p.pdf({ printBackground: true, format: 'A4' })
    await b.close()
    return pdf
  } catch (error) {
    console.log(error)
    return null
  }
}

async function tailwind() {
  if (!_tailwind) {
    _tailwind = await (await fetch('https://unpkg.com/tailwindcss@1.4.6/dist/tailwind.min.css')).text()
  }
  return _tailwind;
}

router.post('', async (req, res) => {
  if (!req.body.content || req.body.content.length === 0) {
    return res.status(422).send("Missing content")
  }
  const pdf = await generate(req.body.content, req.body.css)
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Length': pdf.length
  })
  res.send(pdf)
})

app.use('/', router)

const port = process.env.PORT || 3000

app.listen(port, () => console.log(`:${port}`))