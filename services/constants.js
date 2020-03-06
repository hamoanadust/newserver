const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const GANTRY_TYPE = {
    0: 'ENTRY',
    1: 'EXIT',
    10: 'MANAGE',
    11: 'CHU'
}
const TCP_TYPE = {
    0: 'TRANS',
    1: 'QUERY'
}
const BUFFER_CODE = {
    ACK: [0x65, 0x03, 0x00, 0x00]
}
module.exports = {
    weekdays,
    GANTRY_TYPE,
    TCP_TYPE,
    BUFFER_CODE
};