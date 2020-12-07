process.env.NODE_ENV = 'test'
const chai = require('chai')
const chaiHttp = require('chai-http')
const rfr = require('rfr')
// Configure chai
chai.should();
const should = chai.should();

const models = rfr('db/models').models;
const { validateTransaction, validateClientStore, reduceTransactions, processTransactions } = require('./index');

const transactions = [];
let client1,client2,store1,store2,store3,store4,credit1,credit2,credit3;

describe('/credits', async function () {
    before(async function () {
        const db = rfr('db');
        await db.authenticate()
        rfr('db/models').initModels(db);
        await db.sync();
        client1 = await models.client.create({ email: 'batch1@client.cl', name: 'Batch Client 1' }, { returning: ['id', 'email'] });
        client2 = await models.client.create({ email: 'batch2@client.cl', name: 'Batch Client 2' }, { returning: ['id', 'email'] });
        store1 = await models.store.create({ name: 'Store1', clientId: client1.id }, { returning: ['id', 'name'] });
        store2 = await models.store.create({ name: 'Store2', clientId: client2.id }, { returning: ['id', 'name'] });
        store3 = await models.store.create({ name: 'Store3', clientId: client2.id }, { returning: ['id', 'name'] });
        store4 = await models.store.create({ name: 'Store14', clientId: client1.id }, { returning: ['id', 'name'] });
        credit1 = await models.credit.create({ storeId: store1.id, credits: 10 + Math.ceil(Math.random() * 9999999) }, { returning: ['id', 'credits'] });
        credit2 = await models.credit.create({ storeId: store2.id, credits: 10 + Math.ceil(Math.random() * 9999999) }, { returning: ['id', 'credits'] });
        credit3 = await models.credit.create({ storeId: store3.id, credits: 10 + Math.ceil(Math.random() * 9999999) }, { returning: ['id', 'credits'] });
        transactions.push( {correo: client1.email ,tienda: store1.name ,monto: 10} ) 
        transactions.push( {correo: client1.email ,tienda: store1.name ,monto: -5} ) //final +5
        transactions.push( {correo: client2.email ,tienda: store2.name ,monto: -5} ) // final -5
        transactions.push( {correo: client2.email ,tienda: store3.name ,monto: (-1)*(credit3.credits + 100)} ) //final < (-credit3.credits)
        transactions.push( {correo: client1.email ,tienda: store4.name ,monto: 100} ) //wont apply
        transactions.push( {correo: client2.email ,tienda: store4.name ,monto: 100} ) //wrong combination


    })
    describe('validateTransaction', async function () {
        it('Should return false for a missformated transaction {correo: "client" ,tienda: "store"}', function () {
            const res = validateTransaction({correo: "client" ,tienda: "store"});
            res.should.be.a('boolean');
            res.should.equal(false);
        })
        it('Should return false for a missformated transaction {correo: "client" ,Tienda: "store", monto: 10}', function () {
            const res = validateTransaction({correo: "client" ,tienda: "store"});
            res.should.be.a('boolean');
            res.should.equal(false);
        })
        it('Should return false for unespected format in transaction property {correo: "client" ,tienda: "store", monto: BadNumber}', function () {
            const res = validateTransaction({correo: "client" ,tienda: "store"});
            res.should.be.a('boolean');
            res.should.equal(false);
        })
        it('Should return false for an empty value in transaction property {correo: "" ,tienda: "store", monto: 5}', function () {
            const res = validateTransaction({correo: "client" ,tienda: "store"});
            res.should.be.a('boolean');
            res.should.equal(false);
        })
        it('Should return true for an valid transaction  {correo: "client" ,tienda: "store", monto: 5}', function () {
            const res = validateTransaction({correo: "client" ,tienda: "store", monto: 5});
            res.should.be.a('boolean');
            res.should.equal(true);
        })
    })
    describe('validateClientStore', async function () {
        it(`Should return false for an invalid client/store combination {correo: "${client1.email}" ,tienda: "store", monto: 10}`, async function () {
            const res = await validateClientStore({correo: client1.email ,tienda: "store", monto: 10});
            res.should.be.a('boolean');
            res.should.equal(false);
        })
        it(`Should return true for a valid client/store combination {correo: "${client1.email}" ,tienda: "${store1.name}", monto: 10}`, async function () {
            const res = await validateClientStore({correo: client1.email ,tienda: store1.name, monto: 10});
            res.should.be.a('boolean');
            res.should.equal(true);
        })
    })
    
    describe('reduceTransactions', async function () {
        it(`Should return an array with length 1 for many transactios over 1 store`, function () {
            const res = reduceTransactions([{correo: client1.email ,tienda: "store", monto: 10},{correo: client1.email ,tienda: "store", monto: -10},{correo: client1.email ,tienda: "store", monto: 5}]);
            res.should.be.a('array');
            res.length.should.equal(1);
        })
        it(`Should return an array with length 2 for many transactios over 2 store`, function () {
            const res = reduceTransactions([{correo: client1.email ,tienda: "store", monto: 10},{correo: client1.email ,tienda: "store", monto: -10},{correo: client1.email ,tienda: "store", monto: 5},{correo: client1.email ,tienda: "store2", monto: -10}]);
            res.should.be.a('array');
            res.length.should.equal(2);
        })
        it(`Should return an array with length 1 with monto = 5 for two  transactios of 10 and -5 over 1 store`, function () {
            const res = reduceTransactions([{correo: client1.email ,tienda: "store", monto: 10},{correo: client1.email ,tienda: "store", monto: -5}]);
            res.should.be.a('array');
            res.length.should.equal(1);
            res[0].monto.should.equal(5);
        })
        it(`Should return an array with length 1 with monto = -5 for two  transactios of 10 and -15 over 1 store`, function () {
            const res = reduceTransactions([{correo: client1.email ,tienda: "store", monto: 10},{correo: client1.email ,tienda: "store", monto: -15}]);
            res.should.be.a('array');
            res.length.should.equal(1);
            res[0].monto.should.equal(-5);
        })
    })
    
    describe('processTransactions', async function () {
        it(`store1 should have 5 more credtis
        store2 should have 5 less credtis
        store3 should have remain the same on substraction credits being greater than available funds`, async function () {
            await processTransactions(transactions);
            const foundCredits1 = await models.store.findOne({ where: { name: store1.name }, include: { model: models.credit, attributes: ['credits', 'id'] } });
            const credits1 = Number(((foundCredits1 || {}).credit || {}).credits)
            const foundCredits2 = await models.store.findOne({ where: { name: store2.name }, include: { model: models.credit, attributes: ['credits', 'id'] } });
            const credits2 = Number(((foundCredits2 || {}).credit || {}).credits)
            const foundCredits3 = await models.store.findOne({ where: { name: store3.name }, include: { model: models.credit, attributes: ['credits', 'id'] } });
            const credits3 = Number(((foundCredits3 || {}).credit || {}).credits)
            (credits1-Number(credit1.credits)).should.equal(5);
            (credits2-Number(credit2.credits)).should.equal(-5);
            credits3.should.equal(Number(credit3.credits));
        })
    })
    after(async function () {
        await models.credit.destroy({ where: { storeId: store1.id } })
        await models.credit.destroy({ where: { storeId: store2.id } })
        await models.credit.destroy({ where: { storeId: store3.id } })
        await models.store.destroy({ where: { id: store1.id } })
        await models.store.destroy({ where: { id: store2.id } })
        await models.store.destroy({ where: { id: store3.id } })
        await models.store.destroy({ where: { id: store4.id } })
        await models.client.destroy({ where: { id: client1.id } })
        await models.client.destroy({ where: { id: client2.id } })
    })

})