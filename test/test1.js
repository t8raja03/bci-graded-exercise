const server = require('../server')
const chai = require('chai')
const expect = chai.expect
chai.use(require('chai-http'))
chai.use(require('chai-json-schema-ajv'))

const testURL = 'http://localhost:42010'
const userInfoSchema = require('../schemas/userInfoSchema.json')
const tokenResponseSchema = require('../schemas/tokenResponseSchema.json')
const itemListSchema = require('../schemas/itemListSchema.json')
const secrets = require('./secrets.json')
const authHeader = Buffer.from(`olli.ostaja@posti.com:${secrets.password}`, 'utf-8').toString('base64')
var authToken = ''



var assert = require('assert');



describe('Response tests', function() {

    before(() => server.start())        // Käynnistää APIn ennen testejä
    after(() => server.close())         // Pysäyttää APIn testien jälkeen

    
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
                expect(response).to.be.json
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
        })
        it('should return 401 for other users\' item listing', async function() {
            await chai.request(testURL)
            .get('/users/1')
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
                expect(response).to.have.status(401)
                expect(response).to.be.json
            })
        })
    })

    describe('Test item listing', function() {
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
    })

    describe('Check 404 response format', function() {
        it('should return 404 with body in JSON format', async function() {
            await chai.request(testURL)
            .get('/thisroutedoesnotexist')
            .then(response => {
                expect(response).to.have.status(404)
                expect(response).to.be.json
            })
            .catch(error => {
                throw error
            })
        })
    })



});
