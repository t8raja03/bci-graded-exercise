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
const fs = require('fs')
const multer = require('multer')
const upload = multer({ dest: 'uploads/tmp/' })
const jwtSecretKey = require('./secrets.json')
const createUserJsonSchema = require('./schemas/createUserSchema.json') // Käyttäjän luomiseen käytettävä schema
const itemSchema = require('./schemas/itemSchema.json')


/**************** Variables *********************/
const listenPort = 42010
const baseURL = `http://portforward.ipt.oamk.fi:${listenPort}`
let options = {}    // JWT options


/**************** Data **************************/

users = [
    {
        "idUser": "b2xsaS5vc3RhamFAcG9zdGkuY29t",
        "firstName": "Olli",
        "lastName": "Ostaja",
        "email": "olli.ostaja@posti.com",
        "dateCreated": 1613413844,
        "dateModified": 1613413844,
        "tel": "+35881234567",
        "password": "$2y$10$9nlCG7OwYW9QqE5/Ofd/UeUvvIvArY22BjM7SphFuaXhJ4QYw42je"
    },
    {
        "idUser": "bXl5QG15eW50aS5uZXQ=",
        "firstName": "Myy",
        "lastName": "Myyjätär",
        "email": "myy@myynti.net",
        "dateCreated": 1613413844,
        "dateModified": 1613500255,
        "tel": "0505556677",
        "password": "$2y$10$ZQg5T28.f0/oirjuInEZlefrBVdClfzlan9BqCvoUmaQXITzMExSC"
    },
    {
        "idUser": "a2F1a28ua2F0c2VsaWphQGdtYWlsLmNvbQ==",
        "firstName": "Kauko",
        "lastName": "Katselija",
        "email": "kauko.katselija@gmail.com",
        "dateCreated": 1613654361,
        "dateModified": 1613654361,
        "tel": "0501235678",
        "password": "$2y$10$ZQg5T28.f0/oirjuInEZlefrBVdClfzlan9BqCvoUmaQXITzMExSC"
    }
];

