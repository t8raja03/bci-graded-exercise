/************** Requirements *******************/
const express = require('express')
const Ajv = require('ajv').default
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const BasicStrategy = require('passport-http').BasicStrategy
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const jwtSecretKey = require('./secrets.json')
const createUserJsonSchema = require('./schemas/createUserSchema.json') // Käyttäjän luomiseen käytettävä schema


/**************** Variables *********************/
const listenPort = 42010
const baseURL = `http://portforward.ipt.oamk.fi:${listenPort}`
let options = {}    // JWT options




/**************** Data **************************/

users = [
    {
        "idUser": 0,
        "firstName": "Olli",
        "lastName": "Ostaja",
        "email": "olli.ostaja@posti.com",
        "dateCreated": 1613413844,
        "dateModified": 1613413844,
        "tel": "+35881234567",
        "password": "$2y$10$9nlCG7OwYW9QqE5/Ofd/UeUvvIvArY22BjM7SphFuaXhJ4QYw42je"
    },
    {
        "idUser": 1,
        "firstName": "Myy",
        "lastName": "Myyjätär",
        "email": "myy@myynti.net",
        "dateCreated": 1613413844,
        "dateModified": 1613500255,
        "tel": "0505556677",
        "password": "$2y$10$ZQg5T28.f0/oirjuInEZlefrBVdClfzlan9BqCvoUmaQXITzMExSC"
    }
]

items = [
    {
        "idItem": 0,
        "title": "Opel Corsa, good condition",
        "description": "Opel Corsa m.y. 1998, must be inspected until the end of the month",
        "category": "Cars",
        "location": "Rovaniemi",
        "askingPrice": 200,
        "datePosted": 1613592071,
        "dateModified": 1613592071,
        "canShip": false,
        "idUser": 1
      },
      {
        "idItem": 1,
        "title": "A painting",
        "description": "A beatiful painting of the ocean floor",
        "category": "Art",
        "location": "Strasbourg",
        "askingPrice": 2000,
        "datePosted": 1613647147,
        "dateModified": 1613647147,
        "canShip": false,
        "idUser": 0
      }
]



/************************ Middlewaret *******************************/
  
const app = express()
app.use(express.json())
app.use(bodyParser.json())


///// Jos määritettyä reittiä ei ole, palautetaan vastaus JSON-muodossa
// Expressin oletus HTML-vastauksen sijasta.
// Tämä täytyy olla määritetty viimeiseksi ketjussa (reittien jälkeen!)
// Lähde: https://ourcodeworld.com/articles/read/261/how-to-create-an-http-server-with-express-in-node-js
function jsonRouteNotFound (req, res, next) {
    res.status(404).json({
        status: 404,
        message: `Cannot ${req.method} ${req.originalUrl}`
    })
}


///// Myös palvelimen virheilmoitukset JSON-muodossa
// Tämä myös käyttöön vasta reittien jälkeen
function jsonServerError (err, req, res, next) {
    statusCode = 500
    console.error(err.stack)
    res.status(statusCode).json({
        status: statusCode,
        message: "Server error: " + err.stack.split('\n')[0]
    })
}


///// Passportin HTML Basic - autentikointi    
passport.use(new BasicStrategy(
    function(username, password, done) {
        // Tässä määritellään mitä tehdään, kun tulee Basic Auth-pyyntö

        // katsotaan onko käyttäjä olemassa yllä määritellyssä users-taulukossa
        const basicAuthUser = users.find(u => u.email == username)

        // Check username
        if (basicAuthUser == undefined) {
            // jos käyttäjänimeä ei löydy
            console.log(`               No user with name ${username} found`)
            return done(null, false, { message: "Invalid username for HTTP Basic Authentication"})
        }

        // Check password
        if(bcrypt.compareSync(password, basicAuthUser.password) == false) {
            // jos salasana ei täsmää
            console.log(`               Invalid password for ${username}`)
            return done(null, false, { message: "Invalid password for HTTP Basic Authentication"})
        }

        // Jos käyttäjänimi ja salasana täsmäävät
        // console.log(`User ${username} authorized via HTTP Basic Auth`)
        return done(null, basicAuthUser)
    }
))

///// JWT asetukset
// Määritellään, että JWT kulkee headerissa Bearer Tokenina:
options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
// Luetaan salasana secrets.json -tiedostosta
options.secretOrKey = jwtSecretKey.key

passport.use(new JwtStrategy(options, function(jwt_payload, done) {
    // Tässä määritellään, mitä tapahtuu kun autentikointi onnistuu
    // console.log('Processing JWT payload for token content:')
    // console.log(jwt_payload)
    done(null, jwt_payload.user)
}))


///// Ei middleware, mutta muuten tarvittu funktio
// Muuntaa parametrina saadun UNIX-epoch -kellonajan stringiksi,
// jossa on vain päivämäärä
function epochToDate (epoch) {
    var queryDate = new Date(0)     // Luodaan ensin uusi Date hetkeen 1.1.1970 00:00
    queryDate.setUTCSeconds(epoch)  // asetetaan Date parametrina saatuun arvoon
    return queryDate.toDateString() // Palautetaan pelkkä päivämäärä stringinä
}



/************************  Reitit: *****************************/

