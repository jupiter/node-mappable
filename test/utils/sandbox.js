var sinon = require('sinon');

exports.sandbox = sinon.sandbox.create();

/**
 * Call this stub/spy using the current sandbox
 *
 * @param {Object} obj
 * @param {String} methodName
 * @param {Function} [fn]
 * @return {Function} mock
 * @api public
 */
exports.mock = function(){
  var methodName = (arguments.length > 2) ? 'stub' : 'spy';
  
  // If stubbing with a falsey value, default to a function
  if (!arguments[0][arguments[1]]) {
    arguments[0][arguments[1]] = function(){};
  }
  
  return exports.sandbox[methodName].apply(exports.sandbox, arguments);
}

/**
 * Restore the current sandbox and create a new one
 *
 * @api public
 */
 exports.restore = function(){
  exports.sandbox.restore();
  exports.sandbox = sinon.sandbox.create();
}