items = [
    {
        "idItem": "YlhsNVFHMTVlVzUwYVM1dVpYUT1PcGVsIENvcnNhLCBnb29kIGNvbmRpdGlvbg==",
        "title": "Opel Corsa, good condition",
        "description": "Opel Corsa m.y. 1998, must be inspected until the end of the month",
        "category": "Cars",
        "location": "Rovaniemi",
        "askingPrice": 200,
        "datePosted": 1613592071,
        "dateModified": 1613592071,
        "canShip": false,
        "idUser": "bXl5QG15eW50aS5uZXQ=",
        "images": []
      },
      {
        "idItem": "YjJ4c2FTNXZjM1JoYW1GQWNHOXpkR2t1WTI5dEEgcGFpbnRpbmc=",
        "title": "A painting",
        "description": "A beatiful painting of the ocean floor",
        "category": "Art",
        "location": "Strasbourg",
        "askingPrice": 2000,
        "datePosted": 1613647147,
        "dateModified": 1613647147,
        "canShip": false,
        "idUser": "b2xsaS5vc3RhamFAcG9zdGkuY29t",
        "images": []
      },
      {
        "idItem": "YlhsNVFHMTVlVzUwYVM1dVpYUT1DaGlsZHJlbidzIHdpbnRlciBvdmVyYWxscw==",
        "title": "Children's winter overalls",
        "description": "A very thick overall for children under 90cm. Holes only in the knees, elbows and sitting area.",
        "category": "Clothing",
        "location": "Oslo",
        "askingPrice": 50,
        "datePosted": 1613654361,
        "dateModified": 1613654361,
        "canShip": true,
        "idUser": "bXl5QG15eW50aS5uZXQ=",
        "images": []
      },
      {
        "idItem": "YjJ4c2FTNXZjM1JoYW1GQWNHOXpkR2t1WTI5dEEgZG9nJ3MgY29sbGFy",
        "title": "A dog's collar",
        "description": "Very good leather collar.",
        "category": "Clothing",
        "location": "Oulu",
        "askingPrice": 5,
        "datePosted": 1613654161,
        "dateModified": 1613654161,
        "canShip": true,
        "idUser": "b2xsaS5vc3RhamFAcG9zdGkuY29t",
        "images": []
      },
      {
        "idItem": "YlhsNVFHMTVlVzUwYVM1dVpYUT1GaWF0IFB1bnRvIDIwMTQgMTYgdmFsdmU=",
        "title": "Fiat Punto 2014 16 valve",
        "description": "Good car. Small car. Leaks oil slightly.",
        "category": "Cars",
        "location": "Strasborough",
        "askingPrice": 150,
        "datePosted": 1613654161,
        "dateModified": 1613654161,
        "canShip": true,
        "idUser": "bXl5QG15eW50aS5uZXQ=",
        "images": []
      },
      {
        "idItem": "YlhsNVFHMTVlVzUwYVM1dVpYUT1LYWogU3RlbnZhbGxzIHBhaW50aW5nIG9mIGEgZmFtb3VzIGR1Y2s=",
        "title": "Kaj Stenvalls painting of a famous duck",
        "description": "Nice painting to keep in a safe somewhere",
        "category": "Art",
        "location": "Paris",
        "askingPrice": 10000,
        "datePosted": 1613340000,
        "dateModified": 1613340000,
        "canShip": true,
        "idUser": "bXl5QG15eW50aS5uZXQ=",
        "images": []
      }
];



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
    var statusCode = 500
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
        const basicAuthUser = users.find(u => u.email === username)

        // Check username
        if (basicAuthUser === undefined) {
            // jos käyttäjänimeä ei löydy
            console.log(`               No user with name ${username} found`)
            return done(null, false)
        }

        // Check password
        if(bcrypt.compareSync(password, basicAuthUser.password) === false) {
            // jos salasana ei täsmää
            console.log(`               Invalid password for ${username}`)
            return done(null, false)
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

///// Status-viestien luomista helpottamaan
// Palauttaa vain statusSchema-muotoisen JSON-objektin
function statusMessage (code, message) {
    var statusObject = {
        status: code,
        message: message
    }
    return statusObject
}



/************************  Reitit: *****************************/

app.get('/', (req, res) => {
    res.status(200).json({
        app: 'BCI Graded Exercise',
        author: 'Rankinen Jarno TVT19KMO',
	documentation: 'http://portforward.ipt.oamk.fi:41010/'
    })
})

/********************
 * TESTAUSTA VARTEN * 
 * käyttäjien listaus*
 ********************/
app.get('/users', (req, res) => {
    res.json(users)
})

// Uuden käyttäjän luominen
app.post('/users', (req, res) => {
    
    const ajv = new Ajv()                               // Käytetään ajv:ta varmistamaan
    const validate = ajv.compile(createUserJsonSchema)  // pyynnön bodyn oikea muoto
    const valid = validate(req.body)    

    if (!valid) {                                       // Jos pyynnön body on muotoiltu
        //console.log(validate.errors)                  // väärin, lähetetään status 400
        statusCode = 400
        res.status(statusCode).json(statusMessage(statusCode, 'Invalid request'))
        return
    }

    // Date().valueOf() palauttaa millisekunteja UNIX epochista,
    // joten jotta saadaan varsinainen UNIX epoch-aika, täytyy
    // jakaa 1000 ja pyöristää alaspäin
    var today = new Date().valueOf()
    var epoch = Math.floor(today / 1000)    

    // Luodaan uusi user-objekti johon esitäytetään pakolliset arvot
    var newUser = {
        id: Buffer.from(req.body.email).toString('base64'),
        firstName: '',
        lastName: '',
        email: req.body.email,
        dateCreated: epoch,
        dateModified: epoch,
        tel: '',
        password: ''
    }

    // Luetaan muut kentät pyynnöstä, jos ne on määritelty
    if (req.body.firstName !== undefined) newUser.firstName = req.body.firstName
    if (req.body.lastName !== undefined) newUser.lastName = req.body.lastName
    if (req.body.tel !== undefined) newUser.tel = req.body.tel

    // Salasanan hash ja lisäys newUseriin
    var userPassword = bcrypt.hashSync(req.body.password)
    newUser.password = userPassword
    
    users.push(newUser)     // Lisätään newUser users-arrayhin
    
    // Jos pyyntö onnistuu, status = 201
    var statusCode = 201
    res.status(statusCode)
    .json(statusMessage(statusCode, 'User registered succesfully'))
    // })
    
})


// Palvelimelle kirjautuminen, ts. tokenin hakeminen
app.get('/users/login', passport.authenticate('basic', { session: false }),
        (req, res) => {

            // Haetaan ensin käyttäjän idUser sähköpostiosoitteen perusteella
            var userIndex = users.findIndex( ({email}) => email === req.user.email)
            var idUser = users[userIndex].idUser

            // Muodostetaan token
            const body = {
                email: req.user.email,
                idUser: idUser
            }

            const payload = {
                user: body
            }

            const options = {
                expiresIn: '8h'
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
    var user = users.find( ({idUser}) => idUser == req.params.id)

    // Haetaan idUser auth. tokenista
    var tokenArray = req.headers.authorization.split(' ')   // Erotetaan token headereista
    var decodedToken = jwt.decode(tokenArray[1])            // puretaan tokenin data
    var idUser = decodedToken.user.idUser                   // otetaan idUser datasta

    if (idUser !== req.params.id) {                      // jos yrittää katsoa muiden käyttäjien
        var statusCode = 401                                // tietoja
        res.status(statusCode)
        .json(statusMessage(statusCode, 'You are only authorized to view your own user information'))
        return
    }

    // Jos käyttäjä on olemassa ja katsoo omia tietojaan
    res.status(200)
    res.json(user)
})



app.get('/users/:id/items', passport.authenticate('jwt', { session: false }), (req, res) => {

    // Haetaan idUser auth. tokenista
    var tokenArray = req.headers.authorization.split(' ')   // Erotetaan token headereista
    var decodedToken = jwt.decode(tokenArray[1])            // puretaan tokenin data
    var idUser = decodedToken.user.idUser                   // otetaan idUser datasta

    if (idUser !== req.params.id) {                      // jos yrittää katsoa muiden käyttäjien
        var statusCode = 401                                // tietoja
        res.status(statusCode)
        .json(statusMessage(statusCode, 'You are only authorized to see your own items filtered by user'))
        return
    }

    // Jos käyttäjä on olemassa ja katsoo omia tietojaan
    var userItems = items.filter( ({idUser}) => idUser == req.params.id)

    res.status(200)
    res.json(userItems)
})


// Tavaroiden poisto
app.delete('/items/:idItem', passport.authenticate('jwt', { session: false }), (req, res) => {

    // Haetaan tavaran tiedot items-taulukosta
    var item = items.find( ({idItem}) => idItem === req.params.idItem)

    // Haetaan idUser auth. tokenista
    var tokenArray = req.headers.authorization.split(' ')   // Erotetaan token headereista
    var decodedToken = jwt.decode(tokenArray[1])            // puretaan tokenin data
    var tokenIdUser = decodedToken.user.idUser                   // otetaan idUser datasta

    if (item === undefined) {   // jos itemiä ei ole olemassa
        var statusCode = 404
        res.status(statusCode)
        .json(statusMessage(statusCode, `Item ${req.params.idItem} not found`))
        return
    }
    if (item.idUser !== tokenIdUser) { // jos item ei ole käyttäjän luoma
        var statusCode = 401
        res.status(statusCode)
        .json(statusMessage(statusCode, 'You are only authorized to delete your own items'))
        return
    }

    // Jos käyttäjä ja item on olemassa ja käyttäjä omistaa itemin
    items = items.filter( ({idItem}) => idItem != req.params.idItem)


    var statusCode = 202                    
    res.status(statusCode)
    .json(statusMessage(statusCode, `Item ${req.params.idItem} deleted succesfully`))
})



// Tavaroiden muokkaus
app.put('/items/:idItem', passport.authenticate('jwt', { session: false }), (req, res) => {

    // Haetaan tavaran tiedot items-taulukosta
    var item = items.find( ({idItem}) => idItem === req.params.idItem)

    // Haetaan idUser auth. tokenista
    var tokenArray = req.headers.authorization.split(' ')   // Erotetaan token headereista
    var decodedToken = jwt.decode(tokenArray[1])            // puretaan tokenin data
    var tokenIdUser = decodedToken.user.idUser                   // otetaan idUser datasta

    if (item === undefined) {   // jos itemiä ei ole olemassa
        var statusCode = 404
        res.status(statusCode)
        .json(statusMessage(statusCode, `Item ${req.params.idItem} not found`))
        return
    }
    if (item.idUser !== tokenIdUser) { // jos item ei ole käyttäjän luoma
        var statusCode = 401
        res.status(statusCode)
        .json(statusMessage(statusCode, 'You are only authorized to delete your own items'))
        return
    }

    // Jos käyttäjä ja item on olemassa ja käyttäjä omistaa itemin
    if (req.body.title !== undefined) {
        item.title = req.body.title
    }
    if (req.body.description !== undefined) {
        item.description = req.body.description
    }
    if (req.body.category !== undefined) {
        item.category = req.body.category
    }
    if (req.body.location !== undefined) {
        item.location = req.body.location
    }
    if (req.body.askingPrice !== undefined) {
        item.askingPrice = req.body.askingPrice
    }
    if (req.body.canShip !== undefined) {
        item.canShip = req.body.canShip
    }

    // Update dateModified of the item to current UNIX epoch timestamp
    var today = new Date().valueOf()
    var epoch = Math.floor(today / 1000)
    item.dateModified = epoch


    var statusCode = 202                    
    res.status(statusCode)
    .json(statusMessage(statusCode, `Item ${req.params.idItem} modified succesfully`))
})



// Kaikkien myytävien listaus ja rajaus
app.get('/items', (req, res) => {

    // Kopioidaan ensin items-array,
    // jotta ei tehdä muutoksia siihen:
    // lähde: https://holycoders.com/javscript-copy-array/
    var itemsList = [...items]

        // Suodatetaan itemsListiä parametrien mukaan:        
        if(req.query.category !== undefined) {   // Jos query-parametrina on category:
            itemsList = itemsList.filter( ({category}) => category === req.query.category)
        }        
        if(req.query.location !== undefined) {   // Jos location:
            itemsList = itemsList.filter( ({location}) => location === req.query.location)
        }        
        if(req.query.date !== undefined) {       // Jos date:
            var qDay = epochToDate(req.query.date)  // Pyynnön päivämäärä
            // suodatetaan pyynnön päivämäärän perusteella
            itemsList = itemsList.filter( ({datePosted}) => epochToDate(datePosted) === qDay)
        }
        if (itemsList.length === 0) {
            var statusCode = 404
            res.status(statusCode)
            .json(statusMessage(statusCode, 'No items found with query parameters'))
            return
        }

        res.status(200)
        res.json(itemsList)
    })

app.post('/items', passport.authenticate('jwt', { session: false }), (req, res) => {
    const ajv = new Ajv()                               // Käytetään ajv:ta varmistamaan
    const validate = ajv.compile(itemSchema)            // pyynnön bodyn oikea muoto
    const valid = validate(req.body)    

    if (!valid) {                                       // Jos pyynnön body on muotoiltu
        //console.log(validate.errors)                  // väärin, lähetetään status 400
        statusCode = 400
        res.status(statusCode).json(statusMessage(statusCode, 'Invalid request'))
        return
    }

    // Date().valueOf() palauttaa millisekunteja UNIX epochista,
    // joten jotta saadaan varsinainen UNIX epoch-aika, täytyy
    // jakaa 1000 ja pyöristää alaspäin
    var today = new Date().valueOf()
    var epoch = Math.floor(today / 1000)
    
    // Haetaan idUser auth. tokenista
    var tokenArray = req.headers.authorization.split(' ')   // Erotetaan token headereista
    var decodedToken = jwt.decode(tokenArray[1])            // puretaan tokenin data
    var idUser = decodedToken.user.idUser                   // otetaan idUser datasta

    // ensin määritellään uusi idItem: haetaan taulukon viimeisen elementin idItem
    // ja kasvatetaan yhdellä
    var id = Buffer.from(idUser + req.body.description).toString('base64')
    // Luodaan uusi item-objekti
    var newItem = {
        idItem: id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        location: req.body.location,
        askingPrice: Number(req.body.askingPrice),
        datePosted: epoch,
        dateModified: epoch,
        canShip: Boolean(req.body.canShip),
        idUser: idUser
    }
    
    items.push(newItem)     // Lisätään newUser users-arrayhin
    
    // Jos pyyntö onnistuu, status = 201
    var statusCode = 201
    res.status(statusCode)
    .json(statusMessage(statusCode, 'Item posted succesfully'))
    // })
})



app.post('/upload/:idItem', passport.authenticate('jwt', { session: false }), upload.array('uploads', 4), (req, res, next) => {

    // Haetaan idUser auth. tokenista
    var tokenArray = req.headers.authorization.split(' ')   // Erotetaan token headereista
    var decodedToken = jwt.decode(tokenArray[1])            // puretaan tokenin data
    var idUser = decodedToken.user.idUser                   // otetaan idUser datasta

    req.files.forEach(file => {

        var fileExtension = file.mimetype.split('/')[1]     // Luetaan tiedoston pääte
        
        try {
            // Luodaan käyttäjän tiedostoille kansiot (./uploads/idUser/)
            if (!fs.existsSync(`./uploads/${idUser}`)) {
                fs.mkdirSync(`./uploads/${idUser}`)
            }

            // Siirretään ja nimetään tiedosto uudestaan (./uploads/idUser/idItem.1.jpg)
            fs.renameSync(file.path, `./uploads/${idUser}/${req.params.idItem}.1.${fileExtension}`, function (err) {
                if (err) throw err    
            })

        } catch (error) {
            throw error;
        }
    })

    var statusCode = 201
    res.status(statusCode).json(statusMessage(statusCode, 'Upload successfull'))

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
    },
    users: users,   // Testejä varten
    items: items    //    - " -
}
