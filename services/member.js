const db = require('./db')
const moment = require('moment')
const { execute_query, prepare_where } = require('./dao')

const create_member = async data => {
    try {
        let { file_id, user_id, quota, status } = data
        status = status || 'INACTIVE'
        const condition = user_id ? { where: { whereand: { file_id, user_id } } } : { where: { file_id } }
        const condition2 = user_id ? { where: { whereand: { file_id, user_id, status: 'ACTIVE' } } } : { where: { whereand: { file_id, status: 'ACTIVE' } } }
        const resp = await Promise.all([
            execute_query('get_item_by_condition', condition, 'file', db),
            execute_query('get_item_by_condition', condition2, 'member', db)
        ])
        if (!resp[0] || resp[0].length === 0) throw new Error('file not found')
        if (resp[1] && resp[1].length > 0) throw new Error('member already exist')
        const { carpark_id } = resp[0]
        user_id = user_id || resp[0].user_id
        const item = { file_id, user_id, carpark_id, quota, status, created_at: moment().format('YYYY-MM-DD HH:mm:ss'), updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }
        const member = await execute_query('create_item', item, 'member', db)
        return { ...item, member_id: member.insertId }
    } catch (err) {
        return err
    }
}

const apply_member = async data => {
    try {
        const { file_id, user } = data
        const { user_id } = user
        return create_member({ file_id, user_id })
    } catch (err) {
        return err
    }
}

const approve_member = async data => {
    try {
        let { member_id, quota } = data
        quota = quota || 255
        const member = await list_member_for_admin({ where: { member_id } })
        if (!member || member.length === 0) throw new Error('member not found')
        await execute_query('update_item_by_id', { id: member_id, condition: { status: 'ACTIVE', quota } }, 'member', db)
        return true
    } catch (err) {
        return err
    }
}

const list_member = async data => {
    try {
        let { where, limit, offset, orderby, orderdirection, user } = data
        const { user_id } = user
        where = where || { whereand: { 'u.user_id': user_id } }
        delete where.user_id
        delete where['m.user_id']
        delete where['u.user_id']
        delete where['f.user_id']
        where.whereand = where.whereand || { 'u.user_id': user_id }
        where.whereand['u.user_id'] = user_id
        delete where.whereand['m.user_id']
        delete where.whereand['f.user_id']
        const order = orderby ? `order by ${orderby} ${orderdirection || 'desc'}` : '';
        const limitation = limit === 'no' ? '' : `limit ${limit || '100'}`;
        const offsetion = offset ? `offset ${offset}` : '';
        const sql = `select m.member_id, m.user_id, m.carpark_id, m.status as member_status, m.file_id, f.file_type, f.name, f.status as file_status, u.username, u.name, u.company, u.contact_number, u.email, c.carpark_name, c.carpark_code, c.address as carpark_address, c.postal_code, c.public_policy, c.billing_method, c.allow_auto_renew, c.allow_giro, c.status as carpark_status, c.remarks from member m left join file f using(file_id) left join user u on m.user_id = u.user_id left join carpark c on m.carpark_id = c.carpark_id where ${prepare_where(where, db)} ${order} ${limitation} ${offsetion}`
        const member = await db.query(sql)
        return member
    } catch (err) {
        return err
    }
}

const list_member_for_admin = async data => {
    try {
        let { where, limit, offset, orderby, orderdirection } = data
        where = where || { 'm.member_id': { gt: 0 } }
        const order = orderby ? `order by ${orderby} ${orderdirection || 'desc'}` : '';
        const limitation = limit === 'no' ? '' : `limit ${limit || '100'}`;
        const offsetion = offset ? `offset ${offset}` : '';
        const sql = `select m.member_id, m.user_id, m.carpark_id, m.status as member_status, m.file_id, f.file_type, f.name, f.file_name, f.mimetype, f.size, f.file_path, f.status as file_status, u.username, u.name, u.company, u.contact_number, u.email, c.carpark_name, c.carpark_code, c.address as carpark_address, c.postal_code, c.public_policy, c.billing_method, c.allow_auto_renew, c.allow_giro, c.status as carpark_status, c.remarks from member m left join file f using(file_id) left join user u on m.user_id = u.user_id left join carpark c on m.carpark_id = c.carpark_id where ${prepare_where(where, db)} ${order} ${limitation} ${offsetion}`
        const member = await db.query(sql)
        return member
    } catch (err) {
        return err
    }
}

const create_member_batch = async data => {
    try {
        const { files, user } = data
        const resp = await Promise.all(files.map(f => create_member({ file_id: f.file_id, quota: f.quota, status: 'ACTIVE' })))
        return resp
    } catch (err) {
        return err
    }
}

const remove_member_batch = async data => {
    try {
        const { members, user } = data
        const resp = await Promise.all(members.map(f => execute_query('update_item_by_id', { where: { member_id: f.member_id }, condition: { status: 'INACTIVE' } }, 'member', db)))
        return resp
    } catch (err) {
        return err
    }
}

module.exports = {
    apply_member,
    approve_member,
    list_member,
    list_member_for_admin,
    create_member_batch,
    remove_member_batch
}