const luaparse = require('luaparse');

function stripQuotes(raw) {
    if (typeof raw !== 'string') return raw;
    return raw.replace(/^['"]|['"]$/g, '');
}

function luaValueToJs(node) {
    if (!node) return null;

    switch (node.type) {
        case 'TableConstructorExpression': {
            const hasKeys = node.fields.some(
                (f) => f.type === 'TableKey' || f.type === 'TableKeyString'
            );
            
            if (!hasKeys) {
                return node.fields.map((f) => luaValueToJs(f.value));
            }
            
            const obj = {};
            let listIndex = 1;
            node.fields.forEach((f) => {
                let key;
                if (f.type === 'TableKeyString') {
                    key = f.key.name;
                } else if (f.type === 'TableKey') {
                    key = luaValueToJs(f.key);
                } else {
                    key = listIndex++;
                }
                obj[key] = luaValueToJs(f.value);
            });
            return obj;
        }
        case 'StringLiteral':
            return node.value !== undefined && node.value !== null
                ? node.value
                : stripQuotes(node.raw);
        case 'NumericLiteral':
            return node.value;
        case 'BooleanLiteral':
            return node.value;
        case 'NilLiteral':
            return null;
        case 'UnaryExpression':
            if (node.operator === '-') return -luaValueToJs(node.argument);
            return luaValueToJs(node.argument);
        default:
            return node.raw !== undefined ? node.raw : null;
    }
}

function extractLuaTable(luaCode, name) {
    const ast = luaparse.parse(luaCode, { comments: false, luaVersion: '5.1' });
    let found = null;

    const memberName = (v) => {
        if (v.type === 'Identifier') return v.name;
        if (v.type === 'MemberExpression' && v.identifier) return v.identifier.name;
        return null;
    };

    for (const node of ast.body) {
        if (node.type === 'LocalStatement') {
            node.variables.forEach((v, idx) => {
                if (v.name === name && node.init[idx]) found = node.init[idx];
            });
        } else if (node.type === 'AssignmentStatement') {
            node.variables.forEach((v, idx) => {
                if (memberName(v) === name && node.init[idx]) found = node.init[idx];
            });
        }
    }

    return found ? luaValueToJs(found) : null;
}

module.exports = { extractLuaTable };
