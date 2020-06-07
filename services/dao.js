const { return_type } = require('./tool');

//functions for preparing query format
const prepare_fields = fields => {
    return fields && fields.length > 0 ? fields.toString() : '*';
}

const prepare_condition = (condition, db, type="where") => {
    let text = '';
    if (condition && Object.keys(condition).length > 0) {
        text = `${type} `;
        Object.keys(condition).forEach(e => {
            if (condition[e] !== undefined && condition[e] !== null) {
                text += `${e} = ${db.escape(condition[e])}${type === 'where' ? ' and' : ','} `;
            }
        });
        text = type === "where" ? text.slice(0, -5) : text.slice(0, -2);
    }
    return text;
}

const prepare_increment = (increment, db) => {
    let text = '';
    Object.keys(increment).forEach(e => {
        text += `${e} = ${e} ${increment[e] ? '+1' : '-1'}, `;
    });
    text = text.slice(0, -2);
    return text;
}

const prepare_operator = str => {
    switch (str) {
        case 'is':
            return 'is'
        case 'gt':
            return '>';
        case 'lt':
            return '<';
        case 'gte':
            return '>=';
        case 'lte':
            return '<=';
        case 'in':
            return 'in';
        case 'not in':
            return 'not in';
        case 'not':
            return '!=';
        default: return str;
    }
}

const prepare_where = (entry, db, text = '') => {
    try {
        const key = Object.keys(entry)[0];
        const value = entry[key];
        if (key === 'whereand') {
            text += '(';
            Object.entries(entry.whereand).forEach(e => {
                const temp = prepare_where({[e[0]]: e[1]}, db);
                text += `${temp} and `;
            });
            text = `${text.slice(0, -5)})`;
        } else if (key === 'whereor') {
            text += '(';
            Object.entries(entry.whereor).forEach(e => {
                const temp = prepare_where({[e[0]]: e[1]}, db);
                text += `${temp} or `;
            });
            text = `${text.slice(0, -4)})`;
        } else if (return_type(value) === 'object') {
            Object.keys(value).forEach(e => {
                const op = prepare_operator(e);
                const subvalue = db.escape(value[e]);
                text += `${key} ${op} ${op === 'in' ? '('+subvalue+')':subvalue} and `;
            })
            text = text.slice(0, -5);
        } else if (return_type(value) === 'array') {
            text += `${key} in (${db.escape(value)})`;
        } else {
            text += `${key} = ${db.escape(value)}`;
        }
        return text;
    } catch (err) {
        console.log(entry);
        console.log('prepare_where err:', err);
        throw(err);
    }
}

//generate query of different methods
let query = {};

query.get_items = (item, table, db) => {
    const { fields, condition, nolimit } = item;
    return `select ${prepare_fields(fields)} from ${table} ${prepare_condition(condition, db)} ${nolimit ? '' : 'limit 100'}`;
}

query.get_item = (item, table, db) => {
    return `${query.get_items(item, table, db).slice(0, -2)}`;
}

query.get_last_item = (item, table, db) => {
    const { orderby } = item;
    return `${query.get_items(item, table, db).slice(0, -10)} order by ${orderby} desc limit 1`;
}

query.create_item = (item, table, db) => {
    return `insert into ${table} (${Object.keys(item).toString()}) VALUES (${Object.values(item).map(e => db.escape(e)).toString()})`;
}

query.update_item_by_id = (item, table, db) => {
    const { condition, id, where } = item;
    let wherephrase;
    if (where) {
        wherephrase = `where ${Object.keys(where)[0]} = ${db.escape(Object.values(where)[0])}`;
    } else {
        wherephrase = `where ${table}_id = ${db.escape(id)}`
    }
    return `update ${table} ${prepare_condition(condition, db, 'set')} ${wherephrase}`;
}

query.update_item_by_id_increment = (item, table, db) => {
    const { id, increment } = item;
    return `update ${table} set ${prepare_increment(increment)} where ${table}_id = ${db.escape(id)}`;
}

query.get_item_by_condition = (condition, table, db) => {
    const { fields, where, limit, offset, orderby, orderdirection } = condition;
    const order = orderby ? `order by ${orderby} ${orderdirection || 'desc'}` : '';
    const limitation = limit === 'no' ? '' : `limit ${limit || '100'}`;
    const offsetion = offset ? `offset ${offset}` : '';
    return `select ${prepare_fields(fields)} from ${table} where ${prepare_where(where, db)} ${order} ${limitation} ${offsetion}`;
}

query.count_total_items = (condition, table, db) => {
    const { where } = condition;
    return `select count(*) from ${table} where ${prepare_where(where, db)}`;
}

//execute query
const execute_query = async (method, data, table, db) => {
    try {
        let sql = query[method](data, table, db);
        console.log(sql);
        const resp = await db.query(sql);
        return resp;
    } catch (err) {
        console.log('execute_query dao err: ' + err);
        throw err;
    }
}

const check_exist = async (item, table, db) => {
    try {
        const items = await get_items(item, table, db)
        return items.length > 0;
    } catch (err) {
        console.log('check_exist dao err: ' + err);
        throw err;
    }
}

module.exports = {
    check_exist,
    prepare_fields,
    prepare_condition,
    execute_query,
    prepare_where,
}
