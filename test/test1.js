const server = require('../server')
const chai = require('chai')
const chaiFiles = require('chai-files')
const expect = chai.expect
chai.use(require('chai-http'))
chai.use(require('chai-json-schema-ajv'))
chai.use(chaiFiles)
var file = chaiFiles.file;
var dir = chaiFiles.dir;

const testURL = 'http://localhost:42010'
const userInfoSchema = require('../schemas/userInfoSchema.json')
const tokenResponseSchema = require('../schemas/tokenResponseSchema.json')
const itemListSchema = require('../schemas/itemListSchema.json')
const statusSchema = require('../schemas/statusSchema.json')
const authHeader = Buffer.from(`chai@tests.com:salasana`, 'utf-8').toString('base64')
var authToken = ''
var idTestUser = ''
var testItem = ''
var nItems = 6
var nUsers = 3



var assert = require('assert');

before(() => server.start())        // Käynnistää APIn ennen testejä
after(() => server.close())         // Pysäyttää APIn testien jälkeen


describe('User registration and login', function() {

    describe('Test user registration', function() {

        it('should return a 400 JSON object with an invalid request (integer password)', async function() {
            await chai.request(testURL)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                "email": "chai@tests.com",
                "password": 1234
            })
            .then(response => {
                expect(response).to.have.status(400)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })


        it('should be able to register', async function() {
            nUsers += 1
            await chai.request(testURL)
            .post('/users')
            .send({
                "email": "chai@tests.com",
                "password": "salasana"
            })
            .then(response => {
                expect(response).to.have.status(201)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })

        
        it('a user should actually be created', async function() {
            await chai.request(testURL)
            .get('/users')
            .then(response => {
                expect(response).to.have.status(200)
                expect(response.body.length).to.equal(nUsers)
            })
            .catch(error => {
                throw error
            })
        })
        
    })



    describe('Get bearer token', function() {
        it('should return an access token', async function() {
            await chai.request(testURL)
                .get('/users/login')
                .set('Authorization', `Basic ${authHeader}`)
                .then(response => {
                expect(response).to.have.status(202)
                expect(response.body).to.be.jsonSchema(tokenResponseSchema)
                authToken = response.body.token
                idTestUser = response.body.idUser
            })
            .catch(error => {
                throw error
            })
        })
    })
    describe('Check user info', function() {
        it('should be able to get own info', async function() {
            // Lähetetään http-pyyntö
            await chai.request(testURL)
            .get(`/users/${idTestUser}`)
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                expect(response).to.have.status(200)
                expect(response.body).to.be.jsonSchema(userInfoSchema)
            })
            .catch(error => {
                throw error
            })
        })
        it('should not be able to get other user\'s info', async function() {
            await chai.request(testURL)
            .get('/users/b2xsaS5vc3RhamFAcG9zdGkuY29t')
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



describe('Item listing, posting and modifying', function() {

    describe('Test item listing and posting', function() {
        it('should be able to list items', async function() {
            // Lähetetään http-pyyntö
            await chai.request(testURL)
            .get('/items')
            .then(response => {
                expect(response).to.have.status(200)
                expect(response.body).to.be.jsonSchema(itemListSchema)
            })
            .catch(error => {
                throw error
            })
        })
        it('should be able to filter the items list', async function() {
            await chai.request(testURL)
            .get('/items')
            .query({
                category: 'Cars',
                location: 'Rovaniemi',
                date: '1613591900'
            })
            .then(response => {
                expect(response).to.have.status(200)
                expect(response.body).to.be.jsonSchema(itemListSchema)
            })
            .catch(error => {
                throw error
            })
        })
        it('should return a 404 JSON object instead of an empty array',
            async function() {
                await chai.request(testURL)
                .get('/items')
                .query({
                    date: '0'
                })
                .then(response => {
                    expect(response).to.have.status(404)
                    expect(response.body).to.be.jsonSchema(statusSchema)
                })
                .catch(error => {
                    throw error
                })
            })
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
                    nItems += 1
                    expect(response).to.have.status(201)
                    expect(response.body).to.be.jsonSchema(statusSchema)
                    expect(server.items.length).to.equal(nItems)
                })
                .catch(error => {
                    throw error
                })
        })
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
                expect(response).to.have.status(400)
                expect(response.body).to.be.jsonSchema(statusSchema)
                expect(server.items.length).to.equal(nItems)
            })
            .catch(error => {
                throw error
            })
        })
        it('should be able to list own posted items', async function() {
            await chai.request(testURL)
            .get(`/users/${idTestUser}/items`)
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                expect(response).to.have.status(200)
                expect(response.body).to.be.jsonSchema(itemListSchema)
                testItem = response.body[0]
            })
            .catch(error => {
                throw error
            })
        })
        it('should return 401 for when trying to list other user\'s items', async function() {
            await chai.request(testURL)
            .get('/users/bXl5QG15eW50aS5uZXQ=')
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
    describe('Test item modifying and image uploading', function() {
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
        it('wait 1 second to let timestamps be different in the next phase..', function(done) {
            setTimeout(done, 1000)
        })
        it('should actually modify items', function() {         
            chai.request(testURL)
            .get(`/users/${idTestUser}/items`)
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                expect(response).to.have.status(200)
                expect(response.body[0].dateModified).to.not.equal(response.body[0].datePosted)
            })
            .catch(error => {
                throw error
            })
        })
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
        it('should be able to upload files', async function() {
            await chai.request(testURL)
            .post(`/upload/${testItem.idItem}`)
            .set('Authorization', `Bearer ${authToken}`)
            .attach('uploads', './test/testimage.png')
            .then(response => {
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
        it('should be able to delete items', function() {
            nItems -= 1
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
        it('should actually delete items', function() {
            chai.request(testURL)
            .get('/items')
            .then(response => {
                expect(response.body.length).to.equal(nItems)
            })
            .catch(error => {
                throw error
            })
        })
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





//     })

    

    




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
