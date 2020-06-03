const db = require('./db')
const moment = require('moment')
const { execute_query, prepare_where } = require('./dao')

const create_member = async data => {
    try {
        let { file_id, user_id, quota, status } = data
        status = status || 'INACTIVE'
        const condition = user_id ? { where: { whereand: { file_id, user_id } } } : { where: { file_id } }
        const resp = await execute_query('get_item_by_condition', condition, 'file', db)
        if (!resp || resp.length === 0) throw new Error('file not found')
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
        const { member_id, quota } = data
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
        where = where || { whereand: { user_id } }
        delete where.user_id
        where.whereand = where.whereand || { user_id }
        where.whereand.user_id = user_id
        const order = orderby ? `order by ${orderby} ${orderdirection || 'desc'}` : '';
        const limitation = limit === 'no' ? '' : `limit ${limit || '100'}`;
        const offsetion = offset ? `offset ${offset}` : '';
        const sql = `select m.member_id, m.user_id, m.carpark_id, m.status as member_status, u.username, u.name, u.company, u.contact_number, u.email, c.carpark_name, c.carpark_code, c.address as carpark_address, c.postal_code, c.public_policy, c.billing_method, c.allow_auto_renew, c.allow_giro, c.status as carpark_status, c.remarks from member m left join user u using(user_id) left join carpark c using(carpark_id) where ${prepare_where(where, db)} ${order} ${limitation} ${offsetion}`
        const member = await db.query(sql)
        return member
    } catch (err) {
        return err
    }
}

const list_member_for_admin = async data => {
    try {
        let { where, limit, offset, orderby, orderdirection } = data
        where = where || { member_id: { gt: 0 } }
        const order = orderby ? `order by ${orderby} ${orderdirection || 'desc'}` : '';
        const limitation = limit === 'no' ? '' : `limit ${limit || '100'}`;
        const offsetion = offset ? `offset ${offset}` : '';
        const sql = `select m.member_id, m.user_id, m.carpark_id, m.status as member_status, u.username, u.name, u.company, u.contact_number, u.email, c.carpark_name, c.carpark_code, c.address as carpark_address, c.postal_code, c.public_policy, c.billing_method, c.allow_auto_renew, c.allow_giro, c.status as carpark_status, c.remarks from member m left join user u using(user_id) left join carpark c using(carpark_id) where ${prepare_where(where, db)} ${order} ${limitation} ${offsetion}`
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