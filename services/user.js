const db = require('./db');
const moment = require('moment');
const { execute_query } = require('./dao');
const { hash, compare } = require('./encrypt');
const auth = require('./auth');
const { success_res, fail_res } = require('./tool');

const signup = async data => {
    try {
        const { username, password, name, company, email, contact_number } = data;
        if (!username) return fail_res('no username');
        else if (!password) return fail_res('no password');
        const hashed = await hash(password);
        const exist = await execute_query('get_item', { condition: { username } }, 'user', db);
        if (exist.length > 0) {
            return fail_res('username already existed');
        } else {
            const user = { username, password: hashed, role: 'client', name, company, email, contact_number, created_at: moment().format('YYYY-MM-DD HH:mm:ss'), created_by: 'system' }
            await execute_query('create_item', user, 'user', db);
            return success_res();
        }
    } catch (err) {
        console.log('signup err', err);
        throw(err);
    }
}

const signin = async data => {
    try {
        const { username, password } = data;
        const exist = await execute_query('get_item', { condition: { username } }, 'user', db);
        if (exist.length === 0) {
            return fail_res('username does not exist');
        } else {
            const check = await compare(password, exist[0].password);
            if (check) {
                const token = auth.get_token({user_id: exist[0].user_id});
                return success_res(token);
            } else {
                return fail_res('password incorrect');
            }
        }
    } catch (err) {
        console.log('signin err', err);
        throw(err);
    }
}

const change_password = async data => {
    try {
        const { username, old_password, new_password } = data;
        const exist = await execute_query('get_item', { condition: { username } }, 'user', db);
        if (exist.length === 0) {
            return {success: false, message: 'username does not exist'};
        } else {
            const check = await compare(old_password, exist[0].password);
            if (check) {
                const hashed = await hash(new_password);
                await execute_query('update_item_by_id', { id: exist[0].user_id, condition: { password: hashed } }, 'user', db);
                return {success: true};
            } else {
                return {success: false, message: 'old password incorrect'};
            }
        }
    } catch (err) {
        console.log('change_password err', err);
        throw(err);
    }
}

// const assign_role = async data => {
//     try {
//         const { username, role } = data;
//         const exist = await execute_query('get_item', { condition: { username } }, 'user', db);
//         if (exist.length === 0) {
//             return 'username not exist';
//         } else {
//             await execute_query('update_item_by_id', { id: exist[0].user_id, condition: { role } }, 'user', db);
//             return 'success';
//         }
//     } catch (err) {
//         console.log('assign_role err', err);
//         throw(err);
//     }
// }

// const get_access_control = async data => {
//     try {
//         const { user, id } = data;
//         const access = await execute_query('get_item', { condition: { id } }, 'access_control', db);
//         if (access[0]) {
//             if (access[0].type === 'url') {
//                 if (access[0].enable.split(',').every(e => !user.role.includes(e))) {
//                     return 'DISABLE';
//                 } else {
//                     return null;
//                 }
//             } else {
//                 if (access[0].enable.split(',').some(e => user.role.includes(e))) {
//                     return 'ENABLE';
//                 } else if (access[0].disable.split(',').some(e => user.role.includes(e))) {
//                     return 'DISABLE';
//                 } else if (access[0].hide.split(',').some(e => user.role.includes(e))) {
//                     return 'HIDE';
//                 } else {
//                     return null;
//                 }
//             }
//         } else {
//             return null;
//         }
//     } catch (err) {
//         console.log('get_access_control err', err);
//         throw(err);
//     }
// }

// const get_menu = async data => {
//     try {
//         const { user } = data;
//         const roles = user.role.split(',');
//         const [menus, urls] = await Promise.all([
//             execute_query('get_items', {}, 'menu', db),
//             execute_query('get_item_by_condition', { where: { type: 'url' } }, 'access_control', db)
//         ]);
//         menus.filter(menu => urls.find(e => e.url === menu.url && roles.every(r => !e.enable.includes(r))));
//         return {user, urls, menus}
//     } catch (err) {
//         console.log('get_menu_access err', err);
//         throw(err);
//     }
// }

module.exports = {
    signup,
    signin,
    change_password,
    // assign_role,
    // get_access_control,
    // get_menu
}