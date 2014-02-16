/**
 * Module dependencies
 */
var util = require('util'),
    _ = require('lodash'),
    sandbox = require('./utils/sandbox');

/**
 * Base Model Tests
 */
var Base = require('../lib/base');

exports['an instance can be converted to a view object'] = {
  setUp: function(done){
    var self = this;
    
    var test = self;
    
    self.mocks = {};
    
    function NewBase() {
      NewBase.super_.apply(this);
    }

    util.inherits(NewBase, Base);    
    
    NewBase.prototype._viewTemplate = {
      defaultTopItem: true,
      anotherDefaultTopItem: true      
    }
    
    var viewMappingsFunctions = {
      defaultTopItem: function(){
        return self.defaultTopItem;
      },
      
      anotherDefaultTopItem: function(self, done){
        return done(null, test.anotherDefaultTopItem);
      },
      
      nonDefaultTopItem: function(done){
        return done(null, test.nonDefaultTopItem);
      }
    }
    
    NewBase.prototype._viewMappings = {
      defaultTopItem: function(){
        // Signature for synchronous
        return viewMappingsFunctions.defaultTopItem.apply(this, arguments);
      },
      
      anotherDefaultTopItem: function(self, done){
        // Signature for async with self
        return viewMappingsFunctions.anotherDefaultTopItem.apply(this, arguments);        
      },
      
      nonDefaultTopItem: function(done){
        // Signature for async without self
        return viewMappingsFunctions.nonDefaultTopItem.apply(this, arguments);         
      }      
    }  

    self.defaultTopItem = 1;
    self.anotherDefaultTopItem = 2;
    self.nonDefaultTopItem = 3;
    
    self.NewBase = NewBase;
    
    self.mocks.defaultTopItem = sandbox.mock(viewMappingsFunctions, 'defaultTopItem');
    self.mocks.anotherDefaultTopItem = sandbox.mock(viewMappingsFunctions, 'anotherDefaultTopItem');
    self.mocks.nonDefaultTopItem = sandbox.mock(viewMappingsFunctions, 'nonDefaultTopItem');

    self.mocks._mergedTemplate = sandbox.mock(NewBase.prototype, '_mergedTemplate');
    self.mocks._valueToViewObject = sandbox.mock(NewBase.prototype, '_valueToViewObject');
    
    done();
  },
  
  tearDown: function(done) {
    var self = this;

    _.invoke(self.mocks, 'restore');
    sandbox.restore();

    done();
  },
  
  'using default request template': function(test){
    var self = this;
  
    var newInstance = new self.NewBase();
    
    newInstance.toViewObject(null, function(err, viewObject){
      if (err) return test.done(err);

      test.same(viewObject.defaultTopItem, 1);
      test.same(viewObject.anotherDefaultTopItem, 2);
      test.same(viewObject.nonDefaultTopItem, undefined);
      
      test.ok(self.mocks.defaultTopItem.calledOn(newInstance));
      test.ok(self.mocks.anotherDefaultTopItem.calledOn(newInstance));
      test.ok(!self.mocks.nonDefaultTopItem.called);
      
      test.same(self.mocks._mergedTemplate.callCount, 1);
      test.ok(self.mocks._mergedTemplate.calledWith(null));
      
      test.ok(self.mocks._valueToViewObject.alwaysCalledOn(newInstance));
      test.ok(self.mocks._valueToViewObject.calledWith(true, self.defaultTopItem));      
      test.ok(self.mocks._valueToViewObject.calledWith(true, self.anotherDefaultTopItem));      
      
      test.done();
    });
  },
  
  'including non-default in request template, excluding default': function(test) {
    var self = this;
    
    var newInstance = new self.NewBase();

    var template = {
      defaultTopItem: false,
      nonDefaultTopItem: {}
    };

    newInstance.toViewObject(template, function(err, viewObject){
      if (err) return test.done(err);

      test.same(viewObject.defaultTopItem, undefined);
      test.same(viewObject.anotherDefaultTopItem, 2);
      test.same(viewObject.nonDefaultTopItem, 3);

      test.ok(!self.mocks.defaultTopItem.called);      
      test.ok(self.mocks.anotherDefaultTopItem.calledOn(newInstance));
      test.ok(self.mocks.nonDefaultTopItem.calledOn(newInstance));
      
      test.same(self.mocks._mergedTemplate.callCount, 1);
      test.ok(self.mocks._mergedTemplate.calledWith(template));      
      
      test.ok(self.mocks._valueToViewObject.alwaysCalledOn(newInstance));
      test.ok(self.mocks._valueToViewObject.calledWith(true, self.anotherDefaultTopItem));      
      test.ok(self.mocks._valueToViewObject.calledWith({}, self.nonDefaultTopItem));
      
      test.done();
    });
  },
  
  '_mergedTemplate': {    
    'outputs a new object, with false passed': function(test){
      var self = this;
      
      var newInstance = new self.NewBase();      
      
      var _viewTemplate = newInstance._viewTemplate = {
        first: 'other'
      };
      
      newInstance._mergedTemplate(false, function(err, mergedTemplate){
        if (err) return test.done(err);
        
        test.notEqual(_viewTemplate, mergedTemplate);
        test.done();
      });
    },
    
    'outputs a new object, with true passed': function(test){
      var self = this;
      
      var newInstance = new self.NewBase();      
      
      var _viewTemplate = newInstance._viewTemplate = {
        first: 'other'
      };
      
      newInstance._mergedTemplate(true, function(err, outputSame){
        if (err) return test.done(err);
        
        test.notEqual(_viewTemplate, outputSame);      
        test.same(_viewTemplate, outputSame);
        test.done();
      });
    },
    
    'outputs a new object, with template passed': function(test){
      var self = this;
      
      var newInstance = new self.NewBase();      
      
      var toMerge = {
        second: 'other'
      };      
      
      var _viewTemplate = newInstance._viewTemplate = {
        first: 'other'
      };
      
      newInstance._mergedTemplate(toMerge, function(err, outputMerged){
        if (err) return test.done(err);
        
        var expectedMerged = {
          first: 'other',
          second: 'other'
        };

        test.same(expectedMerged, outputMerged);
        test.done();
      });
    },    
    
    'includes all mappings when passed a wildcard': {
      setUp: function(done){
        var self = this;

        var newInstance = self.newInstance = new self.NewBase();      

        var _viewTemplate = newInstance._viewTemplate = {
          first: true,
          second: {
            id: false
          }
        };

        var _viewMappings = newInstance._viewMappings = {
          first: function(done){ done() },
          second: function(done){ done() },
          another: function(done){ done() }
        };
        
        var expectedMerged = self.expectedMerged = {
          first: true,
          second: {
            id: false
          }
        };        
        
        done();        
      },
      
      'as string': function(test){
        var self = this;
        
        self.newInstance._mergedTemplate('*', function(err, outputMerged){
          if (err) return test.done(err);

          self.expectedMerged.first = '*';
          self.expectedMerged.another = '*';
          self.expectedMerged.second['*'] = true;

          test.same(self.expectedMerged, outputMerged);

          test.done();          
        });
      },
      
      'as object property': function(test){
        var self = this;
        
        var mergedTemplate = {
              first: false,
              '*': true
            };
            
        self.newInstance._mergedTemplate(mergedTemplate, function(err, outputMerged){
          if (err) return test.done(err);
          
          self.expectedMerged.first = false;
          self.expectedMerged.another = {
            '*': true
          };
          self.expectedMerged.second['*'] = true;        

          test.same(self.expectedMerged, outputMerged);

          test.done();          
        });
      }
    }
  },
  
  '_opToViewObject': {
    'can map using op as path': function(test) {
      var self = this;
      
      var newInstance = new self.NewBase();
      
      newInstance.specialObj = {
        forMapping: 'values'
      };
      
      newInstance._viewMappings = {
        something: 'specialObj.forMapping'
      };
      
      var opTemplate = {};
      
      newInstance._opToViewObject(opTemplate, 'something', function(err, viewObject){
        if (err) return test.done(err);

        var expectedViewObject = 'values';
        
        test.same(expectedViewObject, viewObject);
        
        test.ok(self.mocks._valueToViewObject.alwaysCalledOn(newInstance));
        test.ok(self.mocks._valueToViewObject.calledWith(opTemplate, expectedViewObject));        

        test.done();
      });      
    },
  }
}

