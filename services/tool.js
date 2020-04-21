const moment = require('moment');
const { weekdays } = require('./constants');

const success_res = (data=undefined, message=undefined) => {
	message = message || 'success';
	return {success: true, message, data};
}

const fail_res = message => {
	message = message || 'error';
	return {success: false, message};
}

const fill_zero = int => {
	if (int === 0) return '000000';
	else if (int < 10) return `00000${int}`;
	else if (int < 100) return `0000${int}`;
	else if (int < 1000) return `000${int}`;
	else if (int < 10000) return `00${int}`;
	else if (int < 100000) return `0${int}`;
	else return int.toString();
}

const parseCircular = obj => {
	let cache = [];
	const jsonp = JSON.stringify(obj, (key, value) => {
		if (typeof value === 'object' && value !== null) {
			if (cache.indexOf(value) !== -1) {
				// Circular reference found, discard key
				return;
			}
			// Store value in our collection
			cache.push(value);
		}
		return value;
	});
	cache = null;
	return jsonp;
};

const parseStringToJson = str => {
	let obj = {};
    str.split(',').forEach(e => {
        obj[e.split('=')[0].trim()] = e.split('=')[1].trim()
	});
	return obj;
}

const get_day = (datetime, public_holidays) => {
	const is_ph = public_holidays.includes(moment(datetime).format('YYYY-MM-DD'));
	return is_ph ? 'PH' : weekdays[moment(datetime).day()];
}

const set_time = (datetime, time) => {
	const date = moment(datetime).format('YYYY-MM-DD');
	return moment(date + ' ' + time).format('YYYY-MM-DD HH:mm:ss');
}

const duration_formatting = duration => {//duration unit is second
	if (!duration) {
		return '';
	}
	const [
		years,
		months,
		days,
		hours,
		minutes,
		seconds
	 ] = [
		 moment.duration(duration, 'seconds').years(),
		 moment.duration(duration, 'seconds').months(),
		 moment.duration(duration, 'seconds').days(),
		 moment.duration(duration, 'seconds').hours(),
		 moment.duration(duration, 'seconds').minutes(),
		 moment.duration(duration, 'seconds').seconds()
	 ]; 
	// return {years, months, days, hours, minutes, seconds};
	return `Duration is ${years === 0 ? '' : years === 1 ? '1 year ' : years + ' years '}${months === 0 ? '' : months === 1 ? '1 month ' : months + ' months '}${days === 0 ? '' : days === 1 ? '1 day ' : days + ' days '}${hours === 0 ? '' : hours === 1 ? '1 hour ' : hours + ' hours '}${minutes === 0 ? '' : minutes === 1 ? '1 minute ' : minutes + ' minutes '}${seconds === 0 ? '' : seconds === 1 ? '1 second ' : seconds + ' seconds '}`.slice(0, -1) + '. ';
}

const value_unit = (value, unit) => {
	return value > 1 ? `${value} ${unit}s` : `${value} ${unit}`;
}

const generate_random_integer = () => {
	return Math.floor(100000 + Math.random() * 900000)
}

const return_type = value => {
    if (!value) return null;
    else if (typeof value === 'object' && value.length !== undefined) return 'array';
    else if (typeof value === 'object') return 'object';
    else return typeof value;
}

const checksum = str => {
	const arr = str.split('');
	const mul = [9, 4, 5, 4, 3, 2];
	const ar = arr.slice(1, 7).map((e, i) => {
		const num = e.charCodeAt();
		const el = num > 64 && num < 91 ? num - 64 : parseInt(e);
		return el * mul[i];
	});
	const sum = ar.reduce((sum, e) => sum + e, 0);
	const res = sum - parseInt(sum / 19) * 19;
	const m = ['A', 'Z', 'Y', 'X', 'U', 'T', 'S', 'R', 'P', 'M', 'L', 'K', 'J', 'H', 'G', 'E', 'D', 'C', 'B'];
	return arr[arr.length - 1] === m[res];
}

module.exports = {
	success_res,
	fail_res,
	parseCircular,
	parseStringToJson,
	get_day,
	set_time,
	duration_formatting,
	value_unit,
	generate_random_integer,
	return_type,
	checksum,
	fill_zero
}








