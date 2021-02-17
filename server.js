// requirements
const express = require('express')
const Ajv = require('ajv').default
const bodyParser = require('body-parser')
const userJsonSchema = require('./schemas/createUserSchema.json')

const app = express()
app.use(bodyParser.json())


// variables
const listenPort = 42010
const baseURL = `http://portforward.ipt.oamk.fi:${listenPort}`




app.get('/', (req, res) => {
    res.send('BCI Graded Exercise')
})



app.post('/users', (req, res) => {
    
    const ajv = new Ajv()
    const validate = ajv.compile(userJsonSchema)
    const valid = validate(req.body)
    
    if (!valid) {
        console.log(validate.errors)
        res.status(400)
        res.json(validate.errors)
        return
    }
    
    res.status(201)
    res.json({
        "status": 201,
        "message": "User registered successfully"
    })
})




app.listen(listenPort, () => {
    console.log(`BCI-market API listening at ${baseURL}`)
  })