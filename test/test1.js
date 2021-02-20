const server = require('../server')
const chai = require('chai')
const expect = chai.expect
chai.use(require('chai-http'))
chai.use(require('chai-json-schema-ajv'))

const testURL = 'http://localhost:42010'
const userInfoSchema = require('../schemas/userInfoSchema.json')
const tokenResponseSchema = require('../schemas/tokenResponseSchema.json')
const itemListSchema = require('../schemas/itemListSchema.json')
const statusSchema = require('../schemas/statusSchema.json')
const secrets = require('./secrets.json')
const authHeader = Buffer.from(`olli.ostaja@posti.com:${secrets.password}`, 'utf-8').toString('base64')
var authToken = ''
var nItems = 6
var nUsers = 3



var assert = require('assert');



describe('Response tests', function() {

    before(() => server.start())        // Käynnistää APIn ennen testejä
    after(() => server.close())         // Pysäyttää APIn testien jälkeen

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

    describe('Get bearer token', function() {
        it('should return an access token', async function() {
            await chai.request(testURL)
                .get('/users/login')
                .set('Authorization', `Basic ${authHeader}`)
                .then(response => {
                expect(response).to.have.status(202)
                expect(response.body).to.be.jsonSchema(tokenResponseSchema)
                authToken = response.body.token
            })
            .catch(error => {
                throw error
            })
        })
    })

    describe('Check user info', function() {
        it('should return a valid JSON object', async function() {
            // Lähetetään http-pyyntö
            await chai.request(testURL)
            .get('/users/0')
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                expect(response).to.have.status(200)
                expect(response.body).to.be.jsonSchema(userInfoSchema)
            })
            .catch(error => {
                throw error
            })
        })
        it('should return 401 for other users\' info', async function() {
            await chai.request(testURL)
            .get('/users/1')
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                expect(response).to.have.status(401)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })
        it('should return an array of user\'s own postings', async function() {
            await chai.request(testURL)
            .get('/users/0/items')
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                expect(response).to.have.status(200)
                expect(response.body).to.be.jsonSchema(itemListSchema)
            })
            .catch(error => {
                throw error
            })
        })
        it('should return 401 for other users\' item listing', async function() {
            await chai.request(testURL)
            .get('/users/1')
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

    describe('Test item listing and posting', function() {
        it('should return an array of "Item" JSON objects', async function() {
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
        it('should return a filtered array of "Item" JSON objects', async function() {
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
                console.log('server.items.length ' + server.items.length)
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
        it('should return a 200 JSON object when posting items', async function() {
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
        it('should be able to delete items', async function() {
            nItems -= 1
            await chai.request(testURL)
            .delete('/users/0/items/1')
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                expect(response).to.have.status(202)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })
        it('should actually delete items', async function() {
            await chai.request(testURL)
            .get('/items')
            .then(response => {
                expect(response.body.length).to.equal(nItems)
            })
        })
        
    })

    describe('Test user registration', function() {
        it('should return a status 200 JSON object', async function() {
            nUsers += 1
            await chai.request(testURL)
            .post('/users')
            .send({
                email: 'chai@tests.com',
                password: 'salasana'
            })
            .then(response => {
                expect(response).to.have.status(201)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })
        it('should actually create a user', async function() {
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
        it('should return a 400 JSON object with an invalid request', async function() {
            await chai.request(testURL)
            .post('/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                email: 'chai@tests.com',
                password: 1234
            })
            .then(response => {
                expect(response).to.have.status(400)
                expect(response.body).to.be.jsonSchema(statusSchema)
            })
            .catch(error => {
                throw error
            })
        })
    })



});