exports['an instance can define inheriting object'] = {
  setUp: function(done) {
    var self = this;
    
    self.mocks = {};
    
    var NewParent = self.NewParent = function NewParent(){};
    
    util.inherits(NewParent, Base);    
    
    var NewBase = self.NewBase = function NewBase(){};
    
    util.inherits(NewBase, NewParent);
        
    done();
  },
  
  tearDown: function(done) {
    var self = this;

    _.invoke(self.mocks, 'restore');

    done();
  },  
  
  'using __defineInheritingObject__': function(test) {
    var self = this;

    var key = '_specialKey';

    var NewParent = self.NewParent;

    var parentViewOps = {
      firstOne: 'first.mapping',      
      toOverride: 'override.parent'
    };
    NewParent.prototype.__defineInheritingObject__(key, parentViewOps);
    
    var NewBase = self.NewBase;

    var childViewOps = {
      newOne: 'another.mapping',
      toOverride: 'override.child'
    };
    NewBase.prototype.__defineInheritingObject__(key, childViewOps);
    
    var instance = new NewBase();
    
    test.notEqual(instance[key], parentViewOps);
    test.same(instance[key].firstOne, parentViewOps.firstOne);
    test.same(instance[key].newOne, childViewOps.newOne);
    test.same(instance[key].toOverride, childViewOps.toOverride);
    
    test.done();
  },

  'user': {
    setUp: function(done) {
      var self = this;
      
      self.mocks.__defineInheritingObject__ = sandbox.mock(Base.prototype, '__defineInheritingObject__', function(){});
      
      done();      
    },
    
    '__defineViewOps__': function(test) {
      var self = this;
      
      var NewBase = self.NewBase;

      var viewMappings = {
        newOne: 'another.mapping'
      };
      NewBase.prototype.__defineViewOps__(viewMappings);
      
      test.ok(self.mocks.__defineInheritingObject__.calledWith('_viewMappings', viewMappings));
      
      test.done();
    },
    
    '__defineViewTemplate__': function(test) {
      var self = this;
      
      var NewBase = self.NewBase;

      var viewTemplate = {
        newOne: true
      };
      NewBase.prototype.__defineViewTemplate__(viewTemplate);
      
      test.ok(self.mocks.__defineInheritingObject__.calledWith('_viewTemplate', viewTemplate));
      
      test.done();
    },       
  }
}