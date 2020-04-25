const fs = require('fs')
const mapddl = require('..')

/**
 * 
 * @param {string} sqlSchema 
 * @param {import("../dist/types").RelationshipDefinition[]} relationships 
 * @param {{ mapDDLLibPath: string, outputPath: string }} generatorOptions 
 * @param {Partial<import("../dist/types").DatabaseOptions>} options
 */
module.exports = function generateTypes(
    sqlSchema,
    relationships,
    generatorOptions,
    options
) {

    let modelDictionary = ""    
    modelDictionary += `export declare interface ModelDictionary {\n`
        
    const output = fs.createWriteStream(generatorOptions.outputPath)

    options = { ...options, avoidConnect: true }
    
    const db = new mapddl.Database(sqlSchema, relationships, options)

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

function capitalize(str) {
    const res = str.split("")
    res[0] = res[0].toUpperCase()
    return res.join("")
}

function joinSnakeCase(str) {
    return str.replace(/_(\w)/g, (_,m) => m.toUpperCase())
}