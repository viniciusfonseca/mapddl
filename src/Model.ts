import { ModelOptions, QueryOptions } from "./types";
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
    }

    setupRelationshipMethods(options: ModelOptions) {

        const table = this.table

        const getTablePkName = tableName => {
            const { primaryKey } = options.modelDictionary[tableName].table
            if (!primaryKey) { return null }
            return (primaryKey.columns[0] || []).column || 'id'
        }

        const pkName = getTablePkName(table.name)

        for (const [
            table1Name,
            relation,
            table2Name,
            ...args
        ] of options.relationships) {
            if (table1Name !== table.name) { continue }
            const table2Extend = options.modelDictionary[table2Name].extendEntityMethods
            const table2PkName = getTablePkName(table2Name)
            switch (relation) {
                case '1..1': {
                    const [ table2Fk ] = args
                    this.relationshipFns.push({
                        methodName: `get${capitalize(toSingular(table2Name))}`,
                        targetTableName: table2Name,
                        func() {
                            return options.connection(table2Name)
                                .select()
                                .where({ [table2Fk]: this[pkName] })
                                .first()
                                .then(entity => table2Extend(entity))
                        },
                        relation,
                        typeDescription: `get${capitalize(toSingular(table2Name))}(): Promise<${capitalize(table2Name)}>`
                    })
                    this.relationshipFns.push({
                        methodName: `set${capitalize(toSingular(table2Name))}`,
                        targetTableName: table2Name,
                        func(entity) {
                            return options.connection(table2Name)
                                .where({ [table2PkName]: entity[table2PkName] })
                                .update({ [table2Fk]: this[pkName] })
                        },
                        relation,
                        typeDescription: `set${capitalize(toSingular(table2Name))}(${toSingular(table2Name)}: ${capitalize(table2Name)}): Promise<any>`
                    })
                    break
                }
                case '1..n': {
                    const [ table2Fk ] = args
                    this.relationshipFns.push({
                        methodName: `get${capitalize(table2Name)}`,
                        targetTableName: table2Name,
                        func() {
                            const query = options.connection(table2Name)
                                .select()
                                .where({ [table2Fk]: this[pkName] })
                                .then(entities =>
                                    entities.map(entity =>
                                        table2Extend(entity)
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
                            return options.connection(table2Name)
                                .insert(entity, [table2PkName])
                                .then(([ pkVal ]) =>
                                    options.connection(table2Name)
                                        .select()
                                        .where({ [table2PkName]: pkVal })
                                        .first()
                                )
                                .then(entity => table2Extend(entity))
                        },
                        relation,
                        typeDescription: `add${capitalize(toSingular(table2Name))}(${toSingular(table2Name)}: Partial<${capitalize(table2Name)}>): Promise<${capitalize(table2Name)}>`
                    })
                    this.relationshipFns.push({
                        methodName: `remove${capitalize(toSingular(table2Name))}`,
                        targetTableName: table2Name,
                        func(entity) {
                            return options.connection(table2Name)
                                .where({ [table2PkName]: entity[table2PkName] })
                                .delete()
                        },
                        relation,
                        typeDescription: `remove${capitalize(toSingular(table2Name))}(${toSingular(table2Name)}: ${capitalize(table2Name)}): Promise<any>`
                    })
                    break
                }
                case 'n..n': {
                    const [ relationshipTable, table1Fk, table2Fk ] = args
                    this.relationshipFns.push({
                        methodName: `get${capitalize(table2Name)}`,
                        targetTableName: table2Name,
                        func() {
                            return options.connection(table2Name)
                                .select()
                                .innerJoin(table.name, `${table.name}.${pkName}`, `${relationshipTable}.${table1Fk}`)
                                .innerJoin(relationshipTable, `${relationshipTable}.${table2Fk}`, `${table2Name}.${table2PkName}`)
                                .where(`${table.name}.${pkName}`, this[pkName])
                                .then(entities => entities.map(entity => table2Extend(entity)))
                        },
                        relation,
                        typeDescription: `get${capitalize(table2Name)}(): Promise<${capitalize(table2Name)}[]>`
                    })
                    this.relationshipFns.push({
                        methodName: `add${capitalize(toSingular(table2Name))}`,
                        targetTableName: table2Name,
                        func(entity: any, relationshipTableFields: any) {
                            return options.connection(relationshipTable).insert({
                                [table1Fk]: this[pkName],
                                [table2Fk]: entity[table2PkName],
                                ...relationshipTableFields
                            })
                        },
                        relation,
                        typeDescription: `add${capitalize(toSingular(table2Name))}(${toSingular(table2Name)}: ${capitalize(table2Name)}, relationshipParams?: Partial<${joinSnakeCase(capitalize(relationshipTable))}>): Promise<${capitalize(table2Name)}>`
                    })
                    this.relationshipFns.push({
                        methodName: `update${capitalize(toSingular(table2Name))}`,
                        targetTableName: table2Name,
                        func(entity: any, relationshipTableFields: any) {
                            return options.connection(relationshipTable)
                                .where({
                                    [table1Fk]: this[pkName],
                                    [table2Fk]: entity[table2PkName]
                                })
                                .update(relationshipTableFields)
                        },
                        relation,
                        typeDescription: `update${capitalize(toSingular(table2Name))}(${toSingular(table2Name)}: ${capitalize(table2Name)}, relationshipParams?: Partial<${joinSnakeCase(capitalize(relationshipTable))}>): Promise<any>`
                    })
                    this.relationshipFns.push({
                        methodName: `remove${capitalize(toSingular(table2Name))}`,
                        targetTableName: table2Name,
                        func(entity) {
                            return options.connection(relationshipTable)
                                .where({
                                    [table1Fk]: this[pkName],
                                    [table2Fk]: entity[table2PkName]
                                })
                                .delete()
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
        return this.createQuery()
            .select()
            .where({ [pkColKey]: id })
            .first()
            .then(entity => this.extendEntityMethods(entity))
    }

    insert(values: Partial<T>) : Promise<T> {
        const pkColKey = this.getPrimaryKeyColKey()
        return this.createQuery()
            .insert(values, [pkColKey])
            .then(([pkVal]) =>
                this.createQuery()
                    .select()
                    .where({ [pkColKey]: pkVal })
                    .first()
            ).then(entity => this.extendEntityMethods(entity))
    }

    updateById(id: number, values: Partial<T>) : Promise<any> {
        const pkColKey = this.getPrimaryKeyColKey()
        return this.createQuery()
            .where({ [pkColKey]: id })
            .update(values)
    }

    deleteById(id: number) : Promise<any> {
        const pkColKey = this.getPrimaryKeyColKey()
        return this.createQuery()
            .where({ [pkColKey]: id })
            .delete()
    }
}