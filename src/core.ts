export function capitalize(str: string) {
    const res = str.split("")
    res[0] = res[0].toUpperCase()
    return res.join("")
}

export function joinSnakeCase(str: string) {
    return str.replace(/_(\w)/g, (_,m) => m.toUpperCase())
}