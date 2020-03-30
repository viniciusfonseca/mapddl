# MapDDL ORM

MapDDL is an ORM that tries to mimic your current database's schema. Instead of writing up abstractions like models, all you need to do is to provide your database schema and its relationships and MapDDL will generate the models and its relationship methods for you. It is built on top of Knex.js and 

First you need to run the `generateTypes` function to generate the type definitions of your model from your SQL schema:

```ts

const sqlSchema = sql`
    CREATE TABLE customers (
        id int NOT NULL AUTO_INCREMENT,
        name varchar(255),
        email varchar(255),
        phone varchar(255),
        role char(10),
        PRIMARY KEY(id)
    );

    CREATE TABLE addresses (
        id int NOT NULL AUTO_INCREMENT,
        street varchar(255),
        number varchar(255),
        city varchar(255),
        zip_code varchar(255),
        customer_id int NOT NULL,
        PRIMARY KEY(id),
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    );
`

const relationships = [
    ["customers", "1..1", "addresses"]
]

generateTypes(
    sqlSchema,
    relationships,
    {
        mapDDLLibPath: '<map-ddl-path>',
        outputPath: path.join(__dirname, 'mapddl-types.d.ts')
    },
    {}
)
```

It will generate a `.d.ts` file like this:

```ts
export declare interface Customers {
    id: number
    name: string
    email: string
    phone: string
    role: string
    getAddress(): Promise<Addresses>
    setAddress(address: Addresses): Promise<any>
}

export declare interface Addresses {
    id: number
    street: string
    number: string
    city: string
    zip_code: string
    customer_id: number
}

export declare interface ModelDictionary {
    customers: Model<Customers>
    addresses: Model<Addresses>
}
```

Include the `.d.ts` file into your project and create a connection. You will need use the same Knex.js's connection parameters:

```ts
const db = new Database<ModelDictionary>(sqlSchema, relationships, {
    schemaDialect: 'mysql',
    databaseDialect: 'mysql',
    connectionParams: {
        // ...your connection params. See Knex.js documentation for more
    },
    knexParams: { useNullAsDefault: true }
})
```

If you use Javascript instead of Typescript, you can use JSDoc to type the database object:

```js
/** @type {import('mapddl').Database<import('./mapddl-types.d.ts').ModelDictionary>} */
const db = new Database<ModelDictionary>(sqlSchema, relationships, {
    schemaDialect: 'mysql',
    databaseDialect: 'mysql',
    connectionParams: {
        // ...your connection params. See Knex.js documentation for more
    },
    knexParams: { useNullAsDefault: true }
})
```

And start manipulating your models:

```ts
const customer = await db.models.customers.insert({
    email: 'vfonseca@example.com',
    name: 'Vinicius',
    phone: '111111111'
})
// { email: 'vfonseca@example.com', name: 'Vinicius', phone: '111111111' }

const address = await db.models.addresses.insert({
    customer_id: customer.id,
    street: 'foo_street'
})
// { customer_id: 1, street: 'foo_street', ... }
```

This is still a project under active development. If you want to contribute, send a PR or an email to vfonseca1618@gmail.com