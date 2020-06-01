const express = require("express")
const serverless = require("serverless-http")
const puppeteer = require('puppeteer')
const cors = require('cors')


const app = express()
// app.use(cors())
app.use(express.json())

const router = express.Router()

router.use(cors())
router.get('', (req, res) => {
  res.json({ ok: "ok" })
})

async function generate(data, css) {
  data = `
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500&display=swap" rel="stylesheet">
        <style>
          ${tailwind()}
          ${css}
        </style>
      </head>
      <body>
        ${data}
      </body>
    </html>
  `
  const b = await puppeteer.launch({ args: ['--no-sandbox'] })
  const p = await b.newPage()
  await p.setContent(data)
  const pdf = await p.pdf({ printBackground: true, format: 'A4' })
  await b.close()
  return pdf
}

async function tailwind() {
  return await (
    await fetch("https://unpkg.com/tailwindcss@1.4.6/dist/tailwind.min.css      ")
  ).text();
}


router.post('', async (req, res) => {
  if (!req.body.content || req.body.content.length === 0) {
    return res.send("Missing content")
  }
  const pdf = await generate(req.body.content, req.body.css)
  res.contentType("application/pdf")
  res.send(pdf)
})

app.use("/.netlify/functions/api", router)

module.exports.handler = (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: "Method not allowed"}
  }
  const body = JSON.parse(event.body)
  if (!body.content || body.content.length === 0) {
    return { statusCode: 422, body: "Missig content"}
  }
  return {statusCode: 200, body: "NICE"}
}