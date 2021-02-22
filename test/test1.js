const server = require('../server')
const chai = require('chai')
const chaiFiles = require('chai-files')
const expect = chai.expect
chai.use(require('chai-http'))
chai.use(require('chai-json-schema-ajv'))
chai.use(chaiFiles)
var file = chaiFiles.file;
var dir = chaiFiles.dir;
const rmrf = require('rimraf')  // POSIX rm -rf equivalent

// palvelimen URL
const testURL = 'http://localhost:42010'

// Schemat joita vastaan testataan
const userInfoSchema = require('../schemas/userInfoSchema.json')
const tokenResponseSchema = require('../schemas/tokenResponseSchema.json')
const itemListSchema = require('../schemas/itemListSchema.json')
const statusSchema = require('../schemas/statusSchema.json')

// HTTP Basic autentikointia varten base64-enkoodattu käyttäjätunnus:salasana
const authHeader = Buffer.from(`chai@tests.com:salasana`, 'utf-8').toString('base64')
var authToken = ''      // JWT token
var idTestUser = ''     // testeissä luodun käyttäjän idUser
var testItem = ''       // testeissä luotu item

// itemin/käyttäjän luomisen tarkistamista varten muuttujat. Nämä vastaavat
// server.js:ssä users- ja items- taulukoiden objektien määrää
// koska .length palauttaa integerin, arvo sijoitetaan muuttujaan
var nItems = server.items.length
var nUsers = server.user.length


// Ennen testejä käynnistetään serveri
before(() => server.start())

// Testien jälkeen pysäytetään serveri ja poistetaan testien aikana luodut
// tiedostot/kansiot
after(function () {
    server.close()
    rmrf.sync(`./uploads/${idTestUser}`)
})


describe('User registration and login', function() {

    describe('Test user registration', function() {
// Käyttäjän luominen väärin muotoillulla pyynnöllä
        it('should return a 400 JSON object with an invalid request (integer password)', async function() {
            await chai.request(testURL)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                "email": "chai@tests.com",
                "password": 1234
            })
            .then(response => {
                // status=400 ja vastaa statusSchemaa
                expect(response).to.have.status(400)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })

// Käyttäjän luominen
        it('should be able to register', async function() {
            nUsers += 1     // Kasvatetaan oletettujen käyttäjien määrää
            await chai.request(testURL)
            .post('/users')
            .send({
                "email": "chai@tests.com",
                "password": "salasana"
            })
            .then(response => {
                // status=201 ja vastaa statusSchemaa
                expect(response).to.have.status(201)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })

// Tarkistetaan, että käyttäjien määrä kasvoi     
        it('a user should actually be created', async function() {
            await chai.request(testURL)
            .get('/users')
            .then(response => {
                // status=200 ja vastauksessa on nUsersin verran objekteja
                expect(response).to.have.status(200)
                expect(response.body.length).to.equal(nUsers)
            })
            .catch(error => {
                throw error
            })
        })
        
    })


// Haetaan JWT token
    describe('Get bearer token', function() {
        it('should return an access token', async function() {
            await chai.request(testURL)
            .get('/users/login')
            .set('Authorization', `Basic ${authHeader}`)
            .then(response => {
                // status=201 ja vastaus vastaa tokenResponseSchemaa
                expect(response).to.have.status(202)
                expect(response.body).to.be.jsonSchema(tokenResponseSchema)
                authToken = response.body.token     // token talteen myöhempiä testejä varten
                idTestUser = response.body.idUser   // uuden käyttäjän id talteen
            })
            .catch(error => {
                throw error
            })
        })
    })

// Omien käyttäjätietojen haku
    describe('Check user info', function() {
        it('should be able to get own info', async function() {
            // Lähetetään http-pyyntö
            await chai.request(testURL)
            .get(`/users/${idTestUser}`)
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                // status=201 ja vastaa userInfoSchemaa
                expect(response).to.have.status(200)
                expect(response.body).to.be.jsonSchema(userInfoSchema)
            })
            .catch(error => {
                throw error
            })
        })

// Toisten käyttäjien tietojen haku
        it('should not be able to get other user\'s info', async function() {
            await chai.request(testURL)
            .get('/users/b2xsaS5vc3RhamFAcG9zdGkuY29t')
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                // 401 ja vastaa statusSchemaa
                expect(response).to.have.status(401)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })
    })

})



