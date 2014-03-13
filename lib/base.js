/**
 * Modules
 */
var util = require('util'),
    _ = require('lodash')
    async = require('async');
    
var getNested = require('./helpers').getNested;

/**
 * Base for inheritance
 * @api public
 */
var Base = module.exports = function Base() {
  this._viewContext = this;
}

/**
 * Included in template per default
 */
Base.prototype._viewTemplate = { 
}

/**
 * Any of these can be requested in a template
 */
Base.prototype._viewMappings = {
}

/**
 * For defining inheriting objects on subclass prototypes
 */
Base.prototype.__defineViewTemplate__ = function(obj) {
  this.__defineInheritingObject__('_viewTemplate', obj);
}

Base.prototype.__defineViewMappings__ = function(obj) {
  this.__defineInheritingObject__('_viewMappings', obj);
}

Base.prototype.__defineInheritingObject__ = function(key, obj) {
  var Super = this.constructor.super_;
  
  this[key] = _.extend({}, Super.prototype[key], obj);  
}

/**
 * Recursively converts this instance to a view object based on template
 *
 * @param {Object} requestTemplate   template to merge with default template, 
                                     or `null` to just use the default
 * @param {Function} cb(err, viewObject)
 * @api public
 */
Base.prototype.toViewObject = function(requestTemplate, cb) {
  var self = this;

  // Require a context object, defaults to this during initialization
  if (!self._viewContext) throw new Error(self.constructor.name + ' must apply parent initialization for valid context');

  // Handle optional requestTemplate
  if (arguments.length == 1) {
    cb = requestTemplate;
    requestTemplate = true;
  }
  
  // Merge template with defaults
  self._mergedTemplate(requestTemplate, function(err, template) {
    if (err) return cb(err);
    
    var templateKeys = _.keys(template);

    Base._toViewObjectMap(templateKeys, function(key, done){    
      self._opToViewObject(template[key], key, done);
    }, function(err, results){
      if (err) return cb(err);

      var output = {};

      _.each(results, function(result, i){
        output[templateKeys[i]] = result;
      });

      cb(null, output);    
    });    
  })
}

/**
 * Merges a specified template into the viewTemplate
 *
 *
 * @param {Mixed} template  
 *  - {String}  can be '*' for including all available mappings on this item and children
 *  - {Object}  with nested values to include/exclude
 *                key with either '*' = true does same as string
 *                   
 * @return {Object}
 * @api private
 */
Base.prototype._mergedTemplate = function(template, cb) {
  var self = this;

  if (_.isObject(template)) {
    if (template['*']) {
      var subTemplate = template['*'];
            
      template = _.extend({}, self._viewTemplate, template);
      delete(template['*']);
            
      _.each(self._opKeys(), function(key){
        if (_.isObject(template[key])) {
          template[key]['*'] = subTemplate;
        } else if (template[key] !== false){
          template[key] = {
            '*': subTemplate
          };
        }
      });
      
      return cb(null, template);
    }
    
    return cb(null, _.extend({}, self._viewTemplate, template));    
  } else if (_.isString(template)) {
    if (template == '*') {
      template = _.extend({}, self._viewTemplate);

      _.each(self._opKeys(), function(key){
        if (_.isObject(template[key])) {
          template[key]['*'] = true;
        } else {
          template[key] = '*';          
        }
      });
            
      return cb(null, template);
    }
  }
  
  return cb(null, _.extend({}, self._viewTemplate));      
}

Base.prototype._opKeys = function(){
  return Object.keys(this._viewMappings);
}

Base.prototype._opToViewObject = function(opTemplate, key, cb) {
  var self = this;

  var op = self._viewMappings[key];

  if (!opTemplate || !op) return cb();
  
  // Strings indicate a path to a value
  if (_.isString(op)) {
    // Get value on self
    return self._valueToViewObject(opTemplate, getNested(self._viewContext, op), cb);
  }

  // Assume it is a function
  switch (op.length) {
    case 0:
      // Synchronous method
      self._valueToViewObject(opTemplate, op.call(self._viewContext), cb);
      break;
    case 1:
      // Async using `this` and signature `fn(done) {}`
      op.call(self._viewContext, _opToViewObjectDone.bind(self, opTemplate, cb));
      break;
    case 2:
      // Async using signature `fn(self, done)`
      op.call(self._viewContext, self._viewContext, _opToViewObjectDone.bind(self, opTemplate, cb));      
      break;
    default: 
      // Unexpected signature
      cb(new Error('Unexpected view op function signature'));
  }  
}

function _opToViewObjectDone(opTemplate, cb, err, value){
  if (err) return cb(err);

  this._valueToViewObject(opTemplate, value, cb);
}

/**
 * Converts the value to a view object based on the template provided
 *
 * @param {Object} requestTemplate
 * @return {Mixed} value
 * @api private
 */
Base.prototype._valueToViewObject = function(requestTemplate, value, cb) {
  var self = this;

  if (value === undefined) return cb();
  
  if (value && value.toViewObject) {
    // Call toViewObject on the value
    value.toViewObject(requestTemplate, cb);
  } else if (_.isArray(value)) {
    // Call self._valueToViewObject with requestTemplate and each item in array
    async.map(value, _.bind(self._valueToViewObject, self, requestTemplate), cb);
  } else {
    // Just return the value
    cb(null, value);
  }  
}

Base._toViewObjectMap = async.map;