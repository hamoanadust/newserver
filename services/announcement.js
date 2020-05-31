
const get_announcement = async data => {
    try {
        const { user } = data
        const { user_id } = user

        const condition = { where: { status: 'ACTIVE' }, orderby: 'announcement_id', orderdirection: 'desc', limit: 1 }
        const [announcement, userData] = await Promise.all([
            execute_query('get_item_by_condition', condition, 'announcement', db),
            execute_query('get_item_by_condition', { where: { user_id } }, 'user', db)
        ]) 
        return userData[0].announcement_dismiss || !announcement || announcement.length === 0 ? [] : announcement[0]
    } catch (err) {
        return err
    }
}

const dismiss_announcement = async data => {
    try {
        const { user } = data
        let condition = { announcement_dismiss: true }
        const resp = await execute_query('update_item_by_id', { id: user.user_id, condition }, 'user', db)
        return true
    } catch (err) {
        return err
    }
}

const create_announcement_inactive = async data => {
    try {
        const { content } = data
        const announcement = await execute_query('create_item', { content }, 'announcement', db)
        return { announcement_id: announcement.insertId }
    } catch (err) {
        return err
    }
}

const create_announcement_active = async data => {
    try {
        const { content } = data
        const announcement = await create_announcement_inactive({ content })
        const { announcement_id } = announcement
        const activation = await active_announcement({ announcement_id })
        return activation
    } catch (err) {
        return err
    }
}

const active_announcement = async data => {
    try {
        const { announcement_id } = data
        await Promise.all([
            execute_query('update_item_by_id', { where: { status: 'ACTIVE' }, condition: { status: 'INACTIVE' } }, 'announcement', db),
            execute_query('update_item_by_id', { where: { announcement_dismiss: true }, condition: { announcement_dismiss: false } }, 'user', db)
        ])
        const resp = await execute_query('update_item_by_id', { id: announcement_id, condition: { status: 'ACTIVE' } }, 'announcement', db)
        return true
    } catch (err) {
        return err
    }
}

const inactive_announcement = async data => {
    try {
        const { announcement_id } = data
        const resp = await execute_query('update_item_by_id', { id: announcement_id, condition: { status: 'INACTIVE' } }, 'announcement', db)
        return true
    } catch (err) {
        return err
    }
}

const list_announcement = async data => {
    try {
        let { where, limit, offset, orderby, orderdirection } = data
        where = where || { announcement_id: { gt: 0 } }
        const announcement = await execute_query('get_item_by_condition', { where, limit, offset, orderby, orderdirection }, 'announcement', db)
        return announcement
    } catch (err) {
        return err
    }
}

module.exports = {
    get_announcement,
    dismiss_announcement,
    create_announcement_inactive,
    create_announcement_active,
    active_announcement,
    inactive_announcement,
    list_announcement
}