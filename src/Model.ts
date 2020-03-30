import { ModelOptions, QueryOptions, SQLExecutionFunction } from "./@types";
import { TableInterface } from "sql-ddl-to-json-schema/typings";
import * as Knex from 'knex'
import { capitalize, joinSnakeCase } from "./core";

const Pluralize = require('pluralize')

const toSingular = Pluralize.singular

export class Model<T = any> {

    private table: TableInterface
    private connection: Knex
    public relationshipFns: {
        targetTableName: string
        methodName: string
        relation: '1..1' | '1..n' | 'n..n'
        func: Function
        typeDescription: string
    }[]

    constructor(table: TableInterface, options: ModelOptions) {

        this.table = table
        this.connection = options.connection
        this.relationshipFns = []

        const getTablePkName = tableName =>
            (options.modelDictionary[tableName].table.primaryKey.columns[0] || []).column || 'id'

        for (const [
            table1Name,
            relation,
            table2Name,
            ...args
        ] of options.relationships) {
            if (table1Name !== this.table.name) { continue }
            switch (relation) {
                case '1..1':
                    this.relationshipFns.push({
                        methodName: `get${capitalize(toSingular(table2Name))}`,
                        targetTableName: table2Name,
                        func() {
                            // TODO

                        },
                        relation,
                        typeDescription: `get${capitalize(toSingular(table2Name))}(): Promise<${capitalize(table2Name)}>`
                    })
                    this.relationshipFns.push({
                        methodName: `set${capitalize(toSingular(table2Name))}`,
                        targetTableName: table2Name,
                        func() {
                            // TODO

                        },
                        relation,
                        typeDescription: `set${capitalize(toSingular(table2Name))}(${toSingular(table2Name)}: ${capitalize(table2Name)}): Promise<any>`
                    })
                    break
                case '1..n':
                    this.relationshipFns.push({
                        methodName: `get${capitalize(table2Name)}`,
                        targetTableName: table2Name,
                        func() {
                            // TODO
                            const query = options.connection(table2Name)
                                .select()
                                .where({  })
                                .then(entities =>
                                    entities.map(entity =>
                                        options.modelDictionary[table2Name].extendEntityMethods(entity)
                                    )
                                )
                            return query
                        },
                        relation,
                        typeDescription: `get${capitalize(table2Name)}(): Promise<${capitalize(table2Name)}[]>`
                    })
                    this.relationshipFns.push({
                        methodName: `add${capitalize(toSingular(table2Name))}`,
                        targetTableName: table2Name,
                        func(entity: any) {
                            const [ fkName ] = args
                            const pkName = (table.primaryKey.columns[0] || {}).column || 'id'
                            entity = { ...entity, [fkName]: this[pkName] }
                            const table2PkName = getTablePkName(table2Name)
                            const query = options.connection(table2Name)
                                .insert(entity, [table2PkName])
                            return query.then(([ pkVal ]) =>
                                options.connection(table2Name)
                                    .select()
                                    .where({ [table2PkName]: pkVal })
                                    .first()
                            )
                            .then(entity =>
                                options.modelDictionary[table2Name].extendEntityMethods(entity)
                            )
                        },
                        relation,
                        typeDescription: `add${capitalize(toSingular(table2Name))}(${toSingular(table2Name)}: Partial<${capitalize(table2Name)}>): Promise<${capitalize(table2Name)}>`
                    })
                    this.relationshipFns.push({
                        methodName: `remove${capitalize(toSingular(table2Name))}`,
                        targetTableName: table2Name,
                        func() {
                            // TODO

                        },
                        relation,
                        typeDescription: `remove${capitalize(toSingular(table2Name))}(${toSingular(table2Name)}: ${capitalize(table2Name)}): Promise<any>`
                    })
                    break
                case 'n..n': {
                    const [ relationshipTable, table1Fk, table2Fk ] = args
                    this.relationshipFns.push({
                        methodName: `get${capitalize(table2Name)}`,
                        targetTableName: table2Name,
                        func() {
                            // TODO

                        },
                        relation,
                        typeDescription: `get${capitalize(table2Name)}(): Promise<${capitalize(table2Name)}[]>`
                    })
                    this.relationshipFns.push({
                        methodName: `add${capitalize(toSingular(table2Name))}`,
                        targetTableName: table2Name,
                        func(entity: any, relationshipTableFields: any) {

                            const pkName = (table.primaryKey.columns[0] || {}).column || 'id'
                            const table2PkName = getTablePkName(table2Name)

                            console.log({ pkName, table2PkName, this: this, entity })

                            return options.connection(relationshipTable).insert({
                                [table1Fk]: this[pkName],
                                [table2Fk]: entity[table2PkName],
                                ...relationshipTableFields
                            })
                        },
                        relation,
                        typeDescription: `add${capitalize(toSingular(table2Name))}(${toSingular(table2Name)}: Partial<${capitalize(table2Name)}>, relationshipParams: Partial<${joinSnakeCase(capitalize(relationshipTable))}>): Promise<${capitalize(table2Name)}>`
                    })
                    this.relationshipFns.push({
                        methodName: `remove${capitalize(toSingular(table2Name))}`,
                        targetTableName: table2Name,
                        func() {
                            // TODO

                        },
                        relation,
                        typeDescription: `remove${capitalize(toSingular(table2Name))}(${toSingular(table2Name)}: ${capitalize(table2Name)}): Promise<any>`
                    })
                }
            }
        }
    }

    extendEntityMethods(entity: T) {
        for (const { methodName, func } of this.relationshipFns) {
            entity[methodName] = (func || function() {}).bind(entity)
        }
        return entity
    }

    createQuery() {
        return this.connection(this.table.name)
    }

    getPrimaryKeyColKey() {
        return (this.table.primaryKey.columns[0] || {}).column || 'id'
    }

    select(options?: QueryOptions) : Promise<T[]> {
        let query = this.createQuery()
            .select(...options.columns)
        if (options.where) {
            query = query.where(options.where)
        }
        if (options.limit) {
            query = query.limit(options.limit)
        }
        if (options.offset) {
            query = query.offset(options.offset)
        }
        return query.then(entities =>
                entities.map(entity =>
                    this.extendEntityMethods(entity)
                )
        )
    }

    getByPk(id: number) : Promise<T> {
        const pkColKey = this.getPrimaryKeyColKey()
        const query = this.createQuery()
            .select()
            .where({ [pkColKey]: id })
            .first()
        return query.then(entity => this.extendEntityMethods(entity))
    }

    insert(values: Partial<T>) : Promise<T> {
        const pkColKey = this.getPrimaryKeyColKey()
        const query = this.createQuery()
            .insert(values, [pkColKey])
        return query.then(([pkVal]) =>
            this.createQuery()
                .select()
                .where({ [pkColKey]: pkVal })
                .first()
        ).then(entity => this.extendEntityMethods(entity))
    }

    updateById(id: number, values: Partial<T>) : Promise<any> {
        const pkColKey = this.getPrimaryKeyColKey()
        const query = this.createQuery()
            .where({ [pkColKey]: id })
            .update(values)
        return query
    }

    deleteById(id: number) : Promise<any> {
        const pkColKey = this.getPrimaryKeyColKey()
        const query = this.createQuery()
            .where({ [pkColKey]: id })
            .delete()
        return query
    }
}