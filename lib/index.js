/**
 * Export
 */
exports.Base = require('./base');
exports.ViewContext = require('./viewContext');
exports.helpers = require('./helpers');

// Option to set limit to number of mappings performed in parallel
exports.setConcurrencyLimit = function(limit) {
  var async = require('async');

  if (limit == 1) {
    exports.Base._toViewObjectMap = require('async').mapSeries;
  } else {
    exports.Base._toViewObjectMap = function(arr, iterator, callback){
      async.mapLimit(arr, limit, iterator, callback);
    };
  }
}