app.get('/', (req, res) => {
    res.json({
        app: 'BCI Graded Exercise',
        author: 'Rankinen Jarno TVT19KMO'
    })
})


// Uuden käyttäjän luominen
// TÄSTÄ PUUTTUU VIELÄ VARSINAINEN KÄYTTÄJÄN LUOMINEN
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


// Palvelimelle kirjautuminen, ts. tokenin hakeminen
app.get('/users/login', passport.authenticate('basic', { session: false }),
        (req, res) => {

            // Haetaan ensin käyttäjän idUser sähköpostiosoitteen perusteella
            userIndex = users.findIndex( ({email}) => email === req.user.email)
            idUser = users[userIndex].idUser

            // Muodostetaan token
            const body = {
                email: req.user.email,
                idUser: idUser
            }

            const payload = {
                user: body
            }

            const options = {
                expiresIn: '5min'
            }

            const tkn = jwt.sign(payload, jwtSecretKey.key, options)

            // Vastauksena token ja käyttäjän idUser
            res.status(202)
            return res.json({ 
                "token": tkn,
                "idUser": idUser
            })
        })


// Käyttäjän _omien_ tietojen katselu
app.get('/users/:id', passport.authenticate('jwt', { session: false }), (req, res) => {

    // Tarkistetaan ensin, onko käyttäjä olemassa   
    user = users.find( ({idUser}) => idUser == req.params.id)

    // Haetaan idUser auth. tokenista
    tokenArray = req.headers.authorization.split(' ')   // Erotetaan token headereista
    decodedToken = jwt.decode(tokenArray[1])            // puretaan tokenin data
    idUser = decodedToken.user.idUser                   // otetaan idUser datasta

    if (user == undefined) {    // jos ei ole olemassa
        statusCode = 404
        res.status(statusCode)
        res.json({
            "status": statusCode,
            "message": `User ${req.params.id} not found`
        })
        return
    }
    else if (idUser != req.params.id) {     // jos yrittää katsoa muiden käyttäjien
        statusCode = 401                    // tietoja
        res.status(statusCode)
        res.json({
            "status": statusCode,
            "message": 'You are only authorized to view your own user information'
        })
        return
    }

    // Jos käyttäjä on olemassa ja katsoo omia tietojaan
    res.status(200)
    res.json(user)
})



app.get('/users/:id/items', passport.authenticate('jwt', { session: false }), (req, res) => {

    // Tarkistetaan ensin, onko käyttäjä olemassa   
    user = users.find( ({idUser}) => idUser == req.params.id)

    // Haetaan idUser auth. tokenista
    tokenArray = req.headers.authorization.split(' ')   // Erotetaan token headereista
    decodedToken = jwt.decode(tokenArray[1])            // puretaan tokenin data
    idUser = decodedToken.user.idUser                   // otetaan idUser datasta

    if (user == undefined) {    // jos ei ole olemassa
        statusCode = 404
        res.status(statusCode)
        res.json({
            "status": statusCode,
            "message": `User ${req.params.id} not found`
        })
        return
    }
    else if (idUser != req.params.id) {     // jos yrittää katsoa muiden käyttäjien
        statusCode = 401                    // tietoja
        res.status(statusCode)
        res.json({
            "status": statusCode,
            "message": `You are only authorized to see your own items filtered by user`
        })
        return
    }

    // Jos käyttäjä on olemassa ja katsoo omia tietojaan
    userItems = items.filter( ({idUser}) => idUser == req.params.id)

    res.status(200)
    res.json(userItems)
})



// Kaikkien myytävien listaus ja rajaus
app.get('/items', (req, res) => {

    // Kopioidaan ensin items-array,
    // jotta ei tehdä muutoksia siihen:
    // lähde: https://holycoders.com/javscript-copy-array/
    itemsList = [...items]

        // Suodatetaan itemsListiä parametrien mukaan:
        // Jos query-parametrina on category:
        if(req.query.category != undefined) {
            itemsList = itemsList.filter( ({category}) => category === req.query.category)
        }
        // Jos location:
        if(req.query.location != undefined) {
            itemsList = itemsList.filter( ({location}) => location === req.query.location)
        }
        // Jos date:
        if(req.query.date != undefined) {
            var qDay = epochToDate(req.query.date)  // Pyynnön päivämäärä
            // suodatetaan pyynnön päivämäärän perusteella
            itemsList = itemsList.filter( ({datePosted}) => epochToDate(datePosted) === qDay)
        }
        if (itemsList.length === 0) {
            statusCode = 404
            res.status(statusCode)
            res.json({
                status: statusCode,
                message: "No items found with query parameters"
            })
            return
        }

        res.status(200)
        res.json(itemsList)
    })


app.use(jsonServerError)


app.use(jsonRouteNotFound)

let serverInstance = null       // Tähän muuttujaan tallenetaan app.listen()
                                // palauttama objekti

// näihin funktioihin päästään käsiksi muista tiedostoista,                                
module.exports = {
    start: () => {
        // rajapinnan käynnistys:
        serverInstance = app.listen(listenPort, () => {
            // console.log(`BCI-market API listening at ${baseURL}`)
        })
    },
    close: () => {
        // rajapinnan lopetus:
        serverInstance.close()
    }
}