describe('Item listing, posting and modifying', function() {

    describe('Test item listing and posting', function() {

// Tavaroiden listaus
        it('should be able to list items', async function() {
            // Lähetetään http-pyyntö
            await chai.request(testURL)
            .get('/items')
            .then(response => {
                // 200 ja itemListSchema
                expect(response).to.have.status(200)
                expect(response.body).to.be.jsonSchema(itemListSchema)
            })
            .catch(error => {
                throw error
            })
        })

// Tavaroiden listauksen suodatus
        it('should be able to filter the items list', async function() {
            await chai.request(testURL)
            .get('/items')
            .query({
                category: 'Cars',
                location: 'Rovaniemi',
                date: '1613591900'
            })
            .then(response => {
                // status=200 ja itemListSchema
                expect(response).to.have.status(200)
                expect(response.body).to.be.jsonSchema(itemListSchema)
            })
            .catch(error => {
                throw error
            })
        })

// Ei osuvia, tarkistetaan että tulee JSON-muotoinen vastaus
        it('should return a 404 JSON object instead of an empty array',
            async function() {
                await chai.request(testURL)
                .get('/items')
                .query({
                    date: '0'
                })
                .then(response => {
                    // status=404 ja statusSchema
                    expect(response).to.have.status(404)
                    expect(response.body).to.be.jsonSchema(statusSchema)
                })
                .catch(error => {
                    throw error
                })
        })

// Kohteen luominen
        it('should be able to post items', async function() {
            await chai.request(testURL)
                .post('/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    "title": "A magical object for testing purposes",
                    "description": "The object starts to glow as you send it in a HTTP request",
                    "category": "Art",
                    "location": "Atlantis",
                    "askingPrice": 1,
                    "canShip": true
                })
                .then(response => {
                    nItems += 1     // Kasvatetaan oletettujen kohteiden määrää
                    // 201, statusSchema ja server.js:n items-taulukon objektien
                    // määrä == nItems
                    expect(response).to.have.status(201)
                    expect(response.body).to.be.jsonSchema(statusSchema)
                    expect(server.items.length).to.equal(nItems)
                })
                .catch(error => {
                    throw error
                })
        })

// Kohteen luominen väärin muodoillulla pyynnöllä
        it('should return a 400 JSON object when posting an invalid request', async function() {
            await chai.request(testURL)
            .post('/items')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                "title": "A magical object for testing purposes",
                "description": "The object starts to glow as you send it in a HTTP request",
                "category": "Art",
                "location": "Atlantis",
                "askingPrice": 1
            })
            .then(response => {
                // 400, statusSchema ja varmistetaan että kohteita ei poistettu
                // (server.items taulukon kohteiden määrä ei vähentynyt)
                expect(response).to.have.status(400)
                expect(response.body).to.be.jsonSchema(statusSchema)
                expect(server.items.length).to.equal(nItems)
            })
            .catch(error => {
                throw error
            })
        })

// Omien kohteiden listaus
        it('should be able to list own posted items', async function() {
            await chai.request(testURL)
            .get(`/users/${idTestUser}/items`)
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                // 200, itemListSchema
                expect(response).to.have.status(200)
                expect(response.body).to.be.jsonSchema(itemListSchema)
                testItem = response.body[0]
            })
            .catch(error => {
                throw error
            })
        })

