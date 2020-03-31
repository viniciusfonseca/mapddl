import * as fs from 'fs'
import * as path from 'path'
import { generateTypes, Database } from '../src'
// import { ModelDictionary } from './mapddl-types'

const sqlSchema = fs.readFileSync(path.join(__dirname, 'schema.sql')).toString()
const relationships = JSON.parse(fs.readFileSync(path.join(__dirname, 'relationships.json')).toString())

describe('mapddl', () => {

    it.only('generates types', () => {
        generateTypes(
            sqlSchema,
            relationships,
            {
                mapDDLLibPath: '../src',
                outputPath: path.join(__dirname, 'mapddl-types.d.ts')
            },
            {})
    })

    it('creates the models', async () => {

        // const db = new Database<ModelDictionary>(sqlSchema, relationships, {
        //     schemaDialect: 'mysql',
        //     databaseDialect: 'sqlite3',
        //     connectionParams: ':memory:',
        //     knexParams: { useNullAsDefault: true }
        // })

        // await Promise.all(
        //     sqlSchema
        //     .replace(/int NOT NULL AUTO_INCREMENT/g, "INTEGER PRIMARY KEY AUTOINCREMENT")
        //     .replace(/PRIMARY KEY\(id\)(,)?/g, (_, m) => !m ? "_ char(1)" : "")
        //     .match(/[^;]+/gm)
        //     .map(statement => db.connection.raw(statement))
        // )

        // const customer = await db.models.customers.insert({
        //     email: 'vfonseca@example.com',
        //     name: 'Vinicius',
        //     phone: '111111111'
        // })

        // await db.models.addresses.insert({
        //     customer_id: customer.id,
        //     street: 'foo_street'
        // })

        // const cart = await customer.addCart({})

        // const product = await db.models.products.insert({
        //     name: 'xpto',
        //     price: 11111
        // })

        // await cart.addProduct(product, { quantity: 10 })

        // await cart.updateProduct()

        // return null
        // customer.addCart({
             
        // }).then(cart => {
        //     cart.addProduct({

        //     })
        // })

        // await customer.setAddress({
        //     street: 'foo',
        //     city: 'bar',
        //     number: 123
        // })
    })
})