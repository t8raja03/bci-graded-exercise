const server = require('../server')
const chai = require('chai')
const expect = chai.expect
chai.use(require('chai-http'))
chai.use(require('chai-json-schema-ajv'))

const testURL = 'http://localhost:42010'
const userInfoSchema = require('../schemas/userInfoSchema.json')
const tokenResponseSchema = require('../schemas/tokenResponseSchema.json')
const itemSchema = require('../schemas/itemSchema.json')
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
            .then(response => {
                expect(response).to.have.status(200)
                expect(response.body).to.be.jsonSchema(userInfoSchema)
            })
            .catch(error => {
                throw error
            })
        })
    })

    describe('Test item listing', function() {
        it('should return an array "Item" JSON objects', async function() {
            // Lähetetään http-pyyntö
            await chai.request(testURL)
            .get('/items')
            .then(response => {
                expect(response).to.have.status(200)
                expect(response.body).to.be.jsonSchema(itemSchema)
            })
            .catch(error => {
                throw error
            })
        })
    })




});
