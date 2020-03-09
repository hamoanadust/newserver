const db = require('./db');
const { execute_query } = require('./dao');
const { success_res, fail_res } = require('./tool');

const get_carpark_by_condition = async data => {
    try {
        const { condition } = data;
        const resp = execute_query('get_item_by_condition', condition, 'carpark', db);
        return resp;
    } catch (err) {
        console.log('get_carpark_by_condition err', err);
        throw(err);
    }
}

const list_carpark = async data => {
    try {
        let { whereand, limit, offset, orderby, orderdirection } = data
        whereand = whereand || { carpark_id: { gt: 0 } }
        const condition = {where: { whereand }, limit, offset, orderby, orderdirection}
        const resp = await execute_query('get_item_by_condition', condition, 'carpark', db)
        return resp
    } catch (err) {
        return err
    }
}

const list_all_carpark = async () => {
    try {
        const resp = await get_carpark_by_condition({ condition: { where: { carpark_id: { gt: 0 } } } })
        return resp
    } catch (err) {
        return err
    }
}

module.exports = {
    get_carpark_by_condition,
    list_carpark,
    list_all_carpark
}
