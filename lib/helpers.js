var _ = require('lodash');

/**
 * Get a deeply nested object property without throwing an error for null/undefined in path
 *
 * Usage:
 *      getNested(obj, 'foo.bar');
 *
 * @param {Object} obj
 * @param {String} path   Path e.g.  'foo.bar.baz'
 * @return {Mixed}        Returns undefined if the property is not found
 */
exports.getNested = function getNested(obj, path, defaultValue) {
    var self = this;

    if (_.isUndefined(obj) || obj === null) return defaultValue;

    var fields = path.split(".");
    var result = obj;
    for (var i = 0, n = fields.length; i < n; i++) {
        if (!_.isObject(result) && !_.isArray(result)) {
          return (!_.isUndefined(defaultValue)) ? defaultValue : undefined;
        }      

        result = result[fields[i]];
    }
    return (_.isUndefined(result) && !_.isUndefined(defaultValue)) ? defaultValue : result;
};