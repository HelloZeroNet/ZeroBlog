;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () { 'use strict';

var hookCallback;

function hooks () {
    return hookCallback.apply(null, arguments);
}

// This is done to register the method called with moment()
// without creating circular dependencies.
function setHookCallback (callback) {
    hookCallback = callback;
}

function isArray(input) {
    return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
}

function isObject(input) {
    // IE8 will treat undefined and null as object if it wasn't for
    // input != null
    return input != null && Object.prototype.toString.call(input) === '[object Object]';
}

function isObjectEmpty(obj) {
    var k;
    for (k in obj) {
        // even if its not own property I'd still call it non-empty
        return false;
    }
    return true;
}

function isNumber(input) {
    return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
}

function isDate(input) {
    return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
}

function map(arr, fn) {
    var res = [], i;
    for (i = 0; i < arr.length; ++i) {
        res.push(fn(arr[i], i));
    }
    return res;
}

function hasOwnProp(a, b) {
    return Object.prototype.hasOwnProperty.call(a, b);
}

function extend(a, b) {
    for (var i in b) {
        if (hasOwnProp(b, i)) {
            a[i] = b[i];
        }
    }

    if (hasOwnProp(b, 'toString')) {
        a.toString = b.toString;
    }

    if (hasOwnProp(b, 'valueOf')) {
        a.valueOf = b.valueOf;
    }

    return a;
}

function createUTC (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, true).utc();
}

function defaultParsingFlags() {
    // We need to deep clone this object.
    return {
        empty           : false,
        unusedTokens    : [],
        unusedInput     : [],
        overflow        : -2,
        charsLeftOver   : 0,
        nullInput       : false,
        invalidMonth    : null,
        invalidFormat   : false,
        userInvalidated : false,
        iso             : false,
        parsedDateParts : [],
        meridiem        : null
    };
}

function getParsingFlags(m) {
    if (m._pf == null) {
        m._pf = defaultParsingFlags();
    }
    return m._pf;
}

var some;
if (Array.prototype.some) {
    some = Array.prototype.some;
} else {
    some = function (fun) {
        var t = Object(this);
        var len = t.length >>> 0;

        for (var i = 0; i < len; i++) {
            if (i in t && fun.call(this, t[i], i, t)) {
                return true;
            }
        }

        return false;
    };
}

var some$1 = some;

function isValid(m) {
    if (m._isValid == null) {
        var flags = getParsingFlags(m);
        var parsedParts = some$1.call(flags.parsedDateParts, function (i) {
            return i != null;
        });
        var isNowValid = !isNaN(m._d.getTime()) &&
            flags.overflow < 0 &&
            !flags.empty &&
            !flags.invalidMonth &&
            !flags.invalidWeekday &&
            !flags.nullInput &&
            !flags.invalidFormat &&
            !flags.userInvalidated &&
            (!flags.meridiem || (flags.meridiem && parsedParts));

        if (m._strict) {
            isNowValid = isNowValid &&
                flags.charsLeftOver === 0 &&
                flags.unusedTokens.length === 0 &&
                flags.bigHour === undefined;
        }

        if (Object.isFrozen == null || !Object.isFrozen(m)) {
            m._isValid = isNowValid;
        }
        else {
            return isNowValid;
        }
    }
    return m._isValid;
}

function createInvalid (flags) {
    var m = createUTC(NaN);
    if (flags != null) {
        extend(getParsingFlags(m), flags);
    }
    else {
        getParsingFlags(m).userInvalidated = true;
    }

    return m;
}

function isUndefined(input) {
    return input === void 0;
}

// Plugins that add properties should also add the key here (null value),
// so we can properly clone ourselves.
var momentProperties = hooks.momentProperties = [];

function copyConfig(to, from) {
    var i, prop, val;

    if (!isUndefined(from._isAMomentObject)) {
        to._isAMomentObject = from._isAMomentObject;
    }
    if (!isUndefined(from._i)) {
        to._i = from._i;
    }
    if (!isUndefined(from._f)) {
        to._f = from._f;
    }
    if (!isUndefined(from._l)) {
        to._l = from._l;
    }
    if (!isUndefined(from._strict)) {
        to._strict = from._strict;
    }
    if (!isUndefined(from._tzm)) {
        to._tzm = from._tzm;
    }
    if (!isUndefined(from._isUTC)) {
        to._isUTC = from._isUTC;
    }
    if (!isUndefined(from._offset)) {
        to._offset = from._offset;
    }
    if (!isUndefined(from._pf)) {
        to._pf = getParsingFlags(from);
    }
    if (!isUndefined(from._locale)) {
        to._locale = from._locale;
    }

    if (momentProperties.length > 0) {
        for (i in momentProperties) {
            prop = momentProperties[i];
            val = from[prop];
            if (!isUndefined(val)) {
                to[prop] = val;
            }
        }
    }

    return to;
}

var updateInProgress = false;

// Moment prototype object
function Moment(config) {
    copyConfig(this, config);
    this._d = new Date(config._d != null ? config._d.getTime() : NaN);
    if (!this.isValid()) {
        this._d = new Date(NaN);
    }
    // Prevent infinite loop in case updateOffset creates new moment
    // objects.
    if (updateInProgress === false) {
        updateInProgress = true;
        hooks.updateOffset(this);
        updateInProgress = false;
    }
}

function isMoment (obj) {
    return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
}

function absFloor (number) {
    if (number < 0) {
        // -0 -> 0
        return Math.ceil(number) || 0;
    } else {
        return Math.floor(number);
    }
}

function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion,
        value = 0;

    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
        value = absFloor(coercedNumber);
    }

    return value;
}

// compare two arrays, return the number of differences
function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length),
        lengthDiff = Math.abs(array1.length - array2.length),
        diffs = 0,
        i;
    for (i = 0; i < len; i++) {
        if ((dontConvert && array1[i] !== array2[i]) ||
            (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
            diffs++;
        }
    }
    return diffs + lengthDiff;
}

function warn(msg) {
    if (hooks.suppressDeprecationWarnings === false &&
            (typeof console !==  'undefined') && console.warn) {
        console.warn('Deprecation warning: ' + msg);
    }
}

function deprecate(msg, fn) {
    var firstTime = true;

    return extend(function () {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(null, msg);
        }
        if (firstTime) {
            var args = [];
            var arg;
            for (var i = 0; i < arguments.length; i++) {
                arg = '';
                if (typeof arguments[i] === 'object') {
                    arg += '\n[' + i + '] ';
                    for (var key in arguments[0]) {
                        arg += key + ': ' + arguments[0][key] + ', ';
                    }
                    arg = arg.slice(0, -2); // Remove trailing comma and space
                } else {
                    arg = arguments[i];
                }
                args.push(arg);
            }
            warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
            firstTime = false;
        }
        return fn.apply(this, arguments);
    }, fn);
}

var deprecations = {};

function deprecateSimple(name, msg) {
    if (hooks.deprecationHandler != null) {
        hooks.deprecationHandler(name, msg);
    }
    if (!deprecations[name]) {
        warn(msg);
        deprecations[name] = true;
    }
}

hooks.suppressDeprecationWarnings = false;
hooks.deprecationHandler = null;

function isFunction(input) {
    return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
}

function set (config) {
    var prop, i;
    for (i in config) {
        prop = config[i];
        if (isFunction(prop)) {
            this[i] = prop;
        } else {
            this['_' + i] = prop;
        }
    }
    this._config = config;
    // Lenient ordinal parsing accepts just a number in addition to
    // number + (possibly) stuff coming from _ordinalParseLenient.
    this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + (/\d{1,2}/).source);
}

function mergeConfigs(parentConfig, childConfig) {
    var res = extend({}, parentConfig), prop;
    for (prop in childConfig) {
        if (hasOwnProp(childConfig, prop)) {
            if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                res[prop] = {};
                extend(res[prop], parentConfig[prop]);
                extend(res[prop], childConfig[prop]);
            } else if (childConfig[prop] != null) {
                res[prop] = childConfig[prop];
            } else {
                delete res[prop];
            }
        }
    }
    for (prop in parentConfig) {
        if (hasOwnProp(parentConfig, prop) &&
                !hasOwnProp(childConfig, prop) &&
                isObject(parentConfig[prop])) {
            // make sure changes to properties don't modify parent config
            res[prop] = extend({}, res[prop]);
        }
    }
    return res;
}

function Locale(config) {
    if (config != null) {
        this.set(config);
    }
}

var keys;

if (Object.keys) {
    keys = Object.keys;
} else {
    keys = function (obj) {
        var i, res = [];
        for (i in obj) {
            if (hasOwnProp(obj, i)) {
                res.push(i);
            }
        }
        return res;
    };
}

var keys$1 = keys;

var defaultCalendar = {
    sameDay : '[Today at] LT',
    nextDay : '[Tomorrow at] LT',
    nextWeek : 'dddd [at] LT',
    lastDay : '[Yesterday at] LT',
    lastWeek : '[Last] dddd [at] LT',
    sameElse : 'L'
};

function calendar (key, mom, now) {
    var output = this._calendar[key] || this._calendar['sameElse'];
    return isFunction(output) ? output.call(mom, now) : output;
}

var defaultLongDateFormat = {
    LTS  : 'h:mm:ss A',
    LT   : 'h:mm A',
    L    : 'MM/DD/YYYY',
    LL   : 'MMMM D, YYYY',
    LLL  : 'MMMM D, YYYY h:mm A',
    LLLL : 'dddd, MMMM D, YYYY h:mm A'
};

function longDateFormat (key) {
    var format = this._longDateFormat[key],
        formatUpper = this._longDateFormat[key.toUpperCase()];

    if (format || !formatUpper) {
        return format;
    }

    this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
        return val.slice(1);
    });

    return this._longDateFormat[key];
}

var defaultInvalidDate = 'Invalid date';

function invalidDate () {
    return this._invalidDate;
}

var defaultOrdinal = '%d';
var defaultOrdinalParse = /\d{1,2}/;

function ordinal (number) {
    return this._ordinal.replace('%d', number);
}

var defaultRelativeTime = {
    future : 'in %s',
    past   : '%s ago',
    s  : 'a few seconds',
    m  : 'a minute',
    mm : '%d minutes',
    h  : 'an hour',
    hh : '%d hours',
    d  : 'a day',
    dd : '%d days',
    M  : 'a month',
    MM : '%d months',
    y  : 'a year',
    yy : '%d years'
};

function relativeTime (number, withoutSuffix, string, isFuture) {
    var output = this._relativeTime[string];
    return (isFunction(output)) ?
        output(number, withoutSuffix, string, isFuture) :
        output.replace(/%d/i, number);
}

function pastFuture (diff, output) {
    var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
    return isFunction(format) ? format(output) : format.replace(/%s/i, output);
}

var aliases = {};

function addUnitAlias (unit, shorthand) {
    var lowerCase = unit.toLowerCase();
    aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
}

function normalizeUnits(units) {
    return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
}

function normalizeObjectUnits(inputObject) {
    var normalizedInput = {},
        normalizedProp,
        prop;

    for (prop in inputObject) {
        if (hasOwnProp(inputObject, prop)) {
            normalizedProp = normalizeUnits(prop);
            if (normalizedProp) {
                normalizedInput[normalizedProp] = inputObject[prop];
            }
        }
    }

    return normalizedInput;
}

var priorities = {};

function addUnitPriority(unit, priority) {
    priorities[unit] = priority;
}

function getPrioritizedUnits(unitsObj) {
    var units = [];
    for (var u in unitsObj) {
        units.push({unit: u, priority: priorities[u]});
    }
    units.sort(function (a, b) {
        return a.priority - b.priority;
    });
    return units;
}

function makeGetSet (unit, keepTime) {
    return function (value) {
        if (value != null) {
            set$1(this, unit, value);
            hooks.updateOffset(this, keepTime);
            return this;
        } else {
            return get(this, unit);
        }
    };
}

function get (mom, unit) {
    return mom.isValid() ?
        mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
}

function set$1 (mom, unit, value) {
    if (mom.isValid()) {
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
    }
}

// MOMENTS

function stringGet (units) {
    units = normalizeUnits(units);
    if (isFunction(this[units])) {
        return this[units]();
    }
    return this;
}


function stringSet (units, value) {
    if (typeof units === 'object') {
        units = normalizeObjectUnits(units);
        var prioritized = getPrioritizedUnits(units);
        for (var i = 0; i < prioritized.length; i++) {
            this[prioritized[i].unit](units[prioritized[i].unit]);
        }
    } else {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units](value);
        }
    }
    return this;
}

function zeroFill(number, targetLength, forceSign) {
    var absNumber = '' + Math.abs(number),
        zerosToFill = targetLength - absNumber.length,
        sign = number >= 0;
    return (sign ? (forceSign ? '+' : '') : '-') +
        Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
}

var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

var formatFunctions = {};

var formatTokenFunctions = {};

// token:    'M'
// padded:   ['MM', 2]
// ordinal:  'Mo'
// callback: function () { this.month() + 1 }
function addFormatToken (token, padded, ordinal, callback) {
    var func = callback;
    if (typeof callback === 'string') {
        func = function () {
            return this[callback]();
        };
    }
    if (token) {
        formatTokenFunctions[token] = func;
    }
    if (padded) {
        formatTokenFunctions[padded[0]] = function () {
            return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
        };
    }
    if (ordinal) {
        formatTokenFunctions[ordinal] = function () {
            return this.localeData().ordinal(func.apply(this, arguments), token);
        };
    }
}

function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
        return input.replace(/^\[|\]$/g, '');
    }
    return input.replace(/\\/g, '');
}

function makeFormatFunction(format) {
    var array = format.match(formattingTokens), i, length;

    for (i = 0, length = array.length; i < length; i++) {
        if (formatTokenFunctions[array[i]]) {
            array[i] = formatTokenFunctions[array[i]];
        } else {
            array[i] = removeFormattingTokens(array[i]);
        }
    }

    return function (mom) {
        var output = '', i;
        for (i = 0; i < length; i++) {
            output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
        }
        return output;
    };
}

// format date using native date object
function formatMoment(m, format) {
    if (!m.isValid()) {
        return m.localeData().invalidDate();
    }

    format = expandFormat(format, m.localeData());
    formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

    return formatFunctions[format](m);
}

function expandFormat(format, locale) {
    var i = 5;

    function replaceLongDateFormatTokens(input) {
        return locale.longDateFormat(input) || input;
    }

    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format)) {
        format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
        localFormattingTokens.lastIndex = 0;
        i -= 1;
    }

    return format;
}

var match1         = /\d/;            //       0 - 9
var match2         = /\d\d/;          //      00 - 99
var match3         = /\d{3}/;         //     000 - 999
var match4         = /\d{4}/;         //    0000 - 9999
var match6         = /[+-]?\d{6}/;    // -999999 - 999999
var match1to2      = /\d\d?/;         //       0 - 99
var match3to4      = /\d\d\d\d?/;     //     999 - 9999
var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
var match1to3      = /\d{1,3}/;       //       0 - 999
var match1to4      = /\d{1,4}/;       //       0 - 9999
var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

var matchUnsigned  = /\d+/;           //       0 - inf
var matchSigned    = /[+-]?\d+/;      //    -inf - inf

var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

// any word (or two) characters or numbers including two/three word month in arabic.
// includes scottish gaelic two word and hyphenated months
var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


var regexes = {};

function addRegexToken (token, regex, strictRegex) {
    regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
        return (isStrict && strictRegex) ? strictRegex : regex;
    };
}

function getParseRegexForToken (token, config) {
    if (!hasOwnProp(regexes, token)) {
        return new RegExp(unescapeFormat(token));
    }

    return regexes[token](config._strict, config._locale);
}

// Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
function unescapeFormat(s) {
    return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
        return p1 || p2 || p3 || p4;
    }));
}

function regexEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

var tokens = {};

function addParseToken (token, callback) {
    var i, func = callback;
    if (typeof token === 'string') {
        token = [token];
    }
    if (isNumber(callback)) {
        func = function (input, array) {
            array[callback] = toInt(input);
        };
    }
    for (i = 0; i < token.length; i++) {
        tokens[token[i]] = func;
    }
}

function addWeekParseToken (token, callback) {
    addParseToken(token, function (input, array, config, token) {
        config._w = config._w || {};
        callback(input, config._w, config, token);
    });
}

function addTimeToArrayFromToken(token, input, config) {
    if (input != null && hasOwnProp(tokens, token)) {
        tokens[token](input, config._a, config, token);
    }
}

var YEAR = 0;
var MONTH = 1;
var DATE = 2;
var HOUR = 3;
var MINUTE = 4;
var SECOND = 5;
var MILLISECOND = 6;
var WEEK = 7;
var WEEKDAY = 8;

var indexOf;

if (Array.prototype.indexOf) {
    indexOf = Array.prototype.indexOf;
} else {
    indexOf = function (o) {
        // I know
        var i;
        for (i = 0; i < this.length; ++i) {
            if (this[i] === o) {
                return i;
            }
        }
        return -1;
    };
}

var indexOf$1 = indexOf;

function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// FORMATTING

addFormatToken('M', ['MM', 2], 'Mo', function () {
    return this.month() + 1;
});

addFormatToken('MMM', 0, 0, function (format) {
    return this.localeData().monthsShort(this, format);
});

addFormatToken('MMMM', 0, 0, function (format) {
    return this.localeData().months(this, format);
});

// ALIASES

addUnitAlias('month', 'M');

// PRIORITY

addUnitPriority('month', 8);

// PARSING

addRegexToken('M',    match1to2);
addRegexToken('MM',   match1to2, match2);
addRegexToken('MMM',  function (isStrict, locale) {
    return locale.monthsShortRegex(isStrict);
});
addRegexToken('MMMM', function (isStrict, locale) {
    return locale.monthsRegex(isStrict);
});

addParseToken(['M', 'MM'], function (input, array) {
    array[MONTH] = toInt(input) - 1;
});

addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
    var month = config._locale.monthsParse(input, token, config._strict);
    // if we didn't find a month name, mark the date as invalid.
    if (month != null) {
        array[MONTH] = month;
    } else {
        getParsingFlags(config).invalidMonth = input;
    }
});

// LOCALES

var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
function localeMonths (m, format) {
    if (!m) {
        return this._months;
    }
    return isArray(this._months) ? this._months[m.month()] :
        this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
}

var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
function localeMonthsShort (m, format) {
    if (!m) {
        return this._monthsShort;
    }
    return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
        this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
}

function handleStrictParse(monthName, format, strict) {
    var i, ii, mom, llc = monthName.toLocaleLowerCase();
    if (!this._monthsParse) {
        // this is not used
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
        for (i = 0; i < 12; ++i) {
            mom = createUTC([2000, i]);
            this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
            this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
        }
    }

    if (strict) {
        if (format === 'MMM') {
            ii = indexOf$1.call(this._shortMonthsParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._longMonthsParse, llc);
            return ii !== -1 ? ii : null;
        }
    } else {
        if (format === 'MMM') {
            ii = indexOf$1.call(this._shortMonthsParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._longMonthsParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._longMonthsParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._shortMonthsParse, llc);
            return ii !== -1 ? ii : null;
        }
    }
}

function localeMonthsParse (monthName, format, strict) {
    var i, mom, regex;

    if (this._monthsParseExact) {
        return handleStrictParse.call(this, monthName, format, strict);
    }

    if (!this._monthsParse) {
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
    }

    // TODO: add sorting
    // Sorting makes sure if one month (or abbr) is a prefix of another
    // see sorting in computeMonthsParse
    for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, i]);
        if (strict && !this._longMonthsParse[i]) {
            this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
            this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
        }
        if (!strict && !this._monthsParse[i]) {
            regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
            this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
            return i;
        } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
            return i;
        } else if (!strict && this._monthsParse[i].test(monthName)) {
            return i;
        }
    }
}

// MOMENTS

function setMonth (mom, value) {
    var dayOfMonth;

    if (!mom.isValid()) {
        // No op
        return mom;
    }

    if (typeof value === 'string') {
        if (/^\d+$/.test(value)) {
            value = toInt(value);
        } else {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (!isNumber(value)) {
                return mom;
            }
        }
    }

    dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
    mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
    return mom;
}

function getSetMonth (value) {
    if (value != null) {
        setMonth(this, value);
        hooks.updateOffset(this, true);
        return this;
    } else {
        return get(this, 'Month');
    }
}

function getDaysInMonth () {
    return daysInMonth(this.year(), this.month());
}

var defaultMonthsShortRegex = matchWord;
function monthsShortRegex (isStrict) {
    if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
            computeMonthsParse.call(this);
        }
        if (isStrict) {
            return this._monthsShortStrictRegex;
        } else {
            return this._monthsShortRegex;
        }
    } else {
        if (!hasOwnProp(this, '_monthsShortRegex')) {
            this._monthsShortRegex = defaultMonthsShortRegex;
        }
        return this._monthsShortStrictRegex && isStrict ?
            this._monthsShortStrictRegex : this._monthsShortRegex;
    }
}

var defaultMonthsRegex = matchWord;
function monthsRegex (isStrict) {
    if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
            computeMonthsParse.call(this);
        }
        if (isStrict) {
            return this._monthsStrictRegex;
        } else {
            return this._monthsRegex;
        }
    } else {
        if (!hasOwnProp(this, '_monthsRegex')) {
            this._monthsRegex = defaultMonthsRegex;
        }
        return this._monthsStrictRegex && isStrict ?
            this._monthsStrictRegex : this._monthsRegex;
    }
}

function computeMonthsParse () {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom;
    for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, i]);
        shortPieces.push(this.monthsShort(mom, ''));
        longPieces.push(this.months(mom, ''));
        mixedPieces.push(this.months(mom, ''));
        mixedPieces.push(this.monthsShort(mom, ''));
    }
    // Sorting makes sure if one month (or abbr) is a prefix of another it
    // will match the longer piece.
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 12; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
    }
    for (i = 0; i < 24; i++) {
        mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._monthsShortRegex = this._monthsRegex;
    this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
}

// FORMATTING

addFormatToken('Y', 0, 0, function () {
    var y = this.year();
    return y <= 9999 ? '' + y : '+' + y;
});

addFormatToken(0, ['YY', 2], 0, function () {
    return this.year() % 100;
});

addFormatToken(0, ['YYYY',   4],       0, 'year');
addFormatToken(0, ['YYYYY',  5],       0, 'year');
addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

// ALIASES

addUnitAlias('year', 'y');

// PRIORITIES

addUnitPriority('year', 1);

// PARSING

addRegexToken('Y',      matchSigned);
addRegexToken('YY',     match1to2, match2);
addRegexToken('YYYY',   match1to4, match4);
addRegexToken('YYYYY',  match1to6, match6);
addRegexToken('YYYYYY', match1to6, match6);

addParseToken(['YYYYY', 'YYYYYY'], YEAR);
addParseToken('YYYY', function (input, array) {
    array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
});
addParseToken('YY', function (input, array) {
    array[YEAR] = hooks.parseTwoDigitYear(input);
});
addParseToken('Y', function (input, array) {
    array[YEAR] = parseInt(input, 10);
});

// HELPERS

function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// HOOKS

hooks.parseTwoDigitYear = function (input) {
    return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
};

// MOMENTS

var getSetYear = makeGetSet('FullYear', true);

function getIsLeapYear () {
    return isLeapYear(this.year());
}

function createDate (y, m, d, h, M, s, ms) {
    //can't just apply() to create a date:
    //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
    var date = new Date(y, m, d, h, M, s, ms);

    //the date constructor remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
        date.setFullYear(y);
    }
    return date;
}

function createUTCDate (y) {
    var date = new Date(Date.UTC.apply(null, arguments));

    //the Date.UTC function remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
        date.setUTCFullYear(y);
    }
    return date;
}

// start-of-first-week - start-of-year
function firstWeekOffset(year, dow, doy) {
    var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
        fwd = 7 + dow - doy,
        // first-week day local weekday -- which local weekday is fwd
        fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

    return -fwdlw + fwd - 1;
}

//http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
    var localWeekday = (7 + weekday - dow) % 7,
        weekOffset = firstWeekOffset(year, dow, doy),
        dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
        resYear, resDayOfYear;

    if (dayOfYear <= 0) {
        resYear = year - 1;
        resDayOfYear = daysInYear(resYear) + dayOfYear;
    } else if (dayOfYear > daysInYear(year)) {
        resYear = year + 1;
        resDayOfYear = dayOfYear - daysInYear(year);
    } else {
        resYear = year;
        resDayOfYear = dayOfYear;
    }

    return {
        year: resYear,
        dayOfYear: resDayOfYear
    };
}

function weekOfYear(mom, dow, doy) {
    var weekOffset = firstWeekOffset(mom.year(), dow, doy),
        week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
        resWeek, resYear;

    if (week < 1) {
        resYear = mom.year() - 1;
        resWeek = week + weeksInYear(resYear, dow, doy);
    } else if (week > weeksInYear(mom.year(), dow, doy)) {
        resWeek = week - weeksInYear(mom.year(), dow, doy);
        resYear = mom.year() + 1;
    } else {
        resYear = mom.year();
        resWeek = week;
    }

    return {
        week: resWeek,
        year: resYear
    };
}

function weeksInYear(year, dow, doy) {
    var weekOffset = firstWeekOffset(year, dow, doy),
        weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
    return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
}

// FORMATTING

addFormatToken('w', ['ww', 2], 'wo', 'week');
addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

// ALIASES

addUnitAlias('week', 'w');
addUnitAlias('isoWeek', 'W');

// PRIORITIES

addUnitPriority('week', 5);
addUnitPriority('isoWeek', 5);

// PARSING

addRegexToken('w',  match1to2);
addRegexToken('ww', match1to2, match2);
addRegexToken('W',  match1to2);
addRegexToken('WW', match1to2, match2);

addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
    week[token.substr(0, 1)] = toInt(input);
});

// HELPERS

// LOCALES

function localeWeek (mom) {
    return weekOfYear(mom, this._week.dow, this._week.doy).week;
}

var defaultLocaleWeek = {
    dow : 0, // Sunday is the first day of the week.
    doy : 6  // The week that contains Jan 1st is the first week of the year.
};

function localeFirstDayOfWeek () {
    return this._week.dow;
}

function localeFirstDayOfYear () {
    return this._week.doy;
}

// MOMENTS

function getSetWeek (input) {
    var week = this.localeData().week(this);
    return input == null ? week : this.add((input - week) * 7, 'd');
}

function getSetISOWeek (input) {
    var week = weekOfYear(this, 1, 4).week;
    return input == null ? week : this.add((input - week) * 7, 'd');
}

// FORMATTING

addFormatToken('d', 0, 'do', 'day');

addFormatToken('dd', 0, 0, function (format) {
    return this.localeData().weekdaysMin(this, format);
});

addFormatToken('ddd', 0, 0, function (format) {
    return this.localeData().weekdaysShort(this, format);
});

addFormatToken('dddd', 0, 0, function (format) {
    return this.localeData().weekdays(this, format);
});

addFormatToken('e', 0, 0, 'weekday');
addFormatToken('E', 0, 0, 'isoWeekday');

// ALIASES

addUnitAlias('day', 'd');
addUnitAlias('weekday', 'e');
addUnitAlias('isoWeekday', 'E');

// PRIORITY
addUnitPriority('day', 11);
addUnitPriority('weekday', 11);
addUnitPriority('isoWeekday', 11);

// PARSING

addRegexToken('d',    match1to2);
addRegexToken('e',    match1to2);
addRegexToken('E',    match1to2);
addRegexToken('dd',   function (isStrict, locale) {
    return locale.weekdaysMinRegex(isStrict);
});
addRegexToken('ddd',   function (isStrict, locale) {
    return locale.weekdaysShortRegex(isStrict);
});
addRegexToken('dddd',   function (isStrict, locale) {
    return locale.weekdaysRegex(isStrict);
});

addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
    var weekday = config._locale.weekdaysParse(input, token, config._strict);
    // if we didn't get a weekday name, mark the date as invalid
    if (weekday != null) {
        week.d = weekday;
    } else {
        getParsingFlags(config).invalidWeekday = input;
    }
});

addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
    week[token] = toInt(input);
});

// HELPERS

function parseWeekday(input, locale) {
    if (typeof input !== 'string') {
        return input;
    }

    if (!isNaN(input)) {
        return parseInt(input, 10);
    }

    input = locale.weekdaysParse(input);
    if (typeof input === 'number') {
        return input;
    }

    return null;
}

function parseIsoWeekday(input, locale) {
    if (typeof input === 'string') {
        return locale.weekdaysParse(input) % 7 || 7;
    }
    return isNaN(input) ? null : input;
}

// LOCALES

var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
function localeWeekdays (m, format) {
    if (!m) {
        return this._weekdays;
    }
    return isArray(this._weekdays) ? this._weekdays[m.day()] :
        this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
}

var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
function localeWeekdaysShort (m) {
    return (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
}

var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
function localeWeekdaysMin (m) {
    return (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
}

function handleStrictParse$1(weekdayName, format, strict) {
    var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
    if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._minWeekdaysParse = [];

        for (i = 0; i < 7; ++i) {
            mom = createUTC([2000, 1]).day(i);
            this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
            this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
            this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
        }
    }

    if (strict) {
        if (format === 'dddd') {
            ii = indexOf$1.call(this._weekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        }
    } else {
        if (format === 'dddd') {
            ii = indexOf$1.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        }
    }
}

function localeWeekdaysParse (weekdayName, format, strict) {
    var i, mom, regex;

    if (this._weekdaysParseExact) {
        return handleStrictParse$1.call(this, weekdayName, format, strict);
    }

    if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._minWeekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._fullWeekdaysParse = [];
    }

    for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already

        mom = createUTC([2000, 1]).day(i);
        if (strict && !this._fullWeekdaysParse[i]) {
            this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
            this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
            this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
        }
        if (!this._weekdaysParse[i]) {
            regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
            this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
            return i;
        }
    }
}

// MOMENTS

function getSetDayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
    if (input != null) {
        input = parseWeekday(input, this.localeData());
        return this.add(input - day, 'd');
    } else {
        return day;
    }
}

function getSetLocaleDayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
    return input == null ? weekday : this.add(input - weekday, 'd');
}

function getSetISODayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }

    // behaves the same as moment#day except
    // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
    // as a setter, sunday should belong to the previous week.

    if (input != null) {
        var weekday = parseIsoWeekday(input, this.localeData());
        return this.day(this.day() % 7 ? weekday : weekday - 7);
    } else {
        return this.day() || 7;
    }
}

var defaultWeekdaysRegex = matchWord;
function weekdaysRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysStrictRegex;
        } else {
            return this._weekdaysRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            this._weekdaysRegex = defaultWeekdaysRegex;
        }
        return this._weekdaysStrictRegex && isStrict ?
            this._weekdaysStrictRegex : this._weekdaysRegex;
    }
}

var defaultWeekdaysShortRegex = matchWord;
function weekdaysShortRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysShortStrictRegex;
        } else {
            return this._weekdaysShortRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysShortRegex')) {
            this._weekdaysShortRegex = defaultWeekdaysShortRegex;
        }
        return this._weekdaysShortStrictRegex && isStrict ?
            this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
    }
}

var defaultWeekdaysMinRegex = matchWord;
function weekdaysMinRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysMinStrictRegex;
        } else {
            return this._weekdaysMinRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysMinRegex')) {
            this._weekdaysMinRegex = defaultWeekdaysMinRegex;
        }
        return this._weekdaysMinStrictRegex && isStrict ?
            this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
    }
}


function computeWeekdaysParse () {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom, minp, shortp, longp;
    for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, 1]).day(i);
        minp = this.weekdaysMin(mom, '');
        shortp = this.weekdaysShort(mom, '');
        longp = this.weekdays(mom, '');
        minPieces.push(minp);
        shortPieces.push(shortp);
        longPieces.push(longp);
        mixedPieces.push(minp);
        mixedPieces.push(shortp);
        mixedPieces.push(longp);
    }
    // Sorting makes sure if one weekday (or abbr) is a prefix of another it
    // will match the longer piece.
    minPieces.sort(cmpLenRev);
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 7; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
        mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._weekdaysShortRegex = this._weekdaysRegex;
    this._weekdaysMinRegex = this._weekdaysRegex;

    this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
}

// FORMATTING

function hFormat() {
    return this.hours() % 12 || 12;
}

function kFormat() {
    return this.hours() || 24;
}

addFormatToken('H', ['HH', 2], 0, 'hour');
addFormatToken('h', ['hh', 2], 0, hFormat);
addFormatToken('k', ['kk', 2], 0, kFormat);

addFormatToken('hmm', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
});

addFormatToken('hmmss', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
});

addFormatToken('Hmm', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2);
});

addFormatToken('Hmmss', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
});

function meridiem (token, lowercase) {
    addFormatToken(token, 0, 0, function () {
        return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
    });
}

meridiem('a', true);
meridiem('A', false);

// ALIASES

addUnitAlias('hour', 'h');

// PRIORITY
addUnitPriority('hour', 13);

// PARSING

function matchMeridiem (isStrict, locale) {
    return locale._meridiemParse;
}

addRegexToken('a',  matchMeridiem);
addRegexToken('A',  matchMeridiem);
addRegexToken('H',  match1to2);
addRegexToken('h',  match1to2);
addRegexToken('HH', match1to2, match2);
addRegexToken('hh', match1to2, match2);

addRegexToken('hmm', match3to4);
addRegexToken('hmmss', match5to6);
addRegexToken('Hmm', match3to4);
addRegexToken('Hmmss', match5to6);

addParseToken(['H', 'HH'], HOUR);
addParseToken(['a', 'A'], function (input, array, config) {
    config._isPm = config._locale.isPM(input);
    config._meridiem = input;
});
addParseToken(['h', 'hh'], function (input, array, config) {
    array[HOUR] = toInt(input);
    getParsingFlags(config).bigHour = true;
});
addParseToken('hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
    getParsingFlags(config).bigHour = true;
});
addParseToken('hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
    getParsingFlags(config).bigHour = true;
});
addParseToken('Hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
});
addParseToken('Hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
});

// LOCALES

function localeIsPM (input) {
    // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
    // Using charAt should be more compatible.
    return ((input + '').toLowerCase().charAt(0) === 'p');
}

var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
function localeMeridiem (hours, minutes, isLower) {
    if (hours > 11) {
        return isLower ? 'pm' : 'PM';
    } else {
        return isLower ? 'am' : 'AM';
    }
}


// MOMENTS

// Setting the hour should keep the time, because the user explicitly
// specified which hour he wants. So trying to maintain the same hour (in
// a new timezone) makes sense. Adding/subtracting hours does not follow
// this rule.
var getSetHour = makeGetSet('Hours', true);

// months
// week
// weekdays
// meridiem
var baseConfig = {
    calendar: defaultCalendar,
    longDateFormat: defaultLongDateFormat,
    invalidDate: defaultInvalidDate,
    ordinal: defaultOrdinal,
    ordinalParse: defaultOrdinalParse,
    relativeTime: defaultRelativeTime,

    months: defaultLocaleMonths,
    monthsShort: defaultLocaleMonthsShort,

    week: defaultLocaleWeek,

    weekdays: defaultLocaleWeekdays,
    weekdaysMin: defaultLocaleWeekdaysMin,
    weekdaysShort: defaultLocaleWeekdaysShort,

    meridiemParse: defaultLocaleMeridiemParse
};

// internal storage for locale config files
var locales = {};
var localeFamilies = {};
var globalLocale;

function normalizeLocale(key) {
    return key ? key.toLowerCase().replace('_', '-') : key;
}

// pick the locale from the array
// try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
// substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
function chooseLocale(names) {
    var i = 0, j, next, locale, split;

    while (i < names.length) {
        split = normalizeLocale(names[i]).split('-');
        j = split.length;
        next = normalizeLocale(names[i + 1]);
        next = next ? next.split('-') : null;
        while (j > 0) {
            locale = loadLocale(split.slice(0, j).join('-'));
            if (locale) {
                return locale;
            }
            if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                //the next array item is better than a shallower substring of this one
                break;
            }
            j--;
        }
        i++;
    }
    return null;
}

function loadLocale(name) {
    var oldLocale = null;
    // TODO: Find a better way to register and load all the locales in Node
    if (!locales[name] && (typeof module !== 'undefined') &&
            module && module.exports) {
        try {
            oldLocale = globalLocale._abbr;
            require('./locale/' + name);
            // because defineLocale currently also sets the global locale, we
            // want to undo that for lazy loaded locales
            getSetGlobalLocale(oldLocale);
        } catch (e) { }
    }
    return locales[name];
}

// This function will load locale and then set the global locale.  If
// no arguments are passed in, it will simply return the current global
// locale key.
function getSetGlobalLocale (key, values) {
    var data;
    if (key) {
        if (isUndefined(values)) {
            data = getLocale(key);
        }
        else {
            data = defineLocale(key, values);
        }

        if (data) {
            // moment.duration._locale = moment._locale = data;
            globalLocale = data;
        }
    }

    return globalLocale._abbr;
}

function defineLocale (name, config) {
    if (config !== null) {
        var parentConfig = baseConfig;
        config.abbr = name;
        if (locales[name] != null) {
            deprecateSimple('defineLocaleOverride',
                    'use moment.updateLocale(localeName, config) to change ' +
                    'an existing locale. moment.defineLocale(localeName, ' +
                    'config) should only be used for creating a new locale ' +
                    'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
            parentConfig = locales[name]._config;
        } else if (config.parentLocale != null) {
            if (locales[config.parentLocale] != null) {
                parentConfig = locales[config.parentLocale]._config;
            } else {
                if (!localeFamilies[config.parentLocale]) {
                    localeFamilies[config.parentLocale] = [];
                }
                localeFamilies[config.parentLocale].push({
                    name: name,
                    config: config
                });
                return null;
            }
        }
        locales[name] = new Locale(mergeConfigs(parentConfig, config));

        if (localeFamilies[name]) {
            localeFamilies[name].forEach(function (x) {
                defineLocale(x.name, x.config);
            });
        }

        // backwards compat for now: also set the locale
        // make sure we set the locale AFTER all child locales have been
        // created, so we won't end up with the child locale set.
        getSetGlobalLocale(name);


        return locales[name];
    } else {
        // useful for testing
        delete locales[name];
        return null;
    }
}

function updateLocale(name, config) {
    if (config != null) {
        var locale, parentConfig = baseConfig;
        // MERGE
        if (locales[name] != null) {
            parentConfig = locales[name]._config;
        }
        config = mergeConfigs(parentConfig, config);
        locale = new Locale(config);
        locale.parentLocale = locales[name];
        locales[name] = locale;

        // backwards compat for now: also set the locale
        getSetGlobalLocale(name);
    } else {
        // pass null for config to unupdate, useful for tests
        if (locales[name] != null) {
            if (locales[name].parentLocale != null) {
                locales[name] = locales[name].parentLocale;
            } else if (locales[name] != null) {
                delete locales[name];
            }
        }
    }
    return locales[name];
}

// returns locale data
function getLocale (key) {
    var locale;

    if (key && key._locale && key._locale._abbr) {
        key = key._locale._abbr;
    }

    if (!key) {
        return globalLocale;
    }

    if (!isArray(key)) {
        //short-circuit everything else
        locale = loadLocale(key);
        if (locale) {
            return locale;
        }
        key = [key];
    }

    return chooseLocale(key);
}

function listLocales() {
    return keys$1(locales);
}

function checkOverflow (m) {
    var overflow;
    var a = m._a;

    if (a && getParsingFlags(m).overflow === -2) {
        overflow =
            a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
            a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
            a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
            a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
            a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
            a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
            -1;

        if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
            overflow = DATE;
        }
        if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
            overflow = WEEK;
        }
        if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
            overflow = WEEKDAY;
        }

        getParsingFlags(m).overflow = overflow;
    }

    return m;
}

// iso 8601 regex
// 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

var isoDates = [
    ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
    ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
    ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
    ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
    ['YYYY-DDD', /\d{4}-\d{3}/],
    ['YYYY-MM', /\d{4}-\d\d/, false],
    ['YYYYYYMMDD', /[+-]\d{10}/],
    ['YYYYMMDD', /\d{8}/],
    // YYYYMM is NOT allowed by the standard
    ['GGGG[W]WWE', /\d{4}W\d{3}/],
    ['GGGG[W]WW', /\d{4}W\d{2}/, false],
    ['YYYYDDD', /\d{7}/]
];

// iso time formats and regexes
var isoTimes = [
    ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
    ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
    ['HH:mm:ss', /\d\d:\d\d:\d\d/],
    ['HH:mm', /\d\d:\d\d/],
    ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
    ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
    ['HHmmss', /\d\d\d\d\d\d/],
    ['HHmm', /\d\d\d\d/],
    ['HH', /\d\d/]
];

var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

// date from iso format
function configFromISO(config) {
    var i, l,
        string = config._i,
        match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
        allowTime, dateFormat, timeFormat, tzFormat;

    if (match) {
        getParsingFlags(config).iso = true;

        for (i = 0, l = isoDates.length; i < l; i++) {
            if (isoDates[i][1].exec(match[1])) {
                dateFormat = isoDates[i][0];
                allowTime = isoDates[i][2] !== false;
                break;
            }
        }
        if (dateFormat == null) {
            config._isValid = false;
            return;
        }
        if (match[3]) {
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(match[3])) {
                    // match[2] should be 'T' or space
                    timeFormat = (match[2] || ' ') + isoTimes[i][0];
                    break;
                }
            }
            if (timeFormat == null) {
                config._isValid = false;
                return;
            }
        }
        if (!allowTime && timeFormat != null) {
            config._isValid = false;
            return;
        }
        if (match[4]) {
            if (tzRegex.exec(match[4])) {
                tzFormat = 'Z';
            } else {
                config._isValid = false;
                return;
            }
        }
        config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
        configFromStringAndFormat(config);
    } else {
        config._isValid = false;
    }
}

// date from iso format or fallback
function configFromString(config) {
    var matched = aspNetJsonRegex.exec(config._i);

    if (matched !== null) {
        config._d = new Date(+matched[1]);
        return;
    }

    configFromISO(config);
    if (config._isValid === false) {
        delete config._isValid;
        hooks.createFromInputFallback(config);
    }
}

hooks.createFromInputFallback = deprecate(
    'value provided is not in a recognized ISO format. moment construction falls back to js Date(), ' +
    'which is not reliable across all browsers and versions. Non ISO date formats are ' +
    'discouraged and will be removed in an upcoming major release. Please refer to ' +
    'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
    function (config) {
        config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
    }
);

// Pick the first defined of two or three arguments.
function defaults(a, b, c) {
    if (a != null) {
        return a;
    }
    if (b != null) {
        return b;
    }
    return c;
}

function currentDateArray(config) {
    // hooks is actually the exported moment object
    var nowValue = new Date(hooks.now());
    if (config._useUTC) {
        return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
    }
    return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
}

// convert an array to a date.
// the array should mirror the parameters below
// note: all values past the year are optional and will default to the lowest possible value.
// [year, month, day , hour, minute, second, millisecond]
function configFromArray (config) {
    var i, date, input = [], currentDate, yearToUse;

    if (config._d) {
        return;
    }

    currentDate = currentDateArray(config);

    //compute day of the year from weeks and weekdays
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
        dayOfYearFromWeekInfo(config);
    }

    //if the day of the year is set, figure out what it is
    if (config._dayOfYear) {
        yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

        if (config._dayOfYear > daysInYear(yearToUse)) {
            getParsingFlags(config)._overflowDayOfYear = true;
        }

        date = createUTCDate(yearToUse, 0, config._dayOfYear);
        config._a[MONTH] = date.getUTCMonth();
        config._a[DATE] = date.getUTCDate();
    }

    // Default to current date.
    // * if no year, month, day of month are given, default to today
    // * if day of month is given, default month and year
    // * if month is given, default only year
    // * if year is given, don't default anything
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
        config._a[i] = input[i] = currentDate[i];
    }

    // Zero out whatever was not defaulted, including time
    for (; i < 7; i++) {
        config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
    }

    // Check for 24:00:00.000
    if (config._a[HOUR] === 24 &&
            config._a[MINUTE] === 0 &&
            config._a[SECOND] === 0 &&
            config._a[MILLISECOND] === 0) {
        config._nextDay = true;
        config._a[HOUR] = 0;
    }

    config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
    // Apply timezone offset from input. The actual utcOffset can be changed
    // with parseZone.
    if (config._tzm != null) {
        config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    }

    if (config._nextDay) {
        config._a[HOUR] = 24;
    }
}

function dayOfYearFromWeekInfo(config) {
    var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

    w = config._w;
    if (w.GG != null || w.W != null || w.E != null) {
        dow = 1;
        doy = 4;

        // TODO: We need to take the current isoWeekYear, but that depends on
        // how we interpret now (local, utc, fixed offset). So create
        // a now version of current config (take local/utc/offset flags, and
        // create now).
        weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
        week = defaults(w.W, 1);
        weekday = defaults(w.E, 1);
        if (weekday < 1 || weekday > 7) {
            weekdayOverflow = true;
        }
    } else {
        dow = config._locale._week.dow;
        doy = config._locale._week.doy;

        var curWeek = weekOfYear(createLocal(), dow, doy);

        weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

        // Default to current week.
        week = defaults(w.w, curWeek.week);

        if (w.d != null) {
            // weekday -- low day numbers are considered next week
            weekday = w.d;
            if (weekday < 0 || weekday > 6) {
                weekdayOverflow = true;
            }
        } else if (w.e != null) {
            // local weekday -- counting starts from begining of week
            weekday = w.e + dow;
            if (w.e < 0 || w.e > 6) {
                weekdayOverflow = true;
            }
        } else {
            // default to begining of week
            weekday = dow;
        }
    }
    if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
        getParsingFlags(config)._overflowWeeks = true;
    } else if (weekdayOverflow != null) {
        getParsingFlags(config)._overflowWeekday = true;
    } else {
        temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }
}

// constant that refers to the ISO standard
hooks.ISO_8601 = function () {};

// date from string and format string
function configFromStringAndFormat(config) {
    // TODO: Move this to another part of the creation flow to prevent circular deps
    if (config._f === hooks.ISO_8601) {
        configFromISO(config);
        return;
    }

    config._a = [];
    getParsingFlags(config).empty = true;

    // This array is used to make a Date, either with `new Date` or `Date.UTC`
    var string = '' + config._i,
        i, parsedInput, tokens, token, skipped,
        stringLength = string.length,
        totalParsedInputLength = 0;

    tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
        // console.log('token', token, 'parsedInput', parsedInput,
        //         'regex', getParseRegexForToken(token, config));
        if (parsedInput) {
            skipped = string.substr(0, string.indexOf(parsedInput));
            if (skipped.length > 0) {
                getParsingFlags(config).unusedInput.push(skipped);
            }
            string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
            totalParsedInputLength += parsedInput.length;
        }
        // don't parse if it's not a known token
        if (formatTokenFunctions[token]) {
            if (parsedInput) {
                getParsingFlags(config).empty = false;
            }
            else {
                getParsingFlags(config).unusedTokens.push(token);
            }
            addTimeToArrayFromToken(token, parsedInput, config);
        }
        else if (config._strict && !parsedInput) {
            getParsingFlags(config).unusedTokens.push(token);
        }
    }

    // add remaining unparsed input length to the string
    getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
        getParsingFlags(config).unusedInput.push(string);
    }

    // clear _12h flag if hour is <= 12
    if (config._a[HOUR] <= 12 &&
        getParsingFlags(config).bigHour === true &&
        config._a[HOUR] > 0) {
        getParsingFlags(config).bigHour = undefined;
    }

    getParsingFlags(config).parsedDateParts = config._a.slice(0);
    getParsingFlags(config).meridiem = config._meridiem;
    // handle meridiem
    config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

    configFromArray(config);
    checkOverflow(config);
}


function meridiemFixWrap (locale, hour, meridiem) {
    var isPm;

    if (meridiem == null) {
        // nothing to do
        return hour;
    }
    if (locale.meridiemHour != null) {
        return locale.meridiemHour(hour, meridiem);
    } else if (locale.isPM != null) {
        // Fallback
        isPm = locale.isPM(meridiem);
        if (isPm && hour < 12) {
            hour += 12;
        }
        if (!isPm && hour === 12) {
            hour = 0;
        }
        return hour;
    } else {
        // this is not supposed to happen
        return hour;
    }
}

// date from string and array of format strings
function configFromStringAndArray(config) {
    var tempConfig,
        bestMoment,

        scoreToBeat,
        i,
        currentScore;

    if (config._f.length === 0) {
        getParsingFlags(config).invalidFormat = true;
        config._d = new Date(NaN);
        return;
    }

    for (i = 0; i < config._f.length; i++) {
        currentScore = 0;
        tempConfig = copyConfig({}, config);
        if (config._useUTC != null) {
            tempConfig._useUTC = config._useUTC;
        }
        tempConfig._f = config._f[i];
        configFromStringAndFormat(tempConfig);

        if (!isValid(tempConfig)) {
            continue;
        }

        // if there is any input that was not parsed add a penalty for that format
        currentScore += getParsingFlags(tempConfig).charsLeftOver;

        //or tokens
        currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

        getParsingFlags(tempConfig).score = currentScore;

        if (scoreToBeat == null || currentScore < scoreToBeat) {
            scoreToBeat = currentScore;
            bestMoment = tempConfig;
        }
    }

    extend(config, bestMoment || tempConfig);
}

function configFromObject(config) {
    if (config._d) {
        return;
    }

    var i = normalizeObjectUnits(config._i);
    config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
        return obj && parseInt(obj, 10);
    });

    configFromArray(config);
}

function createFromConfig (config) {
    var res = new Moment(checkOverflow(prepareConfig(config)));
    if (res._nextDay) {
        // Adding is smart enough around DST
        res.add(1, 'd');
        res._nextDay = undefined;
    }

    return res;
}

function prepareConfig (config) {
    var input = config._i,
        format = config._f;

    config._locale = config._locale || getLocale(config._l);

    if (input === null || (format === undefined && input === '')) {
        return createInvalid({nullInput: true});
    }

    if (typeof input === 'string') {
        config._i = input = config._locale.preparse(input);
    }

    if (isMoment(input)) {
        return new Moment(checkOverflow(input));
    } else if (isDate(input)) {
        config._d = input;
    } else if (isArray(format)) {
        configFromStringAndArray(config);
    } else if (format) {
        configFromStringAndFormat(config);
    }  else {
        configFromInput(config);
    }

    if (!isValid(config)) {
        config._d = null;
    }

    return config;
}

function configFromInput(config) {
    var input = config._i;
    if (input === undefined) {
        config._d = new Date(hooks.now());
    } else if (isDate(input)) {
        config._d = new Date(input.valueOf());
    } else if (typeof input === 'string') {
        configFromString(config);
    } else if (isArray(input)) {
        config._a = map(input.slice(0), function (obj) {
            return parseInt(obj, 10);
        });
        configFromArray(config);
    } else if (typeof(input) === 'object') {
        configFromObject(config);
    } else if (isNumber(input)) {
        // from milliseconds
        config._d = new Date(input);
    } else {
        hooks.createFromInputFallback(config);
    }
}

function createLocalOrUTC (input, format, locale, strict, isUTC) {
    var c = {};

    if (locale === true || locale === false) {
        strict = locale;
        locale = undefined;
    }

    if ((isObject(input) && isObjectEmpty(input)) ||
            (isArray(input) && input.length === 0)) {
        input = undefined;
    }
    // object construction must be done this way.
    // https://github.com/moment/moment/issues/1423
    c._isAMomentObject = true;
    c._useUTC = c._isUTC = isUTC;
    c._l = locale;
    c._i = input;
    c._f = format;
    c._strict = strict;

    return createFromConfig(c);
}

function createLocal (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, false);
}

var prototypeMin = deprecate(
    'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
        var other = createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
            return other < this ? this : other;
        } else {
            return createInvalid();
        }
    }
);

var prototypeMax = deprecate(
    'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
        var other = createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
            return other > this ? this : other;
        } else {
            return createInvalid();
        }
    }
);

// Pick a moment m from moments so that m[fn](other) is true for all
// other. This relies on the function fn to be transitive.
//
// moments should either be an array of moment objects or an array, whose
// first element is an array of moment objects.
function pickBy(fn, moments) {
    var res, i;
    if (moments.length === 1 && isArray(moments[0])) {
        moments = moments[0];
    }
    if (!moments.length) {
        return createLocal();
    }
    res = moments[0];
    for (i = 1; i < moments.length; ++i) {
        if (!moments[i].isValid() || moments[i][fn](res)) {
            res = moments[i];
        }
    }
    return res;
}

// TODO: Use [].sort instead?
function min () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isBefore', args);
}

function max () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isAfter', args);
}

var now = function () {
    return Date.now ? Date.now() : +(new Date());
};

function Duration (duration) {
    var normalizedInput = normalizeObjectUnits(duration),
        years = normalizedInput.year || 0,
        quarters = normalizedInput.quarter || 0,
        months = normalizedInput.month || 0,
        weeks = normalizedInput.week || 0,
        days = normalizedInput.day || 0,
        hours = normalizedInput.hour || 0,
        minutes = normalizedInput.minute || 0,
        seconds = normalizedInput.second || 0,
        milliseconds = normalizedInput.millisecond || 0;

    // representation for dateAddRemove
    this._milliseconds = +milliseconds +
        seconds * 1e3 + // 1000
        minutes * 6e4 + // 1000 * 60
        hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
    // Because of dateAddRemove treats 24 hours as different from a
    // day when working around DST, we need to store them separately
    this._days = +days +
        weeks * 7;
    // It is impossible translate months into days without knowing
    // which months you are are talking about, so we have to store
    // it separately.
    this._months = +months +
        quarters * 3 +
        years * 12;

    this._data = {};

    this._locale = getLocale();

    this._bubble();
}

function isDuration (obj) {
    return obj instanceof Duration;
}

function absRound (number) {
    if (number < 0) {
        return Math.round(-1 * number) * -1;
    } else {
        return Math.round(number);
    }
}

// FORMATTING

function offset (token, separator) {
    addFormatToken(token, 0, 0, function () {
        var offset = this.utcOffset();
        var sign = '+';
        if (offset < 0) {
            offset = -offset;
            sign = '-';
        }
        return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
    });
}

offset('Z', ':');
offset('ZZ', '');

// PARSING

addRegexToken('Z',  matchShortOffset);
addRegexToken('ZZ', matchShortOffset);
addParseToken(['Z', 'ZZ'], function (input, array, config) {
    config._useUTC = true;
    config._tzm = offsetFromString(matchShortOffset, input);
});

// HELPERS

// timezone chunker
// '+10:00' > ['10',  '00']
// '-1530'  > ['-15', '30']
var chunkOffset = /([\+\-]|\d\d)/gi;

function offsetFromString(matcher, string) {
    var matches = (string || '').match(matcher);

    if (matches === null) {
        return null;
    }

    var chunk   = matches[matches.length - 1] || [];
    var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
    var minutes = +(parts[1] * 60) + toInt(parts[2]);

    return minutes === 0 ?
      0 :
      parts[0] === '+' ? minutes : -minutes;
}

// Return a moment from input, that is local/utc/zone equivalent to model.
function cloneWithOffset(input, model) {
    var res, diff;
    if (model._isUTC) {
        res = model.clone();
        diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
        // Use low-level api, because this fn is low-level api.
        res._d.setTime(res._d.valueOf() + diff);
        hooks.updateOffset(res, false);
        return res;
    } else {
        return createLocal(input).local();
    }
}

function getDateOffset (m) {
    // On Firefox.24 Date#getTimezoneOffset returns a floating point.
    // https://github.com/moment/moment/pull/1871
    return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
}

// HOOKS

// This function will be called whenever a moment is mutated.
// It is intended to keep the offset in sync with the timezone.
hooks.updateOffset = function () {};

// MOMENTS

// keepLocalTime = true means only change the timezone, without
// affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
// 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
// +0200, so we adjust the time as needed, to be valid.
//
// Keeping the time actually adds/subtracts (one hour)
// from the actual represented time. That is why we call updateOffset
// a second time. In case it wants us to change the offset again
// _changeInProgress == true case, then we have to adjust, because
// there is no such time in the given timezone.
function getSetOffset (input, keepLocalTime) {
    var offset = this._offset || 0,
        localAdjust;
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    if (input != null) {
        if (typeof input === 'string') {
            input = offsetFromString(matchShortOffset, input);
            if (input === null) {
                return this;
            }
        } else if (Math.abs(input) < 16) {
            input = input * 60;
        }
        if (!this._isUTC && keepLocalTime) {
            localAdjust = getDateOffset(this);
        }
        this._offset = input;
        this._isUTC = true;
        if (localAdjust != null) {
            this.add(localAdjust, 'm');
        }
        if (offset !== input) {
            if (!keepLocalTime || this._changeInProgress) {
                addSubtract(this, createDuration(input - offset, 'm'), 1, false);
            } else if (!this._changeInProgress) {
                this._changeInProgress = true;
                hooks.updateOffset(this, true);
                this._changeInProgress = null;
            }
        }
        return this;
    } else {
        return this._isUTC ? offset : getDateOffset(this);
    }
}

function getSetZone (input, keepLocalTime) {
    if (input != null) {
        if (typeof input !== 'string') {
            input = -input;
        }

        this.utcOffset(input, keepLocalTime);

        return this;
    } else {
        return -this.utcOffset();
    }
}

function setOffsetToUTC (keepLocalTime) {
    return this.utcOffset(0, keepLocalTime);
}

function setOffsetToLocal (keepLocalTime) {
    if (this._isUTC) {
        this.utcOffset(0, keepLocalTime);
        this._isUTC = false;

        if (keepLocalTime) {
            this.subtract(getDateOffset(this), 'm');
        }
    }
    return this;
}

function setOffsetToParsedOffset () {
    if (this._tzm != null) {
        this.utcOffset(this._tzm);
    } else if (typeof this._i === 'string') {
        var tZone = offsetFromString(matchOffset, this._i);
        if (tZone != null) {
            this.utcOffset(tZone);
        }
        else {
            this.utcOffset(0, true);
        }
    }
    return this;
}

function hasAlignedHourOffset (input) {
    if (!this.isValid()) {
        return false;
    }
    input = input ? createLocal(input).utcOffset() : 0;

    return (this.utcOffset() - input) % 60 === 0;
}

function isDaylightSavingTime () {
    return (
        this.utcOffset() > this.clone().month(0).utcOffset() ||
        this.utcOffset() > this.clone().month(5).utcOffset()
    );
}

function isDaylightSavingTimeShifted () {
    if (!isUndefined(this._isDSTShifted)) {
        return this._isDSTShifted;
    }

    var c = {};

    copyConfig(c, this);
    c = prepareConfig(c);

    if (c._a) {
        var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
        this._isDSTShifted = this.isValid() &&
            compareArrays(c._a, other.toArray()) > 0;
    } else {
        this._isDSTShifted = false;
    }

    return this._isDSTShifted;
}

function isLocal () {
    return this.isValid() ? !this._isUTC : false;
}

function isUtcOffset () {
    return this.isValid() ? this._isUTC : false;
}

function isUtc () {
    return this.isValid() ? this._isUTC && this._offset === 0 : false;
}

// ASP.NET json date format regex
var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

// from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
// somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
// and further modified to allow for strings containing both week and day
var isoRegex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;

function createDuration (input, key) {
    var duration = input,
        // matching against regexp is expensive, do it on demand
        match = null,
        sign,
        ret,
        diffRes;

    if (isDuration(input)) {
        duration = {
            ms : input._milliseconds,
            d  : input._days,
            M  : input._months
        };
    } else if (isNumber(input)) {
        duration = {};
        if (key) {
            duration[key] = input;
        } else {
            duration.milliseconds = input;
        }
    } else if (!!(match = aspNetRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        duration = {
            y  : 0,
            d  : toInt(match[DATE])                         * sign,
            h  : toInt(match[HOUR])                         * sign,
            m  : toInt(match[MINUTE])                       * sign,
            s  : toInt(match[SECOND])                       * sign,
            ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
        };
    } else if (!!(match = isoRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        duration = {
            y : parseIso(match[2], sign),
            M : parseIso(match[3], sign),
            w : parseIso(match[4], sign),
            d : parseIso(match[5], sign),
            h : parseIso(match[6], sign),
            m : parseIso(match[7], sign),
            s : parseIso(match[8], sign)
        };
    } else if (duration == null) {// checks for null or undefined
        duration = {};
    } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
        diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));

        duration = {};
        duration.ms = diffRes.milliseconds;
        duration.M = diffRes.months;
    }

    ret = new Duration(duration);

    if (isDuration(input) && hasOwnProp(input, '_locale')) {
        ret._locale = input._locale;
    }

    return ret;
}

createDuration.fn = Duration.prototype;

function parseIso (inp, sign) {
    // We'd normally use ~~inp for this, but unfortunately it also
    // converts floats to ints.
    // inp may be undefined, so careful calling replace on it.
    var res = inp && parseFloat(inp.replace(',', '.'));
    // apply sign while we're at it
    return (isNaN(res) ? 0 : res) * sign;
}

function positiveMomentsDifference(base, other) {
    var res = {milliseconds: 0, months: 0};

    res.months = other.month() - base.month() +
        (other.year() - base.year()) * 12;
    if (base.clone().add(res.months, 'M').isAfter(other)) {
        --res.months;
    }

    res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

    return res;
}

function momentsDifference(base, other) {
    var res;
    if (!(base.isValid() && other.isValid())) {
        return {milliseconds: 0, months: 0};
    }

    other = cloneWithOffset(other, base);
    if (base.isBefore(other)) {
        res = positiveMomentsDifference(base, other);
    } else {
        res = positiveMomentsDifference(other, base);
        res.milliseconds = -res.milliseconds;
        res.months = -res.months;
    }

    return res;
}

// TODO: remove 'name' arg after deprecation is removed
function createAdder(direction, name) {
    return function (val, period) {
        var dur, tmp;
        //invert the arguments, but complain about it
        if (period !== null && !isNaN(+period)) {
            deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
            'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
            tmp = val; val = period; period = tmp;
        }

        val = typeof val === 'string' ? +val : val;
        dur = createDuration(val, period);
        addSubtract(this, dur, direction);
        return this;
    };
}

function addSubtract (mom, duration, isAdding, updateOffset) {
    var milliseconds = duration._milliseconds,
        days = absRound(duration._days),
        months = absRound(duration._months);

    if (!mom.isValid()) {
        // No op
        return;
    }

    updateOffset = updateOffset == null ? true : updateOffset;

    if (milliseconds) {
        mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
    }
    if (days) {
        set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
    }
    if (months) {
        setMonth(mom, get(mom, 'Month') + months * isAdding);
    }
    if (updateOffset) {
        hooks.updateOffset(mom, days || months);
    }
}

var add      = createAdder(1, 'add');
var subtract = createAdder(-1, 'subtract');

function getCalendarFormat(myMoment, now) {
    var diff = myMoment.diff(now, 'days', true);
    return diff < -6 ? 'sameElse' :
            diff < -1 ? 'lastWeek' :
            diff < 0 ? 'lastDay' :
            diff < 1 ? 'sameDay' :
            diff < 2 ? 'nextDay' :
            diff < 7 ? 'nextWeek' : 'sameElse';
}

function calendar$1 (time, formats) {
    // We want to compare the start of today, vs this.
    // Getting start-of-today depends on whether we're local/utc/offset or not.
    var now = time || createLocal(),
        sod = cloneWithOffset(now, this).startOf('day'),
        format = hooks.calendarFormat(this, sod) || 'sameElse';

    var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

    return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
}

function clone () {
    return new Moment(this);
}

function isAfter (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() > localInput.valueOf();
    } else {
        return localInput.valueOf() < this.clone().startOf(units).valueOf();
    }
}

function isBefore (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() < localInput.valueOf();
    } else {
        return this.clone().endOf(units).valueOf() < localInput.valueOf();
    }
}

function isBetween (from, to, units, inclusivity) {
    inclusivity = inclusivity || '()';
    return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
        (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
}

function isSame (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input),
        inputMs;
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(units || 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() === localInput.valueOf();
    } else {
        inputMs = localInput.valueOf();
        return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
    }
}

function isSameOrAfter (input, units) {
    return this.isSame(input, units) || this.isAfter(input,units);
}

function isSameOrBefore (input, units) {
    return this.isSame(input, units) || this.isBefore(input,units);
}

function diff (input, units, asFloat) {
    var that,
        zoneDelta,
        delta, output;

    if (!this.isValid()) {
        return NaN;
    }

    that = cloneWithOffset(input, this);

    if (!that.isValid()) {
        return NaN;
    }

    zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

    units = normalizeUnits(units);

    if (units === 'year' || units === 'month' || units === 'quarter') {
        output = monthDiff(this, that);
        if (units === 'quarter') {
            output = output / 3;
        } else if (units === 'year') {
            output = output / 12;
        }
    } else {
        delta = this - that;
        output = units === 'second' ? delta / 1e3 : // 1000
            units === 'minute' ? delta / 6e4 : // 1000 * 60
            units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
            units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
            units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
            delta;
    }
    return asFloat ? output : absFloor(output);
}

function monthDiff (a, b) {
    // difference in months
    var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
        // b is in (anchor - 1 month, anchor + 1 month)
        anchor = a.clone().add(wholeMonthDiff, 'months'),
        anchor2, adjust;

    if (b - anchor < 0) {
        anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor - anchor2);
    } else {
        anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor2 - anchor);
    }

    //check for negative zero, return zero if negative zero
    return -(wholeMonthDiff + adjust) || 0;
}

hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

function toString () {
    return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
}

function toISOString () {
    var m = this.clone().utc();
    if (0 < m.year() && m.year() <= 9999) {
        if (isFunction(Date.prototype.toISOString)) {
            // native implementation is ~50x faster, use it when we can
            return this.toDate().toISOString();
        } else {
            return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
    } else {
        return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
    }
}

/**
 * Return a human readable representation of a moment that can
 * also be evaluated to get a new moment which is the same
 *
 * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
 */
function inspect () {
    if (!this.isValid()) {
        return 'moment.invalid(/* ' + this._i + ' */)';
    }
    var func = 'moment';
    var zone = '';
    if (!this.isLocal()) {
        func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
        zone = 'Z';
    }
    var prefix = '[' + func + '("]';
    var year = (0 < this.year() && this.year() <= 9999) ? 'YYYY' : 'YYYYYY';
    var datetime = '-MM-DD[T]HH:mm:ss.SSS';
    var suffix = zone + '[")]';

    return this.format(prefix + year + datetime + suffix);
}

function format (inputString) {
    if (!inputString) {
        inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
    }
    var output = formatMoment(this, inputString);
    return this.localeData().postformat(output);
}

function from (time, withoutSuffix) {
    if (this.isValid() &&
            ((isMoment(time) && time.isValid()) ||
             createLocal(time).isValid())) {
        return createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function fromNow (withoutSuffix) {
    return this.from(createLocal(), withoutSuffix);
}

function to (time, withoutSuffix) {
    if (this.isValid() &&
            ((isMoment(time) && time.isValid()) ||
             createLocal(time).isValid())) {
        return createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function toNow (withoutSuffix) {
    return this.to(createLocal(), withoutSuffix);
}

// If passed a locale key, it will set the locale for this
// instance.  Otherwise, it will return the locale configuration
// variables for this instance.
function locale (key) {
    var newLocaleData;

    if (key === undefined) {
        return this._locale._abbr;
    } else {
        newLocaleData = getLocale(key);
        if (newLocaleData != null) {
            this._locale = newLocaleData;
        }
        return this;
    }
}

var lang = deprecate(
    'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
    function (key) {
        if (key === undefined) {
            return this.localeData();
        } else {
            return this.locale(key);
        }
    }
);

function localeData () {
    return this._locale;
}

function startOf (units) {
    units = normalizeUnits(units);
    // the following switch intentionally omits break keywords
    // to utilize falling through the cases.
    switch (units) {
        case 'year':
            this.month(0);
            /* falls through */
        case 'quarter':
        case 'month':
            this.date(1);
            /* falls through */
        case 'week':
        case 'isoWeek':
        case 'day':
        case 'date':
            this.hours(0);
            /* falls through */
        case 'hour':
            this.minutes(0);
            /* falls through */
        case 'minute':
            this.seconds(0);
            /* falls through */
        case 'second':
            this.milliseconds(0);
    }

    // weeks are a special case
    if (units === 'week') {
        this.weekday(0);
    }
    if (units === 'isoWeek') {
        this.isoWeekday(1);
    }

    // quarters are also special
    if (units === 'quarter') {
        this.month(Math.floor(this.month() / 3) * 3);
    }

    return this;
}

function endOf (units) {
    units = normalizeUnits(units);
    if (units === undefined || units === 'millisecond') {
        return this;
    }

    // 'date' is an alias for 'day', so it should be considered as such.
    if (units === 'date') {
        units = 'day';
    }

    return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
}

function valueOf () {
    return this._d.valueOf() - ((this._offset || 0) * 60000);
}

function unix () {
    return Math.floor(this.valueOf() / 1000);
}

function toDate () {
    return new Date(this.valueOf());
}

function toArray () {
    var m = this;
    return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
}

function toObject () {
    var m = this;
    return {
        years: m.year(),
        months: m.month(),
        date: m.date(),
        hours: m.hours(),
        minutes: m.minutes(),
        seconds: m.seconds(),
        milliseconds: m.milliseconds()
    };
}

function toJSON () {
    // new Date(NaN).toJSON() === null
    return this.isValid() ? this.toISOString() : null;
}

function isValid$1 () {
    return isValid(this);
}

function parsingFlags () {
    return extend({}, getParsingFlags(this));
}

function invalidAt () {
    return getParsingFlags(this).overflow;
}

function creationData() {
    return {
        input: this._i,
        format: this._f,
        locale: this._locale,
        isUTC: this._isUTC,
        strict: this._strict
    };
}

// FORMATTING

addFormatToken(0, ['gg', 2], 0, function () {
    return this.weekYear() % 100;
});

addFormatToken(0, ['GG', 2], 0, function () {
    return this.isoWeekYear() % 100;
});

function addWeekYearFormatToken (token, getter) {
    addFormatToken(0, [token, token.length], 0, getter);
}

addWeekYearFormatToken('gggg',     'weekYear');
addWeekYearFormatToken('ggggg',    'weekYear');
addWeekYearFormatToken('GGGG',  'isoWeekYear');
addWeekYearFormatToken('GGGGG', 'isoWeekYear');

// ALIASES

addUnitAlias('weekYear', 'gg');
addUnitAlias('isoWeekYear', 'GG');

// PRIORITY

addUnitPriority('weekYear', 1);
addUnitPriority('isoWeekYear', 1);


// PARSING

addRegexToken('G',      matchSigned);
addRegexToken('g',      matchSigned);
addRegexToken('GG',     match1to2, match2);
addRegexToken('gg',     match1to2, match2);
addRegexToken('GGGG',   match1to4, match4);
addRegexToken('gggg',   match1to4, match4);
addRegexToken('GGGGG',  match1to6, match6);
addRegexToken('ggggg',  match1to6, match6);

addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
    week[token.substr(0, 2)] = toInt(input);
});

addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
    week[token] = hooks.parseTwoDigitYear(input);
});

// MOMENTS

function getSetWeekYear (input) {
    return getSetWeekYearHelper.call(this,
            input,
            this.week(),
            this.weekday(),
            this.localeData()._week.dow,
            this.localeData()._week.doy);
}

function getSetISOWeekYear (input) {
    return getSetWeekYearHelper.call(this,
            input, this.isoWeek(), this.isoWeekday(), 1, 4);
}

function getISOWeeksInYear () {
    return weeksInYear(this.year(), 1, 4);
}

function getWeeksInYear () {
    var weekInfo = this.localeData()._week;
    return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
}

function getSetWeekYearHelper(input, week, weekday, dow, doy) {
    var weeksTarget;
    if (input == null) {
        return weekOfYear(this, dow, doy).year;
    } else {
        weeksTarget = weeksInYear(input, dow, doy);
        if (week > weeksTarget) {
            week = weeksTarget;
        }
        return setWeekAll.call(this, input, week, weekday, dow, doy);
    }
}

function setWeekAll(weekYear, week, weekday, dow, doy) {
    var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
        date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

    this.year(date.getUTCFullYear());
    this.month(date.getUTCMonth());
    this.date(date.getUTCDate());
    return this;
}

// FORMATTING

addFormatToken('Q', 0, 'Qo', 'quarter');

// ALIASES

addUnitAlias('quarter', 'Q');

// PRIORITY

addUnitPriority('quarter', 7);

// PARSING

addRegexToken('Q', match1);
addParseToken('Q', function (input, array) {
    array[MONTH] = (toInt(input) - 1) * 3;
});

// MOMENTS

function getSetQuarter (input) {
    return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
}

// FORMATTING

addFormatToken('D', ['DD', 2], 'Do', 'date');

// ALIASES

addUnitAlias('date', 'D');

// PRIOROITY
addUnitPriority('date', 9);

// PARSING

addRegexToken('D',  match1to2);
addRegexToken('DD', match1to2, match2);
addRegexToken('Do', function (isStrict, locale) {
    return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
});

addParseToken(['D', 'DD'], DATE);
addParseToken('Do', function (input, array) {
    array[DATE] = toInt(input.match(match1to2)[0], 10);
});

// MOMENTS

var getSetDayOfMonth = makeGetSet('Date', true);

// FORMATTING

addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

// ALIASES

addUnitAlias('dayOfYear', 'DDD');

// PRIORITY
addUnitPriority('dayOfYear', 4);

// PARSING

addRegexToken('DDD',  match1to3);
addRegexToken('DDDD', match3);
addParseToken(['DDD', 'DDDD'], function (input, array, config) {
    config._dayOfYear = toInt(input);
});

// HELPERS

// MOMENTS

function getSetDayOfYear (input) {
    var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
    return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
}

// FORMATTING

addFormatToken('m', ['mm', 2], 0, 'minute');

// ALIASES

addUnitAlias('minute', 'm');

// PRIORITY

addUnitPriority('minute', 14);

// PARSING

addRegexToken('m',  match1to2);
addRegexToken('mm', match1to2, match2);
addParseToken(['m', 'mm'], MINUTE);

// MOMENTS

var getSetMinute = makeGetSet('Minutes', false);

// FORMATTING

addFormatToken('s', ['ss', 2], 0, 'second');

// ALIASES

addUnitAlias('second', 's');

// PRIORITY

addUnitPriority('second', 15);

// PARSING

addRegexToken('s',  match1to2);
addRegexToken('ss', match1to2, match2);
addParseToken(['s', 'ss'], SECOND);

// MOMENTS

var getSetSecond = makeGetSet('Seconds', false);

// FORMATTING

addFormatToken('S', 0, 0, function () {
    return ~~(this.millisecond() / 100);
});

addFormatToken(0, ['SS', 2], 0, function () {
    return ~~(this.millisecond() / 10);
});

addFormatToken(0, ['SSS', 3], 0, 'millisecond');
addFormatToken(0, ['SSSS', 4], 0, function () {
    return this.millisecond() * 10;
});
addFormatToken(0, ['SSSSS', 5], 0, function () {
    return this.millisecond() * 100;
});
addFormatToken(0, ['SSSSSS', 6], 0, function () {
    return this.millisecond() * 1000;
});
addFormatToken(0, ['SSSSSSS', 7], 0, function () {
    return this.millisecond() * 10000;
});
addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
    return this.millisecond() * 100000;
});
addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
    return this.millisecond() * 1000000;
});


// ALIASES

addUnitAlias('millisecond', 'ms');

// PRIORITY

addUnitPriority('millisecond', 16);

// PARSING

addRegexToken('S',    match1to3, match1);
addRegexToken('SS',   match1to3, match2);
addRegexToken('SSS',  match1to3, match3);

var token;
for (token = 'SSSS'; token.length <= 9; token += 'S') {
    addRegexToken(token, matchUnsigned);
}

function parseMs(input, array) {
    array[MILLISECOND] = toInt(('0.' + input) * 1000);
}

for (token = 'S'; token.length <= 9; token += 'S') {
    addParseToken(token, parseMs);
}
// MOMENTS

var getSetMillisecond = makeGetSet('Milliseconds', false);

// FORMATTING

addFormatToken('z',  0, 0, 'zoneAbbr');
addFormatToken('zz', 0, 0, 'zoneName');

// MOMENTS

function getZoneAbbr () {
    return this._isUTC ? 'UTC' : '';
}

function getZoneName () {
    return this._isUTC ? 'Coordinated Universal Time' : '';
}

var proto = Moment.prototype;

proto.add               = add;
proto.calendar          = calendar$1;
proto.clone             = clone;
proto.diff              = diff;
proto.endOf             = endOf;
proto.format            = format;
proto.from              = from;
proto.fromNow           = fromNow;
proto.to                = to;
proto.toNow             = toNow;
proto.get               = stringGet;
proto.invalidAt         = invalidAt;
proto.isAfter           = isAfter;
proto.isBefore          = isBefore;
proto.isBetween         = isBetween;
proto.isSame            = isSame;
proto.isSameOrAfter     = isSameOrAfter;
proto.isSameOrBefore    = isSameOrBefore;
proto.isValid           = isValid$1;
proto.lang              = lang;
proto.locale            = locale;
proto.localeData        = localeData;
proto.max               = prototypeMax;
proto.min               = prototypeMin;
proto.parsingFlags      = parsingFlags;
proto.set               = stringSet;
proto.startOf           = startOf;
proto.subtract          = subtract;
proto.toArray           = toArray;
proto.toObject          = toObject;
proto.toDate            = toDate;
proto.toISOString       = toISOString;
proto.inspect           = inspect;
proto.toJSON            = toJSON;
proto.toString          = toString;
proto.unix              = unix;
proto.valueOf           = valueOf;
proto.creationData      = creationData;

// Year
proto.year       = getSetYear;
proto.isLeapYear = getIsLeapYear;

// Week Year
proto.weekYear    = getSetWeekYear;
proto.isoWeekYear = getSetISOWeekYear;

// Quarter
proto.quarter = proto.quarters = getSetQuarter;

// Month
proto.month       = getSetMonth;
proto.daysInMonth = getDaysInMonth;

// Week
proto.week           = proto.weeks        = getSetWeek;
proto.isoWeek        = proto.isoWeeks     = getSetISOWeek;
proto.weeksInYear    = getWeeksInYear;
proto.isoWeeksInYear = getISOWeeksInYear;

// Day
proto.date       = getSetDayOfMonth;
proto.day        = proto.days             = getSetDayOfWeek;
proto.weekday    = getSetLocaleDayOfWeek;
proto.isoWeekday = getSetISODayOfWeek;
proto.dayOfYear  = getSetDayOfYear;

// Hour
proto.hour = proto.hours = getSetHour;

// Minute
proto.minute = proto.minutes = getSetMinute;

// Second
proto.second = proto.seconds = getSetSecond;

// Millisecond
proto.millisecond = proto.milliseconds = getSetMillisecond;

// Offset
proto.utcOffset            = getSetOffset;
proto.utc                  = setOffsetToUTC;
proto.local                = setOffsetToLocal;
proto.parseZone            = setOffsetToParsedOffset;
proto.hasAlignedHourOffset = hasAlignedHourOffset;
proto.isDST                = isDaylightSavingTime;
proto.isLocal              = isLocal;
proto.isUtcOffset          = isUtcOffset;
proto.isUtc                = isUtc;
proto.isUTC                = isUtc;

// Timezone
proto.zoneAbbr = getZoneAbbr;
proto.zoneName = getZoneName;

// Deprecations
proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

function createUnix (input) {
    return createLocal(input * 1000);
}

function createInZone () {
    return createLocal.apply(null, arguments).parseZone();
}

function preParsePostFormat (string) {
    return string;
}

var proto$1 = Locale.prototype;

proto$1.calendar        = calendar;
proto$1.longDateFormat  = longDateFormat;
proto$1.invalidDate     = invalidDate;
proto$1.ordinal         = ordinal;
proto$1.preparse        = preParsePostFormat;
proto$1.postformat      = preParsePostFormat;
proto$1.relativeTime    = relativeTime;
proto$1.pastFuture      = pastFuture;
proto$1.set             = set;

// Month
proto$1.months            =        localeMonths;
proto$1.monthsShort       =        localeMonthsShort;
proto$1.monthsParse       =        localeMonthsParse;
proto$1.monthsRegex       = monthsRegex;
proto$1.monthsShortRegex  = monthsShortRegex;

// Week
proto$1.week = localeWeek;
proto$1.firstDayOfYear = localeFirstDayOfYear;
proto$1.firstDayOfWeek = localeFirstDayOfWeek;

// Day of Week
proto$1.weekdays       =        localeWeekdays;
proto$1.weekdaysMin    =        localeWeekdaysMin;
proto$1.weekdaysShort  =        localeWeekdaysShort;
proto$1.weekdaysParse  =        localeWeekdaysParse;

proto$1.weekdaysRegex       =        weekdaysRegex;
proto$1.weekdaysShortRegex  =        weekdaysShortRegex;
proto$1.weekdaysMinRegex    =        weekdaysMinRegex;

// Hours
proto$1.isPM = localeIsPM;
proto$1.meridiem = localeMeridiem;

function get$1 (format, index, field, setter) {
    var locale = getLocale();
    var utc = createUTC().set(setter, index);
    return locale[field](utc, format);
}

function listMonthsImpl (format, index, field) {
    if (isNumber(format)) {
        index = format;
        format = undefined;
    }

    format = format || '';

    if (index != null) {
        return get$1(format, index, field, 'month');
    }

    var i;
    var out = [];
    for (i = 0; i < 12; i++) {
        out[i] = get$1(format, i, field, 'month');
    }
    return out;
}

// ()
// (5)
// (fmt, 5)
// (fmt)
// (true)
// (true, 5)
// (true, fmt, 5)
// (true, fmt)
function listWeekdaysImpl (localeSorted, format, index, field) {
    if (typeof localeSorted === 'boolean') {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';
    } else {
        format = localeSorted;
        index = format;
        localeSorted = false;

        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';
    }

    var locale = getLocale(),
        shift = localeSorted ? locale._week.dow : 0;

    if (index != null) {
        return get$1(format, (index + shift) % 7, field, 'day');
    }

    var i;
    var out = [];
    for (i = 0; i < 7; i++) {
        out[i] = get$1(format, (i + shift) % 7, field, 'day');
    }
    return out;
}

function listMonths (format, index) {
    return listMonthsImpl(format, index, 'months');
}

function listMonthsShort (format, index) {
    return listMonthsImpl(format, index, 'monthsShort');
}

function listWeekdays (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
}

function listWeekdaysShort (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
}

function listWeekdaysMin (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
}

getSetGlobalLocale('en', {
    ordinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (toInt(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    }
});

// Side effect imports
hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

var mathAbs = Math.abs;

function abs () {
    var data           = this._data;

    this._milliseconds = mathAbs(this._milliseconds);
    this._days         = mathAbs(this._days);
    this._months       = mathAbs(this._months);

    data.milliseconds  = mathAbs(data.milliseconds);
    data.seconds       = mathAbs(data.seconds);
    data.minutes       = mathAbs(data.minutes);
    data.hours         = mathAbs(data.hours);
    data.months        = mathAbs(data.months);
    data.years         = mathAbs(data.years);

    return this;
}

function addSubtract$1 (duration, input, value, direction) {
    var other = createDuration(input, value);

    duration._milliseconds += direction * other._milliseconds;
    duration._days         += direction * other._days;
    duration._months       += direction * other._months;

    return duration._bubble();
}

// supports only 2.0-style add(1, 's') or add(duration)
function add$1 (input, value) {
    return addSubtract$1(this, input, value, 1);
}

// supports only 2.0-style subtract(1, 's') or subtract(duration)
function subtract$1 (input, value) {
    return addSubtract$1(this, input, value, -1);
}

function absCeil (number) {
    if (number < 0) {
        return Math.floor(number);
    } else {
        return Math.ceil(number);
    }
}

function bubble () {
    var milliseconds = this._milliseconds;
    var days         = this._days;
    var months       = this._months;
    var data         = this._data;
    var seconds, minutes, hours, years, monthsFromDays;

    // if we have a mix of positive and negative values, bubble down first
    // check: https://github.com/moment/moment/issues/2166
    if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
            (milliseconds <= 0 && days <= 0 && months <= 0))) {
        milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
        days = 0;
        months = 0;
    }

    // The following code bubbles up values, see the tests for
    // examples of what that means.
    data.milliseconds = milliseconds % 1000;

    seconds           = absFloor(milliseconds / 1000);
    data.seconds      = seconds % 60;

    minutes           = absFloor(seconds / 60);
    data.minutes      = minutes % 60;

    hours             = absFloor(minutes / 60);
    data.hours        = hours % 24;

    days += absFloor(hours / 24);

    // convert days to months
    monthsFromDays = absFloor(daysToMonths(days));
    months += monthsFromDays;
    days -= absCeil(monthsToDays(monthsFromDays));

    // 12 months -> 1 year
    years = absFloor(months / 12);
    months %= 12;

    data.days   = days;
    data.months = months;
    data.years  = years;

    return this;
}

function daysToMonths (days) {
    // 400 years have 146097 days (taking into account leap year rules)
    // 400 years have 12 months === 4800
    return days * 4800 / 146097;
}

function monthsToDays (months) {
    // the reverse of daysToMonths
    return months * 146097 / 4800;
}

function as (units) {
    var days;
    var months;
    var milliseconds = this._milliseconds;

    units = normalizeUnits(units);

    if (units === 'month' || units === 'year') {
        days   = this._days   + milliseconds / 864e5;
        months = this._months + daysToMonths(days);
        return units === 'month' ? months : months / 12;
    } else {
        // handle milliseconds separately because of floating point math errors (issue #1867)
        days = this._days + Math.round(monthsToDays(this._months));
        switch (units) {
            case 'week'   : return days / 7     + milliseconds / 6048e5;
            case 'day'    : return days         + milliseconds / 864e5;
            case 'hour'   : return days * 24    + milliseconds / 36e5;
            case 'minute' : return days * 1440  + milliseconds / 6e4;
            case 'second' : return days * 86400 + milliseconds / 1000;
            // Math.floor prevents floating point math errors here
            case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
            default: throw new Error('Unknown unit ' + units);
        }
    }
}

// TODO: Use this.as('ms')?
function valueOf$1 () {
    return (
        this._milliseconds +
        this._days * 864e5 +
        (this._months % 12) * 2592e6 +
        toInt(this._months / 12) * 31536e6
    );
}

function makeAs (alias) {
    return function () {
        return this.as(alias);
    };
}

var asMilliseconds = makeAs('ms');
var asSeconds      = makeAs('s');
var asMinutes      = makeAs('m');
var asHours        = makeAs('h');
var asDays         = makeAs('d');
var asWeeks        = makeAs('w');
var asMonths       = makeAs('M');
var asYears        = makeAs('y');

function get$2 (units) {
    units = normalizeUnits(units);
    return this[units + 's']();
}

function makeGetter(name) {
    return function () {
        return this._data[name];
    };
}

var milliseconds = makeGetter('milliseconds');
var seconds      = makeGetter('seconds');
var minutes      = makeGetter('minutes');
var hours        = makeGetter('hours');
var days         = makeGetter('days');
var months       = makeGetter('months');
var years        = makeGetter('years');

function weeks () {
    return absFloor(this.days() / 7);
}

var round = Math.round;
var thresholds = {
    s: 45,  // seconds to minute
    m: 45,  // minutes to hour
    h: 22,  // hours to day
    d: 26,  // days to month
    M: 11   // months to year
};

// helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
}

function relativeTime$1 (posNegDuration, withoutSuffix, locale) {
    var duration = createDuration(posNegDuration).abs();
    var seconds  = round(duration.as('s'));
    var minutes  = round(duration.as('m'));
    var hours    = round(duration.as('h'));
    var days     = round(duration.as('d'));
    var months   = round(duration.as('M'));
    var years    = round(duration.as('y'));

    var a = seconds < thresholds.s && ['s', seconds]  ||
            minutes <= 1           && ['m']           ||
            minutes < thresholds.m && ['mm', minutes] ||
            hours   <= 1           && ['h']           ||
            hours   < thresholds.h && ['hh', hours]   ||
            days    <= 1           && ['d']           ||
            days    < thresholds.d && ['dd', days]    ||
            months  <= 1           && ['M']           ||
            months  < thresholds.M && ['MM', months]  ||
            years   <= 1           && ['y']           || ['yy', years];

    a[2] = withoutSuffix;
    a[3] = +posNegDuration > 0;
    a[4] = locale;
    return substituteTimeAgo.apply(null, a);
}

// This function allows you to set the rounding function for relative time strings
function getSetRelativeTimeRounding (roundingFunction) {
    if (roundingFunction === undefined) {
        return round;
    }
    if (typeof(roundingFunction) === 'function') {
        round = roundingFunction;
        return true;
    }
    return false;
}

// This function allows you to set a threshold for relative time strings
function getSetRelativeTimeThreshold (threshold, limit) {
    if (thresholds[threshold] === undefined) {
        return false;
    }
    if (limit === undefined) {
        return thresholds[threshold];
    }
    thresholds[threshold] = limit;
    return true;
}

function humanize (withSuffix) {
    var locale = this.localeData();
    var output = relativeTime$1(this, !withSuffix, locale);

    if (withSuffix) {
        output = locale.pastFuture(+this, output);
    }

    return locale.postformat(output);
}

var abs$1 = Math.abs;

function toISOString$1() {
    // for ISO strings we do not use the normal bubbling rules:
    //  * milliseconds bubble up until they become hours
    //  * days do not bubble at all
    //  * months bubble up until they become years
    // This is because there is no context-free conversion between hours and days
    // (think of clock changes)
    // and also not between days and months (28-31 days per month)
    var seconds = abs$1(this._milliseconds) / 1000;
    var days         = abs$1(this._days);
    var months       = abs$1(this._months);
    var minutes, hours, years;

    // 3600 seconds -> 60 minutes -> 1 hour
    minutes           = absFloor(seconds / 60);
    hours             = absFloor(minutes / 60);
    seconds %= 60;
    minutes %= 60;

    // 12 months -> 1 year
    years  = absFloor(months / 12);
    months %= 12;


    // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
    var Y = years;
    var M = months;
    var D = days;
    var h = hours;
    var m = minutes;
    var s = seconds;
    var total = this.asSeconds();

    if (!total) {
        // this is the same as C#'s (Noda) and python (isodate)...
        // but not other JS (goog.date)
        return 'P0D';
    }

    return (total < 0 ? '-' : '') +
        'P' +
        (Y ? Y + 'Y' : '') +
        (M ? M + 'M' : '') +
        (D ? D + 'D' : '') +
        ((h || m || s) ? 'T' : '') +
        (h ? h + 'H' : '') +
        (m ? m + 'M' : '') +
        (s ? s + 'S' : '');
}

var proto$2 = Duration.prototype;

proto$2.abs            = abs;
proto$2.add            = add$1;
proto$2.subtract       = subtract$1;
proto$2.as             = as;
proto$2.asMilliseconds = asMilliseconds;
proto$2.asSeconds      = asSeconds;
proto$2.asMinutes      = asMinutes;
proto$2.asHours        = asHours;
proto$2.asDays         = asDays;
proto$2.asWeeks        = asWeeks;
proto$2.asMonths       = asMonths;
proto$2.asYears        = asYears;
proto$2.valueOf        = valueOf$1;
proto$2._bubble        = bubble;
proto$2.get            = get$2;
proto$2.milliseconds   = milliseconds;
proto$2.seconds        = seconds;
proto$2.minutes        = minutes;
proto$2.hours          = hours;
proto$2.days           = days;
proto$2.weeks          = weeks;
proto$2.months         = months;
proto$2.years          = years;
proto$2.humanize       = humanize;
proto$2.toISOString    = toISOString$1;
proto$2.toString       = toISOString$1;
proto$2.toJSON         = toISOString$1;
proto$2.locale         = locale;
proto$2.localeData     = localeData;

// Deprecations
proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
proto$2.lang = lang;

// Side effect imports

// FORMATTING

addFormatToken('X', 0, 0, 'unix');
addFormatToken('x', 0, 0, 'valueOf');

// PARSING

addRegexToken('x', matchSigned);
addRegexToken('X', matchTimestamp);
addParseToken('X', function (input, array, config) {
    config._d = new Date(parseFloat(input, 10) * 1000);
});
addParseToken('x', function (input, array, config) {
    config._d = new Date(toInt(input));
});

// Side effect imports

//! moment.js
//! version : 2.17.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

hooks.version = '2.17.1';

setHookCallback(createLocal);

hooks.fn                    = proto;
hooks.min                   = min;
hooks.max                   = max;
hooks.now                   = now;
hooks.utc                   = createUTC;
hooks.unix                  = createUnix;
hooks.months                = listMonths;
hooks.isDate                = isDate;
hooks.locale                = getSetGlobalLocale;
hooks.invalid               = createInvalid;
hooks.duration              = createDuration;
hooks.isMoment              = isMoment;
hooks.weekdays              = listWeekdays;
hooks.parseZone             = createInZone;
hooks.localeData            = getLocale;
hooks.isDuration            = isDuration;
hooks.monthsShort           = listMonthsShort;
hooks.weekdaysMin           = listWeekdaysMin;
hooks.defineLocale          = defineLocale;
hooks.updateLocale          = updateLocale;
hooks.locales               = listLocales;
hooks.weekdaysShort         = listWeekdaysShort;
hooks.normalizeUnits        = normalizeUnits;
hooks.relativeTimeRounding = getSetRelativeTimeRounding;
hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
hooks.calendarFormat        = getCalendarFormat;
hooks.prototype             = proto;

//! moment.js locale configuration
//! locale : Afrikaans [af]
//! author : Werner Mollentze : https://github.com/wernerm

hooks.defineLocale('af', {
    months : 'Januarie_Februarie_Maart_April_Mei_Junie_Julie_Augustus_September_Oktober_November_Desember'.split('_'),
    monthsShort : 'Jan_Feb_Mrt_Apr_Mei_Jun_Jul_Aug_Sep_Okt_Nov_Des'.split('_'),
    weekdays : 'Sondag_Maandag_Dinsdag_Woensdag_Donderdag_Vrydag_Saterdag'.split('_'),
    weekdaysShort : 'Son_Maa_Din_Woe_Don_Vry_Sat'.split('_'),
    weekdaysMin : 'So_Ma_Di_Wo_Do_Vr_Sa'.split('_'),
    meridiemParse: /vm|nm/i,
    isPM : function (input) {
        return /^nm$/i.test(input);
    },
    meridiem : function (hours, minutes, isLower) {
        if (hours < 12) {
            return isLower ? 'vm' : 'VM';
        } else {
            return isLower ? 'nm' : 'NM';
        }
    },
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[Vandag om] LT',
        nextDay : '[M?re om] LT',
        nextWeek : 'dddd [om] LT',
        lastDay : '[Gister om] LT',
        lastWeek : '[Laas] dddd [om] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'oor %s',
        past : '%s gelede',
        s : '\'n paar sekondes',
        m : '\'n minuut',
        mm : '%d minute',
        h : '\'n uur',
        hh : '%d ure',
        d : '\'n dag',
        dd : '%d dae',
        M : '\'n maand',
        MM : '%d maande',
        y : '\'n jaar',
        yy : '%d jaar'
    },
    ordinalParse: /\d{1,2}(ste|de)/,
    ordinal : function (number) {
        return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de'); // Thanks to Joris R?ling : https://github.com/jjupiter
    },
    week : {
        dow : 1, // Maandag is die eerste dag van die week.
        doy : 4  // Die week wat die 4de Januarie bevat is die eerste week van die jaar.
    }
});

//! moment.js locale configuration
//! locale : Arabic (Algeria) [ar-dz]
//! author : Noureddine LOUAHEDJ : https://github.com/noureddineme

hooks.defineLocale('ar-dz', {
    months : '?????_?????_????_?????_???_????_??????_???_??????_??????_??????_??????'.split('_'),
    monthsShort : '?????_?????_????_?????_???_????_??????_???_??????_??????_??????_??????'.split('_'),
    weekdays : '?????_???????_????????_????????_??????_??????_?????'.split('_'),
    weekdaysShort : '???_?????_??????_??????_????_????_???'.split('_'),
    weekdaysMin : '??_??_???_??_??_??_??'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[????? ??? ??????] LT',
        nextDay: '[??? ??? ??????] LT',
        nextWeek: 'dddd [??? ??????] LT',
        lastDay: '[??? ??? ??????] LT',
        lastWeek: 'dddd [??? ??????] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : '?? %s',
        past : '??? %s',
        s : '????',
        m : '?????',
        mm : '%d ?????',
        h : '????',
        hh : '%d ?????',
        d : '???',
        dd : '%d ????',
        M : '???',
        MM : '%d ????',
        y : '???',
        yy : '%d ?????'
    },
    week : {
        dow : 0, // Sunday is the first day of the week.
        doy : 4  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Arabic (Lybia) [ar-ly]
//! author : Ali Hmer: https://github.com/kikoanis

var symbolMap = {
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '0': '0'
};
var pluralForm = function (n) {
    return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5;
};
var plurals = {
    s : ['??? ?? ?????', '????? ?????', ['???????', '???????'], '%d ????', '%d ?????', '%d ?????'],
    m : ['??? ?? ?????', '????? ?????', ['???????', '???????'], '%d ?????', '%d ?????', '%d ?????'],
    h : ['??? ?? ????', '???? ?????', ['??????', '??????'], '%d ?????', '%d ????', '%d ????'],
    d : ['??? ?? ???', '??? ????', ['?????', '?????'], '%d ????', '%d ?????', '%d ???'],
    M : ['??? ?? ???', '??? ????', ['?????', '?????'], '%d ????', '%d ????', '%d ???'],
    y : ['??? ?? ???', '??? ????', ['?????', '?????'], '%d ?????', '%d ?????', '%d ???']
};
var pluralize = function (u) {
    return function (number, withoutSuffix, string, isFuture) {
        var f = pluralForm(number),
            str = plurals[u][pluralForm(number)];
        if (f === 2) {
            str = str[withoutSuffix ? 0 : 1];
        }
        return str.replace(/%d/i, number);
    };
};
var months$1 = [
    '?????',
    '??????',
    '????',
    '?????',
    '????',
    '?????',
    '?????',
    '?????',
    '??????',
    '??????',
    '??????',
    '??????'
];

hooks.defineLocale('ar-ly', {
    months : months$1,
    monthsShort : months$1,
    weekdays : '?????_???????_????????_????????_??????_??????_?????'.split('_'),
    weekdaysShort : '???_?????_??????_??????_????_????_???'.split('_'),
    weekdaysMin : '?_?_?_?_?_?_?'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'D/\u200FM/\u200FYYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    meridiemParse: /?|?/,
    isPM : function (input) {
        return '?' === input;
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 12) {
            return '?';
        } else {
            return '?';
        }
    },
    calendar : {
        sameDay: '[????? ??? ??????] LT',
        nextDay: '[???? ??? ??????] LT',
        nextWeek: 'dddd [??? ??????] LT',
        lastDay: '[??? ??? ??????] LT',
        lastWeek: 'dddd [??? ??????] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : '??? %s',
        past : '??? %s',
        s : pluralize('s'),
        m : pluralize('m'),
        mm : pluralize('m'),
        h : pluralize('h'),
        hh : pluralize('h'),
        d : pluralize('d'),
        dd : pluralize('d'),
        M : pluralize('M'),
        MM : pluralize('M'),
        y : pluralize('y'),
        yy : pluralize('y')
    },
    preparse: function (string) {
        return string.replace(/\u200f/g, '').replace(/?/g, ',');
    },
    postformat: function (string) {
        return string.replace(/\d/g, function (match) {
            return symbolMap[match];
        }).replace(/,/g, '?');
    },
    week : {
        dow : 6, // Saturday is the first day of the week.
        doy : 12  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Arabic (Morocco) [ar-ma]
//! author : ElFadili Yassine : https://github.com/ElFadiliY
//! author : Abdel Said : https://github.com/abdelsaid

hooks.defineLocale('ar-ma', {
    months : '?????_??????_????_?????_???_?????_??????_???_?????_??????_?????_?????'.split('_'),
    monthsShort : '?????_??????_????_?????_???_?????_??????_???_?????_??????_?????_?????'.split('_'),
    weekdays : '?????_???????_????????_????????_??????_??????_?????'.split('_'),
    weekdaysShort : '???_?????_??????_??????_????_????_???'.split('_'),
    weekdaysMin : '?_?_?_?_?_?_?'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[????? ??? ??????] LT',
        nextDay: '[??? ??? ??????] LT',
        nextWeek: 'dddd [??? ??????] LT',
        lastDay: '[??? ??? ??????] LT',
        lastWeek: 'dddd [??? ??????] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : '?? %s',
        past : '??? %s',
        s : '????',
        m : '?????',
        mm : '%d ?????',
        h : '????',
        hh : '%d ?????',
        d : '???',
        dd : '%d ????',
        M : '???',
        MM : '%d ????',
        y : '???',
        yy : '%d ?????'
    },
    week : {
        dow : 6, // Saturday is the first day of the week.
        doy : 12  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Arabic (Saudi Arabia) [ar-sa]
//! author : Suhail Alkowaileet : https://github.com/xsoh

var symbolMap$1 = {
    '1': '?',
    '2': '?',
    '3': '?',
    '4': '?',
    '5': '?',
    '6': '?',
    '7': '?',
    '8': '?',
    '9': '?',
    '0': '?'
};
var numberMap = {
    '?': '1',
    '?': '2',
    '?': '3',
    '?': '4',
    '?': '5',
    '?': '6',
    '?': '7',
    '?': '8',
    '?': '9',
    '?': '0'
};

hooks.defineLocale('ar-sa', {
    months : '?????_??????_????_?????_????_?????_?????_?????_??????_??????_??????_??????'.split('_'),
    monthsShort : '?????_??????_????_?????_????_?????_?????_?????_??????_??????_??????_??????'.split('_'),
    weekdays : '?????_???????_????????_????????_??????_??????_?????'.split('_'),
    weekdaysShort : '???_?????_??????_??????_????_????_???'.split('_'),
    weekdaysMin : '?_?_?_?_?_?_?'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    meridiemParse: /?|?/,
    isPM : function (input) {
        return '?' === input;
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 12) {
            return '?';
        } else {
            return '?';
        }
    },
    calendar : {
        sameDay: '[????? ??? ??????] LT',
        nextDay: '[??? ??? ??????] LT',
        nextWeek: 'dddd [??? ??????] LT',
        lastDay: '[??? ??? ??????] LT',
        lastWeek: 'dddd [??? ??????] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : '?? %s',
        past : '??? %s',
        s : '????',
        m : '?????',
        mm : '%d ?????',
        h : '????',
        hh : '%d ?????',
        d : '???',
        dd : '%d ????',
        M : '???',
        MM : '%d ????',
        y : '???',
        yy : '%d ?????'
    },
    preparse: function (string) {
        return string.replace(/[??????????]/g, function (match) {
            return numberMap[match];
        }).replace(/?/g, ',');
    },
    postformat: function (string) {
        return string.replace(/\d/g, function (match) {
            return symbolMap$1[match];
        }).replace(/,/g, '?');
    },
    week : {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale  :  Arabic (Tunisia) [ar-tn]
//! author : Nader Toukabri : https://github.com/naderio

hooks.defineLocale('ar-tn', {
    months: '?????_?????_????_?????_???_????_??????_???_??????_??????_??????_??????'.split('_'),
    monthsShort: '?????_?????_????_?????_???_????_??????_???_??????_??????_??????_??????'.split('_'),
    weekdays: '?????_???????_????????_????????_??????_??????_?????'.split('_'),
    weekdaysShort: '???_?????_??????_??????_????_????_???'.split('_'),
    weekdaysMin: '?_?_?_?_?_?_?'.split('_'),
    weekdaysParseExact : true,
    longDateFormat: {
        LT: 'HH:mm',
        LTS: 'HH:mm:ss',
        L: 'DD/MM/YYYY',
        LL: 'D MMMM YYYY',
        LLL: 'D MMMM YYYY HH:mm',
        LLLL: 'dddd D MMMM YYYY HH:mm'
    },
    calendar: {
        sameDay: '[????? ??? ??????] LT',
        nextDay: '[??? ??? ??????] LT',
        nextWeek: 'dddd [??? ??????] LT',
        lastDay: '[??? ??? ??????] LT',
        lastWeek: 'dddd [??? ??????] LT',
        sameElse: 'L'
    },
    relativeTime: {
        future: '?? %s',
        past: '??? %s',
        s: '????',
        m: '?????',
        mm: '%d ?????',
        h: '????',
        hh: '%d ?????',
        d: '???',
        dd: '%d ????',
        M: '???',
        MM: '%d ????',
        y: '???',
        yy: '%d ?????'
    },
    week: {
        dow: 1, // Monday is the first day of the week.
        doy: 4 // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Arabic [ar]
//! author : Abdel Said: https://github.com/abdelsaid
//! author : Ahmed Elkhatib
//! author : forabi https://github.com/forabi

var symbolMap$2 = {
    '1': '?',
    '2': '?',
    '3': '?',
    '4': '?',
    '5': '?',
    '6': '?',
    '7': '?',
    '8': '?',
    '9': '?',
    '0': '?'
};
var numberMap$1 = {
    '?': '1',
    '?': '2',
    '?': '3',
    '?': '4',
    '?': '5',
    '?': '6',
    '?': '7',
    '?': '8',
    '?': '9',
    '?': '0'
};
var pluralForm$1 = function (n) {
    return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5;
};
var plurals$1 = {
    s : ['??? ?? ?????', '????? ?????', ['???????', '???????'], '%d ????', '%d ?????', '%d ?????'],
    m : ['??? ?? ?????', '????? ?????', ['???????', '???????'], '%d ?????', '%d ?????', '%d ?????'],
    h : ['??? ?? ????', '???? ?????', ['??????', '??????'], '%d ?????', '%d ????', '%d ????'],
    d : ['??? ?? ???', '??? ????', ['?????', '?????'], '%d ????', '%d ?????', '%d ???'],
    M : ['??? ?? ???', '??? ????', ['?????', '?????'], '%d ????', '%d ????', '%d ???'],
    y : ['??? ?? ???', '??? ????', ['?????', '?????'], '%d ?????', '%d ?????', '%d ???']
};
var pluralize$1 = function (u) {
    return function (number, withoutSuffix, string, isFuture) {
        var f = pluralForm$1(number),
            str = plurals$1[u][pluralForm$1(number)];
        if (f === 2) {
            str = str[withoutSuffix ? 0 : 1];
        }
        return str.replace(/%d/i, number);
    };
};
var months$2 = [
    '????? ?????? ?????',
    '???? ??????',
    '???? ????',
    '????? ?????',
    '???? ????',
    '?????? ?????',
    '???? ?????',
    '?? ?????',
    '????? ??????',
    '????? ????? ??????',
    '????? ?????? ??????',
    '????? ????? ??????'
];

hooks.defineLocale('ar', {
    months : months$2,
    monthsShort : months$2,
    weekdays : '?????_???????_????????_????????_??????_??????_?????'.split('_'),
    weekdaysShort : '???_?????_??????_??????_????_????_???'.split('_'),
    weekdaysMin : '?_?_?_?_?_?_?'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'D/\u200FM/\u200FYYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    meridiemParse: /?|?/,
    isPM : function (input) {
        return '?' === input;
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 12) {
            return '?';
        } else {
            return '?';
        }
    },
    calendar : {
        sameDay: '[????? ??? ??????] LT',
        nextDay: '[???? ??? ??????] LT',
        nextWeek: 'dddd [??? ??????] LT',
        lastDay: '[??? ??? ??????] LT',
        lastWeek: 'dddd [??? ??????] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : '??? %s',
        past : '??? %s',
        s : pluralize$1('s'),
        m : pluralize$1('m'),
        mm : pluralize$1('m'),
        h : pluralize$1('h'),
        hh : pluralize$1('h'),
        d : pluralize$1('d'),
        dd : pluralize$1('d'),
        M : pluralize$1('M'),
        MM : pluralize$1('M'),
        y : pluralize$1('y'),
        yy : pluralize$1('y')
    },
    preparse: function (string) {
        return string.replace(/\u200f/g, '').replace(/[??????????]/g, function (match) {
            return numberMap$1[match];
        }).replace(/?/g, ',');
    },
    postformat: function (string) {
        return string.replace(/\d/g, function (match) {
            return symbolMap$2[match];
        }).replace(/,/g, '?');
    },
    week : {
        dow : 6, // Saturday is the first day of the week.
        doy : 12  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Azerbaijani [az]
//! author : topchiyev : https://github.com/topchiyev

var suffixes = {
    1: '-inci',
    5: '-inci',
    8: '-inci',
    70: '-inci',
    80: '-inci',
    2: '-nci',
    7: '-nci',
    20: '-nci',
    50: '-nci',
    3: '-��nc��',
    4: '-��nc��',
    100: '-��nc��',
    6: '-nc?',
    9: '-uncu',
    10: '-uncu',
    30: '-uncu',
    60: '-?nc?',
    90: '-?nc?'
};

hooks.defineLocale('az', {
    months : 'yanvar_fevral_mart_aprel_may_iyun_iyul_avqust_sentyabr_oktyabr_noyabr_dekabr'.split('_'),
    monthsShort : 'yan_fev_mar_apr_may_iyn_iyl_avq_sen_okt_noy_dek'.split('_'),
    weekdays : 'Bazar_Bazar ert?si_??r??nb? ax?am?_??r??nb?_C��m? ax?am?_C��m?_??nb?'.split('_'),
    weekdaysShort : 'Baz_BzE_?Ax_??r_CAx_C��m_??n'.split('_'),
    weekdaysMin : 'Bz_BE_?A_??_CA_C��_??'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[bug��n saat] LT',
        nextDay : '[sabah saat] LT',
        nextWeek : '[g?l?n h?ft?] dddd [saat] LT',
        lastDay : '[d��n?n] LT',
        lastWeek : '[ke??n h?ft?] dddd [saat] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s sonra',
        past : '%s ?vv?l',
        s : 'birne?? saniyy?',
        m : 'bir d?qiq?',
        mm : '%d d?qiq?',
        h : 'bir saat',
        hh : '%d saat',
        d : 'bir g��n',
        dd : '%d g��n',
        M : 'bir ay',
        MM : '%d ay',
        y : 'bir il',
        yy : '%d il'
    },
    meridiemParse: /gec?|s?h?r|g��nd��z|ax?am/,
    isPM : function (input) {
        return /^(g��nd��z|ax?am)$/.test(input);
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 4) {
            return 'gec?';
        } else if (hour < 12) {
            return 's?h?r';
        } else if (hour < 17) {
            return 'g��nd��z';
        } else {
            return 'ax?am';
        }
    },
    ordinalParse: /\d{1,2}-(?nc?|inci|nci|��nc��|nc?|uncu)/,
    ordinal : function (number) {
        if (number === 0) {  // special case for zero
            return number + '-?nc?';
        }
        var a = number % 10,
            b = number % 100 - a,
            c = number >= 100 ? 100 : null;
        return number + (suffixes[a] || suffixes[b] || suffixes[c]);
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Belarusian [be]
//! author : Dmitry Demidov : https://github.com/demidov91
//! author: Praleska: http://praleska.pro/
//! Author : Menelion Elens��le : https://github.com/Oire

function plural(word, num) {
    var forms = word.split('_');
    return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
}
function relativeTimeWithPlural(number, withoutSuffix, key) {
    var format = {
        'mm': withoutSuffix ? '���?��?�ߧ�_���?��?�ߧ�_���?��?��' : '���?��?�ߧ�_���?��?�ߧ�_���?��?��',
        'hh': withoutSuffix ? '�ԧѧէ�?�ߧ�_�ԧѧէ�?�ߧ�_�ԧѧէ�?��' : '�ԧѧէ�?�ߧ�_�ԧѧէ�?�ߧ�_�ԧѧէ�?��',
        'dd': '�է٧֧ߧ�_�է�?_�է٧ק�',
        'MM': '�ާ֧���_�ާ֧����_�ާ֧����?',
        'yy': '�ԧ��_�ԧѧէ�_�ԧѧէ�?'
    };
    if (key === 'm') {
        return withoutSuffix ? '���?��?�ߧ�' : '���?��?�ߧ�';
    }
    else if (key === 'h') {
        return withoutSuffix ? '�ԧѧէ�?�ߧ�' : '�ԧѧէ�?�ߧ�';
    }
    else {
        return number + ' ' + plural(format[key], +number);
    }
}

hooks.defineLocale('be', {
    months : {
        format: '����է٧֧ߧ�_�ݧ��ѧԧ�_��ѧܧѧ�?�ܧ�_�ܧ�ѧ�ѧ�?�ܧ�_����?�ߧ�_����ӧ֧ߧ�_��?��֧ߧ�_�ا�??�ߧ�_�ӧ֧�ѧ�ߧ�_�ܧѧ������?�ܧ�_��?���ѧ�ѧէ�_��ߧ֧اߧ�'.split('_'),
        standalone: '����է٧֧ߧ�_�ݧ���_��ѧܧѧ�?��_�ܧ�ѧ�ѧ�?��_���ѧӧ֧ߧ�_����ӧ֧ߧ�_��?��֧ߧ�_�ا�?�ӧ֧ߧ�_�ӧ֧�ѧ�֧ߧ�_�ܧѧ������?��_��?���ѧ�ѧ�_��ߧ֧اѧߧ�'.split('_')
    },
    monthsShort : '�����_�ݧ��_��ѧ�_�ܧ�ѧ�_���ѧ�_�����_��?��_�ا�?��_�ӧ֧�_�ܧѧ��_��?���_��ߧ֧�'.split('_'),
    weekdays : {
        format: '�ߧ�է٧֧ݧ�_��ѧߧ�է٧֧ݧѧ�_��?����ѧ�_��֧�ѧէ�_��ѧ�ӧ֧�_�����?���_���ҧ���'.split('_'),
        standalone: '�ߧ�է٧֧ݧ�_��ѧߧ�է٧֧ݧѧ�_��?����ѧ�_��֧�ѧէ�_��ѧ�ӧ֧�_�����?���_���ҧ���'.split('_'),
        isFormat: /\[ ?[����] ?(?:��?�ߧ�ݧ��|�ߧѧ����ߧ��)? ?\] ?dddd/
    },
    weekdaysShort : '�ߧ�_���_�ѧ�_���_���_���_���'.split('_'),
    weekdaysMin : '�ߧ�_���_�ѧ�_���_���_���_���'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY ��.',
        LLL : 'D MMMM YYYY ��., HH:mm',
        LLLL : 'dddd, D MMMM YYYY ��., HH:mm'
    },
    calendar : {
        sameDay: '[���קߧߧ� ?] LT',
        nextDay: '[����?���� ?] LT',
        lastDay: '[������� ?] LT',
        nextWeek: function () {
            return '[��] dddd [?] LT';
        },
        lastWeek: function () {
            switch (this.day()) {
                case 0:
                case 3:
                case 5:
                case 6:
                    return '[�� ��?�ߧ�ݧ��] dddd [?] LT';
                case 1:
                case 2:
                case 4:
                    return '[�� ��?�ߧ�ݧ�] dddd [?] LT';
            }
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : '���ѧ� %s',
        past : '%s ��ѧާ�',
        s : '�ߧ֧ܧѧݧ��? ��֧ܧ�ߧ�',
        m : relativeTimeWithPlural,
        mm : relativeTimeWithPlural,
        h : relativeTimeWithPlural,
        hh : relativeTimeWithPlural,
        d : '�է٧֧ߧ�',
        dd : relativeTimeWithPlural,
        M : '�ާ֧���',
        MM : relativeTimeWithPlural,
        y : '�ԧ��',
        yy : relativeTimeWithPlural
    },
    meridiemParse: /�ߧ���|��ѧ�?���|�էߧ�|�ӧ֧�ѧ��/,
    isPM : function (input) {
        return /^(�էߧ�|�ӧ֧�ѧ��)$/.test(input);
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 4) {
            return '�ߧ���';
        } else if (hour < 12) {
            return '��ѧ�?���';
        } else if (hour < 17) {
            return '�էߧ�';
        } else {
            return '�ӧ֧�ѧ��';
        }
    },
    ordinalParse: /\d{1,2}-(?|��|�ԧ�)/,
    ordinal: function (number, period) {
        switch (period) {
            case 'M':
            case 'd':
            case 'DDD':
            case 'w':
            case 'W':
                return (number % 10 === 2 || number % 10 === 3) && (number % 100 !== 12 && number % 100 !== 13) ? number + '-?' : number + '-��';
            case 'D':
                return number + '-�ԧ�';
            default:
                return number;
        }
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Bulgarian [bg]
//! author : Krasen Borisov : https://github.com/kraz

hooks.defineLocale('bg', {
    months : '��ߧ�ѧ��_��֧ӧ��ѧ��_�ާѧ��_�ѧ��ڧ�_�ާѧ�_��ߧ�_��ݧ�_�ѧӧԧ���_��֧��֧ާӧ��_��ܧ��ާӧ��_�ߧ�֧ާӧ��_�է֧ܧ֧ާӧ��'.split('_'),
    monthsShort : '��ߧ�_��֧�_�ާѧ�_�ѧ��_�ާѧ�_��ߧ�_��ݧ�_�ѧӧ�_��֧�_��ܧ�_�ߧ��_�է֧�'.split('_'),
    weekdays : '�ߧ֧է֧ݧ�_���ߧ֧է֧ݧߧڧ�_�ӧ���ߧڧ�_����է�_��֧�ӧ�����_��֧���_���ҧ���'.split('_'),
    weekdaysShort : '�ߧ֧�_����_�ӧ��_����_��֧�_��֧�_����'.split('_'),
    weekdaysMin : '�ߧ�_���_�ӧ�_���_���_���_���'.split('_'),
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'D.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY H:mm',
        LLLL : 'dddd, D MMMM YYYY H:mm'
    },
    calendar : {
        sameDay : '[���ߧ֧� ��] LT',
        nextDay : '[������ ��] LT',
        nextWeek : 'dddd [��] LT',
        lastDay : '[����֧�� ��] LT',
        lastWeek : function () {
            switch (this.day()) {
                case 0:
                case 3:
                case 6:
                    return '[�� �ڧ٧ާڧߧѧݧѧ��] dddd [��] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[�� �ڧ٧ާڧߧѧݧڧ�] dddd [��] LT';
            }
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : '��ݧ֧� %s',
        past : '���֧է� %s',
        s : '�ߧ�ܧ�ݧܧ� ��֧ܧ�ߧէ�',
        m : '�ާڧߧ���',
        mm : '%d �ާڧߧ���',
        h : '��ѧ�',
        hh : '%d ��ѧ��',
        d : '�է֧�',
        dd : '%d �էߧ�',
        M : '�ާ֧�֧�',
        MM : '%d �ާ֧�֧��',
        y : '�ԧ�էڧߧ�',
        yy : '%d �ԧ�էڧߧ�'
    },
    ordinalParse: /\d{1,2}-(�֧�|�֧�|���|�ӧ�|���|�ާ�)/,
    ordinal : function (number) {
        var lastDigit = number % 10,
            last2Digits = number % 100;
        if (number === 0) {
            return number + '-�֧�';
        } else if (last2Digits === 0) {
            return number + '-�֧�';
        } else if (last2Digits > 10 && last2Digits < 20) {
            return number + '-���';
        } else if (lastDigit === 1) {
            return number + '-�ӧ�';
        } else if (lastDigit === 2) {
            return number + '-���';
        } else if (lastDigit === 7 || lastDigit === 8) {
            return number + '-�ާ�';
        } else {
            return number + '-���';
        }
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Bengali [bn]
//! author : Kaushik Gandhi : https://github.com/kaushikgandhi

var symbolMap$3 = {
    '1': '?',
    '2': '?',
    '3': '?',
    '4': '?',
    '5': '?',
    '6': '?',
    '7': '?',
    '8': '?',
    '9': '?',
    '0': '?'
};
var numberMap$2 = {
    '?': '1',
    '?': '2',
    '?': '3',
    '?': '4',
    '?': '5',
    '?': '6',
    '?': '7',
    '?': '8',
    '?': '9',
    '?': '0'
};

hooks.defineLocale('bn', {
    months : '????????_??????????_?????_??????_??_???_?????_?????_??????????_???????_???????_????????'.split('_'),
    monthsShort : '????_???_?????_????_??_???_???_??_?????_?????_???_????'.split('_'),
    weekdays : '??????_??????_????????_??????_???????????_????????_??????'.split('_'),
    weekdaysShort : '???_???_?????_???_????????_?????_???'.split('_'),
    weekdaysMin : '???_???_????_???_????_?????_???'.split('_'),
    longDateFormat : {
        LT : 'A h:mm ???',
        LTS : 'A h:mm:ss ???',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY, A h:mm ???',
        LLLL : 'dddd, D MMMM YYYY, A h:mm ???'
    },
    calendar : {
        sameDay : '[??] LT',
        nextDay : '[????????] LT',
        nextWeek : 'dddd, LT',
        lastDay : '[?????] LT',
        lastWeek : '[??] dddd, LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s ???',
        past : '%s ???',
        s : '???? ???????',
        m : '?? ?????',
        mm : '%d ?????',
        h : '?? ?????',
        hh : '%d ?????',
        d : '?? ???',
        dd : '%d ???',
        M : '?? ???',
        MM : '%d ???',
        y : '?? ???',
        yy : '%d ???'
    },
    preparse: function (string) {
        return string.replace(/[??????????]/g, function (match) {
            return numberMap$2[match];
        });
    },
    postformat: function (string) {
        return string.replace(/\d/g, function (match) {
            return symbolMap$3[match];
        });
    },
    meridiemParse: /???|????|?????|?????|???/,
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if ((meridiem === '???' && hour >= 4) ||
                (meridiem === '?????' && hour < 5) ||
                meridiem === '?????') {
            return hour + 12;
        } else {
            return hour;
        }
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 4) {
            return '???';
        } else if (hour < 10) {
            return '????';
        } else if (hour < 17) {
            return '?????';
        } else if (hour < 20) {
            return '?????';
        } else {
            return '???';
        }
    },
    week : {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Tibetan [bo]
//! author : Thupten N. Chakrishar : https://github.com/vajradog

var symbolMap$4 = {
    '1': '?',
    '2': '?',
    '3': '?',
    '4': '?',
    '5': '?',
    '6': '?',
    '7': '?',
    '8': '?',
    '9': '?',
    '0': '?'
};
var numberMap$3 = {
    '?': '1',
    '?': '2',
    '?': '3',
    '?': '4',
    '?': '5',
    '?': '6',
    '?': '7',
    '?': '8',
    '?': '9',
    '?': '0'
};

hooks.defineLocale('bo', {
    months : '??????????_???????????_???????????_??????????_?????????_???????????_???????????_????????????_??????????_??????????_???????????????_???????????????'.split('_'),
    monthsShort : '??????????_???????????_???????????_??????????_?????????_???????????_???????????_????????????_??????????_??????????_???????????????_???????????????'.split('_'),
    weekdays : '?????????_?????????_????????????_??????????_??????????_??????????_???????????'.split('_'),
    weekdaysShort : '?????_?????_????????_??????_??????_??????_???????'.split('_'),
    weekdaysMin : '?????_?????_????????_??????_??????_??????_???????'.split('_'),
    longDateFormat : {
        LT : 'A h:mm',
        LTS : 'A h:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY, A h:mm',
        LLLL : 'dddd, D MMMM YYYY, A h:mm'
    },
    calendar : {
        sameDay : '[??????] LT',
        nextDay : '[??????] LT',
        nextWeek : '[???????????????], LT',
        lastDay : '[????] LT',
        lastWeek : '[??????????????] dddd, LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s ??',
        past : '%s ?????',
        s : '?????',
        m : '??????????',
        mm : '%d ?????',
        h : '???????????',
        hh : '%d ??????',
        d : '????????',
        dd : '%d ????',
        M : '?????????',
        MM : '%d ????',
        y : '???????',
        yy : '%d ??'
    },
    preparse: function (string) {
        return string.replace(/[??????????]/g, function (match) {
            return numberMap$3[match];
        });
    },
    postformat: function (string) {
        return string.replace(/\d/g, function (match) {
            return symbolMap$4[match];
        });
    },
    meridiemParse: /??????|???????|???????|???????|??????/,
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if ((meridiem === '??????' && hour >= 4) ||
                (meridiem === '???????' && hour < 5) ||
                meridiem === '???????') {
            return hour + 12;
        } else {
            return hour;
        }
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 4) {
            return '??????';
        } else if (hour < 10) {
            return '???????';
        } else if (hour < 17) {
            return '???????';
        } else if (hour < 20) {
            return '???????';
        } else {
            return '??????';
        }
    },
    week : {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Breton [br]
//! author : Jean-Baptiste Le Duigou : https://github.com/jbleduigou

function relativeTimeWithMutation(number, withoutSuffix, key) {
    var format = {
        'mm': 'munutenn',
        'MM': 'miz',
        'dd': 'devezh'
    };
    return number + ' ' + mutation(format[key], number);
}
function specialMutationForYears(number) {
    switch (lastNumber(number)) {
        case 1:
        case 3:
        case 4:
        case 5:
        case 9:
            return number + ' bloaz';
        default:
            return number + ' vloaz';
    }
}
function lastNumber(number) {
    if (number > 9) {
        return lastNumber(number % 10);
    }
    return number;
}
function mutation(text, number) {
    if (number === 2) {
        return softMutation(text);
    }
    return text;
}
function softMutation(text) {
    var mutationTable = {
        'm': 'v',
        'b': 'v',
        'd': 'z'
    };
    if (mutationTable[text.charAt(0)] === undefined) {
        return text;
    }
    return mutationTable[text.charAt(0)] + text.substring(1);
}

hooks.defineLocale('br', {
    months : 'Genver_C\'hwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu'.split('_'),
    monthsShort : 'Gen_C\'hwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker'.split('_'),
    weekdays : 'Sul_Lun_Meurzh_Merc\'her_Yaou_Gwener_Sadorn'.split('_'),
    weekdaysShort : 'Sul_Lun_Meu_Mer_Yao_Gwe_Sad'.split('_'),
    weekdaysMin : 'Su_Lu_Me_Mer_Ya_Gw_Sa'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'h[e]mm A',
        LTS : 'h[e]mm:ss A',
        L : 'DD/MM/YYYY',
        LL : 'D [a viz] MMMM YYYY',
        LLL : 'D [a viz] MMMM YYYY h[e]mm A',
        LLLL : 'dddd, D [a viz] MMMM YYYY h[e]mm A'
    },
    calendar : {
        sameDay : '[Hiziv da] LT',
        nextDay : '[Warc\'hoazh da] LT',
        nextWeek : 'dddd [da] LT',
        lastDay : '[Dec\'h da] LT',
        lastWeek : 'dddd [paset da] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'a-benn %s',
        past : '%s \'zo',
        s : 'un nebeud segondenno��',
        m : 'ur vunutenn',
        mm : relativeTimeWithMutation,
        h : 'un eur',
        hh : '%d eur',
        d : 'un devezh',
        dd : relativeTimeWithMutation,
        M : 'ur miz',
        MM : relativeTimeWithMutation,
        y : 'ur bloaz',
        yy : specialMutationForYears
    },
    ordinalParse: /\d{1,2}(a?|vet)/,
    ordinal : function (number) {
        var output = (number === 1) ? 'a?' : 'vet';
        return number + output;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Bosnian [bs]
//! author : Nedim Cholich : https://github.com/frontyard
//! based on (hr) translation by Bojan Markovi?

function translate(number, withoutSuffix, key) {
    var result = number + ' ';
    switch (key) {
        case 'm':
            return withoutSuffix ? 'jedna minuta' : 'jedne minute';
        case 'mm':
            if (number === 1) {
                result += 'minuta';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'minute';
            } else {
                result += 'minuta';
            }
            return result;
        case 'h':
            return withoutSuffix ? 'jedan sat' : 'jednog sata';
        case 'hh':
            if (number === 1) {
                result += 'sat';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'sata';
            } else {
                result += 'sati';
            }
            return result;
        case 'dd':
            if (number === 1) {
                result += 'dan';
            } else {
                result += 'dana';
            }
            return result;
        case 'MM':
            if (number === 1) {
                result += 'mjesec';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'mjeseca';
            } else {
                result += 'mjeseci';
            }
            return result;
        case 'yy':
            if (number === 1) {
                result += 'godina';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'godine';
            } else {
                result += 'godina';
            }
            return result;
    }
}

hooks.defineLocale('bs', {
    months : 'januar_februar_mart_april_maj_juni_juli_august_septembar_oktobar_novembar_decembar'.split('_'),
    monthsShort : 'jan._feb._mar._apr._maj._jun._jul._aug._sep._okt._nov._dec.'.split('_'),
    monthsParseExact: true,
    weekdays : 'nedjelja_ponedjeljak_utorak_srijeda_?etvrtak_petak_subota'.split('_'),
    weekdaysShort : 'ned._pon._uto._sri._?et._pet._sub.'.split('_'),
    weekdaysMin : 'ne_po_ut_sr_?e_pe_su'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY H:mm',
        LLLL : 'dddd, D. MMMM YYYY H:mm'
    },
    calendar : {
        sameDay  : '[danas u] LT',
        nextDay  : '[sutra u] LT',
        nextWeek : function () {
            switch (this.day()) {
                case 0:
                    return '[u] [nedjelju] [u] LT';
                case 3:
                    return '[u] [srijedu] [u] LT';
                case 6:
                    return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[u] dddd [u] LT';
            }
        },
        lastDay  : '[ju?er u] LT',
        lastWeek : function () {
            switch (this.day()) {
                case 0:
                case 3:
                    return '[pro?lu] dddd [u] LT';
                case 6:
                    return '[pro?le] [subote] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[pro?li] dddd [u] LT';
            }
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : 'za %s',
        past   : 'prije %s',
        s      : 'par sekundi',
        m      : translate,
        mm     : translate,
        h      : translate,
        hh     : translate,
        d      : 'dan',
        dd     : translate,
        M      : 'mjesec',
        MM     : translate,
        y      : 'godinu',
        yy     : translate
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Catalan [ca]
//! author : Juan G. Hurtado : https://github.com/juanghurtado

hooks.defineLocale('ca', {
    months : 'gener_febrer_mar?_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre'.split('_'),
    monthsShort : 'gen._febr._mar._abr._mai._jun._jul._ag._set._oct._nov._des.'.split('_'),
    monthsParseExact : true,
    weekdays : 'diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte'.split('_'),
    weekdaysShort : 'dg._dl._dt._dc._dj._dv._ds.'.split('_'),
    weekdaysMin : 'Dg_Dl_Dt_Dc_Dj_Dv_Ds'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY H:mm',
        LLLL : 'dddd D MMMM YYYY H:mm'
    },
    calendar : {
        sameDay : function () {
            return '[avui a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
        },
        nextDay : function () {
            return '[dem�� a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
        },
        nextWeek : function () {
            return 'dddd [a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
        },
        lastDay : function () {
            return '[ahir a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
        },
        lastWeek : function () {
            return '[el] dddd [passat a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : 'd\'aqu�� %s',
        past : 'fa %s',
        s : 'uns segons',
        m : 'un minut',
        mm : '%d minuts',
        h : 'una hora',
        hh : '%d hores',
        d : 'un dia',
        dd : '%d dies',
        M : 'un mes',
        MM : '%d mesos',
        y : 'un any',
        yy : '%d anys'
    },
    ordinalParse: /\d{1,2}(r|n|t|��|a)/,
    ordinal : function (number, period) {
        var output = (number === 1) ? 'r' :
            (number === 2) ? 'n' :
            (number === 3) ? 'r' :
            (number === 4) ? 't' : '��';
        if (period === 'w' || period === 'W') {
            output = 'a';
        }
        return number + output;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Czech [cs]
//! author : petrbela : https://github.com/petrbela

var months$3 = 'leden_��nor_b?ezen_duben_kv��ten_?erven_?ervenec_srpen_z��?��_?��jen_listopad_prosinec'.split('_');
var monthsShort = 'led_��no_b?e_dub_kv��_?vn_?vc_srp_z��?_?��j_lis_pro'.split('_');
function plural$1(n) {
    return (n > 1) && (n < 5) && (~~(n / 10) !== 1);
}
function translate$1(number, withoutSuffix, key, isFuture) {
    var result = number + ' ';
    switch (key) {
        case 's':  // a few seconds / in a few seconds / a few seconds ago
            return (withoutSuffix || isFuture) ? 'p��r sekund' : 'p��r sekundami';
        case 'm':  // a minute / in a minute / a minute ago
            return withoutSuffix ? 'minuta' : (isFuture ? 'minutu' : 'minutou');
        case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
            if (withoutSuffix || isFuture) {
                return result + (plural$1(number) ? 'minuty' : 'minut');
            } else {
                return result + 'minutami';
            }
            break;
        case 'h':  // an hour / in an hour / an hour ago
            return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
        case 'hh': // 9 hours / in 9 hours / 9 hours ago
            if (withoutSuffix || isFuture) {
                return result + (plural$1(number) ? 'hodiny' : 'hodin');
            } else {
                return result + 'hodinami';
            }
            break;
        case 'd':  // a day / in a day / a day ago
            return (withoutSuffix || isFuture) ? 'den' : 'dnem';
        case 'dd': // 9 days / in 9 days / 9 days ago
            if (withoutSuffix || isFuture) {
                return result + (plural$1(number) ? 'dny' : 'dn��');
            } else {
                return result + 'dny';
            }
            break;
        case 'M':  // a month / in a month / a month ago
            return (withoutSuffix || isFuture) ? 'm��s��c' : 'm��s��cem';
        case 'MM': // 9 months / in 9 months / 9 months ago
            if (withoutSuffix || isFuture) {
                return result + (plural$1(number) ? 'm��s��ce' : 'm��s��c?');
            } else {
                return result + 'm��s��ci';
            }
            break;
        case 'y':  // a year / in a year / a year ago
            return (withoutSuffix || isFuture) ? 'rok' : 'rokem';
        case 'yy': // 9 years / in 9 years / 9 years ago
            if (withoutSuffix || isFuture) {
                return result + (plural$1(number) ? 'roky' : 'let');
            } else {
                return result + 'lety';
            }
            break;
    }
}

hooks.defineLocale('cs', {
    months : months$3,
    monthsShort : monthsShort,
    monthsParse : (function (months, monthsShort) {
        var i, _monthsParse = [];
        for (i = 0; i < 12; i++) {
            // use custom parser to solve problem with July (?ervenec)
            _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
        }
        return _monthsParse;
    }(months$3, monthsShort)),
    shortMonthsParse : (function (monthsShort) {
        var i, _shortMonthsParse = [];
        for (i = 0; i < 12; i++) {
            _shortMonthsParse[i] = new RegExp('^' + monthsShort[i] + '$', 'i');
        }
        return _shortMonthsParse;
    }(monthsShort)),
    longMonthsParse : (function (months) {
        var i, _longMonthsParse = [];
        for (i = 0; i < 12; i++) {
            _longMonthsParse[i] = new RegExp('^' + months[i] + '$', 'i');
        }
        return _longMonthsParse;
    }(months$3)),
    weekdays : 'ned��le_pond��l��_��tery_st?eda_?tvrtek_p��tek_sobota'.split('_'),
    weekdaysShort : 'ne_po_��t_st_?t_p��_so'.split('_'),
    weekdaysMin : 'ne_po_��t_st_?t_p��_so'.split('_'),
    longDateFormat : {
        LT: 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY H:mm',
        LLLL : 'dddd D. MMMM YYYY H:mm',
        l : 'D. M. YYYY'
    },
    calendar : {
        sameDay: '[dnes v] LT',
        nextDay: '[z��tra v] LT',
        nextWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[v ned��li v] LT';
                case 1:
                case 2:
                    return '[v] dddd [v] LT';
                case 3:
                    return '[ve st?edu v] LT';
                case 4:
                    return '[ve ?tvrtek v] LT';
                case 5:
                    return '[v p��tek v] LT';
                case 6:
                    return '[v sobotu v] LT';
            }
        },
        lastDay: '[v?era v] LT',
        lastWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[minulou ned��li v] LT';
                case 1:
                case 2:
                    return '[minul��] dddd [v] LT';
                case 3:
                    return '[minulou st?edu v] LT';
                case 4:
                case 5:
                    return '[minuly] dddd [v] LT';
                case 6:
                    return '[minulou sobotu v] LT';
            }
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : 'za %s',
        past : 'p?ed %s',
        s : translate$1,
        m : translate$1,
        mm : translate$1,
        h : translate$1,
        hh : translate$1,
        d : translate$1,
        dd : translate$1,
        M : translate$1,
        MM : translate$1,
        y : translate$1,
        yy : translate$1
    },
    ordinalParse : /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Chuvash [cv]
//! author : Anatoly Mironov : https://github.com/mirontoli

hooks.defineLocale('cv', {
    months : '��?��ݧѧ�_�ߧѧ�?��_����_�ѧܧ�_�ާѧ�_??���ާ�_���?_?���ݧ�_�ѧ�?��_����_��?��_��ѧ��ѧ�'.split('_'),
    monthsShort : '��?��_�ߧѧ�_����_�ѧܧ�_�ާѧ�_??��_���?_?���_�ѧӧ�_����_��?��_��ѧ�'.split('_'),
    weekdays : '�ӧ���ѧ�ߧڧܧ��_���ߧ�ڧܧ��_���ݧѧ�ڧܧ��_��ߧܧ��_��??�ߧ֧�ߧڧܧ��_���ߧ֧ܧ��_��?�ާѧ�ܧ��'.split('_'),
    weekdaysShort : '�ӧ��_����_����_���_��??_����_��?��'.split('_'),
    weekdaysMin : '�ӧ�_���_���_���_��?_���_���'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD-MM-YYYY',
        LL : 'YYYY [?��ݧ��] MMMM [���?��?��] D[-��?��?]',
        LLL : 'YYYY [?��ݧ��] MMMM [���?��?��] D[-��?��?], HH:mm',
        LLLL : 'dddd, YYYY [?��ݧ��] MMMM [���?��?��] D[-��?��?], HH:mm'
    },
    calendar : {
        sameDay: '[���ѧ��] LT [��֧�֧���]',
        nextDay: '[����ѧ�] LT [��֧�֧���]',
        lastDay: '[?�ߧ֧�] LT [��֧�֧���]',
        nextWeek: '[?�ڧ�֧�] dddd LT [��֧�֧���]',
        lastWeek: '[������?] dddd LT [��֧�֧���]',
        sameElse: 'L'
    },
    relativeTime : {
        future : function (output) {
            var affix = /��֧�֧�$/i.exec(output) ? '��֧�' : /?���$/i.exec(output) ? '��ѧ�' : '��ѧ�';
            return output + affix;
        },
        past : '%s �ܧѧ�ݧݧ�',
        s : '��?��-�ڧ� ?�֧ܧܧ�ߧ�',
        m : '��?�� �ާڧߧ��',
        mm : '%d �ާڧߧ��',
        h : '��?�� ��֧�֧�',
        hh : '%d ��֧�֧�',
        d : '��?�� �ܧ��',
        dd : '%d �ܧ��',
        M : '��?�� ���?��',
        MM : '%d ���?��',
        y : '��?�� ?���',
        yy : '%d ?���'
    },
    ordinalParse: /\d{1,2}-��?��/,
    ordinal : '%d-��?��',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Welsh [cy]
//! author : Robert Allen : https://github.com/robgallen
//! author : https://github.com/ryangreaves

hooks.defineLocale('cy', {
    months: 'Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr'.split('_'),
    monthsShort: 'Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag'.split('_'),
    weekdays: 'Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn'.split('_'),
    weekdaysShort: 'Sul_Llun_Maw_Mer_Iau_Gwe_Sad'.split('_'),
    weekdaysMin: 'Su_Ll_Ma_Me_Ia_Gw_Sa'.split('_'),
    weekdaysParseExact : true,
    // time formats are the same as en-gb
    longDateFormat: {
        LT: 'HH:mm',
        LTS : 'HH:mm:ss',
        L: 'DD/MM/YYYY',
        LL: 'D MMMM YYYY',
        LLL: 'D MMMM YYYY HH:mm',
        LLLL: 'dddd, D MMMM YYYY HH:mm'
    },
    calendar: {
        sameDay: '[Heddiw am] LT',
        nextDay: '[Yfory am] LT',
        nextWeek: 'dddd [am] LT',
        lastDay: '[Ddoe am] LT',
        lastWeek: 'dddd [diwethaf am] LT',
        sameElse: 'L'
    },
    relativeTime: {
        future: 'mewn %s',
        past: '%s yn ?l',
        s: 'ychydig eiliadau',
        m: 'munud',
        mm: '%d munud',
        h: 'awr',
        hh: '%d awr',
        d: 'diwrnod',
        dd: '%d diwrnod',
        M: 'mis',
        MM: '%d mis',
        y: 'blwyddyn',
        yy: '%d flynedd'
    },
    ordinalParse: /\d{1,2}(fed|ain|af|il|ydd|ed|eg)/,
    // traditional ordinal numbers above 31 are not commonly used in colloquial Welsh
    ordinal: function (number) {
        var b = number,
            output = '',
            lookup = [
                '', 'af', 'il', 'ydd', 'ydd', 'ed', 'ed', 'ed', 'fed', 'fed', 'fed', // 1af to 10fed
                'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'fed' // 11eg to 20fed
            ];
        if (b > 20) {
            if (b === 40 || b === 50 || b === 60 || b === 80 || b === 100) {
                output = 'fed'; // not 30ain, 70ain or 90ain
            } else {
                output = 'ain';
            }
        } else if (b > 0) {
            output = lookup[b];
        }
        return number + output;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Danish [da]
//! author : Ulrik Nielsen : https://github.com/mrbase

hooks.defineLocale('da', {
    months : 'januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december'.split('_'),
    monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
    weekdays : 's?ndag_mandag_tirsdag_onsdag_torsdag_fredag_l?rdag'.split('_'),
    weekdaysShort : 's?n_man_tir_ons_tor_fre_l?r'.split('_'),
    weekdaysMin : 's?_ma_ti_on_to_fr_l?'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY HH:mm',
        LLLL : 'dddd [d.] D. MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[I dag kl.] LT',
        nextDay : '[I morgen kl.] LT',
        nextWeek : 'dddd [kl.] LT',
        lastDay : '[I g?r kl.] LT',
        lastWeek : '[sidste] dddd [kl] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'om %s',
        past : '%s siden',
        s : 'f? sekunder',
        m : 'et minut',
        mm : '%d minutter',
        h : 'en time',
        hh : '%d timer',
        d : 'en dag',
        dd : '%d dage',
        M : 'en m?ned',
        MM : '%d m?neder',
        y : 'et ?r',
        yy : '%d ?r'
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : German (Austria) [de-at]
//! author : lluchs : https://github.com/lluchs
//! author: Menelion Elens��le: https://github.com/Oire
//! author : Martin Groller : https://github.com/MadMG
//! author : Mikolaj Dadela : https://github.com/mik01aj

function processRelativeTime(number, withoutSuffix, key, isFuture) {
    var format = {
        'm': ['eine Minute', 'einer Minute'],
        'h': ['eine Stunde', 'einer Stunde'],
        'd': ['ein Tag', 'einem Tag'],
        'dd': [number + ' Tage', number + ' Tagen'],
        'M': ['ein Monat', 'einem Monat'],
        'MM': [number + ' Monate', number + ' Monaten'],
        'y': ['ein Jahr', 'einem Jahr'],
        'yy': [number + ' Jahre', number + ' Jahren']
    };
    return withoutSuffix ? format[key][0] : format[key][1];
}

hooks.defineLocale('de-at', {
    months : 'J?nner_Februar_M?rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
    monthsShort : 'J?n._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
    monthsParseExact : true,
    weekdays : 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
    weekdaysShort : 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
    weekdaysMin : 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT: 'HH:mm',
        LTS: 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY HH:mm',
        LLLL : 'dddd, D. MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[heute um] LT [Uhr]',
        sameElse: 'L',
        nextDay: '[morgen um] LT [Uhr]',
        nextWeek: 'dddd [um] LT [Uhr]',
        lastDay: '[gestern um] LT [Uhr]',
        lastWeek: '[letzten] dddd [um] LT [Uhr]'
    },
    relativeTime : {
        future : 'in %s',
        past : 'vor %s',
        s : 'ein paar Sekunden',
        m : processRelativeTime,
        mm : '%d Minuten',
        h : processRelativeTime,
        hh : '%d Stunden',
        d : processRelativeTime,
        dd : processRelativeTime,
        M : processRelativeTime,
        MM : processRelativeTime,
        y : processRelativeTime,
        yy : processRelativeTime
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : German [de]
//! author : lluchs : https://github.com/lluchs
//! author: Menelion Elens��le: https://github.com/Oire
//! author : Mikolaj Dadela : https://github.com/mik01aj

function processRelativeTime$1(number, withoutSuffix, key, isFuture) {
    var format = {
        'm': ['eine Minute', 'einer Minute'],
        'h': ['eine Stunde', 'einer Stunde'],
        'd': ['ein Tag', 'einem Tag'],
        'dd': [number + ' Tage', number + ' Tagen'],
        'M': ['ein Monat', 'einem Monat'],
        'MM': [number + ' Monate', number + ' Monaten'],
        'y': ['ein Jahr', 'einem Jahr'],
        'yy': [number + ' Jahre', number + ' Jahren']
    };
    return withoutSuffix ? format[key][0] : format[key][1];
}

hooks.defineLocale('de', {
    months : 'Januar_Februar_M?rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
    monthsShort : 'Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
    monthsParseExact : true,
    weekdays : 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
    weekdaysShort : 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
    weekdaysMin : 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT: 'HH:mm',
        LTS: 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY HH:mm',
        LLLL : 'dddd, D. MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[heute um] LT [Uhr]',
        sameElse: 'L',
        nextDay: '[morgen um] LT [Uhr]',
        nextWeek: 'dddd [um] LT [Uhr]',
        lastDay: '[gestern um] LT [Uhr]',
        lastWeek: '[letzten] dddd [um] LT [Uhr]'
    },
    relativeTime : {
        future : 'in %s',
        past : 'vor %s',
        s : 'ein paar Sekunden',
        m : processRelativeTime$1,
        mm : '%d Minuten',
        h : processRelativeTime$1,
        hh : '%d Stunden',
        d : processRelativeTime$1,
        dd : processRelativeTime$1,
        M : processRelativeTime$1,
        MM : processRelativeTime$1,
        y : processRelativeTime$1,
        yy : processRelativeTime$1
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Maldivian [dv]
//! author : Jawish Hameed : https://github.com/jawish

var months$4 = [
    '????????',
    '??????????',
    '??????',
    '????????',
    '??',
    '????',
    '??????',
    '????????',
    '????????????',
    '??????????',
    '??????????',
    '??????????'
];
var weekdays = [
    '????????',
    '????',
    '????????',
    '????',
    '??????????',
    '??????',
    '????????'
];

hooks.defineLocale('dv', {
    months : months$4,
    monthsShort : months$4,
    weekdays : weekdays,
    weekdaysShort : weekdays,
    weekdaysMin : '????_????_????_????_????_????_????'.split('_'),
    longDateFormat : {

        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'D/M/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    meridiemParse: /??|??/,
    isPM : function (input) {
        return '??' === input;
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 12) {
            return '??';
        } else {
            return '??';
        }
    },
    calendar : {
        sameDay : '[??????] LT',
        nextDay : '[??????] LT',
        nextWeek : 'dddd LT',
        lastDay : '[??????] LT',
        lastWeek : '[????????] dddd LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '???????? %s',
        past : '?????? %s',
        s : '??????????????',
        m : '????????',
        mm : '?????? %d',
        h : '??????????',
        hh : '???????? %d',
        d : '????????',
        dd : '?????? %d',
        M : '??????',
        MM : '???? %d',
        y : '????????',
        yy : '?????? %d'
    },
    preparse: function (string) {
        return string.replace(/?/g, ',');
    },
    postformat: function (string) {
        return string.replace(/,/g, '?');
    },
    week : {
        dow : 7,  // Sunday is the first day of the week.
        doy : 12  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Greek [el]
//! author : Aggelos Karalias : https://github.com/mehiel

hooks.defineLocale('el', {
    monthsNominativeEl : '�����ͦϦ�?�Ѧɦ�?_���Ŧ¦ѦϦ�?�Ѧɦ�?_��?�ѦӦɦ�?_���Ц�?�˦ɦ�?_��?�ɦ�?_����?�ͦɦ�?_����?�˦ɦ�?_��?�æϦԦҦӦ�?_���ŦЦ�?�̦¦Ѧɦ�?_���ʦ�?�¦Ѧɦ�?_����?�̦¦Ѧɦ�?_���Ŧ�?�̦¦Ѧɦ�?'.split('_'),
    monthsGenitiveEl : '�����ͦϦԦ���?�Ϧ�_���Ŧ¦ѦϦԦ���?�Ϧ�_�����Ѧ�?�Ϧ�_���ЦѦɦ�?�Ϧ�_����?�Ϧ�_���ϦԦ�?�Ϧ�_���ϦԦ�?�Ϧ�_���Ԧæ�?�ҦӦϦ�_���ŦЦӦŦ̦¦�?�Ϧ�_���ʦӦئ¦�?�Ϧ�_���ϦŦ̦¦�?�Ϧ�_���ŦʦŦ̦¦�?�Ϧ�'.split('_'),
    months : function (momentToFormat, format) {
        if (/D/.test(format.substring(0, format.indexOf('MMMM')))) { // if there is a day number before 'MMMM'
            return this._monthsGenitiveEl[momentToFormat.month()];
        } else {
            return this._monthsNominativeEl[momentToFormat.month()];
        }
    },
    monthsShort : '������_���Ŧ�_������_���Ц�_����?_���ϦԦ�_���ϦԦ�_���Ԧ�_���Ŧ�_���ʦ�_���Ϧ�_���Ŧ�'.split('_'),
    weekdays : '���ԦѦɦ���?_���ŦԦ�?�Ѧ�_����?�Ӧ�_���Ŧ�?�ѦӦ�_��?�̦ЦӦ�_�����Ѧ��ҦʦŦ�?_��?�¦¦��Ӧ�'.split('_'),
    weekdaysShort : '���Ԧ�_���Ŧ�_���Ѧ�_���Ŧ�_���Ŧ�_������_������'.split('_'),
    weekdaysMin : '����_����_����_����_����_����_����'.split('_'),
    meridiem : function (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? '�̦�' : '����';
        } else {
            return isLower ? '�Ц�' : '����';
        }
    },
    isPM : function (input) {
        return ((input + '').toLowerCase()[0] === '��');
    },
    meridiemParse : /[����]\.?��?\.?/i,
    longDateFormat : {
        LT : 'h:mm A',
        LTS : 'h:mm:ss A',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY h:mm A',
        LLLL : 'dddd, D MMMM YYYY h:mm A'
    },
    calendarEl : {
        sameDay : '[��?�̦ŦѦ� {}] LT',
        nextDay : '[��?�Ѧɦ� {}] LT',
        nextWeek : 'dddd [{}] LT',
        lastDay : '[���Ȧ�? {}] LT',
        lastWeek : function () {
            switch (this.day()) {
                case 6:
                    return '[�Ӧ� �ЦѦϦǦæ�?�̦Ŧͦ�] dddd [{}] LT';
                default:
                    return '[�ӦǦ� �ЦѦϦǦæ�?�̦Ŧͦ�] dddd [{}] LT';
            }
        },
        sameElse : 'L'
    },
    calendar : function (key, mom) {
        var output = this._calendarEl[key],
            hours = mom && mom.hours();
        if (isFunction(output)) {
            output = output.apply(mom);
        }
        return output.replace('{}', (hours % 12 === 1 ? '�ҦӦ�' : '�ҦӦ�?'));
    },
    relativeTime : {
        future : '�Ҧ� %s',
        past : '%s �ЦѦɦ�',
        s : '��?�æ� �ĦŦԦӦŦ�?�˦ŦЦӦ�',
        m : '?�ͦ� �˦ŦЦ�?',
        mm : '%d �˦ŦЦ�?',
        h : '��?�� ?�Ѧ�',
        hh : '%d ?�Ѧ�?',
        d : '��?�� ��?�Ѧ�',
        dd : '%d ��?�Ѧ�?',
        M : '?�ͦ�? ��?�ͦ�?',
        MM : '%d ��?�ͦ�?',
        y : '?�ͦ�? �֦�?�ͦ�?',
        yy : '%d �֦�?�ͦɦ�'
    },
    ordinalParse: /\d{1,2}��/,
    ordinal: '%d��',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : English (Australia) [en-au]
//! author : Jared Morse : https://github.com/jarcoal

hooks.defineLocale('en-au', {
    months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
    monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
    weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
    weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
    weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
    longDateFormat : {
        LT : 'h:mm A',
        LTS : 'h:mm:ss A',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY h:mm A',
        LLLL : 'dddd, D MMMM YYYY h:mm A'
    },
    calendar : {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'in %s',
        past : '%s ago',
        s : 'a few seconds',
        m : 'a minute',
        mm : '%d minutes',
        h : 'an hour',
        hh : '%d hours',
        d : 'a day',
        dd : '%d days',
        M : 'a month',
        MM : '%d months',
        y : 'a year',
        yy : '%d years'
    },
    ordinalParse: /\d{1,2}(st|nd|rd|th)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (~~(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : English (Canada) [en-ca]
//! author : Jonathan Abourbih : https://github.com/jonbca

hooks.defineLocale('en-ca', {
    months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
    monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
    weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
    weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
    weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
    longDateFormat : {
        LT : 'h:mm A',
        LTS : 'h:mm:ss A',
        L : 'YYYY-MM-DD',
        LL : 'MMMM D, YYYY',
        LLL : 'MMMM D, YYYY h:mm A',
        LLLL : 'dddd, MMMM D, YYYY h:mm A'
    },
    calendar : {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'in %s',
        past : '%s ago',
        s : 'a few seconds',
        m : 'a minute',
        mm : '%d minutes',
        h : 'an hour',
        hh : '%d hours',
        d : 'a day',
        dd : '%d days',
        M : 'a month',
        MM : '%d months',
        y : 'a year',
        yy : '%d years'
    },
    ordinalParse: /\d{1,2}(st|nd|rd|th)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (~~(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    }
});

//! moment.js locale configuration
//! locale : English (United Kingdom) [en-gb]
//! author : Chris Gedrim : https://github.com/chrisgedrim

hooks.defineLocale('en-gb', {
    months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
    monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
    weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
    weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
    weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'in %s',
        past : '%s ago',
        s : 'a few seconds',
        m : 'a minute',
        mm : '%d minutes',
        h : 'an hour',
        hh : '%d hours',
        d : 'a day',
        dd : '%d days',
        M : 'a month',
        MM : '%d months',
        y : 'a year',
        yy : '%d years'
    },
    ordinalParse: /\d{1,2}(st|nd|rd|th)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (~~(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : English (Ireland) [en-ie]
//! author : Chris Cartlidge : https://github.com/chriscartlidge

hooks.defineLocale('en-ie', {
    months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
    monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
    weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
    weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
    weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD-MM-YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'in %s',
        past : '%s ago',
        s : 'a few seconds',
        m : 'a minute',
        mm : '%d minutes',
        h : 'an hour',
        hh : '%d hours',
        d : 'a day',
        dd : '%d days',
        M : 'a month',
        MM : '%d months',
        y : 'a year',
        yy : '%d years'
    },
    ordinalParse: /\d{1,2}(st|nd|rd|th)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (~~(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : English (New Zealand) [en-nz]
//! author : Luke McGregor : https://github.com/lukemcgregor

hooks.defineLocale('en-nz', {
    months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
    monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
    weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
    weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
    weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
    longDateFormat : {
        LT : 'h:mm A',
        LTS : 'h:mm:ss A',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY h:mm A',
        LLLL : 'dddd, D MMMM YYYY h:mm A'
    },
    calendar : {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'in %s',
        past : '%s ago',
        s : 'a few seconds',
        m : 'a minute',
        mm : '%d minutes',
        h : 'an hour',
        hh : '%d hours',
        d : 'a day',
        dd : '%d days',
        M : 'a month',
        MM : '%d months',
        y : 'a year',
        yy : '%d years'
    },
    ordinalParse: /\d{1,2}(st|nd|rd|th)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (~~(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Esperanto [eo]
//! author : Colin Dean : https://github.com/colindean
//! komento: Mi estas malcerta se mi korekte traktis akuzativojn en tiu traduko.
//!          Se ne, bonvolu korekti kaj avizi min por ke mi povas lerni!

hooks.defineLocale('eo', {
    months : 'januaro_februaro_marto_aprilo_majo_junio_julio_a?gusto_septembro_oktobro_novembro_decembro'.split('_'),
    monthsShort : 'jan_feb_mar_apr_maj_jun_jul_a?g_sep_okt_nov_dec'.split('_'),
    weekdays : 'Diman?o_Lundo_Mardo_Merkredo_?a?do_Vendredo_Sabato'.split('_'),
    weekdaysShort : 'Dim_Lun_Mard_Merk_?a?_Ven_Sab'.split('_'),
    weekdaysMin : 'Di_Lu_Ma_Me_?a_Ve_Sa'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'YYYY-MM-DD',
        LL : 'D[-an de] MMMM, YYYY',
        LLL : 'D[-an de] MMMM, YYYY HH:mm',
        LLLL : 'dddd, [la] D[-an de] MMMM, YYYY HH:mm'
    },
    meridiemParse: /[ap]\.t\.m/i,
    isPM: function (input) {
        return input.charAt(0).toLowerCase() === 'p';
    },
    meridiem : function (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'p.t.m.' : 'P.T.M.';
        } else {
            return isLower ? 'a.t.m.' : 'A.T.M.';
        }
    },
    calendar : {
        sameDay : '[Hodia? je] LT',
        nextDay : '[Morga? je] LT',
        nextWeek : 'dddd [je] LT',
        lastDay : '[Hiera? je] LT',
        lastWeek : '[pasinta] dddd [je] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'je %s',
        past : 'anta? %s',
        s : 'sekundoj',
        m : 'minuto',
        mm : '%d minutoj',
        h : 'horo',
        hh : '%d horoj',
        d : 'tago',//ne 'diurno', ?ar estas uzita por proksimumo
        dd : '%d tagoj',
        M : 'monato',
        MM : '%d monatoj',
        y : 'jaro',
        yy : '%d jaroj'
    },
    ordinalParse: /\d{1,2}a/,
    ordinal : '%da',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Spanish (Dominican Republic) [es-do]

var monthsShortDot = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split('_');
var monthsShort$1 = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_');

hooks.defineLocale('es-do', {
    months : 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split('_'),
    monthsShort : function (m, format) {
        if (/-MMM-/.test(format)) {
            return monthsShort$1[m.month()];
        } else {
            return monthsShortDot[m.month()];
        }
    },
    monthsParseExact : true,
    weekdays : 'domingo_lunes_martes_mi��rcoles_jueves_viernes_s��bado'.split('_'),
    weekdaysShort : 'dom._lun._mar._mi��._jue._vie._s��b.'.split('_'),
    weekdaysMin : 'do_lu_ma_mi_ju_vi_s��'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'h:mm A',
        LTS : 'h:mm:ss A',
        L : 'DD/MM/YYYY',
        LL : 'D [de] MMMM [de] YYYY',
        LLL : 'D [de] MMMM [de] YYYY h:mm A',
        LLLL : 'dddd, D [de] MMMM [de] YYYY h:mm A'
    },
    calendar : {
        sameDay : function () {
            return '[hoy a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        nextDay : function () {
            return '[ma?ana a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        nextWeek : function () {
            return 'dddd [a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        lastDay : function () {
            return '[ayer a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        lastWeek : function () {
            return '[el] dddd [pasado a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : 'en %s',
        past : 'hace %s',
        s : 'unos segundos',
        m : 'un minuto',
        mm : '%d minutos',
        h : 'una hora',
        hh : '%d horas',
        d : 'un d��a',
        dd : '%d d��as',
        M : 'un mes',
        MM : '%d meses',
        y : 'un a?o',
        yy : '%d a?os'
    },
    ordinalParse : /\d{1,2}o/,
    ordinal : '%do',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Spanish [es]
//! author : Julio Napur�� : https://github.com/julionc

var monthsShortDot$1 = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split('_');
var monthsShort$2 = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_');

hooks.defineLocale('es', {
    months : 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split('_'),
    monthsShort : function (m, format) {
        if (/-MMM-/.test(format)) {
            return monthsShort$2[m.month()];
        } else {
            return monthsShortDot$1[m.month()];
        }
    },
    monthsParseExact : true,
    weekdays : 'domingo_lunes_martes_mi��rcoles_jueves_viernes_s��bado'.split('_'),
    weekdaysShort : 'dom._lun._mar._mi��._jue._vie._s��b.'.split('_'),
    weekdaysMin : 'do_lu_ma_mi_ju_vi_s��'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D [de] MMMM [de] YYYY',
        LLL : 'D [de] MMMM [de] YYYY H:mm',
        LLLL : 'dddd, D [de] MMMM [de] YYYY H:mm'
    },
    calendar : {
        sameDay : function () {
            return '[hoy a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        nextDay : function () {
            return '[ma?ana a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        nextWeek : function () {
            return 'dddd [a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        lastDay : function () {
            return '[ayer a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        lastWeek : function () {
            return '[el] dddd [pasado a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : 'en %s',
        past : 'hace %s',
        s : 'unos segundos',
        m : 'un minuto',
        mm : '%d minutos',
        h : 'una hora',
        hh : '%d horas',
        d : 'un d��a',
        dd : '%d d��as',
        M : 'un mes',
        MM : '%d meses',
        y : 'un a?o',
        yy : '%d a?os'
    },
    ordinalParse : /\d{1,2}o/,
    ordinal : '%do',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Estonian [et]
//! author : Henry Kehlmann : https://github.com/madhenry
//! improvements : Illimar Tambek : https://github.com/ragulka

function processRelativeTime$2(number, withoutSuffix, key, isFuture) {
    var format = {
        's' : ['m?ne sekundi', 'm?ni sekund', 'paar sekundit'],
        'm' : ['��he minuti', '��ks minut'],
        'mm': [number + ' minuti', number + ' minutit'],
        'h' : ['��he tunni', 'tund aega', '��ks tund'],
        'hh': [number + ' tunni', number + ' tundi'],
        'd' : ['��he p?eva', '��ks p?ev'],
        'M' : ['kuu aja', 'kuu aega', '��ks kuu'],
        'MM': [number + ' kuu', number + ' kuud'],
        'y' : ['��he aasta', 'aasta', '��ks aasta'],
        'yy': [number + ' aasta', number + ' aastat']
    };
    if (withoutSuffix) {
        return format[key][2] ? format[key][2] : format[key][1];
    }
    return isFuture ? format[key][0] : format[key][1];
}

hooks.defineLocale('et', {
    months        : 'jaanuar_veebruar_m?rts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember'.split('_'),
    monthsShort   : 'jaan_veebr_m?rts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets'.split('_'),
    weekdays      : 'p��hap?ev_esmasp?ev_teisip?ev_kolmap?ev_neljap?ev_reede_laup?ev'.split('_'),
    weekdaysShort : 'P_E_T_K_N_R_L'.split('_'),
    weekdaysMin   : 'P_E_T_K_N_R_L'.split('_'),
    longDateFormat : {
        LT   : 'H:mm',
        LTS : 'H:mm:ss',
        L    : 'DD.MM.YYYY',
        LL   : 'D. MMMM YYYY',
        LLL  : 'D. MMMM YYYY H:mm',
        LLLL : 'dddd, D. MMMM YYYY H:mm'
    },
    calendar : {
        sameDay  : '[T?na,] LT',
        nextDay  : '[Homme,] LT',
        nextWeek : '[J?rgmine] dddd LT',
        lastDay  : '[Eile,] LT',
        lastWeek : '[Eelmine] dddd LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s p?rast',
        past   : '%s tagasi',
        s      : processRelativeTime$2,
        m      : processRelativeTime$2,
        mm     : processRelativeTime$2,
        h      : processRelativeTime$2,
        hh     : processRelativeTime$2,
        d      : processRelativeTime$2,
        dd     : '%d p?eva',
        M      : processRelativeTime$2,
        MM     : processRelativeTime$2,
        y      : processRelativeTime$2,
        yy     : processRelativeTime$2
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Basque [eu]
//! author : Eneko Illarramendi : https://github.com/eillarra

hooks.defineLocale('eu', {
    months : 'urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua'.split('_'),
    monthsShort : 'urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.'.split('_'),
    monthsParseExact : true,
    weekdays : 'igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata'.split('_'),
    weekdaysShort : 'ig._al._ar._az._og._ol._lr.'.split('_'),
    weekdaysMin : 'ig_al_ar_az_og_ol_lr'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'YYYY-MM-DD',
        LL : 'YYYY[ko] MMMM[ren] D[a]',
        LLL : 'YYYY[ko] MMMM[ren] D[a] HH:mm',
        LLLL : 'dddd, YYYY[ko] MMMM[ren] D[a] HH:mm',
        l : 'YYYY-M-D',
        ll : 'YYYY[ko] MMM D[a]',
        lll : 'YYYY[ko] MMM D[a] HH:mm',
        llll : 'ddd, YYYY[ko] MMM D[a] HH:mm'
    },
    calendar : {
        sameDay : '[gaur] LT[etan]',
        nextDay : '[bihar] LT[etan]',
        nextWeek : 'dddd LT[etan]',
        lastDay : '[atzo] LT[etan]',
        lastWeek : '[aurreko] dddd LT[etan]',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s barru',
        past : 'duela %s',
        s : 'segundo batzuk',
        m : 'minutu bat',
        mm : '%d minutu',
        h : 'ordu bat',
        hh : '%d ordu',
        d : 'egun bat',
        dd : '%d egun',
        M : 'hilabete bat',
        MM : '%d hilabete',
        y : 'urte bat',
        yy : '%d urte'
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Persian [fa]
//! author : Ebrahim Byagowi : https://github.com/ebraminio

var symbolMap$5 = {
    '1': '?',
    '2': '?',
    '3': '?',
    '4': '?',
    '5': '?',
    '6': '?',
    '7': '?',
    '8': '?',
    '9': '?',
    '0': '?'
};
var numberMap$4 = {
    '?': '1',
    '?': '2',
    '?': '3',
    '?': '4',
    '?': '5',
    '?': '6',
    '?': '7',
    '?': '8',
    '?': '9',
    '?': '0'
};

hooks.defineLocale('fa', {
    months : '??????_?????_????_?????_??_????_?????_???_???????_?????_??????_??????'.split('_'),
    monthsShort : '??????_?????_????_?????_??_????_?????_???_???????_?????_??????_??????'.split('_'),
    weekdays : '??\u200c????_??????_??\u200c????_????????_???\u200c????_????_????'.split('_'),
    weekdaysShort : '??\u200c????_??????_??\u200c????_????????_???\u200c????_????_????'.split('_'),
    weekdaysMin : '?_?_?_?_?_?_?'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    meridiemParse: /??? ?? ???|??? ?? ???/,
    isPM: function (input) {
        return /??? ?? ???/.test(input);
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 12) {
            return '??? ?? ???';
        } else {
            return '??? ?? ???';
        }
    },
    calendar : {
        sameDay : '[????? ????] LT',
        nextDay : '[???? ????] LT',
        nextWeek : 'dddd [????] LT',
        lastDay : '[????? ????] LT',
        lastWeek : 'dddd [???] [????] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '?? %s',
        past : '%s ???',
        s : '????? ?????',
        m : '?? ?????',
        mm : '%d ?????',
        h : '?? ????',
        hh : '%d ????',
        d : '?? ???',
        dd : '%d ???',
        M : '?? ???',
        MM : '%d ???',
        y : '?? ???',
        yy : '%d ???'
    },
    preparse: function (string) {
        return string.replace(/[?-?]/g, function (match) {
            return numberMap$4[match];
        }).replace(/?/g, ',');
    },
    postformat: function (string) {
        return string.replace(/\d/g, function (match) {
            return symbolMap$5[match];
        }).replace(/,/g, '?');
    },
    ordinalParse: /\d{1,2}?/,
    ordinal : '%d?',
    week : {
        dow : 6, // Saturday is the first day of the week.
        doy : 12 // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Finnish [fi]
//! author : Tarmo Aidantausta : https://github.com/bleadof

var numbersPast = 'nolla yksi kaksi kolme nelj? viisi kuusi seitsem?n kahdeksan yhdeks?n'.split(' ');
var numbersFuture = [
        'nolla', 'yhden', 'kahden', 'kolmen', 'nelj?n', 'viiden', 'kuuden',
        numbersPast[7], numbersPast[8], numbersPast[9]
    ];
function translate$2(number, withoutSuffix, key, isFuture) {
    var result = '';
    switch (key) {
        case 's':
            return isFuture ? 'muutaman sekunnin' : 'muutama sekunti';
        case 'm':
            return isFuture ? 'minuutin' : 'minuutti';
        case 'mm':
            result = isFuture ? 'minuutin' : 'minuuttia';
            break;
        case 'h':
            return isFuture ? 'tunnin' : 'tunti';
        case 'hh':
            result = isFuture ? 'tunnin' : 'tuntia';
            break;
        case 'd':
            return isFuture ? 'p?iv?n' : 'p?iv?';
        case 'dd':
            result = isFuture ? 'p?iv?n' : 'p?iv??';
            break;
        case 'M':
            return isFuture ? 'kuukauden' : 'kuukausi';
        case 'MM':
            result = isFuture ? 'kuukauden' : 'kuukautta';
            break;
        case 'y':
            return isFuture ? 'vuoden' : 'vuosi';
        case 'yy':
            result = isFuture ? 'vuoden' : 'vuotta';
            break;
    }
    result = verbalNumber(number, isFuture) + ' ' + result;
    return result;
}
function verbalNumber(number, isFuture) {
    return number < 10 ? (isFuture ? numbersFuture[number] : numbersPast[number]) : number;
}

hooks.defineLocale('fi', {
    months : 'tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kes?kuu_hein?kuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu'.split('_'),
    monthsShort : 'tammi_helmi_maalis_huhti_touko_kes?_hein?_elo_syys_loka_marras_joulu'.split('_'),
    weekdays : 'sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai'.split('_'),
    weekdaysShort : 'su_ma_ti_ke_to_pe_la'.split('_'),
    weekdaysMin : 'su_ma_ti_ke_to_pe_la'.split('_'),
    longDateFormat : {
        LT : 'HH.mm',
        LTS : 'HH.mm.ss',
        L : 'DD.MM.YYYY',
        LL : 'Do MMMM[ta] YYYY',
        LLL : 'Do MMMM[ta] YYYY, [klo] HH.mm',
        LLLL : 'dddd, Do MMMM[ta] YYYY, [klo] HH.mm',
        l : 'D.M.YYYY',
        ll : 'Do MMM YYYY',
        lll : 'Do MMM YYYY, [klo] HH.mm',
        llll : 'ddd, Do MMM YYYY, [klo] HH.mm'
    },
    calendar : {
        sameDay : '[t?n??n] [klo] LT',
        nextDay : '[huomenna] [klo] LT',
        nextWeek : 'dddd [klo] LT',
        lastDay : '[eilen] [klo] LT',
        lastWeek : '[viime] dddd[na] [klo] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s p??st?',
        past : '%s sitten',
        s : translate$2,
        m : translate$2,
        mm : translate$2,
        h : translate$2,
        hh : translate$2,
        d : translate$2,
        dd : translate$2,
        M : translate$2,
        MM : translate$2,
        y : translate$2,
        yy : translate$2
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Faroese [fo]
//! author : Ragnar Johannesen : https://github.com/ragnar123

hooks.defineLocale('fo', {
    months : 'januar_februar_mars_apr��l_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
    monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
    weekdays : 'sunnudagur_m��nadagur_tysdagur_mikudagur_h��sdagur_fr��ggjadagur_leygardagur'.split('_'),
    weekdaysShort : 'sun_m��n_tys_mik_h��s_fr��_ley'.split('_'),
    weekdaysMin : 'su_m��_ty_mi_h��_fr_le'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D. MMMM, YYYY HH:mm'
    },
    calendar : {
        sameDay : '[�� dag kl.] LT',
        nextDay : '[�� morgin kl.] LT',
        nextWeek : 'dddd [kl.] LT',
        lastDay : '[�� gj��r kl.] LT',
        lastWeek : '[s��estu] dddd [kl] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'um %s',
        past : '%s s��eani',
        s : 'f�� sekund',
        m : 'ein minutt',
        mm : '%d minuttir',
        h : 'ein t��mi',
        hh : '%d t��mar',
        d : 'ein dagur',
        dd : '%d dagar',
        M : 'ein m��naei',
        MM : '%d m��naeir',
        y : 'eitt ��r',
        yy : '%d ��r'
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : French (Canada) [fr-ca]
//! author : Jonathan Abourbih : https://github.com/jonbca

hooks.defineLocale('fr-ca', {
    months : 'janvier_f��vrier_mars_avril_mai_juin_juillet_ao?t_septembre_octobre_novembre_d��cembre'.split('_'),
    monthsShort : 'janv._f��vr._mars_avr._mai_juin_juil._ao?t_sept._oct._nov._d��c.'.split('_'),
    monthsParseExact : true,
    weekdays : 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
    weekdaysShort : 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
    weekdaysMin : 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'YYYY-MM-DD',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[Aujourd\'hui ��] LT',
        nextDay: '[Demain ��] LT',
        nextWeek: 'dddd [��] LT',
        lastDay: '[Hier ��] LT',
        lastWeek: 'dddd [dernier ��] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'dans %s',
        past : 'il y a %s',
        s : 'quelques secondes',
        m : 'une minute',
        mm : '%d minutes',
        h : 'une heure',
        hh : '%d heures',
        d : 'un jour',
        dd : '%d jours',
        M : 'un mois',
        MM : '%d mois',
        y : 'un an',
        yy : '%d ans'
    },
    ordinalParse: /\d{1,2}(er|e)/,
    ordinal : function (number) {
        return number + (number === 1 ? 'er' : 'e');
    }
});

//! moment.js locale configuration
//! locale : French (Switzerland) [fr-ch]
//! author : Gaspard Bucher : https://github.com/gaspard

hooks.defineLocale('fr-ch', {
    months : 'janvier_f��vrier_mars_avril_mai_juin_juillet_ao?t_septembre_octobre_novembre_d��cembre'.split('_'),
    monthsShort : 'janv._f��vr._mars_avr._mai_juin_juil._ao?t_sept._oct._nov._d��c.'.split('_'),
    monthsParseExact : true,
    weekdays : 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
    weekdaysShort : 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
    weekdaysMin : 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[Aujourd\'hui ��] LT',
        nextDay: '[Demain ��] LT',
        nextWeek: 'dddd [��] LT',
        lastDay: '[Hier ��] LT',
        lastWeek: 'dddd [dernier ��] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'dans %s',
        past : 'il y a %s',
        s : 'quelques secondes',
        m : 'une minute',
        mm : '%d minutes',
        h : 'une heure',
        hh : '%d heures',
        d : 'un jour',
        dd : '%d jours',
        M : 'un mois',
        MM : '%d mois',
        y : 'un an',
        yy : '%d ans'
    },
    ordinalParse: /\d{1,2}(er|e)/,
    ordinal : function (number) {
        return number + (number === 1 ? 'er' : 'e');
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : French [fr]
//! author : John Fischer : https://github.com/jfroffice

hooks.defineLocale('fr', {
    months : 'janvier_f��vrier_mars_avril_mai_juin_juillet_ao?t_septembre_octobre_novembre_d��cembre'.split('_'),
    monthsShort : 'janv._f��vr._mars_avr._mai_juin_juil._ao?t_sept._oct._nov._d��c.'.split('_'),
    monthsParseExact : true,
    weekdays : 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
    weekdaysShort : 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
    weekdaysMin : 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[Aujourd\'hui ��] LT',
        nextDay: '[Demain ��] LT',
        nextWeek: 'dddd [��] LT',
        lastDay: '[Hier ��] LT',
        lastWeek: 'dddd [dernier ��] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'dans %s',
        past : 'il y a %s',
        s : 'quelques secondes',
        m : 'une minute',
        mm : '%d minutes',
        h : 'une heure',
        hh : '%d heures',
        d : 'un jour',
        dd : '%d jours',
        M : 'un mois',
        MM : '%d mois',
        y : 'un an',
        yy : '%d ans'
    },
    ordinalParse: /\d{1,2}(er|)/,
    ordinal : function (number) {
        return number + (number === 1 ? 'er' : '');
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Frisian [fy]
//! author : Robin van der Vliet : https://github.com/robin0van0der0v

var monthsShortWithDots = 'jan._feb._mrt._apr._mai_jun._jul._aug._sep._okt._nov._des.'.split('_');
var monthsShortWithoutDots = 'jan_feb_mrt_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_');

hooks.defineLocale('fy', {
    months : 'jannewaris_febrewaris_maart_april_maaie_juny_july_augustus_septimber_oktober_novimber_desimber'.split('_'),
    monthsShort : function (m, format) {
        if (/-MMM-/.test(format)) {
            return monthsShortWithoutDots[m.month()];
        } else {
            return monthsShortWithDots[m.month()];
        }
    },
    monthsParseExact : true,
    weekdays : 'snein_moandei_tiisdei_woansdei_tongersdei_freed_sneon'.split('_'),
    weekdaysShort : 'si._mo._ti._wo._to._fr._so.'.split('_'),
    weekdaysMin : 'Si_Mo_Ti_Wo_To_Fr_So'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD-MM-YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[hjoed om] LT',
        nextDay: '[moarn om] LT',
        nextWeek: 'dddd [om] LT',
        lastDay: '[juster om] LT',
        lastWeek: '[?fr?ne] dddd [om] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'oer %s',
        past : '%s lyn',
        s : 'in pear sekonden',
        m : 'ien min��t',
        mm : '%d minuten',
        h : 'ien oere',
        hh : '%d oeren',
        d : 'ien dei',
        dd : '%d dagen',
        M : 'ien moanne',
        MM : '%d moannen',
        y : 'ien jier',
        yy : '%d jierren'
    },
    ordinalParse: /\d{1,2}(ste|de)/,
    ordinal : function (number) {
        return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Scottish Gaelic [gd]
//! author : Jon Ashdown : https://github.com/jonashdown

var months$5 = [
    'Am Faoilleach', 'An Gearran', 'Am M��rt', 'An Giblean', 'An C��itean', 'An t-��gmhios', 'An t-Iuchar', 'An L��nastal', 'An t-Sultain', 'An D��mhair', 'An t-Samhain', 'An D��bhlachd'
];

var monthsShort$3 = ['Faoi', 'Gear', 'M��rt', 'Gibl', 'C��it', '��gmh', 'Iuch', 'L��n', 'Sult', 'D��mh', 'Samh', 'D��bh'];

var weekdays$1 = ['Did��mhnaich', 'Diluain', 'Dim��irt', 'Diciadain', 'Diardaoin', 'Dihaoine', 'Disathairne'];

var weekdaysShort = ['Did', 'Dil', 'Dim', 'Dic', 'Dia', 'Dih', 'Dis'];

var weekdaysMin = ['D��', 'Lu', 'M��', 'Ci', 'Ar', 'Ha', 'Sa'];

hooks.defineLocale('gd', {
    months : months$5,
    monthsShort : monthsShort$3,
    monthsParseExact : true,
    weekdays : weekdays$1,
    weekdaysShort : weekdaysShort,
    weekdaysMin : weekdaysMin,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[An-diugh aig] LT',
        nextDay : '[A-m��ireach aig] LT',
        nextWeek : 'dddd [aig] LT',
        lastDay : '[An-d�� aig] LT',
        lastWeek : 'dddd [seo chaidh] [aig] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'ann an %s',
        past : 'bho chionn %s',
        s : 'beagan diogan',
        m : 'mionaid',
        mm : '%d mionaidean',
        h : 'uair',
        hh : '%d uairean',
        d : 'latha',
        dd : '%d latha',
        M : 'm��os',
        MM : '%d m��osan',
        y : 'bliadhna',
        yy : '%d bliadhna'
    },
    ordinalParse : /\d{1,2}(d|na|mh)/,
    ordinal : function (number) {
        var output = number === 1 ? 'd' : number % 10 === 2 ? 'na' : 'mh';
        return number + output;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Galician [gl]
//! author : Juan G. Hurtado : https://github.com/juanghurtado

hooks.defineLocale('gl', {
    months : 'xaneiro_febreiro_marzo_abril_maio_xu?o_xullo_agosto_setembro_outubro_novembro_decembro'.split('_'),
    monthsShort : 'xan._feb._mar._abr._mai._xu?._xul._ago._set._out._nov._dec.'.split('_'),
    monthsParseExact: true,
    weekdays : 'domingo_luns_martes_m��rcores_xoves_venres_s��bado'.split('_'),
    weekdaysShort : 'dom._lun._mar._m��r._xov._ven._s��b.'.split('_'),
    weekdaysMin : 'do_lu_ma_m��_xo_ve_s��'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D [de] MMMM [de] YYYY',
        LLL : 'D [de] MMMM [de] YYYY H:mm',
        LLLL : 'dddd, D [de] MMMM [de] YYYY H:mm'
    },
    calendar : {
        sameDay : function () {
            return '[hoxe ' + ((this.hours() !== 1) ? '��s' : '��') + '] LT';
        },
        nextDay : function () {
            return '[ma?�� ' + ((this.hours() !== 1) ? '��s' : '��') + '] LT';
        },
        nextWeek : function () {
            return 'dddd [' + ((this.hours() !== 1) ? '��s' : 'a') + '] LT';
        },
        lastDay : function () {
            return '[onte ' + ((this.hours() !== 1) ? '��' : 'a') + '] LT';
        },
        lastWeek : function () {
            return '[o] dddd [pasado ' + ((this.hours() !== 1) ? '��s' : 'a') + '] LT';
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : function (str) {
            if (str.indexOf('un') === 0) {
                return 'n' + str;
            }
            return 'en ' + str;
        },
        past : 'hai %s',
        s : 'uns segundos',
        m : 'un minuto',
        mm : '%d minutos',
        h : 'unha hora',
        hh : '%d horas',
        d : 'un d��a',
        dd : '%d d��as',
        M : 'un mes',
        MM : '%d meses',
        y : 'un ano',
        yy : '%d anos'
    },
    ordinalParse : /\d{1,2}o/,
    ordinal : '%do',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Hebrew [he]
//! author : Tomer Cohen : https://github.com/tomer
//! author : Moshe Simantov : https://github.com/DevelopmentIL
//! author : Tal Ater : https://github.com/TalAter

hooks.defineLocale('he', {
    months : '?????_??????_???_?????_???_????_????_??????_??????_???????_??????_?????'.split('_'),
    monthsShort : '????_????_???_????_???_????_????_????_????_????_????_????'.split('_'),
    weekdays : '?????_???_?????_?????_?????_????_???'.split('_'),
    weekdaysShort : '??_??_??_??_??_??_??'.split('_'),
    weekdaysMin : '?_?_?_?_?_?_?'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D [?]MMMM YYYY',
        LLL : 'D [?]MMMM YYYY HH:mm',
        LLLL : 'dddd, D [?]MMMM YYYY HH:mm',
        l : 'D/M/YYYY',
        ll : 'D MMM YYYY',
        lll : 'D MMM YYYY HH:mm',
        llll : 'ddd, D MMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[???? ??]LT',
        nextDay : '[??? ??]LT',
        nextWeek : 'dddd [????] LT',
        lastDay : '[????? ??]LT',
        lastWeek : '[????] dddd [?????? ????] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '???? %s',
        past : '???? %s',
        s : '???? ?????',
        m : '???',
        mm : '%d ????',
        h : '???',
        hh : function (number) {
            if (number === 2) {
                return '??????';
            }
            return number + ' ????';
        },
        d : '???',
        dd : function (number) {
            if (number === 2) {
                return '??????';
            }
            return number + ' ????';
        },
        M : '????',
        MM : function (number) {
            if (number === 2) {
                return '???????';
            }
            return number + ' ??????';
        },
        y : '???',
        yy : function (number) {
            if (number === 2) {
                return '??????';
            } else if (number % 10 === 0 && number !== 10) {
                return number + ' ???';
            }
            return number + ' ????';
        }
    },
    meridiemParse: /???"?|????"?|???? ???????|???? ???????|????? ????|?????|????/i,
    isPM : function (input) {
        return /^(???"?|???? ???????|????)$/.test(input);
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 5) {
            return '????? ????';
        } else if (hour < 10) {
            return '?????';
        } else if (hour < 12) {
            return isLower ? '????"?' : '???? ???????';
        } else if (hour < 18) {
            return isLower ? '???"?' : '???? ???????';
        } else {
            return '????';
        }
    }
});

//! moment.js locale configuration
//! locale : Hindi [hi]
//! author : Mayank Singhal : https://github.com/mayanksinghal

var symbolMap$6 = {
    '1': '?',
    '2': '?',
    '3': '?',
    '4': '?',
    '5': '?',
    '6': '?',
    '7': '?',
    '8': '?',
    '9': '?',
    '0': '?'
};
var numberMap$5 = {
    '?': '1',
    '?': '2',
    '?': '3',
    '?': '4',
    '?': '5',
    '?': '6',
    '?': '7',
    '?': '8',
    '?': '9',
    '?': '0'
};

hooks.defineLocale('hi', {
    months : '?????_??????_?????_??????_??_???_?????_?????_???????_???????_??????_???????'.split('_'),
    monthsShort : '??._???._?????_?????._??_???_???._??._???._?????._??._???.'.split('_'),
    monthsParseExact: true,
    weekdays : '??????_??????_???????_??????_???????_????????_??????'.split('_'),
    weekdaysShort : '???_???_????_???_????_?????_???'.split('_'),
    weekdaysMin : '?_??_??_??_??_??_?'.split('_'),
    longDateFormat : {
        LT : 'A h:mm ???',
        LTS : 'A h:mm:ss ???',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY, A h:mm ???',
        LLLL : 'dddd, D MMMM YYYY, A h:mm ???'
    },
    calendar : {
        sameDay : '[??] LT',
        nextDay : '[??] LT',
        nextWeek : 'dddd, LT',
        lastDay : '[??] LT',
        lastWeek : '[?????] dddd, LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s ???',
        past : '%s ????',
        s : '??? ?? ????',
        m : '?? ????',
        mm : '%d ????',
        h : '?? ????',
        hh : '%d ????',
        d : '?? ???',
        dd : '%d ???',
        M : '?? ?????',
        MM : '%d ?????',
        y : '?? ????',
        yy : '%d ????'
    },
    preparse: function (string) {
        return string.replace(/[??????????]/g, function (match) {
            return numberMap$5[match];
        });
    },
    postformat: function (string) {
        return string.replace(/\d/g, function (match) {
            return symbolMap$6[match];
        });
    },
    // Hindi notation for meridiems are quite fuzzy in practice. While there exists
    // a rigid notion of a 'Pahar' it is not used as rigidly in modern Hindi.
    meridiemParse: /???|????|?????|???/,
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '???') {
            return hour < 4 ? hour : hour + 12;
        } else if (meridiem === '????') {
            return hour;
        } else if (meridiem === '?????') {
            return hour >= 10 ? hour : hour + 12;
        } else if (meridiem === '???') {
            return hour + 12;
        }
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 4) {
            return '???';
        } else if (hour < 10) {
            return '????';
        } else if (hour < 17) {
            return '?????';
        } else if (hour < 20) {
            return '???';
        } else {
            return '???';
        }
    },
    week : {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Croatian [hr]
//! author : Bojan Markovi? : https://github.com/bmarkovic

function translate$3(number, withoutSuffix, key) {
    var result = number + ' ';
    switch (key) {
        case 'm':
            return withoutSuffix ? 'jedna minuta' : 'jedne minute';
        case 'mm':
            if (number === 1) {
                result += 'minuta';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'minute';
            } else {
                result += 'minuta';
            }
            return result;
        case 'h':
            return withoutSuffix ? 'jedan sat' : 'jednog sata';
        case 'hh':
            if (number === 1) {
                result += 'sat';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'sata';
            } else {
                result += 'sati';
            }
            return result;
        case 'dd':
            if (number === 1) {
                result += 'dan';
            } else {
                result += 'dana';
            }
            return result;
        case 'MM':
            if (number === 1) {
                result += 'mjesec';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'mjeseca';
            } else {
                result += 'mjeseci';
            }
            return result;
        case 'yy':
            if (number === 1) {
                result += 'godina';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'godine';
            } else {
                result += 'godina';
            }
            return result;
    }
}

hooks.defineLocale('hr', {
    months : {
        format: 'sije?nja_velja?e_o?ujka_travnja_svibnja_lipnja_srpnja_kolovoza_rujna_listopada_studenoga_prosinca'.split('_'),
        standalone: 'sije?anj_velja?a_o?ujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac'.split('_')
    },
    monthsShort : 'sij._velj._o?u._tra._svi._lip._srp._kol._ruj._lis._stu._pro.'.split('_'),
    monthsParseExact: true,
    weekdays : 'nedjelja_ponedjeljak_utorak_srijeda_?etvrtak_petak_subota'.split('_'),
    weekdaysShort : 'ned._pon._uto._sri._?et._pet._sub.'.split('_'),
    weekdaysMin : 'ne_po_ut_sr_?e_pe_su'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY H:mm',
        LLLL : 'dddd, D. MMMM YYYY H:mm'
    },
    calendar : {
        sameDay  : '[danas u] LT',
        nextDay  : '[sutra u] LT',
        nextWeek : function () {
            switch (this.day()) {
                case 0:
                    return '[u] [nedjelju] [u] LT';
                case 3:
                    return '[u] [srijedu] [u] LT';
                case 6:
                    return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[u] dddd [u] LT';
            }
        },
        lastDay  : '[ju?er u] LT',
        lastWeek : function () {
            switch (this.day()) {
                case 0:
                case 3:
                    return '[pro?lu] dddd [u] LT';
                case 6:
                    return '[pro?le] [subote] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[pro?li] dddd [u] LT';
            }
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : 'za %s',
        past   : 'prije %s',
        s      : 'par sekundi',
        m      : translate$3,
        mm     : translate$3,
        h      : translate$3,
        hh     : translate$3,
        d      : 'dan',
        dd     : translate$3,
        M      : 'mjesec',
        MM     : translate$3,
        y      : 'godinu',
        yy     : translate$3
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Hungarian [hu]
//! author : Adam Brunner : https://github.com/adambrunner

var weekEndings = 'vas��rnap h��tf?n kedden szerd��n cs��t?rt?k?n p��nteken szombaton'.split(' ');
function translate$4(number, withoutSuffix, key, isFuture) {
    var num = number,
        suffix;
    switch (key) {
        case 's':
            return (isFuture || withoutSuffix) ? 'n��h��ny m��sodperc' : 'n��h��ny m��sodperce';
        case 'm':
            return 'egy' + (isFuture || withoutSuffix ? ' perc' : ' perce');
        case 'mm':
            return num + (isFuture || withoutSuffix ? ' perc' : ' perce');
        case 'h':
            return 'egy' + (isFuture || withoutSuffix ? ' ��ra' : ' ��r��ja');
        case 'hh':
            return num + (isFuture || withoutSuffix ? ' ��ra' : ' ��r��ja');
        case 'd':
            return 'egy' + (isFuture || withoutSuffix ? ' nap' : ' napja');
        case 'dd':
            return num + (isFuture || withoutSuffix ? ' nap' : ' napja');
        case 'M':
            return 'egy' + (isFuture || withoutSuffix ? ' h��nap' : ' h��napja');
        case 'MM':
            return num + (isFuture || withoutSuffix ? ' h��nap' : ' h��napja');
        case 'y':
            return 'egy' + (isFuture || withoutSuffix ? ' ��v' : ' ��ve');
        case 'yy':
            return num + (isFuture || withoutSuffix ? ' ��v' : ' ��ve');
    }
    return '';
}
function week(isFuture) {
    return (isFuture ? '' : '[m��lt] ') + '[' + weekEndings[this.day()] + '] LT[-kor]';
}

hooks.defineLocale('hu', {
    months : 'janu��r_febru��r_m��rcius_��prilis_m��jus_j��nius_j��lius_augusztus_szeptember_okt��ber_november_december'.split('_'),
    monthsShort : 'jan_feb_m��rc_��pr_m��j_j��n_j��l_aug_szept_okt_nov_dec'.split('_'),
    weekdays : 'vas��rnap_h��tf?_kedd_szerda_cs��t?rt?k_p��ntek_szombat'.split('_'),
    weekdaysShort : 'vas_h��t_kedd_sze_cs��t_p��n_szo'.split('_'),
    weekdaysMin : 'v_h_k_sze_cs_p_szo'.split('_'),
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'YYYY.MM.DD.',
        LL : 'YYYY. MMMM D.',
        LLL : 'YYYY. MMMM D. H:mm',
        LLLL : 'YYYY. MMMM D., dddd H:mm'
    },
    meridiemParse: /de|du/i,
    isPM: function (input) {
        return input.charAt(1).toLowerCase() === 'u';
    },
    meridiem : function (hours, minutes, isLower) {
        if (hours < 12) {
            return isLower === true ? 'de' : 'DE';
        } else {
            return isLower === true ? 'du' : 'DU';
        }
    },
    calendar : {
        sameDay : '[ma] LT[-kor]',
        nextDay : '[holnap] LT[-kor]',
        nextWeek : function () {
            return week.call(this, true);
        },
        lastDay : '[tegnap] LT[-kor]',
        lastWeek : function () {
            return week.call(this, false);
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s m��lva',
        past : '%s',
        s : translate$4,
        m : translate$4,
        mm : translate$4,
        h : translate$4,
        hh : translate$4,
        d : translate$4,
        dd : translate$4,
        M : translate$4,
        MM : translate$4,
        y : translate$4,
        yy : translate$4
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Armenian [hy-am]
//! author : Armendarabyan : https://github.com/armendarabyan

hooks.defineLocale('hy-am', {
    months : {
        format: '????????_????????_?????_??????_??????_???????_???????_????????_??????????_??????????_?????????_??????????'.split('_'),
        standalone: '???????_???????_????_?????_?????_??????_??????_???????_?????????_?????????_????????_?????????'.split('_')
    },
    monthsShort : '???_???_???_???_???_???_???_???_???_???_???_???'.split('_'),
    weekdays : '??????_??????????_?????????_??????????_?????????_??????_?????'.split('_'),
    weekdaysShort : '???_???_???_???_???_????_???'.split('_'),
    weekdaysMin : '???_???_???_???_???_????_???'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY ?.',
        LLL : 'D MMMM YYYY ?., HH:mm',
        LLLL : 'dddd, D MMMM YYYY ?., HH:mm'
    },
    calendar : {
        sameDay: '[?????] LT',
        nextDay: '[????] LT',
        lastDay: '[????] LT',
        nextWeek: function () {
            return 'dddd [??? ????] LT';
        },
        lastWeek: function () {
            return '[?????] dddd [??? ????] LT';
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : '%s ????',
        past : '%s ????',
        s : '?? ???? ????????',
        m : '????',
        mm : '%d ????',
        h : '???',
        hh : '%d ???',
        d : '??',
        dd : '%d ??',
        M : '????',
        MM : '%d ????',
        y : '????',
        yy : '%d ????'
    },
    meridiemParse: /???????|????????|???????|????????/,
    isPM: function (input) {
        return /^(???????|????????)$/.test(input);
    },
    meridiem : function (hour) {
        if (hour < 4) {
            return '???????';
        } else if (hour < 12) {
            return '????????';
        } else if (hour < 17) {
            return '???????';
        } else {
            return '????????';
        }
    },
    ordinalParse: /\d{1,2}|\d{1,2}-(??|??)/,
    ordinal: function (number, period) {
        switch (period) {
            case 'DDD':
            case 'w':
            case 'W':
            case 'DDDo':
                if (number === 1) {
                    return number + '-??';
                }
                return number + '-??';
            default:
                return number;
        }
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Indonesian [id]
//! author : Mohammad Satrio Utomo : https://github.com/tyok
//! reference: http://id.wikisource.org/wiki/Pedoman_Umum_Ejaan_Bahasa_Indonesia_yang_Disempurnakan

hooks.defineLocale('id', {
    months : 'Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember'.split('_'),
    monthsShort : 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nov_Des'.split('_'),
    weekdays : 'Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu'.split('_'),
    weekdaysShort : 'Min_Sen_Sel_Rab_Kam_Jum_Sab'.split('_'),
    weekdaysMin : 'Mg_Sn_Sl_Rb_Km_Jm_Sb'.split('_'),
    longDateFormat : {
        LT : 'HH.mm',
        LTS : 'HH.mm.ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY [pukul] HH.mm',
        LLLL : 'dddd, D MMMM YYYY [pukul] HH.mm'
    },
    meridiemParse: /pagi|siang|sore|malam/,
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === 'pagi') {
            return hour;
        } else if (meridiem === 'siang') {
            return hour >= 11 ? hour : hour + 12;
        } else if (meridiem === 'sore' || meridiem === 'malam') {
            return hour + 12;
        }
    },
    meridiem : function (hours, minutes, isLower) {
        if (hours < 11) {
            return 'pagi';
        } else if (hours < 15) {
            return 'siang';
        } else if (hours < 19) {
            return 'sore';
        } else {
            return 'malam';
        }
    },
    calendar : {
        sameDay : '[Hari ini pukul] LT',
        nextDay : '[Besok pukul] LT',
        nextWeek : 'dddd [pukul] LT',
        lastDay : '[Kemarin pukul] LT',
        lastWeek : 'dddd [lalu pukul] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'dalam %s',
        past : '%s yang lalu',
        s : 'beberapa detik',
        m : 'semenit',
        mm : '%d menit',
        h : 'sejam',
        hh : '%d jam',
        d : 'sehari',
        dd : '%d hari',
        M : 'sebulan',
        MM : '%d bulan',
        y : 'setahun',
        yy : '%d tahun'
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Icelandic [is]
//! author : Hinrik ?rn Siguresson : https://github.com/hinrik

function plural$2(n) {
    if (n % 100 === 11) {
        return true;
    } else if (n % 10 === 1) {
        return false;
    }
    return true;
}
function translate$5(number, withoutSuffix, key, isFuture) {
    var result = number + ' ';
    switch (key) {
        case 's':
            return withoutSuffix || isFuture ? 'nokkrar sek��ndur' : 'nokkrum sek��ndum';
        case 'm':
            return withoutSuffix ? 'm��n��ta' : 'm��n��tu';
        case 'mm':
            if (plural$2(number)) {
                return result + (withoutSuffix || isFuture ? 'm��n��tur' : 'm��n��tum');
            } else if (withoutSuffix) {
                return result + 'm��n��ta';
            }
            return result + 'm��n��tu';
        case 'hh':
            if (plural$2(number)) {
                return result + (withoutSuffix || isFuture ? 'klukkustundir' : 'klukkustundum');
            }
            return result + 'klukkustund';
        case 'd':
            if (withoutSuffix) {
                return 'dagur';
            }
            return isFuture ? 'dag' : 'degi';
        case 'dd':
            if (plural$2(number)) {
                if (withoutSuffix) {
                    return result + 'dagar';
                }
                return result + (isFuture ? 'daga' : 'd?gum');
            } else if (withoutSuffix) {
                return result + 'dagur';
            }
            return result + (isFuture ? 'dag' : 'degi');
        case 'M':
            if (withoutSuffix) {
                return 'm��nueur';
            }
            return isFuture ? 'm��nue' : 'm��nuei';
        case 'MM':
            if (plural$2(number)) {
                if (withoutSuffix) {
                    return result + 'm��nueir';
                }
                return result + (isFuture ? 'm��nuei' : 'm��nueum');
            } else if (withoutSuffix) {
                return result + 'm��nueur';
            }
            return result + (isFuture ? 'm��nue' : 'm��nuei');
        case 'y':
            return withoutSuffix || isFuture ? '��r' : '��ri';
        case 'yy':
            if (plural$2(number)) {
                return result + (withoutSuffix || isFuture ? '��r' : '��rum');
            }
            return result + (withoutSuffix || isFuture ? '��r' : '��ri');
    }
}

hooks.defineLocale('is', {
    months : 'jan��ar_febr��ar_mars_apr��l_ma��_j��n��_j��l��_��g��st_september_okt��ber_n��vember_desember'.split('_'),
    monthsShort : 'jan_feb_mar_apr_ma��_j��n_j��l_��g��_sep_okt_n��v_des'.split('_'),
    weekdays : 'sunnudagur_m��nudagur_triejudagur_mievikudagur_fimmtudagur_f?studagur_laugardagur'.split('_'),
    weekdaysShort : 'sun_m��n_tri_mie_fim_f?s_lau'.split('_'),
    weekdaysMin : 'Su_M��_Tr_Mi_Fi_F?_La'.split('_'),
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY [kl.] H:mm',
        LLLL : 'dddd, D. MMMM YYYY [kl.] H:mm'
    },
    calendar : {
        sameDay : '[�� dag kl.] LT',
        nextDay : '[�� morgun kl.] LT',
        nextWeek : 'dddd [kl.] LT',
        lastDay : '[�� g?r kl.] LT',
        lastWeek : '[s��easta] dddd [kl.] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'eftir %s',
        past : 'fyrir %s s��ean',
        s : translate$5,
        m : translate$5,
        mm : translate$5,
        h : 'klukkustund',
        hh : translate$5,
        d : translate$5,
        dd : translate$5,
        M : translate$5,
        MM : translate$5,
        y : translate$5,
        yy : translate$5
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Italian [it]
//! author : Lorenzo : https://github.com/aliem
//! author: Mattia Larentis: https://github.com/nostalgiaz

hooks.defineLocale('it', {
    months : 'gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre'.split('_'),
    monthsShort : 'gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic'.split('_'),
    weekdays : 'Domenica_Luned��_Marted��_Mercoled��_Gioved��_Venerd��_Sabato'.split('_'),
    weekdaysShort : 'Dom_Lun_Mar_Mer_Gio_Ven_Sab'.split('_'),
    weekdaysMin : 'Do_Lu_Ma_Me_Gi_Ve_Sa'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[Oggi alle] LT',
        nextDay: '[Domani alle] LT',
        nextWeek: 'dddd [alle] LT',
        lastDay: '[Ieri alle] LT',
        lastWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[la scorsa] dddd [alle] LT';
                default:
                    return '[lo scorso] dddd [alle] LT';
            }
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : function (s) {
            return ((/^[0-9].+$/).test(s) ? 'tra' : 'in') + ' ' + s;
        },
        past : '%s fa',
        s : 'alcuni secondi',
        m : 'un minuto',
        mm : '%d minuti',
        h : 'un\'ora',
        hh : '%d ore',
        d : 'un giorno',
        dd : '%d giorni',
        M : 'un mese',
        MM : '%d mesi',
        y : 'un anno',
        yy : '%d anni'
    },
    ordinalParse : /\d{1,2}o/,
    ordinal: '%do',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Japanese [ja]
//! author : LI Long : https://github.com/baryon

hooks.defineLocale('ja', {
    months : '1��_2��_3��_4��_5��_6��_7��_8��_9��_10��_11��_12��'.split('_'),
    monthsShort : '1��_2��_3��_4��_5��_6��_7��_8��_9��_10��_11��_12��'.split('_'),
    weekdays : '������_������_������_ˮ����_ľ����_������_������'.split('_'),
    weekdaysShort : '��_��_��_ˮ_ľ_��_��'.split('_'),
    weekdaysMin : '��_��_��_ˮ_ľ_��_��'.split('_'),
    longDateFormat : {
        LT : 'Ah�rm��',
        LTS : 'Ah�rm��s��',
        L : 'YYYY/MM/DD',
        LL : 'YYYY��M��D��',
        LLL : 'YYYY��M��D��Ah�rm��',
        LLLL : 'YYYY��M��D��Ah�rm�� dddd'
    },
    meridiemParse: /��ǰ|����/i,
    isPM : function (input) {
        return input === '����';
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 12) {
            return '��ǰ';
        } else {
            return '����';
        }
    },
    calendar : {
        sameDay : '[����] LT',
        nextDay : '[����] LT',
        nextWeek : '[���L]dddd LT',
        lastDay : '[����] LT',
        lastWeek : '[ǰ�L]dddd LT',
        sameElse : 'L'
    },
    ordinalParse : /\d{1,2}��/,
    ordinal : function (number, period) {
        switch (period) {
            case 'd':
            case 'D':
            case 'DDD':
                return number + '��';
            default:
                return number;
        }
    },
    relativeTime : {
        future : '%s��',
        past : '%sǰ',
        s : '����',
        m : '1��',
        mm : '%d��',
        h : '1�r�g',
        hh : '%d�r�g',
        d : '1��',
        dd : '%d��',
        M : '1����',
        MM : '%d����',
        y : '1��',
        yy : '%d��'
    }
});

//! moment.js locale configuration
//! locale : Javanese [jv]
//! author : Rony Lantip : https://github.com/lantip
//! reference: http://jv.wikipedia.org/wiki/Basa_Jawa

hooks.defineLocale('jv', {
    months : 'Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_Nopember_Desember'.split('_'),
    monthsShort : 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nop_Des'.split('_'),
    weekdays : 'Minggu_Senen_Seloso_Rebu_Kemis_Jemuwah_Septu'.split('_'),
    weekdaysShort : 'Min_Sen_Sel_Reb_Kem_Jem_Sep'.split('_'),
    weekdaysMin : 'Mg_Sn_Sl_Rb_Km_Jm_Sp'.split('_'),
    longDateFormat : {
        LT : 'HH.mm',
        LTS : 'HH.mm.ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY [pukul] HH.mm',
        LLLL : 'dddd, D MMMM YYYY [pukul] HH.mm'
    },
    meridiemParse: /enjing|siyang|sonten|ndalu/,
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === 'enjing') {
            return hour;
        } else if (meridiem === 'siyang') {
            return hour >= 11 ? hour : hour + 12;
        } else if (meridiem === 'sonten' || meridiem === 'ndalu') {
            return hour + 12;
        }
    },
    meridiem : function (hours, minutes, isLower) {
        if (hours < 11) {
            return 'enjing';
        } else if (hours < 15) {
            return 'siyang';
        } else if (hours < 19) {
            return 'sonten';
        } else {
            return 'ndalu';
        }
    },
    calendar : {
        sameDay : '[Dinten puniko pukul] LT',
        nextDay : '[Mbenjang pukul] LT',
        nextWeek : 'dddd [pukul] LT',
        lastDay : '[Kala wingi pukul] LT',
        lastWeek : 'dddd [kepengker pukul] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'wonten ing %s',
        past : '%s ingkang kepengker',
        s : 'sawetawis detik',
        m : 'setunggal menit',
        mm : '%d menit',
        h : 'setunggal jam',
        hh : '%d jam',
        d : 'sedinten',
        dd : '%d dinten',
        M : 'sewulan',
        MM : '%d wulan',
        y : 'setaun',
        yy : '%d taun'
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Georgian [ka]
//! author : Irakli Janiashvili : https://github.com/irakli-janiashvili

hooks.defineLocale('ka', {
    months : {
        standalone: '???????_?????????_?????_??????_?????_??????_??????_???????_??????????_?????????_????????_?????????'.split('_'),
        format: '???????_?????????_?????_???????_?????_??????_??????_???????_??????????_?????????_????????_?????????'.split('_')
    },
    monthsShort : '???_???_???_???_???_???_???_???_???_???_???_???'.split('_'),
    weekdays : {
        standalone: '?????_????????_?????????_?????????_?????????_?????????_??????'.split('_'),
        format: '??????_????????_?????????_?????????_?????????_?????????_??????'.split('_'),
        isFormat: /(????|??????)/
    },
    weekdaysShort : '???_???_???_???_???_???_???'.split('_'),
    weekdaysMin : '??_??_??_??_??_??_??'.split('_'),
    longDateFormat : {
        LT : 'h:mm A',
        LTS : 'h:mm:ss A',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY h:mm A',
        LLLL : 'dddd, D MMMM YYYY h:mm A'
    },
    calendar : {
        sameDay : '[????] LT[-??]',
        nextDay : '[????] LT[-??]',
        lastDay : '[?????] LT[-??]',
        nextWeek : '[??????] dddd LT[-??]',
        lastWeek : '[????] dddd LT-??',
        sameElse : 'L'
    },
    relativeTime : {
        future : function (s) {
            return (/(????|????|?????|????)/).test(s) ?
                s.replace(/?$/, '??') :
                s + '??';
        },
        past : function (s) {
            if ((/(????|????|?????|???|???)/).test(s)) {
                return s.replace(/(?|?)$/, '?? ???');
            }
            if ((/????/).test(s)) {
                return s.replace(/????$/, '???? ???');
            }
        },
        s : '????????? ????',
        m : '????',
        mm : '%d ????',
        h : '?????',
        hh : '%d ?????',
        d : '???',
        dd : '%d ???',
        M : '???',
        MM : '%d ???',
        y : '????',
        yy : '%d ????'
    },
    ordinalParse: /0|1-??|??-\d{1,2}|\d{1,2}-?/,
    ordinal : function (number) {
        if (number === 0) {
            return number;
        }
        if (number === 1) {
            return number + '-??';
        }
        if ((number < 20) || (number <= 100 && (number % 20 === 0)) || (number % 100 === 0)) {
            return '??-' + number;
        }
        return number + '-?';
    },
    week : {
        dow : 1,
        doy : 7
    }
});

//! moment.js locale configuration
//! locale : Kazakh [kk]
//! authors : Nurlan Rakhimzhanov : https://github.com/nurlan

var suffixes$1 = {
    0: '-��?',
    1: '-��?',
    2: '-��?',
    3: '-��?',
    4: '-��?',
    5: '-��?',
    6: '-���',
    7: '-��?',
    8: '-��?',
    9: '-���',
    10: '-���',
    20: '-���',
    30: '-���',
    40: '-���',
    50: '-��?',
    60: '-���',
    70: '-��?',
    80: '-��?',
    90: '-���',
    100: '-��?'
};

hooks.defineLocale('kk', {
    months : '?��?��ѧ�_��?��ѧ�_�ߧѧ����_��?��?��_�ާѧާ��_�ާѧ����_��?�ݧէ�_��ѧާ��_?����?�֧ۧ�_?�ѧ٧ѧ�_?�ѧ�ѧ��_�ا֧ݧ��?��ѧ�'.split('_'),
    monthsShort : '?��?_��?��_�ߧѧ�_��?��_�ާѧ�_�ާѧ�_��?��_��ѧ�_?���_?�ѧ�_?�ѧ�_�ا֧�'.split('_'),
    weekdays : '�ا֧ܧ�֧ߧ�?_��?�ۧ�֧ߧ�?_��֧ۧ�֧ߧ�?_��?���֧ߧ�?_�ҧ֧ۧ�֧ߧ�?_��?�ާ�_��֧ߧ�?'.split('_'),
    weekdaysShort : '�ا֧�_��?��_��֧�_��?��_�ҧ֧�_��?��_��֧�'.split('_'),
    weekdaysMin : '�ا�_�է�_���_���_�ҧ�_�ا�_���'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[��?��?�� ���?�ѧ�] LT',
        nextDay : '[������? ���?�ѧ�] LT',
        nextWeek : 'dddd [���?�ѧ�] LT',
        lastDay : '[���֧�� ���?�ѧ�] LT',
        lastWeek : '[?��ܧ֧� �ѧ��ѧߧ�?] dddd [���?�ѧ�] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s ?��?�ߧէ�',
        past : '%s ��?����',
        s : '��?��ߧ֧�� ��֧ܧ�ߧ�',
        m : '��?�� �ާڧߧ��',
        mm : '%d �ާڧߧ��',
        h : '��?�� ���?�ѧ�',
        hh : '%d ���?�ѧ�',
        d : '��?�� ��?��',
        dd : '%d ��?��',
        M : '��?�� �ѧ�',
        MM : '%d �ѧ�',
        y : '��?�� �ا��',
        yy : '%d �ا��'
    },
    ordinalParse: /\d{1,2}-(��?|���)/,
    ordinal : function (number) {
        var a = number % 10,
            b = number >= 100 ? 100 : null;
        return number + (suffixes$1[number] || suffixes$1[a] || suffixes$1[b]);
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Cambodian [km]
//! author : Kruy Vanna : https://github.com/kruyvanna

hooks.defineLocale('km', {
    months: '????_??????_????_????_????_??????_??????_????_?????_????_????????_????'.split('_'),
    monthsShort: '????_??????_????_????_????_??????_??????_????_?????_????_????????_????'.split('_'),
    weekdays: '???????_?????_??????_???_??????????_?????_????'.split('_'),
    weekdaysShort: '???????_?????_??????_???_??????????_?????_????'.split('_'),
    weekdaysMin: '???????_?????_??????_???_??????????_?????_????'.split('_'),
    longDateFormat: {
        LT: 'HH:mm',
        LTS : 'HH:mm:ss',
        L: 'DD/MM/YYYY',
        LL: 'D MMMM YYYY',
        LLL: 'D MMMM YYYY HH:mm',
        LLLL: 'dddd, D MMMM YYYY HH:mm'
    },
    calendar: {
        sameDay: '[??????? ????] LT',
        nextDay: '[????? ????] LT',
        nextWeek: 'dddd [????] LT',
        lastDay: '[???????? ????] LT',
        lastWeek: 'dddd [??????????] [????] LT',
        sameElse: 'L'
    },
    relativeTime: {
        future: '%s???',
        past: '%s???',
        s: '??????????????',
        m: '???????',
        mm: '%d ????',
        h: '???????',
        hh: '%d ????',
        d: '???????',
        dd: '%d ????',
        M: '?????',
        MM: '%d ??',
        y: '????????',
        yy: '%d ?????'
    },
    week: {
        dow: 1, // Monday is the first day of the week.
        doy: 4 // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Korean [ko]
//! author : Kyungwook, Park : https://github.com/kyungw00k
//! author : Jeeeyul Lee <jeeeyul@gmail.com>

hooks.defineLocale('ko', {
    months : '1?_2?_3?_4?_5?_6?_7?_8?_9?_10?_11?_12?'.split('_'),
    monthsShort : '1?_2?_3?_4?_5?_6?_7?_8?_9?_10?_11?_12?'.split('_'),
    weekdays : '???_???_???_???_???_???_???'.split('_'),
    weekdaysShort : '?_?_?_?_?_?_?'.split('_'),
    weekdaysMin : '?_?_?_?_?_?_?'.split('_'),
    longDateFormat : {
        LT : 'A h? m?',
        LTS : 'A h? m? s?',
        L : 'YYYY.MM.DD',
        LL : 'YYYY? MMMM D?',
        LLL : 'YYYY? MMMM D? A h? m?',
        LLLL : 'YYYY? MMMM D? dddd A h? m?'
    },
    calendar : {
        sameDay : '?? LT',
        nextDay : '?? LT',
        nextWeek : 'dddd LT',
        lastDay : '?? LT',
        lastWeek : '??? dddd LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s ?',
        past : '%s ?',
        s : '? ?',
        ss : '%d?',
        m : '??',
        mm : '%d?',
        h : '? ??',
        hh : '%d??',
        d : '??',
        dd : '%d?',
        M : '? ?',
        MM : '%d?',
        y : '? ?',
        yy : '%d?'
    },
    ordinalParse : /\d{1,2}?/,
    ordinal : '%d?',
    meridiemParse : /??|??/,
    isPM : function (token) {
        return token === '??';
    },
    meridiem : function (hour, minute, isUpper) {
        return hour < 12 ? '??' : '??';
    }
});

//! moment.js locale configuration
//! locale : Kyrgyz [ky]
//! author : Chyngyz Arystan uulu : https://github.com/chyngyz


var suffixes$2 = {
    0: '-��?',
    1: '-���',
    2: '-���',
    3: '-��?',
    4: '-��?',
    5: '-���',
    6: '-���',
    7: '-���',
    8: '-���',
    9: '-���',
    10: '-���',
    20: '-���',
    30: '-���',
    40: '-���',
    50: '-��?',
    60: '-���',
    70: '-���',
    80: '-���',
    90: '-���',
    100: '-��?'
};

hooks.defineLocale('ky', {
    months : '��ߧӧѧ��_��֧ӧ�ѧݧ�_�ާѧ��_�ѧ��֧ݧ�_�ާѧ�_�ڧ�ߧ�_�ڧ�ݧ�_�ѧӧԧ���_��֧ߧ��ҧ��_��ܧ��ҧ��_�ߧ��ҧ��_�է֧ܧѧҧ��'.split('_'),
    monthsShort : '��ߧ�_��֧�_�ާѧ��_�ѧ��_�ާѧ�_�ڧ�ߧ�_�ڧ�ݧ�_�ѧӧ�_��֧�_��ܧ�_�ߧ��_�է֧�'.split('_'),
    weekdays : '���֧ܧ�֧ާҧ�_��?�ۧ�?�ާ�?_���֧ۧ�֧ާҧ�_���ѧ��֧ާҧ�_���֧ۧ�֧ާҧ�_����ާ�_����֧ާҧ�'.split('_'),
    weekdaysShort : '���֧�_��?��_���֧�_���ѧ�_���֧�_�����_�����'.split('_'),
    weekdaysMin : '����_����_����_����_����_����_����'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[��?��?�� ��ѧѧ�] LT',
        nextDay : '[������? ��ѧѧ�] LT',
        nextWeek : 'dddd [��ѧѧ�] LT',
        lastDay : '[���֧�� ��ѧѧ�] LT',
        lastWeek : '[?��ܧ֧� �ѧ��ѧߧ��] dddd [��?��?] [��ѧѧ�] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s �ڧ�ڧߧէ�',
        past : '%s �ާ����',
        s : '�ҧڧ�ߧ֧�� ��֧ܧ�ߧ�',
        m : '�ҧڧ� ��?��?��',
        mm : '%d ��?��?��',
        h : '�ҧڧ� ��ѧѧ�',
        hh : '%d ��ѧѧ�',
        d : '�ҧڧ� ��?��',
        dd : '%d ��?��',
        M : '�ҧڧ� �ѧ�',
        MM : '%d �ѧ�',
        y : '�ҧڧ� �ا��',
        yy : '%d �ا��'
    },
    ordinalParse: /\d{1,2}-(���|���|��?|���)/,
    ordinal : function (number) {
        var a = number % 10,
            b = number >= 100 ? 100 : null;
        return number + (suffixes$2[number] || suffixes$2[a] || suffixes$2[b]);
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Luxembourgish [lb]
//! author : mweimerskirch : https://github.com/mweimerskirch
//! author : David Raison : https://github.com/kwisatz

function processRelativeTime$3(number, withoutSuffix, key, isFuture) {
    var format = {
        'm': ['eng Minutt', 'enger Minutt'],
        'h': ['eng Stonn', 'enger Stonn'],
        'd': ['een Dag', 'engem Dag'],
        'M': ['ee Mount', 'engem Mount'],
        'y': ['ee Joer', 'engem Joer']
    };
    return withoutSuffix ? format[key][0] : format[key][1];
}
function processFutureTime(string) {
    var number = string.substr(0, string.indexOf(' '));
    if (eifelerRegelAppliesToNumber(number)) {
        return 'a ' + string;
    }
    return 'an ' + string;
}
function processPastTime(string) {
    var number = string.substr(0, string.indexOf(' '));
    if (eifelerRegelAppliesToNumber(number)) {
        return 'viru ' + string;
    }
    return 'virun ' + string;
}
/**
 * Returns true if the word before the given number loses the '-n' ending.
 * e.g. 'an 10 Deeg' but 'a 5 Deeg'
 *
 * @param number {integer}
 * @returns {boolean}
 */
function eifelerRegelAppliesToNumber(number) {
    number = parseInt(number, 10);
    if (isNaN(number)) {
        return false;
    }
    if (number < 0) {
        // Negative Number --> always true
        return true;
    } else if (number < 10) {
        // Only 1 digit
        if (4 <= number && number <= 7) {
            return true;
        }
        return false;
    } else if (number < 100) {
        // 2 digits
        var lastDigit = number % 10, firstDigit = number / 10;
        if (lastDigit === 0) {
            return eifelerRegelAppliesToNumber(firstDigit);
        }
        return eifelerRegelAppliesToNumber(lastDigit);
    } else if (number < 10000) {
        // 3 or 4 digits --> recursively check first digit
        while (number >= 10) {
            number = number / 10;
        }
        return eifelerRegelAppliesToNumber(number);
    } else {
        // Anything larger than 4 digits: recursively check first n-3 digits
        number = number / 1000;
        return eifelerRegelAppliesToNumber(number);
    }
}

hooks.defineLocale('lb', {
    months: 'Januar_Februar_M?erz_Abr?ll_Mee_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
    monthsShort: 'Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
    monthsParseExact : true,
    weekdays: 'Sonndeg_M��indeg_D?nschdeg_M?ttwoch_Donneschdeg_Freideg_Samschdeg'.split('_'),
    weekdaysShort: 'So._M��._D?._M?._Do._Fr._Sa.'.split('_'),
    weekdaysMin: 'So_M��_D?_M?_Do_Fr_Sa'.split('_'),
    weekdaysParseExact : true,
    longDateFormat: {
        LT: 'H:mm [Auer]',
        LTS: 'H:mm:ss [Auer]',
        L: 'DD.MM.YYYY',
        LL: 'D. MMMM YYYY',
        LLL: 'D. MMMM YYYY H:mm [Auer]',
        LLLL: 'dddd, D. MMMM YYYY H:mm [Auer]'
    },
    calendar: {
        sameDay: '[Haut um] LT',
        sameElse: 'L',
        nextDay: '[Muer um] LT',
        nextWeek: 'dddd [um] LT',
        lastDay: '[G?schter um] LT',
        lastWeek: function () {
            // Different date string for 'D?nschdeg' (Tuesday) and 'Donneschdeg' (Thursday) due to phonological rule
            switch (this.day()) {
                case 2:
                case 4:
                    return '[Leschten] dddd [um] LT';
                default:
                    return '[Leschte] dddd [um] LT';
            }
        }
    },
    relativeTime : {
        future : processFutureTime,
        past : processPastTime,
        s : 'e puer Sekonnen',
        m : processRelativeTime$3,
        mm : '%d Minutten',
        h : processRelativeTime$3,
        hh : '%d Stonnen',
        d : processRelativeTime$3,
        dd : '%d Deeg',
        M : processRelativeTime$3,
        MM : '%d M��int',
        y : processRelativeTime$3,
        yy : '%d Joer'
    },
    ordinalParse: /\d{1,2}\./,
    ordinal: '%d.',
    week: {
        dow: 1, // Monday is the first day of the week.
        doy: 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Lao [lo]
//! author : Ryan Hart : https://github.com/ryanhart2

hooks.defineLocale('lo', {
    months : '??????_?????_????_????_???????_??????_???????_?????_?????_????_?????_?????'.split('_'),
    monthsShort : '??????_?????_????_????_???????_??????_???????_?????_?????_????_?????_?????'.split('_'),
    weekdays : '?????_???_??????_???_?????_???_????'.split('_'),
    weekdaysShort : '???_???_??????_???_?????_???_????'.split('_'),
    weekdaysMin : '?_?_??_?_??_??_?'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : '???dddd D MMMM YYYY HH:mm'
    },
    meridiemParse: /????????|??????/,
    isPM: function (input) {
        return input === '??????';
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 12) {
            return '????????';
        } else {
            return '??????';
        }
    },
    calendar : {
        sameDay : '[??????????] LT',
        nextDay : '[???????????] LT',
        nextWeek : '[???]dddd[???????] LT',
        lastDay : '[?????????????] LT',
        lastWeek : '[???]dddd[???????????] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '??? %s',
        past : '%s??????',
        s : '????????????????',
        m : '1 ????',
        mm : '%d ????',
        h : '1 ???????',
        hh : '%d ???????',
        d : '1 ???',
        dd : '%d ???',
        M : '1 ?????',
        MM : '%d ?????',
        y : '1 ??',
        yy : '%d ??'
    },
    ordinalParse: /(???)\d{1,2}/,
    ordinal : function (number) {
        return '???' + number;
    }
});

//! moment.js locale configuration
//! locale : Lithuanian [lt]
//! author : Mindaugas Moz��ras : https://github.com/mmozuras

var units = {
    'm' : 'minut?_minut?s_minut?',
    'mm': 'minut?s_minu?i?_minutes',
    'h' : 'valanda_valandos_valand?',
    'hh': 'valandos_valand?_valandas',
    'd' : 'diena_dienos_dien?',
    'dd': 'dienos_dien?_dienas',
    'M' : 'm?nuo_m?nesio_m?nes?',
    'MM': 'm?nesiai_m?nesi?_m?nesius',
    'y' : 'metai_met?_metus',
    'yy': 'metai_met?_metus'
};
function translateSeconds(number, withoutSuffix, key, isFuture) {
    if (withoutSuffix) {
        return 'kelios sekund?s';
    } else {
        return isFuture ? 'keli? sekund?i?' : 'kelias sekundes';
    }
}
function translateSingular(number, withoutSuffix, key, isFuture) {
    return withoutSuffix ? forms(key)[0] : (isFuture ? forms(key)[1] : forms(key)[2]);
}
function special(number) {
    return number % 10 === 0 || (number > 10 && number < 20);
}
function forms(key) {
    return units[key].split('_');
}
function translate$6(number, withoutSuffix, key, isFuture) {
    var result = number + ' ';
    if (number === 1) {
        return result + translateSingular(number, withoutSuffix, key[0], isFuture);
    } else if (withoutSuffix) {
        return result + (special(number) ? forms(key)[1] : forms(key)[0]);
    } else {
        if (isFuture) {
            return result + forms(key)[1];
        } else {
            return result + (special(number) ? forms(key)[1] : forms(key)[2]);
        }
    }
}
hooks.defineLocale('lt', {
    months : {
        format: 'sausio_vasario_kovo_baland?io_gegu??s_bir?elio_liepos_rugpj��?io_rugs?jo_spalio_lapkri?io_gruod?io'.split('_'),
        standalone: 'sausis_vasaris_kovas_balandis_gegu??_bir?elis_liepa_rugpj��tis_rugs?jis_spalis_lapkritis_gruodis'.split('_'),
        isFormat: /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?|MMMM?(\[[^\[\]]*\]|\s)+D[oD]?/
    },
    monthsShort : 'sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd'.split('_'),
    weekdays : {
        format: 'sekmadien?_pirmadien?_antradien?_tre?iadien?_ketvirtadien?_penktadien?_?e?tadien?'.split('_'),
        standalone: 'sekmadienis_pirmadienis_antradienis_tre?iadienis_ketvirtadienis_penktadienis_?e?tadienis'.split('_'),
        isFormat: /dddd HH:mm/
    },
    weekdaysShort : 'Sek_Pir_Ant_Tre_Ket_Pen_?e?'.split('_'),
    weekdaysMin : 'S_P_A_T_K_Pn_?'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'YYYY-MM-DD',
        LL : 'YYYY [m.] MMMM D [d.]',
        LLL : 'YYYY [m.] MMMM D [d.], HH:mm [val.]',
        LLLL : 'YYYY [m.] MMMM D [d.], dddd, HH:mm [val.]',
        l : 'YYYY-MM-DD',
        ll : 'YYYY [m.] MMMM D [d.]',
        lll : 'YYYY [m.] MMMM D [d.], HH:mm [val.]',
        llll : 'YYYY [m.] MMMM D [d.], ddd, HH:mm [val.]'
    },
    calendar : {
        sameDay : '[?iandien] LT',
        nextDay : '[Rytoj] LT',
        nextWeek : 'dddd LT',
        lastDay : '[Vakar] LT',
        lastWeek : '[Pra?jus?] dddd LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'po %s',
        past : 'prie? %s',
        s : translateSeconds,
        m : translateSingular,
        mm : translate$6,
        h : translateSingular,
        hh : translate$6,
        d : translateSingular,
        dd : translate$6,
        M : translateSingular,
        MM : translate$6,
        y : translateSingular,
        yy : translate$6
    },
    ordinalParse: /\d{1,2}-oji/,
    ordinal : function (number) {
        return number + '-oji';
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Latvian [lv]
//! author : Kristaps Karlsons : https://github.com/skakri
//! author : J��nis Elmeris : https://github.com/JanisE

var units$1 = {
    'm': 'min��tes_min��t��m_min��te_min��tes'.split('_'),
    'mm': 'min��tes_min��t��m_min��te_min��tes'.split('_'),
    'h': 'stundas_stund��m_stunda_stundas'.split('_'),
    'hh': 'stundas_stund��m_stunda_stundas'.split('_'),
    'd': 'dienas_dien��m_diena_dienas'.split('_'),
    'dd': 'dienas_dien��m_diena_dienas'.split('_'),
    'M': 'm��ne?a_m��ne?iem_m��nesis_m��ne?i'.split('_'),
    'MM': 'm��ne?a_m��ne?iem_m��nesis_m��ne?i'.split('_'),
    'y': 'gada_gadiem_gads_gadi'.split('_'),
    'yy': 'gada_gadiem_gads_gadi'.split('_')
};
/**
 * @param withoutSuffix boolean true = a length of time; false = before/after a period of time.
 */
function format$1(forms, number, withoutSuffix) {
    if (withoutSuffix) {
        // E.g. "21 min��te", "3 min��tes".
        return number % 10 === 1 && number % 100 !== 11 ? forms[2] : forms[3];
    } else {
        // E.g. "21 min��tes" as in "p��c 21 min��tes".
        // E.g. "3 min��t��m" as in "p��c 3 min��t��m".
        return number % 10 === 1 && number % 100 !== 11 ? forms[0] : forms[1];
    }
}
function relativeTimeWithPlural$1(number, withoutSuffix, key) {
    return number + ' ' + format$1(units$1[key], number, withoutSuffix);
}
function relativeTimeWithSingular(number, withoutSuffix, key) {
    return format$1(units$1[key], number, withoutSuffix);
}
function relativeSeconds(number, withoutSuffix) {
    return withoutSuffix ? 'da?as sekundes' : 'da?��m sekund��m';
}

hooks.defineLocale('lv', {
    months : 'janv��ris_febru��ris_marts_apr��lis_maijs_j��nijs_j��lijs_augusts_septembris_oktobris_novembris_decembris'.split('_'),
    monthsShort : 'jan_feb_mar_apr_mai_j��n_j��l_aug_sep_okt_nov_dec'.split('_'),
    weekdays : 'sv��tdiena_pirmdiena_otrdiena_tre?diena_ceturtdiena_piektdiena_sestdiena'.split('_'),
    weekdaysShort : 'Sv_P_O_T_C_Pk_S'.split('_'),
    weekdaysMin : 'Sv_P_O_T_C_Pk_S'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY.',
        LL : 'YYYY. [gada] D. MMMM',
        LLL : 'YYYY. [gada] D. MMMM, HH:mm',
        LLLL : 'YYYY. [gada] D. MMMM, dddd, HH:mm'
    },
    calendar : {
        sameDay : '[?odien pulksten] LT',
        nextDay : '[R��t pulksten] LT',
        nextWeek : 'dddd [pulksten] LT',
        lastDay : '[Vakar pulksten] LT',
        lastWeek : '[Pag��ju?��] dddd [pulksten] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'p��c %s',
        past : 'pirms %s',
        s : relativeSeconds,
        m : relativeTimeWithSingular,
        mm : relativeTimeWithPlural$1,
        h : relativeTimeWithSingular,
        hh : relativeTimeWithPlural$1,
        d : relativeTimeWithSingular,
        dd : relativeTimeWithPlural$1,
        M : relativeTimeWithSingular,
        MM : relativeTimeWithPlural$1,
        y : relativeTimeWithSingular,
        yy : relativeTimeWithPlural$1
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Montenegrin [me]
//! author : Miodrag Nika? <miodrag@restartit.me> : https://github.com/miodragnikac

var translator = {
    words: { //Different grammatical cases
        m: ['jedan minut', 'jednog minuta'],
        mm: ['minut', 'minuta', 'minuta'],
        h: ['jedan sat', 'jednog sata'],
        hh: ['sat', 'sata', 'sati'],
        dd: ['dan', 'dana', 'dana'],
        MM: ['mjesec', 'mjeseca', 'mjeseci'],
        yy: ['godina', 'godine', 'godina']
    },
    correctGrammaticalCase: function (number, wordKey) {
        return number === 1 ? wordKey[0] : (number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]);
    },
    translate: function (number, withoutSuffix, key) {
        var wordKey = translator.words[key];
        if (key.length === 1) {
            return withoutSuffix ? wordKey[0] : wordKey[1];
        } else {
            return number + ' ' + translator.correctGrammaticalCase(number, wordKey);
        }
    }
};

hooks.defineLocale('me', {
    months: 'januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar'.split('_'),
    monthsShort: 'jan._feb._mar._apr._maj_jun_jul_avg._sep._okt._nov._dec.'.split('_'),
    monthsParseExact : true,
    weekdays: 'nedjelja_ponedjeljak_utorak_srijeda_?etvrtak_petak_subota'.split('_'),
    weekdaysShort: 'ned._pon._uto._sri._?et._pet._sub.'.split('_'),
    weekdaysMin: 'ne_po_ut_sr_?e_pe_su'.split('_'),
    weekdaysParseExact : true,
    longDateFormat: {
        LT: 'H:mm',
        LTS : 'H:mm:ss',
        L: 'DD.MM.YYYY',
        LL: 'D. MMMM YYYY',
        LLL: 'D. MMMM YYYY H:mm',
        LLLL: 'dddd, D. MMMM YYYY H:mm'
    },
    calendar: {
        sameDay: '[danas u] LT',
        nextDay: '[sjutra u] LT',

        nextWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[u] [nedjelju] [u] LT';
                case 3:
                    return '[u] [srijedu] [u] LT';
                case 6:
                    return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[u] dddd [u] LT';
            }
        },
        lastDay  : '[ju?e u] LT',
        lastWeek : function () {
            var lastWeekDays = [
                '[pro?le] [nedjelje] [u] LT',
                '[pro?log] [ponedjeljka] [u] LT',
                '[pro?log] [utorka] [u] LT',
                '[pro?le] [srijede] [u] LT',
                '[pro?log] [?etvrtka] [u] LT',
                '[pro?log] [petka] [u] LT',
                '[pro?le] [subote] [u] LT'
            ];
            return lastWeekDays[this.day()];
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : 'za %s',
        past   : 'prije %s',
        s      : 'nekoliko sekundi',
        m      : translator.translate,
        mm     : translator.translate,
        h      : translator.translate,
        hh     : translator.translate,
        d      : 'dan',
        dd     : translator.translate,
        M      : 'mjesec',
        MM     : translator.translate,
        y      : 'godinu',
        yy     : translator.translate
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Maori [mi]
//! author : John Corrigan <robbiecloset@gmail.com> : https://github.com/johnideal

hooks.defineLocale('mi', {
    months: 'Kohi-t��te_Hui-tanguru_Pout��-te-rangi_Paenga-wh��wh��_Haratua_Pipiri_H��ngoingoi_Here-turi-k��k��_Mahuru_Whiringa-��-nuku_Whiringa-��-rangi_Hakihea'.split('_'),
    monthsShort: 'Kohi_Hui_Pou_Pae_Hara_Pipi_H��ngoi_Here_Mahu_Whi-nu_Whi-ra_Haki'.split('_'),
    monthsRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
    monthsStrictRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
    monthsShortRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
    monthsShortStrictRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,2}/i,
    weekdays: 'R��tapu_Mane_T��rei_Wenerei_T��ite_Paraire_H��tarei'.split('_'),
    weekdaysShort: 'Ta_Ma_T��_We_T��i_Pa_H��'.split('_'),
    weekdaysMin: 'Ta_Ma_T��_We_T��i_Pa_H��'.split('_'),
    longDateFormat: {
        LT: 'HH:mm',
        LTS: 'HH:mm:ss',
        L: 'DD/MM/YYYY',
        LL: 'D MMMM YYYY',
        LLL: 'D MMMM YYYY [i] HH:mm',
        LLLL: 'dddd, D MMMM YYYY [i] HH:mm'
    },
    calendar: {
        sameDay: '[i teie mahana, i] LT',
        nextDay: '[apopo i] LT',
        nextWeek: 'dddd [i] LT',
        lastDay: '[inanahi i] LT',
        lastWeek: 'dddd [whakamutunga i] LT',
        sameElse: 'L'
    },
    relativeTime: {
        future: 'i roto i %s',
        past: '%s i mua',
        s: 'te h��kona ruarua',
        m: 'he meneti',
        mm: '%d meneti',
        h: 'te haora',
        hh: '%d haora',
        d: 'he ra',
        dd: '%d ra',
        M: 'he marama',
        MM: '%d marama',
        y: 'he tau',
        yy: '%d tau'
    },
    ordinalParse: /\d{1,2}o/,
    ordinal: '%do',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Macedonian [mk]
//! author : Borislav Mickov : https://github.com/B0k0

hooks.defineLocale('mk', {
    months : '?�ѧߧ�ѧ��_��֧ӧ��ѧ��_�ާѧ��_�ѧ��ڧ�_�ާ�?_?��ߧ�_?��ݧ�_�ѧӧԧ���_��֧��֧ާӧ��_��ܧ��ާӧ��_�ߧ�֧ާӧ��_�է֧ܧ֧ާӧ��'.split('_'),
    monthsShort : '?�ѧ�_��֧�_�ާѧ�_�ѧ��_�ާ�?_?���_?���_�ѧӧ�_��֧�_��ܧ�_�ߧ��_�է֧�'.split('_'),
    weekdays : '�ߧ֧է֧ݧ�_���ߧ֧է֧ݧߧڧ�_�ӧ���ߧڧ�_���֧է�_��֧�ӧ����_��֧���_��ѧҧ���'.split('_'),
    weekdaysShort : '�ߧ֧�_����_�ӧ��_����_��֧�_��֧�_��ѧ�'.split('_'),
    weekdaysMin : '��e_��o_�ӧ�_���_���_���_��a'.split('_'),
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'D.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY H:mm',
        LLLL : 'dddd, D MMMM YYYY H:mm'
    },
    calendar : {
        sameDay : '[���֧ߧ֧� �ӧ�] LT',
        nextDay : '[������ �ӧ�] LT',
        nextWeek : '[����] dddd [�ӧ�] LT',
        lastDay : '[����֧�� �ӧ�] LT',
        lastWeek : function () {
            switch (this.day()) {
                case 0:
                case 3:
                case 6:
                    return '[���٧ާڧߧѧ�ѧ��] dddd [�ӧ�] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[���٧ާڧߧѧ�ڧ��] dddd [�ӧ�] LT';
            }
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : '����ݧ� %s',
        past : '���֧� %s',
        s : '�ߧ֧ܧ�ݧܧ� ��֧ܧ�ߧէ�',
        m : '�ާڧߧ���',
        mm : '%d �ާڧߧ���',
        h : '��ѧ�',
        hh : '%d ��ѧ��',
        d : '�է֧�',
        dd : '%d �է֧ߧ�',
        M : '�ާ֧�֧�',
        MM : '%d �ާ֧�֧��',
        y : '�ԧ�էڧߧ�',
        yy : '%d �ԧ�էڧߧ�'
    },
    ordinalParse: /\d{1,2}-(�֧�|�֧�|���|�ӧ�|���|�ާ�)/,
    ordinal : function (number) {
        var lastDigit = number % 10,
            last2Digits = number % 100;
        if (number === 0) {
            return number + '-�֧�';
        } else if (last2Digits === 0) {
            return number + '-�֧�';
        } else if (last2Digits > 10 && last2Digits < 20) {
            return number + '-���';
        } else if (lastDigit === 1) {
            return number + '-�ӧ�';
        } else if (lastDigit === 2) {
            return number + '-���';
        } else if (lastDigit === 7 || lastDigit === 8) {
            return number + '-�ާ�';
        } else {
            return number + '-���';
        }
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Malayalam [ml]
//! author : Floyd Pink : https://github.com/floydpink

hooks.defineLocale('ml', {
    months : '??????_?????????_???????_??????_????_???_????_????????_??????????_???????_?????_??????'.split('_'),
    monthsShort : '???._??????._???._?????._????_???_????._??._???????._?????._???._????.'.split('_'),
    monthsParseExact : true,
    weekdays : '????????_??????????_?????????_????????_?????????_???????????_????????'.split('_'),
    weekdaysShort : '????_??????_?????_????_??????_??????_???'.split('_'),
    weekdaysMin : '??_??_??_??_????_??_?'.split('_'),
    longDateFormat : {
        LT : 'A h:mm -??',
        LTS : 'A h:mm:ss -??',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY, A h:mm -??',
        LLLL : 'dddd, D MMMM YYYY, A h:mm -??'
    },
    calendar : {
        sameDay : '[?????] LT',
        nextDay : '[????] LT',
        nextWeek : 'dddd, LT',
        lastDay : '[??????] LT',
        lastWeek : '[??????] dddd, LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s ???????',
        past : '%s ?????',
        s : '??? ?????????',
        m : '??? ????????',
        mm : '%d ????????',
        h : '??? ????????',
        hh : '%d ????????',
        d : '??? ?????',
        dd : '%d ?????',
        M : '??? ????',
        MM : '%d ????',
        y : '??? ????',
        yy : '%d ????'
    },
    meridiemParse: /??????|??????|???? ???????|??????????|??????/i,
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if ((meridiem === '??????' && hour >= 4) ||
                meridiem === '???? ???????' ||
                meridiem === '??????????') {
            return hour + 12;
        } else {
            return hour;
        }
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 4) {
            return '??????';
        } else if (hour < 12) {
            return '??????';
        } else if (hour < 17) {
            return '???? ???????';
        } else if (hour < 20) {
            return '??????????';
        } else {
            return '??????';
        }
    }
});

//! moment.js locale configuration
//! locale : Marathi [mr]
//! author : Harshad Kale : https://github.com/kalehv
//! author : Vivek Athalye : https://github.com/vnathalye

var symbolMap$7 = {
    '1': '?',
    '2': '?',
    '3': '?',
    '4': '?',
    '5': '?',
    '6': '?',
    '7': '?',
    '8': '?',
    '9': '?',
    '0': '?'
};
var numberMap$6 = {
    '?': '1',
    '?': '2',
    '?': '3',
    '?': '4',
    '?': '5',
    '?': '6',
    '?': '7',
    '?': '8',
    '?': '9',
    '?': '0'
};

function relativeTimeMr(number, withoutSuffix, string, isFuture)
{
    var output = '';
    if (withoutSuffix) {
        switch (string) {
            case 's': output = '???? ?????'; break;
            case 'm': output = '?? ?????'; break;
            case 'mm': output = '%d ??????'; break;
            case 'h': output = '?? ???'; break;
            case 'hh': output = '%d ???'; break;
            case 'd': output = '?? ????'; break;
            case 'dd': output = '%d ????'; break;
            case 'M': output = '?? ?????'; break;
            case 'MM': output = '%d ?????'; break;
            case 'y': output = '?? ????'; break;
            case 'yy': output = '%d ?????'; break;
        }
    }
    else {
        switch (string) {
            case 's': output = '???? ???????'; break;
            case 'm': output = '??? ??????'; break;
            case 'mm': output = '%d ???????'; break;
            case 'h': output = '??? ????'; break;
            case 'hh': output = '%d ?????'; break;
            case 'd': output = '??? ?????'; break;
            case 'dd': output = '%d ??????'; break;
            case 'M': output = '??? ???????'; break;
            case 'MM': output = '%d ????????'; break;
            case 'y': output = '??? ?????'; break;
            case 'yy': output = '%d ??????'; break;
        }
    }
    return output.replace(/%d/i, number);
}

hooks.defineLocale('mr', {
    months : '????????_??????????_?????_??????_??_???_????_?????_????????_???????_?????????_???????'.split('_'),
    monthsShort: '????._??????._?????._?????._??._???._????._??._??????._?????._???????._?????.'.split('_'),
    monthsParseExact : true,
    weekdays : '??????_??????_???????_??????_???????_????????_??????'.split('_'),
    weekdaysShort : '???_???_????_???_????_?????_???'.split('_'),
    weekdaysMin : '?_??_??_??_??_??_?'.split('_'),
    longDateFormat : {
        LT : 'A h:mm ?????',
        LTS : 'A h:mm:ss ?????',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY, A h:mm ?????',
        LLLL : 'dddd, D MMMM YYYY, A h:mm ?????'
    },
    calendar : {
        sameDay : '[??] LT',
        nextDay : '[?????] LT',
        nextWeek : 'dddd, LT',
        lastDay : '[???] LT',
        lastWeek: '[?????] dddd, LT',
        sameElse : 'L'
    },
    relativeTime : {
        future: '%s?????',
        past: '%s??????',
        s: relativeTimeMr,
        m: relativeTimeMr,
        mm: relativeTimeMr,
        h: relativeTimeMr,
        hh: relativeTimeMr,
        d: relativeTimeMr,
        dd: relativeTimeMr,
        M: relativeTimeMr,
        MM: relativeTimeMr,
        y: relativeTimeMr,
        yy: relativeTimeMr
    },
    preparse: function (string) {
        return string.replace(/[??????????]/g, function (match) {
            return numberMap$6[match];
        });
    },
    postformat: function (string) {
        return string.replace(/\d/g, function (match) {
            return symbolMap$7[match];
        });
    },
    meridiemParse: /??????|?????|??????|????????/,
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '??????') {
            return hour < 4 ? hour : hour + 12;
        } else if (meridiem === '?????') {
            return hour;
        } else if (meridiem === '??????') {
            return hour >= 10 ? hour : hour + 12;
        } else if (meridiem === '????????') {
            return hour + 12;
        }
    },
    meridiem: function (hour, minute, isLower) {
        if (hour < 4) {
            return '??????';
        } else if (hour < 10) {
            return '?????';
        } else if (hour < 17) {
            return '??????';
        } else if (hour < 20) {
            return '????????';
        } else {
            return '??????';
        }
    },
    week : {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Malay [ms-my]
//! note : DEPRECATED, the correct one is [ms]
//! author : Weldan Jamili : https://github.com/weldan

hooks.defineLocale('ms-my', {
    months : 'Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember'.split('_'),
    monthsShort : 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis'.split('_'),
    weekdays : 'Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu'.split('_'),
    weekdaysShort : 'Ahd_Isn_Sel_Rab_Kha_Jum_Sab'.split('_'),
    weekdaysMin : 'Ah_Is_Sl_Rb_Km_Jm_Sb'.split('_'),
    longDateFormat : {
        LT : 'HH.mm',
        LTS : 'HH.mm.ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY [pukul] HH.mm',
        LLLL : 'dddd, D MMMM YYYY [pukul] HH.mm'
    },
    meridiemParse: /pagi|tengahari|petang|malam/,
    meridiemHour: function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === 'pagi') {
            return hour;
        } else if (meridiem === 'tengahari') {
            return hour >= 11 ? hour : hour + 12;
        } else if (meridiem === 'petang' || meridiem === 'malam') {
            return hour + 12;
        }
    },
    meridiem : function (hours, minutes, isLower) {
        if (hours < 11) {
            return 'pagi';
        } else if (hours < 15) {
            return 'tengahari';
        } else if (hours < 19) {
            return 'petang';
        } else {
            return 'malam';
        }
    },
    calendar : {
        sameDay : '[Hari ini pukul] LT',
        nextDay : '[Esok pukul] LT',
        nextWeek : 'dddd [pukul] LT',
        lastDay : '[Kelmarin pukul] LT',
        lastWeek : 'dddd [lepas pukul] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'dalam %s',
        past : '%s yang lepas',
        s : 'beberapa saat',
        m : 'seminit',
        mm : '%d minit',
        h : 'sejam',
        hh : '%d jam',
        d : 'sehari',
        dd : '%d hari',
        M : 'sebulan',
        MM : '%d bulan',
        y : 'setahun',
        yy : '%d tahun'
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Malay [ms]
//! author : Weldan Jamili : https://github.com/weldan

hooks.defineLocale('ms', {
    months : 'Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember'.split('_'),
    monthsShort : 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis'.split('_'),
    weekdays : 'Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu'.split('_'),
    weekdaysShort : 'Ahd_Isn_Sel_Rab_Kha_Jum_Sab'.split('_'),
    weekdaysMin : 'Ah_Is_Sl_Rb_Km_Jm_Sb'.split('_'),
    longDateFormat : {
        LT : 'HH.mm',
        LTS : 'HH.mm.ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY [pukul] HH.mm',
        LLLL : 'dddd, D MMMM YYYY [pukul] HH.mm'
    },
    meridiemParse: /pagi|tengahari|petang|malam/,
    meridiemHour: function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === 'pagi') {
            return hour;
        } else if (meridiem === 'tengahari') {
            return hour >= 11 ? hour : hour + 12;
        } else if (meridiem === 'petang' || meridiem === 'malam') {
            return hour + 12;
        }
    },
    meridiem : function (hours, minutes, isLower) {
        if (hours < 11) {
            return 'pagi';
        } else if (hours < 15) {
            return 'tengahari';
        } else if (hours < 19) {
            return 'petang';
        } else {
            return 'malam';
        }
    },
    calendar : {
        sameDay : '[Hari ini pukul] LT',
        nextDay : '[Esok pukul] LT',
        nextWeek : 'dddd [pukul] LT',
        lastDay : '[Kelmarin pukul] LT',
        lastWeek : 'dddd [lepas pukul] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'dalam %s',
        past : '%s yang lepas',
        s : 'beberapa saat',
        m : 'seminit',
        mm : '%d minit',
        h : 'sejam',
        hh : '%d jam',
        d : 'sehari',
        dd : '%d hari',
        M : 'sebulan',
        MM : '%d bulan',
        y : 'setahun',
        yy : '%d tahun'
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Burmese [my]
//! author : Squar team, mysquar.com
//! author : David Rossellat : https://github.com/gholadr
//! author : Tin Aung Lin : https://github.com/thanyawzinmin

var symbolMap$8 = {
    '1': '?',
    '2': '?',
    '3': '?',
    '4': '?',
    '5': '?',
    '6': '?',
    '7': '?',
    '8': '?',
    '9': '?',
    '0': '?'
};
var numberMap$7 = {
    '?': '1',
    '?': '2',
    '?': '3',
    '?': '4',
    '?': '5',
    '?': '6',
    '?': '7',
    '?': '8',
    '?': '9',
    '?': '0'
};

hooks.defineLocale('my', {
    months: '????????_??????????_???_????_??_????_???????_??????_????????_??????????_????????_???????'.split('_'),
    monthsShort: '???_??_???_???_??_????_?????_??_???_?????_???_??'.split('_'),
    weekdays: '?????????_???????_??????_????????_????????_??????_???'.split('_'),
    weekdaysShort: '???_??_??_???_???_???_??'.split('_'),
    weekdaysMin: '???_??_??_???_???_???_??'.split('_'),

    longDateFormat: {
        LT: 'HH:mm',
        LTS: 'HH:mm:ss',
        L: 'DD/MM/YYYY',
        LL: 'D MMMM YYYY',
        LLL: 'D MMMM YYYY HH:mm',
        LLLL: 'dddd D MMMM YYYY HH:mm'
    },
    calendar: {
        sameDay: '[???.] LT [???]',
        nextDay: '[????????] LT [???]',
        nextWeek: 'dddd LT [???]',
        lastDay: '[???.?] LT [???]',
        lastWeek: '[??????????] dddd LT [???]',
        sameElse: 'L'
    },
    relativeTime: {
        future: '?????? %s ???',
        past: '?????????? %s ?',
        s: '??????.????????',
        m: '????????',
        mm: '%d ?????',
        h: '???????',
        hh: '%d ????',
        d: '??????',
        dd: '%d ???',
        M: '????',
        MM: '%d ?',
        y: '???????',
        yy: '%d ????'
    },
    preparse: function (string) {
        return string.replace(/[??????????]/g, function (match) {
            return numberMap$7[match];
        });
    },
    postformat: function (string) {
        return string.replace(/\d/g, function (match) {
            return symbolMap$8[match];
        });
    },
    week: {
        dow: 1, // Monday is the first day of the week.
        doy: 4 // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Norwegian Bokm?l [nb]
//! authors : Espen Hovlandsdal : https://github.com/rexxars
//!           Sigurd Gartmann : https://github.com/sigurdga

hooks.defineLocale('nb', {
    months : 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
    monthsShort : 'jan._feb._mars_april_mai_juni_juli_aug._sep._okt._nov._des.'.split('_'),
    monthsParseExact : true,
    weekdays : 's?ndag_mandag_tirsdag_onsdag_torsdag_fredag_l?rdag'.split('_'),
    weekdaysShort : 's?._ma._ti._on._to._fr._l?.'.split('_'),
    weekdaysMin : 's?_ma_ti_on_to_fr_l?'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY [kl.] HH:mm',
        LLLL : 'dddd D. MMMM YYYY [kl.] HH:mm'
    },
    calendar : {
        sameDay: '[i dag kl.] LT',
        nextDay: '[i morgen kl.] LT',
        nextWeek: 'dddd [kl.] LT',
        lastDay: '[i g?r kl.] LT',
        lastWeek: '[forrige] dddd [kl.] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'om %s',
        past : '%s siden',
        s : 'noen sekunder',
        m : 'ett minutt',
        mm : '%d minutter',
        h : 'en time',
        hh : '%d timer',
        d : 'en dag',
        dd : '%d dager',
        M : 'en m?ned',
        MM : '%d m?neder',
        y : 'ett ?r',
        yy : '%d ?r'
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Nepalese [ne]
//! author : suvash : https://github.com/suvash

var symbolMap$9 = {
    '1': '?',
    '2': '?',
    '3': '?',
    '4': '?',
    '5': '?',
    '6': '?',
    '7': '?',
    '8': '?',
    '9': '?',
    '0': '?'
};
var numberMap$8 = {
    '?': '1',
    '?': '2',
    '?': '3',
    '?': '4',
    '?': '5',
    '?': '6',
    '?': '7',
    '?': '8',
    '?': '9',
    '?': '0'
};

hooks.defineLocale('ne', {
    months : '?????_?????????_?????_??????_??_???_?????_?????_??????????_???????_????????_????????'.split('_'),
    monthsShort : '??._??????._?????_?????._??_???_?????._??._?????._?????._????._????.'.split('_'),
    monthsParseExact : true,
    weekdays : '??????_??????_????????_??????_???????_????????_??????'.split('_'),
    weekdaysShort : '???._???._?????._???._????._?????._???.'.split('_'),
    weekdaysMin : '?._??._??._??._??._??._?.'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'A?? h:mm ???',
        LTS : 'A?? h:mm:ss ???',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY, A?? h:mm ???',
        LLLL : 'dddd, D MMMM YYYY, A?? h:mm ???'
    },
    preparse: function (string) {
        return string.replace(/[??????????]/g, function (match) {
            return numberMap$8[match];
        });
    },
    postformat: function (string) {
        return string.replace(/\d/g, function (match) {
            return symbolMap$9[match];
        });
    },
    meridiemParse: /????|?????|??????|????/,
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '????') {
            return hour < 4 ? hour : hour + 12;
        } else if (meridiem === '?????') {
            return hour;
        } else if (meridiem === '??????') {
            return hour >= 10 ? hour : hour + 12;
        } else if (meridiem === '????') {
            return hour + 12;
        }
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 3) {
            return '????';
        } else if (hour < 12) {
            return '?????';
        } else if (hour < 16) {
            return '??????';
        } else if (hour < 20) {
            return '????';
        } else {
            return '????';
        }
    },
    calendar : {
        sameDay : '[??] LT',
        nextDay : '[????] LT',
        nextWeek : '[?????] dddd[,] LT',
        lastDay : '[????] LT',
        lastWeek : '[????] dddd[,] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s??',
        past : '%s ?????',
        s : '???? ????',
        m : '?? ?????',
        mm : '%d ?????',
        h : '?? ?????',
        hh : '%d ?????',
        d : '?? ???',
        dd : '%d ???',
        M : '?? ?????',
        MM : '%d ?????',
        y : '?? ????',
        yy : '%d ????'
    },
    week : {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Dutch (Belgium) [nl-be]
//! author : Joris R?ling : https://github.com/jorisroling
//! author : Jacob Middag : https://github.com/middagj

var monthsShortWithDots$1 = 'jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.'.split('_');
var monthsShortWithoutDots$1 = 'jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec'.split('_');

var monthsParse = [/^jan/i, /^feb/i, /^maart|mrt.?$/i, /^apr/i, /^mei$/i, /^jun[i.]?$/i, /^jul[i.]?$/i, /^aug/i, /^sep/i, /^okt/i, /^nov/i, /^dec/i];
var monthsRegex$1 = /^(januari|februari|maart|april|mei|april|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;

hooks.defineLocale('nl-be', {
    months : 'januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december'.split('_'),
    monthsShort : function (m, format) {
        if (/-MMM-/.test(format)) {
            return monthsShortWithoutDots$1[m.month()];
        } else {
            return monthsShortWithDots$1[m.month()];
        }
    },

    monthsRegex: monthsRegex$1,
    monthsShortRegex: monthsRegex$1,
    monthsStrictRegex: /^(januari|februari|maart|mei|ju[nl]i|april|augustus|september|oktober|november|december)/i,
    monthsShortStrictRegex: /^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,

    monthsParse : monthsParse,
    longMonthsParse : monthsParse,
    shortMonthsParse : monthsParse,

    weekdays : 'zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag'.split('_'),
    weekdaysShort : 'zo._ma._di._wo._do._vr._za.'.split('_'),
    weekdaysMin : 'Zo_Ma_Di_Wo_Do_Vr_Za'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[vandaag om] LT',
        nextDay: '[morgen om] LT',
        nextWeek: 'dddd [om] LT',
        lastDay: '[gisteren om] LT',
        lastWeek: '[afgelopen] dddd [om] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'over %s',
        past : '%s geleden',
        s : 'een paar seconden',
        m : '����n minuut',
        mm : '%d minuten',
        h : '����n uur',
        hh : '%d uur',
        d : '����n dag',
        dd : '%d dagen',
        M : '����n maand',
        MM : '%d maanden',
        y : '����n jaar',
        yy : '%d jaar'
    },
    ordinalParse: /\d{1,2}(ste|de)/,
    ordinal : function (number) {
        return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Dutch [nl]
//! author : Joris R?ling : https://github.com/jorisroling
//! author : Jacob Middag : https://github.com/middagj

var monthsShortWithDots$2 = 'jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.'.split('_');
var monthsShortWithoutDots$2 = 'jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec'.split('_');

var monthsParse$1 = [/^jan/i, /^feb/i, /^maart|mrt.?$/i, /^apr/i, /^mei$/i, /^jun[i.]?$/i, /^jul[i.]?$/i, /^aug/i, /^sep/i, /^okt/i, /^nov/i, /^dec/i];
var monthsRegex$2 = /^(januari|februari|maart|april|mei|april|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;

hooks.defineLocale('nl', {
    months : 'januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december'.split('_'),
    monthsShort : function (m, format) {
        if (/-MMM-/.test(format)) {
            return monthsShortWithoutDots$2[m.month()];
        } else {
            return monthsShortWithDots$2[m.month()];
        }
    },

    monthsRegex: monthsRegex$2,
    monthsShortRegex: monthsRegex$2,
    monthsStrictRegex: /^(januari|februari|maart|mei|ju[nl]i|april|augustus|september|oktober|november|december)/i,
    monthsShortStrictRegex: /^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,

    monthsParse : monthsParse$1,
    longMonthsParse : monthsParse$1,
    shortMonthsParse : monthsParse$1,

    weekdays : 'zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag'.split('_'),
    weekdaysShort : 'zo._ma._di._wo._do._vr._za.'.split('_'),
    weekdaysMin : 'Zo_Ma_Di_Wo_Do_Vr_Za'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD-MM-YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[vandaag om] LT',
        nextDay: '[morgen om] LT',
        nextWeek: 'dddd [om] LT',
        lastDay: '[gisteren om] LT',
        lastWeek: '[afgelopen] dddd [om] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'over %s',
        past : '%s geleden',
        s : 'een paar seconden',
        m : '����n minuut',
        mm : '%d minuten',
        h : '����n uur',
        hh : '%d uur',
        d : '����n dag',
        dd : '%d dagen',
        M : '����n maand',
        MM : '%d maanden',
        y : '����n jaar',
        yy : '%d jaar'
    },
    ordinalParse: /\d{1,2}(ste|de)/,
    ordinal : function (number) {
        return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Nynorsk [nn]
//! author : https://github.com/mechuwind

hooks.defineLocale('nn', {
    months : 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
    monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
    weekdays : 'sundag_m?ndag_tysdag_onsdag_torsdag_fredag_laurdag'.split('_'),
    weekdaysShort : 'sun_m?n_tys_ons_tor_fre_lau'.split('_'),
    weekdaysMin : 'su_m?_ty_on_to_fr_l?'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY [kl.] H:mm',
        LLLL : 'dddd D. MMMM YYYY [kl.] HH:mm'
    },
    calendar : {
        sameDay: '[I dag klokka] LT',
        nextDay: '[I morgon klokka] LT',
        nextWeek: 'dddd [klokka] LT',
        lastDay: '[I g?r klokka] LT',
        lastWeek: '[F?reg?ande] dddd [klokka] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'om %s',
        past : '%s sidan',
        s : 'nokre sekund',
        m : 'eit minutt',
        mm : '%d minutt',
        h : 'ein time',
        hh : '%d timar',
        d : 'ein dag',
        dd : '%d dagar',
        M : 'ein m?nad',
        MM : '%d m?nader',
        y : 'eit ?r',
        yy : '%d ?r'
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Punjabi (India) [pa-in]
//! author : Harpreet Singh : https://github.com/harpreetkhalsagtbit

var symbolMap$10 = {
    '1': '?',
    '2': '?',
    '3': '?',
    '4': '?',
    '5': '?',
    '6': '?',
    '7': '?',
    '8': '?',
    '9': '?',
    '0': '?'
};
var numberMap$9 = {
    '?': '1',
    '?': '2',
    '?': '3',
    '?': '4',
    '?': '5',
    '?': '6',
    '?': '7',
    '?': '8',
    '?': '9',
    '?': '0'
};

hooks.defineLocale('pa-in', {
    // There are months name as per Nanakshahi Calender but they are not used as rigidly in modern Punjabi.
    months : '?????_??????_????_??????_??_???_?????_????_?????_??????_?????_?????'.split('_'),
    monthsShort : '?????_??????_????_??????_??_???_?????_????_?????_??????_?????_?????'.split('_'),
    weekdays : '?????_??????_???????_??????_??????_?????????_?????????'.split('_'),
    weekdaysShort : '??_???_????_???_???_?????_????'.split('_'),
    weekdaysMin : '??_???_????_???_???_?????_????'.split('_'),
    longDateFormat : {
        LT : 'A h:mm ???',
        LTS : 'A h:mm:ss ???',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY, A h:mm ???',
        LLLL : 'dddd, D MMMM YYYY, A h:mm ???'
    },
    calendar : {
        sameDay : '[??] LT',
        nextDay : '[??] LT',
        nextWeek : 'dddd, LT',
        lastDay : '[??] LT',
        lastWeek : '[?????] dddd, LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s ????',
        past : '%s ?????',
        s : '??? ?????',
        m : '?? ????',
        mm : '%d ????',
        h : '??? ????',
        hh : '%d ????',
        d : '??? ???',
        dd : '%d ???',
        M : '??? ?????',
        MM : '%d ?????',
        y : '??? ???',
        yy : '%d ???'
    },
    preparse: function (string) {
        return string.replace(/[??????????]/g, function (match) {
            return numberMap$9[match];
        });
    },
    postformat: function (string) {
        return string.replace(/\d/g, function (match) {
            return symbolMap$10[match];
        });
    },
    // Punjabi notation for meridiems are quite fuzzy in practice. While there exists
    // a rigid notion of a 'Pahar' it is not used as rigidly in modern Punjabi.
    meridiemParse: /???|????|??????|????/,
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '???') {
            return hour < 4 ? hour : hour + 12;
        } else if (meridiem === '????') {
            return hour;
        } else if (meridiem === '??????') {
            return hour >= 10 ? hour : hour + 12;
        } else if (meridiem === '????') {
            return hour + 12;
        }
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 4) {
            return '???';
        } else if (hour < 10) {
            return '????';
        } else if (hour < 17) {
            return '??????';
        } else if (hour < 20) {
            return '????';
        } else {
            return '???';
        }
    },
    week : {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Polish [pl]
//! author : Rafal Hirsz : https://github.com/evoL

var monthsNominative = 'stycze��_luty_marzec_kwiecie��_maj_czerwiec_lipiec_sierpie��_wrzesie��_pa?dziernik_listopad_grudzie��'.split('_');
var monthsSubjective = 'stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_wrze?nia_pa?dziernika_listopada_grudnia'.split('_');
function plural$3(n) {
    return (n % 10 < 5) && (n % 10 > 1) && ((~~(n / 10) % 10) !== 1);
}
function translate$7(number, withoutSuffix, key) {
    var result = number + ' ';
    switch (key) {
        case 'm':
            return withoutSuffix ? 'minuta' : 'minut?';
        case 'mm':
            return result + (plural$3(number) ? 'minuty' : 'minut');
        case 'h':
            return withoutSuffix  ? 'godzina'  : 'godzin?';
        case 'hh':
            return result + (plural$3(number) ? 'godziny' : 'godzin');
        case 'MM':
            return result + (plural$3(number) ? 'miesi?ce' : 'miesi?cy');
        case 'yy':
            return result + (plural$3(number) ? 'lata' : 'lat');
    }
}

hooks.defineLocale('pl', {
    months : function (momentToFormat, format) {
        if (format === '') {
            // Hack: if format empty we know this is used to generate
            // RegExp by moment. Give then back both valid forms of months
            // in RegExp ready format.
            return '(' + monthsSubjective[momentToFormat.month()] + '|' + monthsNominative[momentToFormat.month()] + ')';
        } else if (/D MMMM/.test(format)) {
            return monthsSubjective[momentToFormat.month()];
        } else {
            return monthsNominative[momentToFormat.month()];
        }
    },
    monthsShort : 'sty_lut_mar_kwi_maj_cze_lip_sie_wrz_pa?_lis_gru'.split('_'),
    weekdays : 'niedziela_poniedzia?ek_wtorek_?roda_czwartek_pi?tek_sobota'.split('_'),
    weekdaysShort : 'ndz_pon_wt_?r_czw_pt_sob'.split('_'),
    weekdaysMin : 'Nd_Pn_Wt_?r_Cz_Pt_So'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[Dzi? o] LT',
        nextDay: '[Jutro o] LT',
        nextWeek: '[W] dddd [o] LT',
        lastDay: '[Wczoraj o] LT',
        lastWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[W zesz?? niedziel? o] LT';
                case 3:
                    return '[W zesz?? ?rod? o] LT';
                case 6:
                    return '[W zesz?? sobot? o] LT';
                default:
                    return '[W zesz?y] dddd [o] LT';
            }
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : 'za %s',
        past : '%s temu',
        s : 'kilka sekund',
        m : translate$7,
        mm : translate$7,
        h : translate$7,
        hh : translate$7,
        d : '1 dzie��',
        dd : '%d dni',
        M : 'miesi?c',
        MM : translate$7,
        y : 'rok',
        yy : translate$7
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Portuguese (Brazil) [pt-br]
//! author : Caio Ribeiro Pereira : https://github.com/caio-ribeiro-pereira

hooks.defineLocale('pt-br', {
    months : 'Janeiro_Fevereiro_Mar?o_Abril_Maio_Junho_Julho_Agosto_Setembro_Outubro_Novembro_Dezembro'.split('_'),
    monthsShort : 'Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez'.split('_'),
    weekdays : 'Domingo_Segunda-feira_Ter?a-feira_Quarta-feira_Quinta-feira_Sexta-feira_S��bado'.split('_'),
    weekdaysShort : 'Dom_Seg_Ter_Qua_Qui_Sex_S��b'.split('_'),
    weekdaysMin : 'Dom_2a_3a_4a_5a_6a_S��b'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D [de] MMMM [de] YYYY',
        LLL : 'D [de] MMMM [de] YYYY [��s] HH:mm',
        LLLL : 'dddd, D [de] MMMM [de] YYYY [��s] HH:mm'
    },
    calendar : {
        sameDay: '[Hoje ��s] LT',
        nextDay: '[Amanh? ��s] LT',
        nextWeek: 'dddd [��s] LT',
        lastDay: '[Ontem ��s] LT',
        lastWeek: function () {
            return (this.day() === 0 || this.day() === 6) ?
                '[��ltimo] dddd [��s] LT' : // Saturday + Sunday
                '[��ltima] dddd [��s] LT'; // Monday - Friday
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : 'em %s',
        past : '%s atr��s',
        s : 'poucos segundos',
        m : 'um minuto',
        mm : '%d minutos',
        h : 'uma hora',
        hh : '%d horas',
        d : 'um dia',
        dd : '%d dias',
        M : 'um m��s',
        MM : '%d meses',
        y : 'um ano',
        yy : '%d anos'
    },
    ordinalParse: /\d{1,2}o/,
    ordinal : '%do'
});

//! moment.js locale configuration
//! locale : Portuguese [pt]
//! author : Jefferson : https://github.com/jalex79

hooks.defineLocale('pt', {
    months : 'Janeiro_Fevereiro_Mar?o_Abril_Maio_Junho_Julho_Agosto_Setembro_Outubro_Novembro_Dezembro'.split('_'),
    monthsShort : 'Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez'.split('_'),
    weekdays : 'Domingo_Segunda-Feira_Ter?a-Feira_Quarta-Feira_Quinta-Feira_Sexta-Feira_S��bado'.split('_'),
    weekdaysShort : 'Dom_Seg_Ter_Qua_Qui_Sex_S��b'.split('_'),
    weekdaysMin : 'Dom_2a_3a_4a_5a_6a_S��b'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D [de] MMMM [de] YYYY',
        LLL : 'D [de] MMMM [de] YYYY HH:mm',
        LLLL : 'dddd, D [de] MMMM [de] YYYY HH:mm'
    },
    calendar : {
        sameDay: '[Hoje ��s] LT',
        nextDay: '[Amanh? ��s] LT',
        nextWeek: 'dddd [��s] LT',
        lastDay: '[Ontem ��s] LT',
        lastWeek: function () {
            return (this.day() === 0 || this.day() === 6) ?
                '[��ltimo] dddd [��s] LT' : // Saturday + Sunday
                '[��ltima] dddd [��s] LT'; // Monday - Friday
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : 'em %s',
        past : 'h�� %s',
        s : 'segundos',
        m : 'um minuto',
        mm : '%d minutos',
        h : 'uma hora',
        hh : '%d horas',
        d : 'um dia',
        dd : '%d dias',
        M : 'um m��s',
        MM : '%d meses',
        y : 'um ano',
        yy : '%d anos'
    },
    ordinalParse: /\d{1,2}o/,
    ordinal : '%do',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Romanian [ro]
//! author : Vlad Gurdiga : https://github.com/gurdiga
//! author : Valentin Agachi : https://github.com/avaly

function relativeTimeWithPlural$2(number, withoutSuffix, key) {
    var format = {
            'mm': 'minute',
            'hh': 'ore',
            'dd': 'zile',
            'MM': 'luni',
            'yy': 'ani'
        },
        separator = ' ';
    if (number % 100 >= 20 || (number >= 100 && number % 100 === 0)) {
        separator = ' de ';
    }
    return number + separator + format[key];
}

hooks.defineLocale('ro', {
    months : 'ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie'.split('_'),
    monthsShort : 'ian._febr._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.'.split('_'),
    monthsParseExact: true,
    weekdays : 'duminic?_luni_mar?i_miercuri_joi_vineri_samb?t?'.split('_'),
    weekdaysShort : 'Dum_Lun_Mar_Mie_Joi_Vin_Sam'.split('_'),
    weekdaysMin : 'Du_Lu_Ma_Mi_Jo_Vi_Sa'.split('_'),
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY H:mm',
        LLLL : 'dddd, D MMMM YYYY H:mm'
    },
    calendar : {
        sameDay: '[azi la] LT',
        nextDay: '[maine la] LT',
        nextWeek: 'dddd [la] LT',
        lastDay: '[ieri la] LT',
        lastWeek: '[fosta] dddd [la] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'peste %s',
        past : '%s ?n urm?',
        s : 'cateva secunde',
        m : 'un minut',
        mm : relativeTimeWithPlural$2,
        h : 'o or?',
        hh : relativeTimeWithPlural$2,
        d : 'o zi',
        dd : relativeTimeWithPlural$2,
        M : 'o lun?',
        MM : relativeTimeWithPlural$2,
        y : 'un an',
        yy : relativeTimeWithPlural$2
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Russian [ru]
//! author : Viktorminator : https://github.com/Viktorminator
//! Author : Menelion Elens��le : https://github.com/Oire
//! author : �����֧ߧҧ֧�� ���ѧ�� : https://github.com/socketpair

function plural$4(word, num) {
    var forms = word.split('_');
    return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
}
function relativeTimeWithPlural$3(number, withoutSuffix, key) {
    var format = {
        'mm': withoutSuffix ? '�ާڧߧ���_�ާڧߧ���_�ާڧߧ��' : '�ާڧߧ���_�ާڧߧ���_�ާڧߧ��',
        'hh': '��ѧ�_��ѧ��_��ѧ���',
        'dd': '�է֧ߧ�_�էߧ�_�էߧ֧�',
        'MM': '�ާ֧���_�ާ֧����_�ާ֧���֧�',
        'yy': '�ԧ��_�ԧ�է�_�ݧ֧�'
    };
    if (key === 'm') {
        return withoutSuffix ? '�ާڧߧ���' : '�ާڧߧ���';
    }
    else {
        return number + ' ' + plural$4(format[key], +number);
    }
}
var monthsParse$2 = [/^��ߧ�/i, /^��֧�/i, /^�ާѧ�/i, /^�ѧ��/i, /^�ާ�[�ۧ�]/i, /^�ڧ��/i, /^�ڧ��/i, /^�ѧӧ�/i, /^��֧�/i, /^��ܧ�/i, /^�ߧ��/i, /^�է֧�/i];

// http://new.gramota.ru/spravka/rules/139-prop : �� 103
// ����ܧ�ѧ�֧ߧڧ� �ާ֧���֧�: http://new.gramota.ru/spravka/buro/search-answer?s=242637
// CLDR data:          http://www.unicode.org/cldr/charts/28/summary/ru.html#1753
hooks.defineLocale('ru', {
    months : {
        format: '��ߧӧѧ��_��֧ӧ�ѧݧ�_�ާѧ���_�ѧ��֧ݧ�_�ާѧ�_�ڧ�ߧ�_�ڧ�ݧ�_�ѧӧԧ����_��֧ߧ��ҧ��_��ܧ��ҧ��_�ߧ��ҧ��_�է֧ܧѧҧ��'.split('_'),
        standalone: '��ߧӧѧ��_��֧ӧ�ѧݧ�_�ާѧ��_�ѧ��֧ݧ�_�ާѧ�_�ڧ�ߧ�_�ڧ�ݧ�_�ѧӧԧ���_��֧ߧ��ҧ��_��ܧ��ҧ��_�ߧ��ҧ��_�է֧ܧѧҧ��'.split('_')
    },
    monthsShort : {
        // ��� CLDR �ڧާ֧ߧߧ� "�ڧ��." �� "�ڧ��.", �ߧ� �ܧѧܧ�� ��ާ��� �ާ֧ߧ��� �ҧ�ܧӧ� �ߧ� ����ܧ� ?
        format: '��ߧ�._��֧ӧ�._�ާѧ�._�ѧ��._�ާѧ�_�ڧ�ߧ�_�ڧ�ݧ�_�ѧӧ�._��֧ߧ�._��ܧ�._�ߧ���._�է֧�.'.split('_'),
        standalone: '��ߧ�._��֧ӧ�._�ާѧ��_�ѧ��._�ާѧ�_�ڧ�ߧ�_�ڧ�ݧ�_�ѧӧ�._��֧ߧ�._��ܧ�._�ߧ���._�է֧�.'.split('_')
    },
    weekdays : {
        standalone: '�ӧ��ܧ�֧�֧ߧ��_���ߧ֧է֧ݧ�ߧڧ�_�ӧ���ߧڧ�_���֧է�_��֧�ӧ֧��_����ߧڧ��_���ҧҧ���'.split('_'),
        format: '�ӧ��ܧ�֧�֧ߧ��_���ߧ֧է֧ݧ�ߧڧ�_�ӧ���ߧڧ�_���֧է�_��֧�ӧ֧��_����ߧڧ��_���ҧҧ���'.split('_'),
        isFormat: /\[ ?[����] ?(?:�����ݧ��|��ݧ֧է�����|����)? ?\] ?dddd/
    },
    weekdaysShort : '�ӧ�_���_�ӧ�_���_���_���_���'.split('_'),
    weekdaysMin : '�ӧ�_���_�ӧ�_���_���_���_���'.split('_'),
    monthsParse : monthsParse$2,
    longMonthsParse : monthsParse$2,
    shortMonthsParse : monthsParse$2,

    // ���ݧߧ�� �ߧѧ٧ӧѧߧڧ� �� ��ѧէ֧اѧާ�, ��� ���� �ҧ�ܧӧ�, �էݧ� �ߧ֧ܧ������, ��� 4 �ҧ�ܧӧ�, ���ܧ�ѧ�֧ߧڧ� �� ����ܧ�� �� �ҧ֧� ����ܧ�
    monthsRegex: /^(��ߧӧѧ�[���]|��ߧ�\.?|��֧ӧ�ѧ�[���]|��֧ӧ�?\.?|�ާѧ���?|�ާѧ�\.?|�ѧ��֧�[���]|�ѧ��\.?|�ާ�[�ۧ�]|�ڧ��[���]|�ڧ��\.?|�ڧ��[���]|�ڧ��\.?|�ѧӧԧ����?|�ѧӧ�\.?|��֧ߧ��ҧ�[���]|��֧ߧ�?\.?|��ܧ��ҧ�[���]|��ܧ�\.?|�ߧ��ҧ�[���]|�ߧ���?\.?|�է֧ܧѧҧ�[���]|�է֧�\.?)/i,

    // �ܧ��ڧ� ���֧է�է��֧ԧ�
    monthsShortRegex: /^(��ߧӧѧ�[���]|��ߧ�\.?|��֧ӧ�ѧ�[���]|��֧ӧ�?\.?|�ާѧ���?|�ާѧ�\.?|�ѧ��֧�[���]|�ѧ��\.?|�ާ�[�ۧ�]|�ڧ��[���]|�ڧ��\.?|�ڧ��[���]|�ڧ��\.?|�ѧӧԧ����?|�ѧӧ�\.?|��֧ߧ��ҧ�[���]|��֧ߧ�?\.?|��ܧ��ҧ�[���]|��ܧ�\.?|�ߧ��ҧ�[���]|�ߧ���?\.?|�է֧ܧѧҧ�[���]|�է֧�\.?)/i,

    // ���ݧߧ�� �ߧѧ٧ӧѧߧڧ� �� ��ѧէ֧اѧާ�
    monthsStrictRegex: /^(��ߧӧѧ�[���]|��֧ӧ�ѧ�[���]|�ާѧ���?|�ѧ��֧�[���]|�ާ�[���]|�ڧ��[���]|�ڧ��[���]|�ѧӧԧ����?|��֧ߧ��ҧ�[���]|��ܧ��ҧ�[���]|�ߧ��ҧ�[���]|�է֧ܧѧҧ�[���])/i,

    // �����ѧا֧ߧڧ�, �ܧ������ �����ӧ֧��ӧ�֧� ���ݧ�ܧ� ���ܧ�ѧ�קߧߧ�� ����ާѧ�
    monthsShortStrictRegex: /^(��ߧ�\.|��֧ӧ�?\.|�ާѧ�[��.]|�ѧ��\.|�ާ�[���]|�ڧ��[���.]|�ڧ��[���.]|�ѧӧ�\.|��֧ߧ�?\.|��ܧ�\.|�ߧ���?\.|�է֧�\.)/i,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY ��.',
        LLL : 'D MMMM YYYY ��., HH:mm',
        LLLL : 'dddd, D MMMM YYYY ��., HH:mm'
    },
    calendar : {
        sameDay: '[���֧ԧ�էߧ� ��] LT',
        nextDay: '[���ѧӧ��� ��] LT',
        lastDay: '[����֧�� ��] LT',
        nextWeek: function (now) {
            if (now.week() !== this.week()) {
                switch (this.day()) {
                    case 0:
                        return '[�� ��ݧ֧է���֧�] dddd [��] LT';
                    case 1:
                    case 2:
                    case 4:
                        return '[�� ��ݧ֧է���ڧ�] dddd [��] LT';
                    case 3:
                    case 5:
                    case 6:
                        return '[�� ��ݧ֧է�����] dddd [��] LT';
                }
            } else {
                if (this.day() === 2) {
                    return '[����] dddd [��] LT';
                } else {
                    return '[��] dddd [��] LT';
                }
            }
        },
        lastWeek: function (now) {
            if (now.week() !== this.week()) {
                switch (this.day()) {
                    case 0:
                        return '[�� �����ݧ��] dddd [��] LT';
                    case 1:
                    case 2:
                    case 4:
                        return '[�� �����ݧ��] dddd [��] LT';
                    case 3:
                    case 5:
                    case 6:
                        return '[�� �����ݧ��] dddd [��] LT';
                }
            } else {
                if (this.day() === 2) {
                    return '[����] dddd [��] LT';
                } else {
                    return '[��] dddd [��] LT';
                }
            }
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : '��֧�֧� %s',
        past : '%s �ߧѧ٧ѧ�',
        s : '�ߧ֧�ܧ�ݧ�ܧ� ��֧ܧ�ߧ�',
        m : relativeTimeWithPlural$3,
        mm : relativeTimeWithPlural$3,
        h : '��ѧ�',
        hh : relativeTimeWithPlural$3,
        d : '�է֧ߧ�',
        dd : relativeTimeWithPlural$3,
        M : '�ާ֧���',
        MM : relativeTimeWithPlural$3,
        y : '�ԧ��',
        yy : relativeTimeWithPlural$3
    },
    meridiemParse: /�ߧ���|�����|�էߧ�|�ӧ֧�֧��/i,
    isPM : function (input) {
        return /^(�էߧ�|�ӧ֧�֧��)$/.test(input);
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 4) {
            return '�ߧ���';
        } else if (hour < 12) {
            return '�����';
        } else if (hour < 17) {
            return '�էߧ�';
        } else {
            return '�ӧ֧�֧��';
        }
    },
    ordinalParse: /\d{1,2}-(��|�ԧ�|��)/,
    ordinal: function (number, period) {
        switch (period) {
            case 'M':
            case 'd':
            case 'DDD':
                return number + '-��';
            case 'D':
                return number + '-�ԧ�';
            case 'w':
            case 'W':
                return number + '-��';
            default:
                return number;
        }
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Northern Sami [se]
//! authors : B?rd Rolstad Henriksen : https://github.com/karamell


hooks.defineLocale('se', {
    months : 'o??ajagem��nnu_guovvam��nnu_njuk?am��nnu_cuo?om��nnu_miessem��nnu_geassem��nnu_suoidnem��nnu_borgem��nnu_?ak?am��nnu_golggotm��nnu_sk��bmam��nnu_juovlam��nnu'.split('_'),
    monthsShort : 'o??j_guov_njuk_cuo_mies_geas_suoi_borg_?ak?_golg_sk��b_juov'.split('_'),
    weekdays : 'sotnabeaivi_vuoss��rga_ma??eb��rga_gaskavahkku_duorastat_bearjadat_l��vvardat'.split('_'),
    weekdaysShort : 'sotn_vuos_ma?_gask_duor_bear_l��v'.split('_'),
    weekdaysMin : 's_v_m_g_d_b_L'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'MMMM D. [b.] YYYY',
        LLL : 'MMMM D. [b.] YYYY [ti.] HH:mm',
        LLLL : 'dddd, MMMM D. [b.] YYYY [ti.] HH:mm'
    },
    calendar : {
        sameDay: '[otne ti] LT',
        nextDay: '[ihttin ti] LT',
        nextWeek: 'dddd [ti] LT',
        lastDay: '[ikte ti] LT',
        lastWeek: '[ovddit] dddd [ti] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : '%s gea?es',
        past : 'ma?it %s',
        s : 'moadde sekunddat',
        m : 'okta minuhta',
        mm : '%d minuhtat',
        h : 'okta diimmu',
        hh : '%d diimmut',
        d : 'okta beaivi',
        dd : '%d beaivvit',
        M : 'okta m��nnu',
        MM : '%d m��nut',
        y : 'okta jahki',
        yy : '%d jagit'
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Sinhalese [si]
//! author : Sampath Sitinamaluwa : https://github.com/sampathsris

/*jshint -W100*/
hooks.defineLocale('si', {
    months : '??????_????????_??????_????????_????_????_????_???????_???????????_????????_?????????_?????????'.split('_'),
    monthsShort : '??_???_????_???_????_????_????_???_????_???_????_????'.split('_'),
    weekdays : '?????_?????_?????????_?????_??????????????_????????_?????????'.split('_'),
    weekdaysShort : '???_???_??_???_?????_????_???'.split('_'),
    weekdaysMin : '?_?_?_?_????_??_??'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'a h:mm',
        LTS : 'a h:mm:ss',
        L : 'YYYY/MM/DD',
        LL : 'YYYY MMMM D',
        LLL : 'YYYY MMMM D, a h:mm',
        LLLL : 'YYYY MMMM D [????] dddd, a h:mm:ss'
    },
    calendar : {
        sameDay : '[??] LT[?]',
        nextDay : '[???] LT[?]',
        nextWeek : 'dddd LT[?]',
        lastDay : '[???] LT[?]',
        lastWeek : '[??????] dddd LT[?]',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s????',
        past : '%s?? ???',
        s : '????? ??????',
        m : '?????????',
        mm : '???????? %d',
        h : '???',
        hh : '??? %d',
        d : '????',
        dd : '??? %d',
        M : '????',
        MM : '??? %d',
        y : '???',
        yy : '??? %d'
    },
    ordinalParse: /\d{1,2} ????/,
    ordinal : function (number) {
        return number + ' ????';
    },
    meridiemParse : /??? ???|??? ???|??.?|?.?./,
    isPM : function (input) {
        return input === '?.?.' || input === '??? ???';
    },
    meridiem : function (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? '?.?.' : '??? ???';
        } else {
            return isLower ? '??.?.' : '??? ???';
        }
    }
});

//! moment.js locale configuration
//! locale : Slovak [sk]
//! author : Martin Minka : https://github.com/k2s
//! based on work of petrbela : https://github.com/petrbela

var months$6 = 'janu��r_febru��r_marec_apr��l_m��j_j��n_j��l_august_september_okt��ber_november_december'.split('_');
var monthsShort$4 = 'jan_feb_mar_apr_m��j_j��n_j��l_aug_sep_okt_nov_dec'.split('_');
function plural$5(n) {
    return (n > 1) && (n < 5);
}
function translate$8(number, withoutSuffix, key, isFuture) {
    var result = number + ' ';
    switch (key) {
        case 's':  // a few seconds / in a few seconds / a few seconds ago
            return (withoutSuffix || isFuture) ? 'p��r sek��nd' : 'p��r sekundami';
        case 'm':  // a minute / in a minute / a minute ago
            return withoutSuffix ? 'min��ta' : (isFuture ? 'min��tu' : 'min��tou');
        case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
            if (withoutSuffix || isFuture) {
                return result + (plural$5(number) ? 'min��ty' : 'min��t');
            } else {
                return result + 'min��tami';
            }
            break;
        case 'h':  // an hour / in an hour / an hour ago
            return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
        case 'hh': // 9 hours / in 9 hours / 9 hours ago
            if (withoutSuffix || isFuture) {
                return result + (plural$5(number) ? 'hodiny' : 'hod��n');
            } else {
                return result + 'hodinami';
            }
            break;
        case 'd':  // a day / in a day / a day ago
            return (withoutSuffix || isFuture) ? 'de��' : 'd��om';
        case 'dd': // 9 days / in 9 days / 9 days ago
            if (withoutSuffix || isFuture) {
                return result + (plural$5(number) ? 'dni' : 'dn��');
            } else {
                return result + 'd��ami';
            }
            break;
        case 'M':  // a month / in a month / a month ago
            return (withoutSuffix || isFuture) ? 'mesiac' : 'mesiacom';
        case 'MM': // 9 months / in 9 months / 9 months ago
            if (withoutSuffix || isFuture) {
                return result + (plural$5(number) ? 'mesiace' : 'mesiacov');
            } else {
                return result + 'mesiacmi';
            }
            break;
        case 'y':  // a year / in a year / a year ago
            return (withoutSuffix || isFuture) ? 'rok' : 'rokom';
        case 'yy': // 9 years / in 9 years / 9 years ago
            if (withoutSuffix || isFuture) {
                return result + (plural$5(number) ? 'roky' : 'rokov');
            } else {
                return result + 'rokmi';
            }
            break;
    }
}

hooks.defineLocale('sk', {
    months : months$6,
    monthsShort : monthsShort$4,
    weekdays : 'nede?a_pondelok_utorok_streda_?tvrtok_piatok_sobota'.split('_'),
    weekdaysShort : 'ne_po_ut_st_?t_pi_so'.split('_'),
    weekdaysMin : 'ne_po_ut_st_?t_pi_so'.split('_'),
    longDateFormat : {
        LT: 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY H:mm',
        LLLL : 'dddd D. MMMM YYYY H:mm'
    },
    calendar : {
        sameDay: '[dnes o] LT',
        nextDay: '[zajtra o] LT',
        nextWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[v nede?u o] LT';
                case 1:
                case 2:
                    return '[v] dddd [o] LT';
                case 3:
                    return '[v stredu o] LT';
                case 4:
                    return '[vo ?tvrtok o] LT';
                case 5:
                    return '[v piatok o] LT';
                case 6:
                    return '[v sobotu o] LT';
            }
        },
        lastDay: '[v?era o] LT',
        lastWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[minul�� nede?u o] LT';
                case 1:
                case 2:
                    return '[minuly] dddd [o] LT';
                case 3:
                    return '[minul�� stredu o] LT';
                case 4:
                case 5:
                    return '[minuly] dddd [o] LT';
                case 6:
                    return '[minul�� sobotu o] LT';
            }
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : 'za %s',
        past : 'pred %s',
        s : translate$8,
        m : translate$8,
        mm : translate$8,
        h : translate$8,
        hh : translate$8,
        d : translate$8,
        dd : translate$8,
        M : translate$8,
        MM : translate$8,
        y : translate$8,
        yy : translate$8
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Slovenian [sl]
//! author : Robert Sedov?ek : https://github.com/sedovsek

function processRelativeTime$4(number, withoutSuffix, key, isFuture) {
    var result = number + ' ';
    switch (key) {
        case 's':
            return withoutSuffix || isFuture ? 'nekaj sekund' : 'nekaj sekundami';
        case 'm':
            return withoutSuffix ? 'ena minuta' : 'eno minuto';
        case 'mm':
            if (number === 1) {
                result += withoutSuffix ? 'minuta' : 'minuto';
            } else if (number === 2) {
                result += withoutSuffix || isFuture ? 'minuti' : 'minutama';
            } else if (number < 5) {
                result += withoutSuffix || isFuture ? 'minute' : 'minutami';
            } else {
                result += withoutSuffix || isFuture ? 'minut' : 'minutami';
            }
            return result;
        case 'h':
            return withoutSuffix ? 'ena ura' : 'eno uro';
        case 'hh':
            if (number === 1) {
                result += withoutSuffix ? 'ura' : 'uro';
            } else if (number === 2) {
                result += withoutSuffix || isFuture ? 'uri' : 'urama';
            } else if (number < 5) {
                result += withoutSuffix || isFuture ? 'ure' : 'urami';
            } else {
                result += withoutSuffix || isFuture ? 'ur' : 'urami';
            }
            return result;
        case 'd':
            return withoutSuffix || isFuture ? 'en dan' : 'enim dnem';
        case 'dd':
            if (number === 1) {
                result += withoutSuffix || isFuture ? 'dan' : 'dnem';
            } else if (number === 2) {
                result += withoutSuffix || isFuture ? 'dni' : 'dnevoma';
            } else {
                result += withoutSuffix || isFuture ? 'dni' : 'dnevi';
            }
            return result;
        case 'M':
            return withoutSuffix || isFuture ? 'en mesec' : 'enim mesecem';
        case 'MM':
            if (number === 1) {
                result += withoutSuffix || isFuture ? 'mesec' : 'mesecem';
            } else if (number === 2) {
                result += withoutSuffix || isFuture ? 'meseca' : 'mesecema';
            } else if (number < 5) {
                result += withoutSuffix || isFuture ? 'mesece' : 'meseci';
            } else {
                result += withoutSuffix || isFuture ? 'mesecev' : 'meseci';
            }
            return result;
        case 'y':
            return withoutSuffix || isFuture ? 'eno leto' : 'enim letom';
        case 'yy':
            if (number === 1) {
                result += withoutSuffix || isFuture ? 'leto' : 'letom';
            } else if (number === 2) {
                result += withoutSuffix || isFuture ? 'leti' : 'letoma';
            } else if (number < 5) {
                result += withoutSuffix || isFuture ? 'leta' : 'leti';
            } else {
                result += withoutSuffix || isFuture ? 'let' : 'leti';
            }
            return result;
    }
}

hooks.defineLocale('sl', {
    months : 'januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december'.split('_'),
    monthsShort : 'jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.'.split('_'),
    monthsParseExact: true,
    weekdays : 'nedelja_ponedeljek_torek_sreda_?etrtek_petek_sobota'.split('_'),
    weekdaysShort : 'ned._pon._tor._sre._?et._pet._sob.'.split('_'),
    weekdaysMin : 'ne_po_to_sr_?e_pe_so'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM YYYY',
        LLL : 'D. MMMM YYYY H:mm',
        LLLL : 'dddd, D. MMMM YYYY H:mm'
    },
    calendar : {
        sameDay  : '[danes ob] LT',
        nextDay  : '[jutri ob] LT',

        nextWeek : function () {
            switch (this.day()) {
                case 0:
                    return '[v] [nedeljo] [ob] LT';
                case 3:
                    return '[v] [sredo] [ob] LT';
                case 6:
                    return '[v] [soboto] [ob] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[v] dddd [ob] LT';
            }
        },
        lastDay  : '[v?eraj ob] LT',
        lastWeek : function () {
            switch (this.day()) {
                case 0:
                    return '[prej?njo] [nedeljo] [ob] LT';
                case 3:
                    return '[prej?njo] [sredo] [ob] LT';
                case 6:
                    return '[prej?njo] [soboto] [ob] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[prej?nji] dddd [ob] LT';
            }
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : '?ez %s',
        past   : 'pred %s',
        s      : processRelativeTime$4,
        m      : processRelativeTime$4,
        mm     : processRelativeTime$4,
        h      : processRelativeTime$4,
        hh     : processRelativeTime$4,
        d      : processRelativeTime$4,
        dd     : processRelativeTime$4,
        M      : processRelativeTime$4,
        MM     : processRelativeTime$4,
        y      : processRelativeTime$4,
        yy     : processRelativeTime$4
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Albanian [sq]
//! author : Flak?rim Ismani : https://github.com/flakerimi
//! author : Menelion Elens��le : https://github.com/Oire
//! author : Oerd Cukalla : https://github.com/oerd

hooks.defineLocale('sq', {
    months : 'Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_N?ntor_Dhjetor'.split('_'),
    monthsShort : 'Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_N?n_Dhj'.split('_'),
    weekdays : 'E Diel_E H?n?_E Mart?_E M?rkur?_E Enjte_E Premte_E Shtun?'.split('_'),
    weekdaysShort : 'Die_H?n_Mar_M?r_Enj_Pre_Sht'.split('_'),
    weekdaysMin : 'D_H_Ma_M?_E_P_Sh'.split('_'),
    weekdaysParseExact : true,
    meridiemParse: /PD|MD/,
    isPM: function (input) {
        return input.charAt(0) === 'M';
    },
    meridiem : function (hours, minutes, isLower) {
        return hours < 12 ? 'PD' : 'MD';
    },
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[Sot n?] LT',
        nextDay : '[Nes?r n?] LT',
        nextWeek : 'dddd [n?] LT',
        lastDay : '[Dje n?] LT',
        lastWeek : 'dddd [e kaluar n?] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'n? %s',
        past : '%s m? par?',
        s : 'disa sekonda',
        m : 'nj? minut?',
        mm : '%d minuta',
        h : 'nj? or?',
        hh : '%d or?',
        d : 'nj? dit?',
        dd : '%d dit?',
        M : 'nj? muaj',
        MM : '%d muaj',
        y : 'nj? vit',
        yy : '%d vite'
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Serbian Cyrillic [sr-cyrl]
//! author : Milan Jana?kovi?<milanjanackovic@gmail.com> : https://github.com/milan-j

var translator$1 = {
    words: { //Different grammatical cases
        m: ['?�֧էѧ� �ާڧߧ��', '?�֧էߧ� �ާڧߧ���'],
        mm: ['�ާڧߧ��', '�ާڧߧ���', '�ާڧߧ���'],
        h: ['?�֧էѧ� ��ѧ�', '?�֧էߧ�� ��ѧ��'],
        hh: ['��ѧ�', '��ѧ��', '��ѧ��'],
        dd: ['�էѧ�', '�էѧߧ�', '�էѧߧ�'],
        MM: ['�ާ֧�֧�', '�ާ֧�֧��', '�ާ֧�֧��'],
        yy: ['�ԧ�էڧߧ�', '�ԧ�էڧߧ�', '�ԧ�էڧߧ�']
    },
    correctGrammaticalCase: function (number, wordKey) {
        return number === 1 ? wordKey[0] : (number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]);
    },
    translate: function (number, withoutSuffix, key) {
        var wordKey = translator$1.words[key];
        if (key.length === 1) {
            return withoutSuffix ? wordKey[0] : wordKey[1];
        } else {
            return number + ' ' + translator$1.correctGrammaticalCase(number, wordKey);
        }
    }
};

hooks.defineLocale('sr-cyrl', {
    months: '?�ѧߧ�ѧ�_��֧ҧ��ѧ�_�ާѧ��_�ѧ��ڧ�_�ާ�?_?���_?���_�ѧӧԧ���_��֧��֧ާҧѧ�_��ܧ��ҧѧ�_�ߧ�ӧ֧ާҧѧ�_�է֧�֧ާҧѧ�'.split('_'),
    monthsShort: '?�ѧ�._��֧�._�ާѧ�._�ѧ��._�ާ�?_?���_?���_�ѧӧ�._��֧�._��ܧ�._�ߧ��._�է֧�.'.split('_'),
    monthsParseExact: true,
    weekdays: '�ߧ֧է�?��_���ߧ֧է�?�ѧ�_�����ѧ�_���֧է�_��֧�ӧ��ѧ�_��֧�ѧ�_���ҧ���'.split('_'),
    weekdaysShort: '�ߧ֧�._����._����._����._��֧�._��֧�._����.'.split('_'),
    weekdaysMin: '�ߧ�_���_���_���_���_���_���'.split('_'),
    weekdaysParseExact : true,
    longDateFormat: {
        LT: 'H:mm',
        LTS : 'H:mm:ss',
        L: 'DD.MM.YYYY',
        LL: 'D. MMMM YYYY',
        LLL: 'D. MMMM YYYY H:mm',
        LLLL: 'dddd, D. MMMM YYYY H:mm'
    },
    calendar: {
        sameDay: '[�էѧߧѧ� ��] LT',
        nextDay: '[������ ��] LT',
        nextWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[��] [�ߧ֧է�?��] [��] LT';
                case 3:
                    return '[��] [���֧է�] [��] LT';
                case 6:
                    return '[��] [���ҧ���] [��] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[��] dddd [��] LT';
            }
        },
        lastDay  : '[?���� ��] LT',
        lastWeek : function () {
            var lastWeekDays = [
                '[�����ݧ�] [�ߧ֧է�?��] [��] LT',
                '[�����ݧ��] [���ߧ֧է�?�ܧ�] [��] LT',
                '[�����ݧ��] [�����ܧ�] [��] LT',
                '[�����ݧ�] [���֧է�] [��] LT',
                '[�����ݧ��] [��֧�ӧ��ܧ�] [��] LT',
                '[�����ݧ��] [��֧�ܧ�] [��] LT',
                '[�����ݧ�] [���ҧ���] [��] LT'
            ];
            return lastWeekDays[this.day()];
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : '�٧� %s',
        past   : '���� %s',
        s      : '�ߧ֧ܧ�ݧڧܧ� ��֧ܧ�ߧէ�',
        m      : translator$1.translate,
        mm     : translator$1.translate,
        h      : translator$1.translate,
        hh     : translator$1.translate,
        d      : '�էѧ�',
        dd     : translator$1.translate,
        M      : '�ާ֧�֧�',
        MM     : translator$1.translate,
        y      : '�ԧ�էڧߧ�',
        yy     : translator$1.translate
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Serbian [sr]
//! author : Milan Jana?kovi?<milanjanackovic@gmail.com> : https://github.com/milan-j

var translator$2 = {
    words: { //Different grammatical cases
        m: ['jedan minut', 'jedne minute'],
        mm: ['minut', 'minute', 'minuta'],
        h: ['jedan sat', 'jednog sata'],
        hh: ['sat', 'sata', 'sati'],
        dd: ['dan', 'dana', 'dana'],
        MM: ['mesec', 'meseca', 'meseci'],
        yy: ['godina', 'godine', 'godina']
    },
    correctGrammaticalCase: function (number, wordKey) {
        return number === 1 ? wordKey[0] : (number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]);
    },
    translate: function (number, withoutSuffix, key) {
        var wordKey = translator$2.words[key];
        if (key.length === 1) {
            return withoutSuffix ? wordKey[0] : wordKey[1];
        } else {
            return number + ' ' + translator$2.correctGrammaticalCase(number, wordKey);
        }
    }
};

hooks.defineLocale('sr', {
    months: 'januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar'.split('_'),
    monthsShort: 'jan._feb._mar._apr._maj_jun_jul_avg._sep._okt._nov._dec.'.split('_'),
    monthsParseExact: true,
    weekdays: 'nedelja_ponedeljak_utorak_sreda_?etvrtak_petak_subota'.split('_'),
    weekdaysShort: 'ned._pon._uto._sre._?et._pet._sub.'.split('_'),
    weekdaysMin: 'ne_po_ut_sr_?e_pe_su'.split('_'),
    weekdaysParseExact : true,
    longDateFormat: {
        LT: 'H:mm',
        LTS : 'H:mm:ss',
        L: 'DD.MM.YYYY',
        LL: 'D. MMMM YYYY',
        LLL: 'D. MMMM YYYY H:mm',
        LLLL: 'dddd, D. MMMM YYYY H:mm'
    },
    calendar: {
        sameDay: '[danas u] LT',
        nextDay: '[sutra u] LT',
        nextWeek: function () {
            switch (this.day()) {
                case 0:
                    return '[u] [nedelju] [u] LT';
                case 3:
                    return '[u] [sredu] [u] LT';
                case 6:
                    return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[u] dddd [u] LT';
            }
        },
        lastDay  : '[ju?e u] LT',
        lastWeek : function () {
            var lastWeekDays = [
                '[pro?le] [nedelje] [u] LT',
                '[pro?log] [ponedeljka] [u] LT',
                '[pro?log] [utorka] [u] LT',
                '[pro?le] [srede] [u] LT',
                '[pro?log] [?etvrtka] [u] LT',
                '[pro?log] [petka] [u] LT',
                '[pro?le] [subote] [u] LT'
            ];
            return lastWeekDays[this.day()];
        },
        sameElse : 'L'
    },
    relativeTime : {
        future : 'za %s',
        past   : 'pre %s',
        s      : 'nekoliko sekundi',
        m      : translator$2.translate,
        mm     : translator$2.translate,
        h      : translator$2.translate,
        hh     : translator$2.translate,
        d      : 'dan',
        dd     : translator$2.translate,
        M      : 'mesec',
        MM     : translator$2.translate,
        y      : 'godinu',
        yy     : translator$2.translate
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : siSwati [ss]
//! author : Nicolai Davies<mail@nicolai.io> : https://github.com/nicolaidavies


hooks.defineLocale('ss', {
    months : "Bhimbidvwane_Indlovana_Indlov'lenkhulu_Mabasa_Inkhwekhweti_Inhlaba_Kholwane_Ingci_Inyoni_Imphala_Lweti_Ingongoni".split('_'),
    monthsShort : 'Bhi_Ina_Inu_Mab_Ink_Inh_Kho_Igc_Iny_Imp_Lwe_Igo'.split('_'),
    weekdays : 'Lisontfo_Umsombuluko_Lesibili_Lesitsatfu_Lesine_Lesihlanu_Umgcibelo'.split('_'),
    weekdaysShort : 'Lis_Umb_Lsb_Les_Lsi_Lsh_Umg'.split('_'),
    weekdaysMin : 'Li_Us_Lb_Lt_Ls_Lh_Ug'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'h:mm A',
        LTS : 'h:mm:ss A',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY h:mm A',
        LLLL : 'dddd, D MMMM YYYY h:mm A'
    },
    calendar : {
        sameDay : '[Namuhla nga] LT',
        nextDay : '[Kusasa nga] LT',
        nextWeek : 'dddd [nga] LT',
        lastDay : '[Itolo nga] LT',
        lastWeek : 'dddd [leliphelile] [nga] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'nga %s',
        past : 'wenteka nga %s',
        s : 'emizuzwana lomcane',
        m : 'umzuzu',
        mm : '%d emizuzu',
        h : 'lihora',
        hh : '%d emahora',
        d : 'lilanga',
        dd : '%d emalanga',
        M : 'inyanga',
        MM : '%d tinyanga',
        y : 'umnyaka',
        yy : '%d iminyaka'
    },
    meridiemParse: /ekuseni|emini|entsambama|ebusuku/,
    meridiem : function (hours, minutes, isLower) {
        if (hours < 11) {
            return 'ekuseni';
        } else if (hours < 15) {
            return 'emini';
        } else if (hours < 19) {
            return 'entsambama';
        } else {
            return 'ebusuku';
        }
    },
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === 'ekuseni') {
            return hour;
        } else if (meridiem === 'emini') {
            return hour >= 11 ? hour : hour + 12;
        } else if (meridiem === 'entsambama' || meridiem === 'ebusuku') {
            if (hour === 0) {
                return 0;
            }
            return hour + 12;
        }
    },
    ordinalParse: /\d{1,2}/,
    ordinal : '%d',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Swedish [sv]
//! author : Jens Alm : https://github.com/ulmus

hooks.defineLocale('sv', {
    months : 'januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december'.split('_'),
    monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
    weekdays : 's?ndag_m?ndag_tisdag_onsdag_torsdag_fredag_l?rdag'.split('_'),
    weekdaysShort : 's?n_m?n_tis_ons_tor_fre_l?r'.split('_'),
    weekdaysMin : 's?_m?_ti_on_to_fr_l?'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'YYYY-MM-DD',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY [kl.] HH:mm',
        LLLL : 'dddd D MMMM YYYY [kl.] HH:mm',
        lll : 'D MMM YYYY HH:mm',
        llll : 'ddd D MMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[Idag] LT',
        nextDay: '[Imorgon] LT',
        lastDay: '[Ig?r] LT',
        nextWeek: '[P?] dddd LT',
        lastWeek: '[I] dddd[s] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'om %s',
        past : 'f?r %s sedan',
        s : 'n?gra sekunder',
        m : 'en minut',
        mm : '%d minuter',
        h : 'en timme',
        hh : '%d timmar',
        d : 'en dag',
        dd : '%d dagar',
        M : 'en m?nad',
        MM : '%d m?nader',
        y : 'ett ?r',
        yy : '%d ?r'
    },
    ordinalParse: /\d{1,2}(e|a)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (~~(number % 100 / 10) === 1) ? 'e' :
            (b === 1) ? 'a' :
            (b === 2) ? 'a' :
            (b === 3) ? 'e' : 'e';
        return number + output;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Swahili [sw]
//! author : Fahad Kassim : https://github.com/fadsel

hooks.defineLocale('sw', {
    months : 'Januari_Februari_Machi_Aprili_Mei_Juni_Julai_Agosti_Septemba_Oktoba_Novemba_Desemba'.split('_'),
    monthsShort : 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ago_Sep_Okt_Nov_Des'.split('_'),
    weekdays : 'Jumapili_Jumatatu_Jumanne_Jumatano_Alhamisi_Ijumaa_Jumamosi'.split('_'),
    weekdaysShort : 'Jpl_Jtat_Jnne_Jtan_Alh_Ijm_Jmos'.split('_'),
    weekdaysMin : 'J2_J3_J4_J5_Al_Ij_J1'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[leo saa] LT',
        nextDay : '[kesho saa] LT',
        nextWeek : '[wiki ijayo] dddd [saat] LT',
        lastDay : '[jana] LT',
        lastWeek : '[wiki iliyopita] dddd [saat] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s baadaye',
        past : 'tokea %s',
        s : 'hivi punde',
        m : 'dakika moja',
        mm : 'dakika %d',
        h : 'saa limoja',
        hh : 'masaa %d',
        d : 'siku moja',
        dd : 'masiku %d',
        M : 'mwezi mmoja',
        MM : 'miezi %d',
        y : 'mwaka mmoja',
        yy : 'miaka %d'
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Tamil [ta]
//! author : Arjunkumar Krishnamoorthy : https://github.com/tk120404

var symbolMap$11 = {
    '1': '?',
    '2': '?',
    '3': '?',
    '4': '?',
    '5': '?',
    '6': '?',
    '7': '?',
    '8': '?',
    '9': '?',
    '0': '?'
};
var numberMap$10 = {
    '?': '1',
    '?': '2',
    '?': '3',
    '?': '4',
    '?': '5',
    '?': '6',
    '?': '7',
    '?': '8',
    '?': '9',
    '?': '0'
};

hooks.defineLocale('ta', {
    months : '?????_????????_??????_??????_??_????_????_??????_???????????_?????????_???????_????????'.split('_'),
    monthsShort : '?????_????????_??????_??????_??_????_????_??????_???????????_?????????_???????_????????'.split('_'),
    weekdays : '???????????????_????????????_?????????????_??????????_????????????_?????????????_??????????'.split('_'),
    weekdaysShort : '??????_???????_????????_?????_???????_??????_???'.split('_'),
    weekdaysMin : '??_??_??_??_??_??_?'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY, HH:mm',
        LLLL : 'dddd, D MMMM YYYY, HH:mm'
    },
    calendar : {
        sameDay : '[?????] LT',
        nextDay : '[????] LT',
        nextWeek : 'dddd, LT',
        lastDay : '[??????] LT',
        lastWeek : '[????? ?????] dddd, LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s ???',
        past : '%s ????',
        s : '??? ??? ?????????',
        m : '??? ???????',
        mm : '%d ??????????',
        h : '??? ??? ?????',
        hh : '%d ??? ?????',
        d : '??? ????',
        dd : '%d ???????',
        M : '??? ?????',
        MM : '%d ????????',
        y : '??? ??????',
        yy : '%d ????????'
    },
    ordinalParse: /\d{1,2}???/,
    ordinal : function (number) {
        return number + '???';
    },
    preparse: function (string) {
        return string.replace(/[??????????]/g, function (match) {
            return numberMap$10[match];
        });
    },
    postformat: function (string) {
        return string.replace(/\d/g, function (match) {
            return symbolMap$11[match];
        });
    },
    // refer http://ta.wikipedia.org/s/1er1
    meridiemParse: /?????|?????|????|???????|???????|????/,
    meridiem : function (hour, minute, isLower) {
        if (hour < 2) {
            return ' ?????';
        } else if (hour < 6) {
            return ' ?????';  // ?????
        } else if (hour < 10) {
            return ' ????'; // ????
        } else if (hour < 14) {
            return ' ???????'; // ???????
        } else if (hour < 18) {
            return ' ???????'; // ???????
        } else if (hour < 22) {
            return ' ????'; // ????
        } else {
            return ' ?????';
        }
    },
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '?????') {
            return hour < 2 ? hour : hour + 12;
        } else if (meridiem === '?????' || meridiem === '????') {
            return hour;
        } else if (meridiem === '???????') {
            return hour >= 10 ? hour : hour + 12;
        } else {
            return hour + 12;
        }
    },
    week : {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Telugu [te]
//! author : Krishna Chaitanya Thota : https://github.com/kcthota

hooks.defineLocale('te', {
    months : '?????_????????_??????_???????_??_????_?????_??????_??????????_????????_??????_????????'.split('_'),
    monthsShort : '??._?????._??????_?????._??_????_?????_??._????._?????._??._????.'.split('_'),
    monthsParseExact : true,
    weekdays : '???????_???????_????????_???????_????????_?????????_???????'.split('_'),
    weekdaysShort : '???_???_????_???_????_?????_???'.split('_'),
    weekdaysMin : '?_??_??_??_??_??_?'.split('_'),
    longDateFormat : {
        LT : 'A h:mm',
        LTS : 'A h:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY, A h:mm',
        LLLL : 'dddd, D MMMM YYYY, A h:mm'
    },
    calendar : {
        sameDay : '[????] LT',
        nextDay : '[????] LT',
        nextWeek : 'dddd, LT',
        lastDay : '[?????] LT',
        lastWeek : '[??] dddd, LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s ??',
        past : '%s ??????',
        s : '?????? ???????',
        m : '?? ??????',
        mm : '%d ????????',
        h : '?? ???',
        hh : '%d ?????',
        d : '?? ????',
        dd : '%d ??????',
        M : '?? ???',
        MM : '%d ?????',
        y : '?? ????????',
        yy : '%d ??????????'
    },
    ordinalParse : /\d{1,2}?/,
    ordinal : '%d?',
    meridiemParse: /??????|????|?????????|????????/,
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '??????') {
            return hour < 4 ? hour : hour + 12;
        } else if (meridiem === '????') {
            return hour;
        } else if (meridiem === '?????????') {
            return hour >= 10 ? hour : hour + 12;
        } else if (meridiem === '????????') {
            return hour + 12;
        }
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 4) {
            return '??????';
        } else if (hour < 10) {
            return '????';
        } else if (hour < 17) {
            return '?????????';
        } else if (hour < 20) {
            return '????????';
        } else {
            return '??????';
        }
    },
    week : {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Tetun Dili (East Timor) [tet]
//! author : Joshua Brooks : https://github.com/joshbrooks
//! author : Onorio De J. Afonso : https://github.com/marobo

hooks.defineLocale('tet', {
    months : 'Janeiru_Fevereiru_Marsu_Abril_Maiu_Juniu_Juliu_Augustu_Setembru_Outubru_Novembru_Dezembru'.split('_'),
    monthsShort : 'Jan_Fev_Mar_Abr_Mai_Jun_Jul_Aug_Set_Out_Nov_Dez'.split('_'),
    weekdays : 'Domingu_Segunda_Tersa_Kuarta_Kinta_Sexta_Sabadu'.split('_'),
    weekdaysShort : 'Dom_Seg_Ters_Kua_Kint_Sext_Sab'.split('_'),
    weekdaysMin : 'Do_Seg_Te_Ku_Ki_Sex_Sa'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[Ohin iha] LT',
        nextDay: '[Aban iha] LT',
        nextWeek: 'dddd [iha] LT',
        lastDay: '[Horiseik iha] LT',
        lastWeek: 'dddd [semana kotuk] [iha] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'iha %s',
        past : '%s liuba',
        s : 'minutu balun',
        m : 'minutu ida',
        mm : 'minutus %d',
        h : 'horas ida',
        hh : 'horas %d',
        d : 'loron ida',
        dd : 'loron %d',
        M : 'fulan ida',
        MM : 'fulan %d',
        y : 'tinan ida',
        yy : 'tinan %d'
    },
    ordinalParse: /\d{1,2}(st|nd|rd|th)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (~~(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Thai [th]
//! author : Kridsada Thanabulpong : https://github.com/sirn

hooks.defineLocale('th', {
    months : '??????_??????????_??????_??????_???????_????????_???????_???????_???????_??????_?????????_???????'.split('_'),
    monthsShort : '?.?._?.?._??.?._??.?._?.?._??.?._?.?._?.?._?.?._?.?._?.?._?.?.'.split('_'),
    monthsParseExact: true,
    weekdays : '???????_??????_??????_???_????????_?????_?????'.split('_'),
    weekdaysShort : '???????_??????_??????_???_?????_?????_?????'.split('_'), // yes, three characters difference
    weekdaysMin : '??._?._?._?._??._?._?.'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'H:mm',
        LTS : 'H:mm:ss',
        L : 'YYYY/MM/DD',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY ???? H:mm',
        LLLL : '???dddd??? D MMMM YYYY ???? H:mm'
    },
    meridiemParse: /??????????|??????????/,
    isPM: function (input) {
        return input === '??????????';
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 12) {
            return '??????????';
        } else {
            return '??????????';
        }
    },
    calendar : {
        sameDay : '[?????? ????] LT',
        nextDay : '[???????? ????] LT',
        nextWeek : 'dddd[???? ????] LT',
        lastDay : '[??????????? ????] LT',
        lastWeek : '[???]dddd[??????? ????] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '??? %s',
        past : '%s???????',
        s : '????????????',
        m : '1 ????',
        mm : '%d ????',
        h : '1 ???????',
        hh : '%d ???????',
        d : '1 ???',
        dd : '%d ???',
        M : '1 ?????',
        MM : '%d ?????',
        y : '1 ??',
        yy : '%d ??'
    }
});

//! moment.js locale configuration
//! locale : Tagalog (Philippines) [tl-ph]
//! author : Dan Hagman : https://github.com/hagmandan

hooks.defineLocale('tl-ph', {
    months : 'Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre'.split('_'),
    monthsShort : 'Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis'.split('_'),
    weekdays : 'Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado'.split('_'),
    weekdaysShort : 'Lin_Lun_Mar_Miy_Huw_Biy_Sab'.split('_'),
    weekdaysMin : 'Li_Lu_Ma_Mi_Hu_Bi_Sab'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'MM/D/YYYY',
        LL : 'MMMM D, YYYY',
        LLL : 'MMMM D, YYYY HH:mm',
        LLLL : 'dddd, MMMM DD, YYYY HH:mm'
    },
    calendar : {
        sameDay: 'LT [ngayong araw]',
        nextDay: '[Bukas ng] LT',
        nextWeek: 'LT [sa susunod na] dddd',
        lastDay: 'LT [kahapon]',
        lastWeek: 'LT [noong nakaraang] dddd',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'sa loob ng %s',
        past : '%s ang nakalipas',
        s : 'ilang segundo',
        m : 'isang minuto',
        mm : '%d minuto',
        h : 'isang oras',
        hh : '%d oras',
        d : 'isang araw',
        dd : '%d araw',
        M : 'isang buwan',
        MM : '%d buwan',
        y : 'isang taon',
        yy : '%d taon'
    },
    ordinalParse: /\d{1,2}/,
    ordinal : function (number) {
        return number;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Klingon [tlh]
//! author : Dominika Kruk : https://github.com/amaranthrose

var numbersNouns = 'pagh_wa��_cha��_wej_loS_vagh_jav_Soch_chorgh_Hut'.split('_');

function translateFuture(output) {
    var time = output;
    time = (output.indexOf('jaj') !== -1) ?
    time.slice(0, -3) + 'leS' :
    (output.indexOf('jar') !== -1) ?
    time.slice(0, -3) + 'waQ' :
    (output.indexOf('DIS') !== -1) ?
    time.slice(0, -3) + 'nem' :
    time + ' pIq';
    return time;
}

function translatePast(output) {
    var time = output;
    time = (output.indexOf('jaj') !== -1) ?
    time.slice(0, -3) + 'Hu��' :
    (output.indexOf('jar') !== -1) ?
    time.slice(0, -3) + 'wen' :
    (output.indexOf('DIS') !== -1) ?
    time.slice(0, -3) + 'ben' :
    time + ' ret';
    return time;
}

function translate$9(number, withoutSuffix, string, isFuture) {
    var numberNoun = numberAsNoun(number);
    switch (string) {
        case 'mm':
            return numberNoun + ' tup';
        case 'hh':
            return numberNoun + ' rep';
        case 'dd':
            return numberNoun + ' jaj';
        case 'MM':
            return numberNoun + ' jar';
        case 'yy':
            return numberNoun + ' DIS';
    }
}

function numberAsNoun(number) {
    var hundred = Math.floor((number % 1000) / 100),
    ten = Math.floor((number % 100) / 10),
    one = number % 10,
    word = '';
    if (hundred > 0) {
        word += numbersNouns[hundred] + 'vatlh';
    }
    if (ten > 0) {
        word += ((word !== '') ? ' ' : '') + numbersNouns[ten] + 'maH';
    }
    if (one > 0) {
        word += ((word !== '') ? ' ' : '') + numbersNouns[one];
    }
    return (word === '') ? 'pagh' : word;
}

hooks.defineLocale('tlh', {
    months : 'tera�� jar wa��_tera�� jar cha��_tera�� jar wej_tera�� jar loS_tera�� jar vagh_tera�� jar jav_tera�� jar Soch_tera�� jar chorgh_tera�� jar Hut_tera�� jar wa��maH_tera�� jar wa��maH wa��_tera�� jar wa��maH cha��'.split('_'),
    monthsShort : 'jar wa��_jar cha��_jar wej_jar loS_jar vagh_jar jav_jar Soch_jar chorgh_jar Hut_jar wa��maH_jar wa��maH wa��_jar wa��maH cha��'.split('_'),
    monthsParseExact : true,
    weekdays : 'lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj'.split('_'),
    weekdaysShort : 'lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj'.split('_'),
    weekdaysMin : 'lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[DaHjaj] LT',
        nextDay: '[wa��leS] LT',
        nextWeek: 'LLL',
        lastDay: '[wa��Hu��] LT',
        lastWeek: 'LLL',
        sameElse: 'L'
    },
    relativeTime : {
        future : translateFuture,
        past : translatePast,
        s : 'puS lup',
        m : 'wa�� tup',
        mm : translate$9,
        h : 'wa�� rep',
        hh : translate$9,
        d : 'wa�� jaj',
        dd : translate$9,
        M : 'wa�� jar',
        MM : translate$9,
        y : 'wa�� DIS',
        yy : translate$9
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Turkish [tr]
//! authors : Erhan Gundogan : https://github.com/erhangundogan,
//!           Burak Yi?it Kaya: https://github.com/BYK

var suffixes$3 = {
    1: '\'inci',
    5: '\'inci',
    8: '\'inci',
    70: '\'inci',
    80: '\'inci',
    2: '\'nci',
    7: '\'nci',
    20: '\'nci',
    50: '\'nci',
    3: '\'��nc��',
    4: '\'��nc��',
    100: '\'��nc��',
    6: '\'nc?',
    9: '\'uncu',
    10: '\'uncu',
    30: '\'uncu',
    60: '\'?nc?',
    90: '\'?nc?'
};

hooks.defineLocale('tr', {
    months : 'Ocak_?ubat_Mart_Nisan_May?s_Haziran_Temmuz_A?ustos_Eyl��l_Ekim_Kas?m_Aral?k'.split('_'),
    monthsShort : 'Oca_?ub_Mar_Nis_May_Haz_Tem_A?u_Eyl_Eki_Kas_Ara'.split('_'),
    weekdays : 'Pazar_Pazartesi_Sal?_?ar?amba_Per?embe_Cuma_Cumartesi'.split('_'),
    weekdaysShort : 'Paz_Pts_Sal_?ar_Per_Cum_Cts'.split('_'),
    weekdaysMin : 'Pz_Pt_Sa_?a_Pe_Cu_Ct'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[bug��n saat] LT',
        nextDay : '[yar?n saat] LT',
        nextWeek : '[haftaya] dddd [saat] LT',
        lastDay : '[d��n] LT',
        lastWeek : '[ge?en hafta] dddd [saat] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '%s sonra',
        past : '%s ?nce',
        s : 'birka? saniye',
        m : 'bir dakika',
        mm : '%d dakika',
        h : 'bir saat',
        hh : '%d saat',
        d : 'bir g��n',
        dd : '%d g��n',
        M : 'bir ay',
        MM : '%d ay',
        y : 'bir y?l',
        yy : '%d y?l'
    },
    ordinalParse: /\d{1,2}'(inci|nci|��nc��|nc?|uncu|?nc?)/,
    ordinal : function (number) {
        if (number === 0) {  // special case for zero
            return number + '\'?nc?';
        }
        var a = number % 10,
            b = number % 100 - a,
            c = number >= 100 ? 100 : null;
        return number + (suffixes$3[a] || suffixes$3[b] || suffixes$3[c]);
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Talossan [tzl]
//! author : Robin van der Vliet : https://github.com/robin0van0der0v
//! author : Iust�� Canun

// After the year there should be a slash and the amount of years since December 26, 1979 in Roman numerals.
// This is currently too difficult (maybe even impossible) to add.
hooks.defineLocale('tzl', {
    months : 'Januar_Fevraglh_Mar?_Avr?u_Mai_G��n_Julia_Guscht_Setemvar_Listop?ts_Noemvar_Zecemvar'.split('_'),
    monthsShort : 'Jan_Fev_Mar_Avr_Mai_G��n_Jul_Gus_Set_Lis_Noe_Zec'.split('_'),
    weekdays : 'S��ladi_L��ne?i_Maitzi_M��rcuri_Xh��adi_Vi��ner?i_S��turi'.split('_'),
    weekdaysShort : 'S��l_L��n_Mai_M��r_Xh��_Vi��_S��t'.split('_'),
    weekdaysMin : 'S��_L��_Ma_M��_Xh_Vi_S��'.split('_'),
    longDateFormat : {
        LT : 'HH.mm',
        LTS : 'HH.mm.ss',
        L : 'DD.MM.YYYY',
        LL : 'D. MMMM [dallas] YYYY',
        LLL : 'D. MMMM [dallas] YYYY HH.mm',
        LLLL : 'dddd, [li] D. MMMM [dallas] YYYY HH.mm'
    },
    meridiemParse: /d\'o|d\'a/i,
    isPM : function (input) {
        return 'd\'o' === input.toLowerCase();
    },
    meridiem : function (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'd\'o' : 'D\'O';
        } else {
            return isLower ? 'd\'a' : 'D\'A';
        }
    },
    calendar : {
        sameDay : '[oxhi ��] LT',
        nextDay : '[dem�� ��] LT',
        nextWeek : 'dddd [��] LT',
        lastDay : '[ieiri ��] LT',
        lastWeek : '[s��r el] dddd [lasteu ��] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'osprei %s',
        past : 'ja%s',
        s : processRelativeTime$5,
        m : processRelativeTime$5,
        mm : processRelativeTime$5,
        h : processRelativeTime$5,
        hh : processRelativeTime$5,
        d : processRelativeTime$5,
        dd : processRelativeTime$5,
        M : processRelativeTime$5,
        MM : processRelativeTime$5,
        y : processRelativeTime$5,
        yy : processRelativeTime$5
    },
    ordinalParse: /\d{1,2}\./,
    ordinal : '%d.',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

function processRelativeTime$5(number, withoutSuffix, key, isFuture) {
    var format = {
        's': ['viensas secunds', '\'iensas secunds'],
        'm': ['\'n m��ut', '\'iens m��ut'],
        'mm': [number + ' m��uts', '' + number + ' m��uts'],
        'h': ['\'n tora', '\'iensa tora'],
        'hh': [number + ' toras', '' + number + ' toras'],
        'd': ['\'n ziua', '\'iensa ziua'],
        'dd': [number + ' ziuas', '' + number + ' ziuas'],
        'M': ['\'n mes', '\'iens mes'],
        'MM': [number + ' mesen', '' + number + ' mesen'],
        'y': ['\'n ar', '\'iens ar'],
        'yy': [number + ' ars', '' + number + ' ars']
    };
    return isFuture ? format[key][0] : (withoutSuffix ? format[key][0] : format[key][1]);
}

//! moment.js locale configuration
//! locale : Central Atlas Tamazight Latin [tzm-latn]
//! author : Abdel Said : https://github.com/abdelsaid

hooks.defineLocale('tzm-latn', {
    months : 'innayr_br?ayr?_mar?s?_ibrir_mayyw_ywnyw_ywlywz_?w?t_?wtanbir_kt?wbr?_nwwanbir_dwjnbir'.split('_'),
    monthsShort : 'innayr_br?ayr?_mar?s?_ibrir_mayyw_ywnyw_ywlywz_?w?t_?wtanbir_kt?wbr?_nwwanbir_dwjnbir'.split('_'),
    weekdays : 'asamas_aynas_asinas_akras_akwas_asimwas_asi?yas'.split('_'),
    weekdaysShort : 'asamas_aynas_asinas_akras_akwas_asimwas_asi?yas'.split('_'),
    weekdaysMin : 'asamas_aynas_asinas_akras_akwas_asimwas_asi?yas'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[asdkh g] LT',
        nextDay: '[aska g] LT',
        nextWeek: 'dddd [g] LT',
        lastDay: '[assant g] LT',
        lastWeek: 'dddd [g] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : 'dadkh s yan %s',
        past : 'yan %s',
        s : 'imik',
        m : 'minu?',
        mm : '%d minu?',
        h : 'sa?a',
        hh : '%d tassa?in',
        d : 'ass',
        dd : '%d ossan',
        M : 'ayowr',
        MM : '%d iyyirn',
        y : 'asgas',
        yy : '%d isgasn'
    },
    week : {
        dow : 6, // Saturday is the first day of the week.
        doy : 12  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Central Atlas Tamazight [tzm]
//! author : Abdel Said : https://github.com/abdelsaid

hooks.defineLocale('tzm', {
    months : '??????_?????_????_?????_?????_?????_??????_????_????????_?????_????????_???????'.split('_'),
    monthsShort : '??????_?????_????_?????_?????_?????_??????_????_????????_?????_????????_???????'.split('_'),
    weekdays : '??????_?????_??????_?????_?????_???????_???????'.split('_'),
    weekdaysShort : '??????_?????_??????_?????_?????_???????_???????'.split('_'),
    weekdaysMin : '??????_?????_??????_?????_?????_???????_???????'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS: 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[???? ?] LT',
        nextDay: '[???? ?] LT',
        nextWeek: 'dddd [?] LT',
        lastDay: '[????? ?] LT',
        lastWeek: 'dddd [?] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : '???? ? ??? %s',
        past : '??? %s',
        s : '????',
        m : '?????',
        mm : '%d ?????',
        h : '????',
        hh : '%d ????????',
        d : '???',
        dd : '%d o????',
        M : '??o??',
        MM : '%d ??????',
        y : '?????',
        yy : '%d ??????'
    },
    week : {
        dow : 6, // Saturday is the first day of the week.
        doy : 12  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Ukrainian [uk]
//! author : zemlanin : https://github.com/zemlanin
//! Author : Menelion Elens��le : https://github.com/Oire

function plural$6(word, num) {
    var forms = word.split('_');
    return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
}
function relativeTimeWithPlural$4(number, withoutSuffix, key) {
    var format = {
        'mm': withoutSuffix ? '��ӧڧݧڧߧ�_��ӧڧݧڧߧ�_��ӧڧݧڧ�' : '��ӧڧݧڧߧ�_��ӧڧݧڧߧ�_��ӧڧݧڧ�',
        'hh': withoutSuffix ? '�ԧ�էڧߧ�_�ԧ�էڧߧ�_�ԧ�էڧ�' : '�ԧ�էڧߧ�_�ԧ�էڧߧ�_�ԧ�էڧ�',
        'dd': '�է֧ߧ�_�է�?_�է�?��',
        'MM': '��?�����_��?����?_��?����?��',
        'yy': '��?��_���ܧ�_����?��'
    };
    if (key === 'm') {
        return withoutSuffix ? '��ӧڧݧڧߧ�' : '��ӧڧݧڧߧ�';
    }
    else if (key === 'h') {
        return withoutSuffix ? '�ԧ�էڧߧ�' : '�ԧ�էڧߧ�';
    }
    else {
        return number + ' ' + plural$6(format[key], +number);
    }
}
function weekdaysCaseReplace(m, format) {
    var weekdays = {
        'nominative': '�ߧ֧�?�ݧ�_���ߧ֧�?�ݧ��_��?�ӧ�����_��֧�֧է�_��֧�ӧ֧�_�ᡯ���ߧڧ��_���ҧ���'.split('_'),
        'accusative': '�ߧ֧�?�ݧ�_���ߧ֧�?�ݧ��_��?�ӧ�����_��֧�֧է�_��֧�ӧ֧�_�ᡯ���ߧڧ��_���ҧ���'.split('_'),
        'genitive': '�ߧ֧�?��?_���ߧ֧�?�ݧܧ�_��?�ӧ���ܧ�_��֧�֧է�_��֧�ӧ֧�ԧ�_�ᡯ���ߧڧ�?_���ҧ���'.split('_')
    },
    nounCase = (/(\[[���ӧ���]\]) ?dddd/).test(format) ?
        'accusative' :
        ((/\[?(?:�ާڧߧ�ݧ�?|�ߧѧ����ߧ�?)? ?\] ?dddd/).test(format) ?
            'genitive' :
            'nominative');
    return weekdays[nounCase][m.day()];
}
function processHoursFunction(str) {
    return function () {
        return str + '��' + (this.hours() === 11 ? '��' : '') + '] LT';
    };
}

hooks.defineLocale('uk', {
    months : {
        'format': '��?��ߧ�_�ݧ���ԧ�_�ҧ֧�֧٧ߧ�_�ܧ�?��ߧ�_���ѧӧߧ�_��֧�ӧߧ�_�ݧڧ�ߧ�_��֧��ߧ�_�ӧ֧�֧�ߧ�_�ا�ӧ�ߧ�_�ݧڧ����ѧէ�_�ԧ��էߧ�'.split('_'),
        'standalone': '��?��֧ߧ�_�ݧ��ڧ�_�ҧ֧�֧٧֧ߧ�_�ܧ�?��֧ߧ�_���ѧӧ֧ߧ�_��֧�ӧ֧ߧ�_�ݧڧ�֧ߧ�_��֧��֧ߧ�_�ӧ֧�֧�֧ߧ�_�ا�ӧ�֧ߧ�_�ݧڧ����ѧ�_�ԧ��է֧ߧ�'.split('_')
    },
    monthsShort : '��?��_�ݧ��_�ҧ֧�_�ܧ�?��_���ѧ�_��֧��_�ݧڧ�_��֧��_�ӧ֧�_�ا�ӧ�_�ݧڧ��_�ԧ���'.split('_'),
    weekdays : weekdaysCaseReplace,
    weekdaysShort : '�ߧ�_���_�ӧ�_���_���_���_���'.split('_'),
    weekdaysMin : '�ߧ�_���_�ӧ�_���_���_���_���'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD.MM.YYYY',
        LL : 'D MMMM YYYY ��.',
        LLL : 'D MMMM YYYY ��., HH:mm',
        LLLL : 'dddd, D MMMM YYYY ��., HH:mm'
    },
    calendar : {
        sameDay: processHoursFunction('[�����ԧ�է�? '),
        nextDay: processHoursFunction('[���ѧӧ��� '),
        lastDay: processHoursFunction('[������� '),
        nextWeek: processHoursFunction('[��] dddd ['),
        lastWeek: function () {
            switch (this.day()) {
                case 0:
                case 3:
                case 5:
                case 6:
                    return processHoursFunction('[���ڧߧ�ݧ�?] dddd [').call(this);
                case 1:
                case 2:
                case 4:
                    return processHoursFunction('[���ڧߧ�ݧ�ԧ�] dddd [').call(this);
            }
        },
        sameElse: 'L'
    },
    relativeTime : {
        future : '�٧� %s',
        past : '%s ���ާ�',
        s : '�է֧�?�ݧ�ܧ� ��֧ܧ�ߧ�',
        m : relativeTimeWithPlural$4,
        mm : relativeTimeWithPlural$4,
        h : '�ԧ�էڧߧ�',
        hh : relativeTimeWithPlural$4,
        d : '�է֧ߧ�',
        dd : relativeTimeWithPlural$4,
        M : '��?�����',
        MM : relativeTimeWithPlural$4,
        y : '��?��',
        yy : relativeTimeWithPlural$4
    },
    // M. E.: those two are virtually unused but a user might want to implement them for his/her website for some reason
    meridiemParse: /�ߧ��?|��ѧߧܧ�|�էߧ�|�ӧ֧����/,
    isPM: function (input) {
        return /^(�էߧ�|�ӧ֧����)$/.test(input);
    },
    meridiem : function (hour, minute, isLower) {
        if (hour < 4) {
            return '�ߧ��?';
        } else if (hour < 12) {
            return '��ѧߧܧ�';
        } else if (hour < 17) {
            return '�էߧ�';
        } else {
            return '�ӧ֧����';
        }
    },
    ordinalParse: /\d{1,2}-(��|�ԧ�)/,
    ordinal: function (number, period) {
        switch (period) {
            case 'M':
            case 'd':
            case 'DDD':
            case 'w':
            case 'W':
                return number + '-��';
            case 'D':
                return number + '-�ԧ�';
            default:
                return number;
        }
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 1st is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Uzbek [uz]
//! author : Sardor Muminov : https://github.com/muminoff

hooks.defineLocale('uz', {
    months : '��ߧӧѧ�_��֧ӧ�ѧ�_�ާѧ��_�ѧ��֧�_�ާѧ�_�ڧ��_�ڧ��_�ѧӧԧ���_��֧ߧ��ҧ�_��ܧ��ҧ�_�ߧ��ҧ�_�է֧ܧѧҧ�'.split('_'),
    monthsShort : '��ߧ�_��֧�_�ާѧ�_�ѧ��_�ާѧ�_�ڧ��_�ڧ��_�ѧӧ�_��֧�_��ܧ�_�ߧ��_�է֧�'.split('_'),
    weekdays : '���ܧ�ѧߧҧ�_�����ѧߧҧ�_���֧�ѧߧҧ�_������ѧߧҧ�_���ѧۧ�ѧߧҧ�_����ާ�_���ѧߧҧ�'.split('_'),
    weekdaysShort : '���ܧ�_�����_���֧�_�����_���ѧ�_�����_���ѧ�'.split('_'),
    weekdaysMin : '����_����_����_����_����_����_����'.split('_'),
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'D MMMM YYYY, dddd HH:mm'
    },
    calendar : {
        sameDay : '[����ԧ�� ���ѧ�] LT [�է�]',
        nextDay : '[�����ѧԧ�] LT [�է�]',
        nextWeek : 'dddd [�ܧ�ߧ� ���ѧ�] LT [�է�]',
        lastDay : '[���֧�� ���ѧ�] LT [�է�]',
        lastWeek : '[����ԧѧ�] dddd [�ܧ�ߧ� ���ѧ�] LT [�է�]',
        sameElse : 'L'
    },
    relativeTime : {
        future : '���ܧڧ� %s �ڧ�ڧէ�',
        past : '���ڧ� �ߧ֧�� %s ��ݧէڧ�',
        s : '�����ѧ�',
        m : '�ҧڧ� �էѧܧڧܧ�',
        mm : '%d �էѧܧڧܧ�',
        h : '�ҧڧ� ���ѧ�',
        hh : '%d ���ѧ�',
        d : '�ҧڧ� �ܧ��',
        dd : '%d �ܧ��',
        M : '�ҧڧ� ���',
        MM : '%d ���',
        y : '�ҧڧ� �ۧڧ�',
        yy : '%d �ۧڧ�'
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 7  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Vietnamese [vi]
//! author : Bang Nguyen : https://github.com/bangnk

hooks.defineLocale('vi', {
    months : 'th��ng 1_th��ng 2_th��ng 3_th��ng 4_th��ng 5_th��ng 6_th��ng 7_th��ng 8_th��ng 9_th��ng 10_th��ng 11_th��ng 12'.split('_'),
    monthsShort : 'Th01_Th02_Th03_Th04_Th05_Th06_Th07_Th08_Th09_Th10_Th11_Th12'.split('_'),
    monthsParseExact : true,
    weekdays : 'ch? nh?t_th? hai_th? ba_th? t?_th? n?m_th? s��u_th? b?y'.split('_'),
    weekdaysShort : 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
    weekdaysMin : 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
    weekdaysParseExact : true,
    meridiemParse: /sa|ch/i,
    isPM : function (input) {
        return /^ch$/i.test(input);
    },
    meridiem : function (hours, minutes, isLower) {
        if (hours < 12) {
            return isLower ? 'sa' : 'SA';
        } else {
            return isLower ? 'ch' : 'CH';
        }
    },
    longDateFormat : {
        LT : 'HH:mm',
        LTS : 'HH:mm:ss',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM [n?m] YYYY',
        LLL : 'D MMMM [n?m] YYYY HH:mm',
        LLLL : 'dddd, D MMMM [n?m] YYYY HH:mm',
        l : 'DD/M/YYYY',
        ll : 'D MMM YYYY',
        lll : 'D MMM YYYY HH:mm',
        llll : 'ddd, D MMM YYYY HH:mm'
    },
    calendar : {
        sameDay: '[H?m nay l��c] LT',
        nextDay: '[Ng��y mai l��c] LT',
        nextWeek: 'dddd [tu?n t?i l��c] LT',
        lastDay: '[H?m qua l��c] LT',
        lastWeek: 'dddd [tu?n r?i l��c] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : '%s t?i',
        past : '%s tr??c',
        s : 'v��i giay',
        m : 'm?t ph��t',
        mm : '%d ph��t',
        h : 'm?t gi?',
        hh : '%d gi?',
        d : 'm?t ng��y',
        dd : '%d ng��y',
        M : 'm?t th��ng',
        MM : '%d th��ng',
        y : 'm?t n?m',
        yy : '%d n?m'
    },
    ordinalParse: /\d{1,2}/,
    ordinal : function (number) {
        return number;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Pseudo [x-pseudo]
//! author : Andrew Hood : https://github.com/andrewhood125

hooks.defineLocale('x-pseudo', {
    months : 'J~��?����~ry_F~��br��~��ry_~M��rc~h_��p~r��l_~M��y_~J��?��~_J��l~y_����~g��st~_S��p~t��mb~��r_��~ct��b~��r_?~��v��m~b��r_~D��c��~mb��r'.split('_'),
    monthsShort : 'J~��?_~F��b_~M��r_~��pr_~M��y_~J��?_~J��l_~����g_~S��p_~��ct_~?��v_~D��c'.split('_'),
    monthsParseExact : true,
    weekdays : 'S~��?d��~y_M��~?d��y~_T����~sd��y~_W��d~?��sd~��y_T~h��rs~d��y_~Fr��d~��y_S~��t��r~d��y'.split('_'),
    weekdaysShort : 'S~��?_~M��?_~T����_~W��d_~Th��_~Fr��_~S��t'.split('_'),
    weekdaysMin : 'S~��_M��~_T��_~W��_T~h_Fr~_S��'.split('_'),
    weekdaysParseExact : true,
    longDateFormat : {
        LT : 'HH:mm',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY HH:mm',
        LLLL : 'dddd, D MMMM YYYY HH:mm'
    },
    calendar : {
        sameDay : '[T~��d��~y ��t] LT',
        nextDay : '[T~��m��~rr��~w ��t] LT',
        nextWeek : 'dddd [��t] LT',
        lastDay : '[Y~��st~��rd��~y ��t] LT',
        lastWeek : '[L~��st] dddd [��t] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : '��~? %s',
        past : '%s ��~g��',
        s : '�� ~f��w ~s��c��~?ds',
        m : '�� ~m��?~��t��',
        mm : '%d m~��?��~t��s',
        h : '��~? h��~��r',
        hh : '%d h~����rs',
        d : '�� ~d��y',
        dd : '%d d~��ys',
        M : '�� ~m��?~th',
        MM : '%d m~��?t~hs',
        y : '�� ~y����r',
        yy : '%d y~����rs'
    },
    ordinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (~~(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Yoruba Nigeria [yo]
//! author : Atolagbe Abisoye : https://github.com/andela-batolagbe

hooks.defineLocale('yo', {
    months : 'S??r??_E?re?le?_?r??na?_I?gbe?_E?bibi_O?ku?du_Ag?mo_O?gu?n_Owewe_??wa?ra?_Be?lu?_??p???'.split('_'),
    monthsShort : 'S??r_E?rl_?rn_I?gb_E?bi_O?ku?_Ag?_O?gu?_Owe_??wa?_Be?l_??p???'.split('_'),
    weekdays : 'A?i?ku?_Aje?_I?s??gun_?j??ru?_?j??b?_?ti?_A?ba?m??ta'.split('_'),
    weekdaysShort : 'A?i?k_Aje?_I?s??_?jr_?jb_?ti?_A?ba?'.split('_'),
    weekdaysMin : 'A?i?_Aj_I?s_?r_?b_?t_A?b'.split('_'),
    longDateFormat : {
        LT : 'h:mm A',
        LTS : 'h:mm:ss A',
        L : 'DD/MM/YYYY',
        LL : 'D MMMM YYYY',
        LLL : 'D MMMM YYYY h:mm A',
        LLLL : 'dddd, D MMMM YYYY h:mm A'
    },
    calendar : {
        sameDay : '[O?ni? ni] LT',
        nextDay : '[??la ni] LT',
        nextWeek : 'dddd [?s?? to?n\'b?] [ni] LT',
        lastDay : '[A?na ni] LT',
        lastWeek : 'dddd [?s?? to?l??] [ni] LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : 'ni? %s',
        past : '%s k?ja?',
        s : 'i?s?ju? aaya? die',
        m : 'i?s?ju? kan',
        mm : 'i?s?ju? %d',
        h : 'wa?kati kan',
        hh : 'wa?kati %d',
        d : '?j?? kan',
        dd : '?j?? %d',
        M : 'osu? kan',
        MM : 'osu? %d',
        y : '?du?n kan',
        yy : '?du?n %d'
    },
    ordinalParse : /?j??\s\d{1,2}/,
    ordinal : '?j?? %d',
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4 // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Chinese (China) [zh-cn]
//! author : suupic : https://github.com/suupic
//! author : Zeno Zeng : https://github.com/zenozeng

hooks.defineLocale('zh-cn', {
    months : 'һ��_����_����_����_����_����_����_����_����_ʮ��_ʮһ��_ʮ����'.split('_'),
    monthsShort : '1��_2��_3��_4��_5��_6��_7��_8��_9��_10��_11��_12��'.split('_'),
    weekdays : '������_����һ_���ڶ�_������_������_������_������'.split('_'),
    weekdaysShort : '����_��һ_�ܶ�_����_����_����_����'.split('_'),
    weekdaysMin : '��_һ_��_��_��_��_��'.split('_'),
    longDateFormat : {
        LT : 'Ah��mm��',
        LTS : 'Ah��m��s��',
        L : 'YYYY-MM-DD',
        LL : 'YYYY��MMMD��',
        LLL : 'YYYY��MMMD��Ah��mm��',
        LLLL : 'YYYY��MMMD��ddddAh��mm��',
        l : 'YYYY-MM-DD',
        ll : 'YYYY��MMMD��',
        lll : 'YYYY��MMMD��Ah��mm��',
        llll : 'YYYY��MMMD��ddddAh��mm��'
    },
    meridiemParse: /�賿|����|����|����|����|����/,
    meridiemHour: function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '�賿' || meridiem === '����' ||
                meridiem === '����') {
            return hour;
        } else if (meridiem === '����' || meridiem === '����') {
            return hour + 12;
        } else {
            // '����'
            return hour >= 11 ? hour : hour + 12;
        }
    },
    meridiem : function (hour, minute, isLower) {
        var hm = hour * 100 + minute;
        if (hm < 600) {
            return '�賿';
        } else if (hm < 900) {
            return '����';
        } else if (hm < 1130) {
            return '����';
        } else if (hm < 1230) {
            return '����';
        } else if (hm < 1800) {
            return '����';
        } else {
            return '����';
        }
    },
    calendar : {
        sameDay : function () {
            return this.minutes() === 0 ? '[����]Ah[����]' : '[����]LT';
        },
        nextDay : function () {
            return this.minutes() === 0 ? '[����]Ah[����]' : '[����]LT';
        },
        lastDay : function () {
            return this.minutes() === 0 ? '[����]Ah[����]' : '[����]LT';
        },
        nextWeek : function () {
            var startOfWeek, prefix;
            startOfWeek = hooks().startOf('week');
            prefix = this.diff(startOfWeek, 'days') >= 7 ? '[��]' : '[��]';
            return this.minutes() === 0 ? prefix + 'dddAh����' : prefix + 'dddAh��mm';
        },
        lastWeek : function () {
            var startOfWeek, prefix;
            startOfWeek = hooks().startOf('week');
            prefix = this.unix() < startOfWeek.unix()  ? '[��]' : '[��]';
            return this.minutes() === 0 ? prefix + 'dddAh����' : prefix + 'dddAh��mm';
        },
        sameElse : 'LL'
    },
    ordinalParse: /\d{1,2}(��|��|��)/,
    ordinal : function (number, period) {
        switch (period) {
            case 'd':
            case 'D':
            case 'DDD':
                return number + '��';
            case 'M':
                return number + '��';
            case 'w':
            case 'W':
                return number + '��';
            default:
                return number;
        }
    },
    relativeTime : {
        future : '%s��',
        past : '%sǰ',
        s : '����',
        m : '1 ����',
        mm : '%d ����',
        h : '1 Сʱ',
        hh : '%d Сʱ',
        d : '1 ��',
        dd : '%d ��',
        M : '1 ����',
        MM : '%d ����',
        y : '1 ��',
        yy : '%d ��'
    },
    week : {
        // GB/T 7408-1994������Ԫ�ͽ�����ʽ����Ϣ���������ں�ʱ���ʾ������ISO 8601:1988��Ч
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

//! moment.js locale configuration
//! locale : Chinese (Hong Kong) [zh-hk]
//! author : Ben : https://github.com/ben-lin
//! author : Chris Lam : https://github.com/hehachris
//! author : Konstantin : https://github.com/skfd

hooks.defineLocale('zh-hk', {
    months : 'һ��_����_����_����_����_����_����_����_����_ʮ��_ʮһ��_ʮ����'.split('_'),
    monthsShort : '1��_2��_3��_4��_5��_6��_7��_8��_9��_10��_11��_12��'.split('_'),
    weekdays : '������_����һ_���ڶ�_������_������_������_������'.split('_'),
    weekdaysShort : '�L��_�Lһ_�L��_�L��_�L��_�L��_�L��'.split('_'),
    weekdaysMin : '��_һ_��_��_��_��_��'.split('_'),
    longDateFormat : {
        LT : 'Ah�cmm��',
        LTS : 'Ah�cm��s��',
        L : 'YYYY��MMMD��',
        LL : 'YYYY��MMMD��',
        LLL : 'YYYY��MMMD��Ah�cmm��',
        LLLL : 'YYYY��MMMD��ddddAh�cmm��',
        l : 'YYYY��MMMD��',
        ll : 'YYYY��MMMD��',
        lll : 'YYYY��MMMD��Ah�cmm��',
        llll : 'YYYY��MMMD��ddddAh�cmm��'
    },
    meridiemParse: /�賿|����|����|����|����|����/,
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '�賿' || meridiem === '����' || meridiem === '����') {
            return hour;
        } else if (meridiem === '����') {
            return hour >= 11 ? hour : hour + 12;
        } else if (meridiem === '����' || meridiem === '����') {
            return hour + 12;
        }
    },
    meridiem : function (hour, minute, isLower) {
        var hm = hour * 100 + minute;
        if (hm < 600) {
            return '�賿';
        } else if (hm < 900) {
            return '����';
        } else if (hm < 1130) {
            return '����';
        } else if (hm < 1230) {
            return '����';
        } else if (hm < 1800) {
            return '����';
        } else {
            return '����';
        }
    },
    calendar : {
        sameDay : '[����]LT',
        nextDay : '[����]LT',
        nextWeek : '[��]ddddLT',
        lastDay : '[����]LT',
        lastWeek : '[��]ddddLT',
        sameElse : 'L'
    },
    ordinalParse: /\d{1,2}(��|��|�L)/,
    ordinal : function (number, period) {
        switch (period) {
            case 'd' :
            case 'D' :
            case 'DDD' :
                return number + '��';
            case 'M' :
                return number + '��';
            case 'w' :
            case 'W' :
                return number + '�L';
            default :
                return number;
        }
    },
    relativeTime : {
        future : '%s��',
        past : '%sǰ',
        s : '����',
        m : '1 ���',
        mm : '%d ���',
        h : '1 С�r',
        hh : '%d С�r',
        d : '1 ��',
        dd : '%d ��',
        M : '1 ����',
        MM : '%d ����',
        y : '1 ��',
        yy : '%d ��'
    }
});

//! moment.js locale configuration
//! locale : Chinese (Taiwan) [zh-tw]
//! author : Ben : https://github.com/ben-lin
//! author : Chris Lam : https://github.com/hehachris

hooks.defineLocale('zh-tw', {
    months : 'һ��_����_����_����_����_����_����_����_����_ʮ��_ʮһ��_ʮ����'.split('_'),
    monthsShort : '1��_2��_3��_4��_5��_6��_7��_8��_9��_10��_11��_12��'.split('_'),
    weekdays : '������_����һ_���ڶ�_������_������_������_������'.split('_'),
    weekdaysShort : '�L��_�Lһ_�L��_�L��_�L��_�L��_�L��'.split('_'),
    weekdaysMin : '��_һ_��_��_��_��_��'.split('_'),
    longDateFormat : {
        LT : 'Ah�cmm��',
        LTS : 'Ah�cm��s��',
        L : 'YYYY��MMMD��',
        LL : 'YYYY��MMMD��',
        LLL : 'YYYY��MMMD��Ah�cmm��',
        LLLL : 'YYYY��MMMD��ddddAh�cmm��',
        l : 'YYYY��MMMD��',
        ll : 'YYYY��MMMD��',
        lll : 'YYYY��MMMD��Ah�cmm��',
        llll : 'YYYY��MMMD��ddddAh�cmm��'
    },
    meridiemParse: /�賿|����|����|����|����|����/,
    meridiemHour : function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '�賿' || meridiem === '����' || meridiem === '����') {
            return hour;
        } else if (meridiem === '����') {
            return hour >= 11 ? hour : hour + 12;
        } else if (meridiem === '����' || meridiem === '����') {
            return hour + 12;
        }
    },
    meridiem : function (hour, minute, isLower) {
        var hm = hour * 100 + minute;
        if (hm < 600) {
            return '�賿';
        } else if (hm < 900) {
            return '����';
        } else if (hm < 1130) {
            return '����';
        } else if (hm < 1230) {
            return '����';
        } else if (hm < 1800) {
            return '����';
        } else {
            return '����';
        }
    },
    calendar : {
        sameDay : '[����]LT',
        nextDay : '[����]LT',
        nextWeek : '[��]ddddLT',
        lastDay : '[����]LT',
        lastWeek : '[��]ddddLT',
        sameElse : 'L'
    },
    ordinalParse: /\d{1,2}(��|��|�L)/,
    ordinal : function (number, period) {
        switch (period) {
            case 'd' :
            case 'D' :
            case 'DDD' :
                return number + '��';
            case 'M' :
                return number + '��';
            case 'w' :
            case 'W' :
                return number + '�L';
            default :
                return number;
        }
    },
    relativeTime : {
        future : '%s��',
        past : '%sǰ',
        s : '����',
        m : '1 ���',
        mm : '%d ���',
        h : '1 С�r',
        hh : '%d С�r',
        d : '1 ��',
        dd : '%d ��',
        M : '1 ����',
        MM : '%d ����',
        y : '1 ��',
        yy : '%d ��'
    }
});

hooks.locale('en');

return hooks;

})));
moment.locale((navigator.language || navigator.browserLanguage).toLowerCase());