function tokenize(text) {
    const tokens = [];
    let i = 0;
    const n = text.length;

    while (i < n) {
        const c = text[i];
        
        if (c === ' ' || c === '\t' || c === '\r' || c === '\n') {
            i++;
            continue;
        }
        
        if (c === '/' && text[i + 1] === '/') {
            while (i < n && text[i] !== '\n') i++;
            continue;
        }
        
        if (c === '{' || c === '}') {
            tokens.push({ t: c });
            i++;
            continue;
        }
        
        if (c === '"') {
            i++;
            let s = '';
            while (i < n && text[i] !== '"') {
                if (text[i] === '\\' && i + 1 < n) {
                    s += text[i + 1];
                    i += 2;
                    continue;
                }
                s += text[i++];
            }
            i++;
            tokens.push({ t: 'str', v: s });
            continue;
        }
        
        let s = '';
        while (i < n && ' \t\r\n{}"'.indexOf(text[i]) === -1) {
            if (text[i] === '/' && text[i + 1] === '/') break;
            s += text[i++];
        }
        tokens.push({ t: 'str', v: s });
    }

    return tokens;
}

function addKey(obj, key, val) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (Array.isArray(obj[key])) {
            obj[key].push(val);
        } else {
            obj[key] = [obj[key], val];
        }
    } else {
        obj[key] = val;
    }
}

function parseKV(text) {
    const tokens = tokenize(text);
    let pos = 0;

    function parseObject() {
        const obj = {};
        while (pos < tokens.length) {
            const tok = tokens[pos];

            if (tok.t === '}') {
                pos++;
                break;
            }
            if (tok.t !== 'str') {
                pos++;
                continue;
            }

            const key = tok.v;
            pos++;
            const next = tokens[pos];

            if (next && next.t === '{') {
                pos++;
                addKey(obj, key, parseObject());
            } else if (next && next.t === 'str') {
                const val = next.v;
                pos++;
                if (tokens[pos] && tokens[pos].t === 'str' && tokens[pos].v[0] === '[') {
                    pos++;
                }
                addKey(obj, key, val);
            } else {
                addKey(obj, key, '');
            }
        }
        return obj;
    }

    return parseObject();
}

module.exports = { parseKV };