// Muiden käyttäjien kohteiden listaus
        it('should return 401 for when trying to list other user\'s items', async function() {
            await chai.request(testURL)
            .get('/users/bXl5QG15eW50aS5uZXQ=')
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                // 401 ja statusSchema
                expect(response).to.have.status(401)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })
    })



    describe('Test item modifying and image uploading', function() {
// Tauko, jotta juuri luodun kohteen dateModified olisi eri kuin datePosted.
// Unix epoch on sekunteja, joten jos testit sattuvat samalle sekunnille,
// aikaleimat pysyvät samana
        it('wait 1 second to let timestamps be different in the next phase..', function(done) {
            setTimeout(done, 1000)
        })
// Kohteen muokkaus
        it('should be able to modify items', async function() {
            await chai.request(testURL)
            .put(`/items/${testItem.idItem}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                "description": "The object is obviously modified somehow"
            })
            .then(response => {
                expect(response).to.have.status(202)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })

// Varmistetaan kohteen muokkaus
        it('should actually modify items', function() {         
            chai.request(testURL)
            .get(`/users/${idTestUser}/items`)
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                // 200 ja vastauksen bodyssa tulevan taulukon ensimmmäinen alkion
                // datePosted ei saa olla sama kuin dateModified
                expect(response).to.have.status(200)
                expect(response.body[0].dateModified).to.not.equal(response.body[0].datePosted)
            })
            .catch(error => {
                throw error
            })
        })

// Muiden käyttäjien kohteiden muokkaus
        it('should not be able to modify other user\'s items', async function() {
            await chai.request(testURL)
            .put('/items/YlhsNVFHMTVlVzUwYVM1dVpYUT1PcGVsIENvcnNhLCBnb29kIGNvbmRpdGlvbg==')
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                expect(response).to.have.status(401)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })

// Kuvien lataus
        it('should be able to upload files', async function() {
            await chai.request(testURL)
            .post(`/upload/${testItem.idItem}`)
            .set('Authorization', `Bearer ${authToken}`)
            .attach('uploads', './test/testimage.png')
            .then(response => {
                // status 200, statusSchema
                // luotu kansio ./uploads/${idTestUser}
                // luotu tiedosto ./uploads/${idTestUser}/${testItem.idItem}.1.png
                // joka on sama tiedosto kuin ./test/testimage.png
                expect(response).to.have.status(201)
                expect(response.body).to.have.jsonSchema(statusSchema)
                expect(dir(`./uploads/${idTestUser}`)).to.exist
                expect(file(`./uploads/${idTestUser}/${testItem.idItem}.1.png`)).to.exist
                expect(file(`./uploads/${idTestUser}/${testItem.idItem}.1.png`))
                .to.equal(file('./test/testimage.png'))
            })
            .catch(error => {
                throw error
            })
        })

// Kuvien lataus muiden käyttäjien kohteisiin
        it('should be not be able to upload items to other users\' items', async function() {
            await chai.request(testURL)
            .post('/upload/YlhsNVFHMTVlVzUwYVM1dVpYUT1GaWF0IFB1bnRvIDIwMTQgMTYgdmFsdmU=')
            .set('Authorization', `Bearer ${authToken}`)
            // .set('Content-Type', 'multipart/form-data; boundary=' + boundary)
            .attach('uploads', './test/testimage.png')
            .then(response => {
                expect(response).to.have.status(401)
                expect(response.body).to.have.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })
    })

    
    describe('Test deleting items', function() {
    
// Kohteen poisto
        it('should be able to delete items', function() {
            nItems -= 1     // vähennetään oletettujen kohteiden määrää
            chai.request(testURL)
            .delete(`/items/${testItem.idItem}`)
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                expect(response).to.have.status(202)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })

// Poiston varmistus
        it('should actually delete items', function() {
            chai.request(testURL)
            .get('/items')
            .then(response => {
                // Items-taulukon pituus on yhtä suuri kuin nItems
                expect(response.body.length).to.equal(nItems)
            })
            .catch(error => {
                throw error
            })
        })

// Muiden käyttäjien kohteiden poisto
        it('should not be able to delete other user\'s items', function() {
            chai.request(testURL)
            .delete('/items/YlhsNVFHMTVlVzUwYVM1dVpYUT1PcGVsIENvcnNhLCBnb29kIGNvbmRpdGlvbg==')
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                expect(response).to.have.status(401)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })

        
    })

})


// Kokeillaan, että 404 error tulee JSON-muodossa
describe('Error message test', function() {



    describe('Check 404 response format', function() {
        it('should return 404 JSON object', async function() {
            await chai.request(testURL)
            .get('/thisroutedoesnotexist')
            .then(response => {
                expect(response).to.have.status(404)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })
    })
    
})
