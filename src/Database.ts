import * as Knex from 'knex'
import { Model } from "./Model";
import { Parser, TableInterface } from "sql-ddl-to-json-schema";
import { DatabaseOptions, RelationshipDefinition } from "./types";

export class Database<ModelDictionary = any> {

    public schema: TableInterface[]
    public models: ModelDictionary
    public connection: Knex

    constructor(
        sqlSchema: string,
        relationships: RelationshipDefinition[],
        options: Partial<DatabaseOptions>
    ) {

        const parser = new Parser(options.schemaDialect)

        const schema = parser.feed(sqlSchema).toCompactJson()

        let connection: any

        if (!options.avoidConnect) {

            connection = Knex({
                client: options.databaseDialect,
                connection: options.connectionParams,
                ...options.knexParams
            })

            this.connection = connection
        }
        this.models = {} as ModelDictionary

        for (const table of schema) {
            this.models[table.name] = new Model(table, {
                connection,
                relationships,
                modelDictionary: this.models
            })
        }

        this.schema = schema

    }
}