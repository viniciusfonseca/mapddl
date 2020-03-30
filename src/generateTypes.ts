import { DatabaseOptions, RelationshipDefinition } from "./@types";
import { Database } from "./Database";
import * as fs from 'fs'
import { capitalize, joinSnakeCase } from "./core";

export function generateTypes(
    sqlSchema: string,
    relationships: RelationshipDefinition[],
    generatorOptions: {
        mapDDLLibPath: string
        outputPath: string
    },
    options: Partial<DatabaseOptions>,
) {

    let modelDictionary = ""    
    modelDictionary += `export declare interface ModelDictionary {\n`
        
    const output = fs.createWriteStream(generatorOptions.outputPath)

    options = { ...options, avoidConnect: true }
    
    const db = new Database(sqlSchema, relationships, options)

    output.write(`import { Model } from '${generatorOptions.mapDDLLibPath}'\n\n`)

    for (const model of db.schema) {
        const interfaceName = joinSnakeCase(capitalize(model.name))
        output.write(`export declare interface ${interfaceName} {\n`)
        for (const column of model.columns) {
            const columnType = mapType[column.type.datatype] || 'string'
            output.write(`    ${column.name}: ${columnType}\n`)
        }
        for (const { typeDescription } of db.models[model.name].relationshipFns) {
            output.write(`    ${typeDescription}\n`)
        }
        modelDictionary += `    ${model.name}: Model<${interfaceName}>\n`
        output.write(`}\n\n`)
    }

    modelDictionary += `}`

    output.write(modelDictionary)

    output.close()
}

const mapType = {
    'int': 'number',
    'char': 'string',
    'varchar': 'string'
}