const db = require('./db');
const moment = require('moment');
const { success_res, fail_res } = require('./tool');
const { execute_query } = require('./dao');

const get_vehicle_by_condition = async data => {
    try {
        const { condition } = data;
        const resp = await execute_query('get_item_by_condition', condition, 'vehicle', db);
        return resp;
    } catch (err) {
        console.log('get_vehicle_by_condition err:', err);
        throw(err);
    }
}

const list_vehicle = async data => {
    try {
        let { limit, offset, orderby, orderdirection, user } = data;
        const condition = {where: {user_id: user.user_id}, limit, offset, orderby, orderdirection};
        const resp = await get_vehicle_by_condition({condition});
        return success_res(resp);
    } catch (err) {
        console.log('get vehicle err:', err);
        throw(err);
    }
}

const list_vehicle_for_admin = async data => {
    try {
        let { condition } = data;
        if (!condition) condition = {where: {vehicle_id: {gt: 0}}};
        const resp = await get_vehicle_by_condition({condition});
        return success_res(resp);
    } catch (err) {
        console.log('list_vehicle_for_admin err:', err);
        throw(err);
    }
}

const add_vehicle = async data => {
    try {
        const { vehicle_number, card_number, card_type, user } = data;
        const { user_id } = user;
        const condition = {where: {whereand: {vehicle_number, user_id}}};
        const exist_vehicle = await get_vehicle_by_condition({condition});
        if (exist_vehicle && exist_vehicle.length > 0) {
            return fail_res('vehicle already exist')
        } else {
            const item = { vehicle_number, card_number, card_type, user_id };
            await execute_query('create_item', item, 'vehicle', db);
            return success_res();
        }
    } catch (err) {
        console.log('add vehicle err:', err);
        throw(err);
    }
}

const add_vehicle_for_admin = async data => {
    try {
        const { vehicle_number, card_number, card_type, user_id } = data;
        if (!vehicle_number || !card_number || !user_id) return fail_res('vehicle number, card number and user id are required')
        const condition = {where: {whereand: {vehicle_number, user_id}}};
        const exist_vehicle = await get_vehicle_by_condition({condition});
        if (exist_vehicle && exist_vehicle.length > 0) {
            return fail_res('vehicle already exist')
        } else {
            const item = { vehicle_number, card_number, card_type, user_id };
            await execute_query('create_item', item, 'vehicle', db);
            return success_res();
        }
    } catch (err) {
        console.log('add vehicle err:', err);
        throw(err);
    }
}

module.exports = {
    get_vehicle_by_condition,
    list_vehicle,
    list_vehicle_for_admin,
    add_vehicle,
    add_vehicle_for_admin
}
