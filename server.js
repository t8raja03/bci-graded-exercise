// requirements
const express = require('express')
const Ajv = require('ajv').default
const bodyParser = require('body-parser')
const createUserJsonSchema = require('./schemas/createUserSchema.json') // Käyttäjän luomiseen käytettävä schema

const app = express()
app.use(bodyParser.json())


// variables
const listenPort = 42010
const baseURL = `http://portforward.ipt.oamk.fi:${listenPort}`




app.get('/', (req, res) => {
    res.send('BCI Graded Exercise')
})



app.post('/users', (req, res) => {
    
    const ajv = new Ajv()                               // Käytetään ajv:ta varmistamaan
    const validate = ajv.compile(createUserJsonSchema)  // pyynnön bodyn oikea muoto
    const valid = validate(req.body)    

    if (!valid) {                                       // Jos pyynnön body on muotoiltu
        console.log(validate.errors)                    // väärin, lähetetään status 400
        res.status(400)                                 // ja AJV:n virheviestips 
        res.json(validate.errors)                       // vastauksena
        return
    }
    
    statusCode = 201
    res.status(statusCode)                          // Jos pyyntö onnistuu,
    res.json({                                      // status = 201 ja
        "status": statusCode,                       // vastataan lyhyellä
        "message": "User registered successfully"   // JSON-viestillä.
    })
    
})




app.listen(listenPort, () => {
    console.log(`BCI-market API listening at ${baseURL}`)
  })