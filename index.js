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
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pago Exitoso | Hotel Isabel</title>

      <style>
        body {
          margin: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          color: white;
          text-align: center;
        }

        .card {
          background: white;
          color: #333;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          max-width: 500px;
          width: 90%;
          animation: fadeIn 0.8s ease-in-out;
        }

        h1 {
          color: #28a745;
          margin-bottom: 15px;
        }

        p {
          margin: 10px 0;
          font-size: 16px;
        }

        .btn {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 25px;
          background-color: #0d6efd;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          transition: 0.3s ease;
        }

        .btn:hover {
          background-color: #0b5ed7;
        }

        .icon {
          font-size: 60px;
          margin-bottom: 15px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>

      <script>
        setTimeout(function() {
          window.location.href = "https://hotel-isabel.com.mx/pagosonlinehotelisabel";
        }, 5000);
      </script>

    </head>
    <body>

      <div class="card">
        <div class="icon">✅</div>
        <h1>¡Pago realizado con éxito!</h1>
        <p>Tu transacción ha sido procesada correctamente.</p>
        <p>Gracias por confiar en Hotel Isabel.</p>
        <p>En unos segundos serás redirigido automáticamente.</p>

        <a href="https://hotel-isabel.com.mx/pagosonlinehotelisabel" class="btn">
          Realizar otro pago
        </a>
      </div>

    </body>
    </html>
  `)

})

/* =====================
   SERVER
===================== */

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
})





