require('dotenv').config()

const express = require('express')
const helmet = require('helmet')
const axios = require('axios')
const morgan = require('morgan')

const app = express()

/* =====================
   MIDDLEWARES
===================== */

app.use(morgan('dev'))
app.use(
  helmet({
    contentSecurityPolicy: false
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/* =====================
   CONFIG
===================== */

const PORT = process.env.PORT || 3000
const BASE_URL = process.env.BASE_URL

if (!BASE_URL) {
  console.error('❌ Falta BASE_URL en variables de entorno')
  process.exit(1)
}

/* =====================
   ROUTES
===================== */

// Página principal
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Pago Hotel Isabel</title>
      <style>
        body {
          font-family: Arial;
          background: #f5f5f5;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }

        form {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,.1);
        }

        input, button {
          width: 100%;
          margin-top: 10px;
          padding: 10px;
        }

        button {
          background: #2c7be5;
          color: white;
          border: none;
          cursor: pointer;
        }
      </style>
    </head>

    <body>
      <form method="POST" action="/crear-pago">

        <h2>Pago Hotel Isabel</h2>

        <label>Monto (MXN)</label>
        <input 
          type="number" 
          name="amount" 
          step="0.01" 
          min="1"
          required
        />

        <button type="submit">Pagar</button>

      </form>
    </body>
    </html>
  `)
})


// Crear pago
app.post('/crear-pago', async (req, res) => {

  const amount = Number(req.body.amount)

  /* VALIDACIÓN */
  if (!amount || amount <= 0) {
    return res.status(400).send('Monto inválido')
  }

  try {

    console.log('💳 Creando pago por:', amount)

    const response = await axios.post(
      `https://sandbox-api.openpay.mx/v1/${process.env.OPENPAY_MERCHANT_ID}/charges`,
      {
        method: 'card',
        amount,
        currency: 'MXN',
        description: 'Pago reserva Hotel Isabel',
        confirm: false,

        redirect_url: `${BASE_URL}/pago-exitoso`,

        customer: {
          name: 'Cliente',
          last_name: 'Hotel',
          email: 'cliente@hotel.com'
        }
      },
      {
        auth: {
          username: process.env.OPENPAY_PRIVATE_KEY,
          password: ''
        }
      }
    )

    console.log('✅ Pago creado:', response.data.id)

    res.redirect(response.data.payment_method.url)

  } catch (err) {

    console.error('❌ Error OpenPay:')

    if (err.response) {
      console.error(err.response.data)
    } else {
      console.error(err.message)
    }

    res.status(500).send('Error al procesar el pago')
  }

})


// Resultado
app.get('/pago-exitoso', (req, res) => {

  res.send(`
    <h1>Pago en proceso</h1>
    <p>Estamos validando tu transacción.</p>
    <p>Gracias por tu preferencia.</p>
  `)

})

/* =====================
   SERVER
===================== */

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
})





