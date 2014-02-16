/**
 * Module dependencies
 */
var util = require('util'),
    _ = require('lodash');

var Base = require('./base');
var EventEmitter = require('events').EventEmitter;

/**
 * ViewContext
 * This is a wrapper around any object for converting to view object
 *
 * Constructor
 * @api public
 */
function ViewContext(context, mappings, template) {
  ViewContext.super_.apply(this, arguments);

  // Initialize (gets optimized by v8)
  this._viewContext = context || this;
  this._viewMappings = mappings || this._viewMappings;
  this._viewTemplate = template || this._viewTemplate;
};
util.inherits(ViewContext, Base);

/**
 * Set template for this instance (chainable method)
 */
ViewContext.prototype.template = function(template){
  if (template == '*') {
    this._requestTemplate = template;
    return;
  }
  
  this._viewTemplate = template;
  return this;
}

/**
 * Set mappings for this instance (chainable method)
 */
ViewContext.prototype.map = function(mappings){
  this._viewMappings = mappings;
  return this;
}

/**
 * Default view template
 */
ViewContext.prototype.__defineViewTemplate__({
});

/**
 * Default mappings
 */
ViewContext.prototype.__defineViewMappings__({
});

/**
 * Make all context keys available as mappings
 * @override Base.prototype._opKeys
 */
ViewContext.prototype._opKeys = function(){
  // Include values available on obj
  return (this._viewContext == this) ? Object.keys(this._viewMappings) : Object.keys(this._viewContext).concat(Object.keys(this._viewMappings));
}

/**
 * @override Base.prototype._opToViewObject
 */
ViewContext.prototype._opToViewObject = function(template, key, cb){
  var self = this;

  // Use value on obj where available
  var value = self._viewContext[key];

  if (value) {
    ViewContext.super_.prototype._valueToViewObject.call(self, template, value, cb);
  } else {
    ViewContext.super_.prototype._opToViewObject.apply(self, arguments);
  }
}

/**
 * @override Base.prototype.toViewObject
 * @param {Object} [requestTemplate]
 * @param {Function} [cb]
 */
ViewContext.prototype.toViewObject = function(requestTemplate, cb) {
  if (_.isFunction(requestTemplate)) return ViewContext.super_.prototype.toViewObject.call(this, this._requestTemplate || true, requestTemplate);

  ViewContext.super_.prototype.toViewObject.apply(this, arguments);
}

/**
 * For use as EventEmitter
 */
ViewContext.prototype.on = function() {
  if (!this._eventEmitter) this._eventEmitter = new EventEmitter();

  var self = this;

  // Fire on next tick
  if (!self._willFire) {
    self._willFire = true;
    process.nextTick(function(){
      self.toViewObject(function(err, viewObject){
        if (err) return self._eventEmitter.emit('error', err);

        self._eventEmitter.emit('complete', viewObject);
      });
    });
  }

  // Forward to EventEmitter
  this._eventEmitter.on.apply(this._eventEmitter, arguments);

  return self;
}

/**
 * Class methods
 */
/**
 * Create a new ViewContext
 *
 * Usage:
 ```
      ViewContext.create({
        someObject: { etc: 'someValue' },
      })
      .map({
        etc: 'someObject.etc',
        now: function(){
          return new Date();
        },
        asyncValue: function(self, cb) {
          self.someObject.calculate(cb);
        }
      })
      .toViewObject({
        etc: true,
        now: true,
        asyncValue: {
          deeper: true
        }
      }, function(err, viewObj){
      });
 ```
 *
 * @param {Object} obj
 * @param {Object} viewMappings  mapping operations, as per .map()
 * @return {ViewContext}    returns an instance of ViewContext
 */
ViewContext.create = function(obj, viewMappings) {
  return new this(obj, viewMappings);
}

/**
 * Exports
 */
module.exports = ViewContext;