#!/usr/bin/env node

const arg = require('arg')
const fs = require('fs')
const path = require('path')
const generateTypes = require('./generateTypes')

function parseArgumentsIntoOptions(rawArgs) {

    const args = arg({
        '--schema': String,
        '--relationships': String,
        '--out': String
    }, {
        argv: rawArgs.slice(2),
    })

    return {
        schema: args['--schema'] || 'schema.sql',
        relationships: args['--relationships'] || 'relationships.json',
        out: args['--out'] || 'mapddl-dictionary.d.ts'
    }
}

function cli(args) {

    const options = parseArgumentsIntoOptions(args)

    if (!options.schema) {
        process.stdout.write('No SQL schema was specified. Abort.')
        return process.exit(0)
    }

    if (!options.relationships) {
        process.stdout.write('No relationships file was specified. Abort.')
        return process.exit(0)
    }

    const data = {}

    try {
        data.schema = fs.readFileSync(path.join(process.cwd(), options.schema))
    }
    catch (e) {
        process.stderr.write(`Could not access schema file: ${e.message}`)
    }

    try {
        data.relationships = fs.readFileSync(path.join(process.cwd(), options.relationships))
        data.relationships = JSON.parse(data.relationships)
    }
    catch (e) {
        process.stderr.write(`Could not access relationships file: ${e.message}`)
    }

    generateTypes(data.schema.toString(), data.relationships, {
        mapDDLLibPath: 'mapddl',
        outputPath: path.join(process.cwd(), options.out)
    }, {})
}

cli(process.argv)

module.exports = cli