//keyList is an object of all keys with the information of alias, type, special treatment functions
//countryList is for transfer country code into country name
//aliasList is for transfer some strings into correct formation
const { keyList, countryList, aliasList } = require('../services/constants');

//return type of a data as string, number, array or object
//e.g. {} -> 'object'
const returnType = value => {
    if (!value) return null;
    else if (typeof value === 'object' && value.length !== undefined) return 'array';
    else if (typeof value === 'object') return 'object';
    else return typeof value;
}
//get all alias for a given key, include key itself, uppercase first char, and other alias
//e.g. 'id' -> ['id', 'Id', 'hotel_id']
const getAllAlias = key => {
    const otherAlias = keyList[key].alias || [];
    return [key, key.charAt(0).toUpperCase() + key.slice(1), ...otherAlias];
}
//some string need to be corrected and lowercased
//e.g. 'BusinessCenter' -> 'business center'
const correctString = value => {
    let newValue = value.toLowerCase();
    if (aliasList[newValue]) newValue = aliasList[newValue];
    return newValue;
}
//given a key and a source object, get the correct value of the key from the object, simply search in root level
//e.g. source={Id: 'abc'}, key='id' -> 'abc'
const returnKeyValueSimple = (source, key) => {
    if (!source || !key) return undefined;
    const alias = getAllAlias(key);
    const realKey = alias.find(e => source.hasOwnProperty(e) && returnType(source[e]) !== 'object');
    if (!realKey || !source[realKey]) {
        return undefined;
    } else if (keyList[key].subtype && returnType(source[realKey][0]) !== keyList[key].subtype) {
        return undefined;
    } else if (keyList[key].create_method) {
        return create_method[keyList[key].create_method](source[realKey]);
    } else {
        return trimSource(source[realKey]);
    }
}
//deep search all level of an object and return the correct value of a key
//e.g. source={location: {address: 'abc'}}, key='address' -> 'abc'
const returnKeyValue = (source, key) => {
    if (!source || !key || returnType(source) !== 'object') return undefined;
    let result = returnKeyValueSimple(source, key);
    if (result) {
        return result;
    } else {
        Object.keys(source).filter(e => returnType(source[e]) === 'object').some(e => {
            result = returnKeyValue(source[e], key);
            return result;
        });
        return result;
    }
}
//trim all level of an object to remove spaces from the value
//e.g. [' abc', 'de '] -> ['abc', 'de']
const trimSource = source => {
    if (!source) {
        return source;
    } else if (returnType(source) === 'string') {
        source = source.trim();
    } else if (returnType(source) === 'array') {
        source = source.map(e => {
            return trimSource(e);
        });
    } else if (returnType(source) === 'object') {
        Object.keys(source).forEach(e => {
            source[e] = trimSource(source[e]);
        });
    }
    return source;
}
//when get country code change into country name
//e.g. JP -> Japan
const replace_code_with_name = value => {
    if (!value || value.length > 2) return value;
    else return countryList[value];
}
//some array of string need to change into lowercase and do some correction
//e.g. ['drycleaning', 'WiFi'] -> ['dry cleaning', 'wifi']
const lower_case_all = value => {
    if (!value || returnType(value) !== 'array') {
        return value;
    } else {
        return value.map(e => correctString(e.toLowerCase().trim()));
    }
}
//image link formating
//e.g. url -> link
const image_link_formating = value => {
    if (!value) return value;
    else return value.map(e => {
        return {
            link: e.link || e.url,
            description: e.description || e.caption
        }
    });
}
//for some data like description, replace short version with long version
//e.g. A hotel -> A very good hotel...
const longer_replace_shorter = (key, source, target) => {
    if (!target[key]) {
        return source[key];
    } else if (!source[key]) {
        return target[key];
    } else {
        return target[key].length > source[key].length ? target[key] : source[key];
    }
}
//for some data (array) like room facilities, if new source have different items, append them to the old items
//e.g. ['tv', 'tub'], ['tv', 'iron'] -> ['tv', 'tub', 'iron']
const append_different_item = (key, source, target) => {
    if (!target[key]) {
        return source[key];
    } else if (!source[key]) {
        return target[key];
    } else {
        source[key].forEach(e => {
            if (target[key].every(el => el.toLowerCase() !== e.toLowerCase())) {
                target[key].push(e);
            }
        })
        return target[key];
    }
}
//for images if new source have different links, append them to the old images
const append_different_link = (key, source, target) => {
    if (!target[key]) {
        return source[key];
    } else if (!source[key]) {
        return target[key];
    } else {
        source[key].forEach(e => {
            if (target[key].every(el => el.link !== e.link)) {
                target[key].push(e);
            }
        })
        return target[key];
    }
}
//all special treatment function for create new object
const create_method = {
    replace_code_with_name,
    lower_case_all,
    image_link_formating
}
//all special treatment function for merge two sources
const merge_method = {
    longer_replace_shorter,
    append_different_item,
    append_different_link
}
//process one source to set all the key correct, all key will be placed in root level for now
//e.g. {Id: 'a', location: {Address: 'b'}} -> {id: 'a', address: 'b'}
const processOneSource = source => {
    let obj = {};
    Object.keys(keyList).forEach(e => {
        obj[e] = returnKeyValue(source, e);
    });
    return obj;
}
//process an array of sources
const processAllSources = sources => {
    return sources.map(e => processOneSource(e));
}
//merge two source when they have the same id
//e.g. {id: 'a', address: 'b'}, {id: 'a', lat: 123} -> {id: 'a', address: 'b', lat: 123}
const mergeTwoSources = (source, target) => {
    Object.keys(keyList).forEach(e => {
        if (keyList[e].merge_method) {
            target[e] = merge_method[keyList[e].merge_method](e, source, target);
        } else {
            target[e] = target[e] || source[e];
        }
    });
    return target;
}
//merge an array of sources into an array with only different id sources
const mergeAllSources = sources => {
    let target = [];
    sources.forEach(source => {
        let t = target.find(e => e.id === source.id);
        if (t) {
            t = mergeTwoSources(source, t);
        } else {
            target.push(source)
        }
    });
    return target;
}
//after merging sources, get correct address format from address, postalcode and country data
//e.g. address: 'Singapore, hillview peak', postalcode: '667968', country: 'Singapore' -> address: 'hillview peak, 667968', country: 'Singapore'
const addressFormating = source => {
    let address = source.address || '';
    const country = source.country;
    const postalcode = source.postalcode;
    if (country) {
        address = address.replace(`, ${country}`, '').replace(`${country}, `, '').replace(` ${country}`, '').replace(`${country} `, '').replace(`, ${country.toUpperCase()}`, '').replace(`${country.toUpperCase()}, `, '').replace(` ${country.toUpperCase()}`, '').replace(`${country.toUpperCase()} `, '').replace(`, ${country.toLowerCase()}`, '').replace(`${country.toLowerCase()}, `, '').replace(` ${country.toLowerCase()}`, '').replace(`${country.toLowerCase()} `, '');
    }
    if (postalcode) {
        address = address.replace(`, ${postalcode}`, '').replace(`${postalcode}, `, '').replace(` ${postalcode}`, '').replace(`${postalcode} `, '') + (address === '' ? postalcode : `, ${postalcode}`);
    } 
    if (address === '') address = undefined;
    else if (address) {
        source.postalcode = undefined;
        source.address = address;
    }
    return source;
}
//address formating for all sources 
const addressFormatingAll = sources => {
    return sources.map(source => addressFormating(source))
}
//restructure source object to target format
const restructureOneSource = source => {
    Object.keys(keyList).filter(e => keyList[e].parent).forEach(e => {
        console.log(e);
        if (!source[keyList[e].parent]) source[keyList[e].parent] = {};
        source[keyList[e].parent][e] = source[e];
        delete source[e];
    });
    return source;
}
//restructure all sources
const restructureAllSources = sources => {
    return sources.map(source => restructureOneSource(source));
}
//main business flow function
//input data is an array of sources
//first process all sources into a standard format, with all correct key in the root level
//then merge all sources if they have same id
//then do address formating, remove country from the address and append postalcode in the end of the address
//then restructure the sources into correct format
const businessLogic = sources => {
    const pros = processAllSources(sources);
    const merg = mergeAllSources(pros);
    const addr = addressFormatingAll(merg);
    const rest = restructureAllSources(addr);
    return rest;
}

module.exports = {
    businessLogic
};



"{'station_id':'123456','station_type':'ENTRY','transaction_type':'IU','transaction_number':'1100110011','transaction_time':'03/10/2019 10:00:00'}"