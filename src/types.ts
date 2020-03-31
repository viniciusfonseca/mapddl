import * as Knex from 'knex'

export declare type SupportedSchemaDialects = 'mysql' | 'mariadb'
export declare type SupportedDatabaseDialects = 'mysql' | 'pg' | 'oracledb' | 'sqlite3' | 'mssql'
export declare type RelationshipDefinition = [
    string,
    '1..1' | '1..n' | 'n..n',
    string,
    ...string[]
]

export declare interface DatabaseOptions {
    schemaDialect: SupportedSchemaDialects
    databaseDialect: SupportedDatabaseDialects
    avoidConnect: boolean
    connectionParams: any
    knexParams: any
}

export declare interface ModelOptions {
    connection: Knex
    relationships: RelationshipDefinition[]
    modelDictionary: any
}

export declare interface QueryOptions {
    columns: string[]
    where: object
    limit: number
    offset: number
}
