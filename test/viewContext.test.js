/**
 * Module dependencies
 */
var util = require('util'),
    _ = require('lodash'),
    sandbox = require('./utils/sandbox');

/**
 * ViewContext Tests
 */
var ViewContext = require('../lib/viewContext'),
    Base = require('../lib/base');

exports['simple integration test'] = {
  setUp: function(done) {
    var self = this;

    self.err = null;

    self.wrappedObj = {
      simple: {
        name: 'Some Name',
        notInterestedIn: function(){}
      },
      other: {
        toViewObject: function(template, done){
          if (self.err) return done(self.err);

          done(null, template);
        }
      }
    };

    self.ops = {
      name: 'simple.name',
      skipMe: 'simple.notInterestedIn',
      now: function(){
        return new Date();
      }
    };

    self.template = {
      name: true,
      now: true,
      other: {
        deepTemplate: true
      }
    };

    done();
  },

  'used with callback': {
    'for success': function(test) {
      var self = this;

      ViewContext
      .create(self.wrappedObj)
      .map(self.ops)
      .template(self.template)
      .toViewObject(function(err, viewObject){
        if (err) return test.done(err);

        test.same(viewObject.name, 'Some Name');
        test.ok(viewObject.now instanceof Date, 'instanceof Date');
        test.same(viewObject.other, {
          deepTemplate: true
        });
        test.done();
      });
    },

    'for error': function(test) {
      var self = this;

      self.err = new Error();

      ViewContext
      .create(self.wrappedObj)
      .map(self.ops)
      .template(self.template)
      .toViewObject(function(err, viewObject){
        test.same(self.err, err);
        test.done();
      });
    },
  },

  'used as an eventemitter': {
    'for success': function(test) {
      var self = this;

      ViewContext
      .create(self.wrappedObj)
      .map(self.ops)
      .template(self.template)
      .on('error', function(err) {
        test.done(err);
      })
      .on('complete', function(viewObject){
        test.same(viewObject.name, 'Some Name');
        test.ok(viewObject.now instanceof Date, 'instanceof Date');
        test.same(viewObject.other, {
          deepTemplate: true
        });
        test.done();
      });
    },

    'for error': function(test) {
      var self = this;

      self.err = new Error();

      ViewContext
      .create(self.wrappedObj)
      .map(self.ops)
      .template(self.template)
      .on('error', function(err) {
        test.same(self.err, err);
        test.done();
      })
      .on('complete', function(viewObject){
        test.ok(false, 'should have errored');
        test.done();
      });
    },
  },

  'without a context to wrap': {
    'without map and wildcard template': function(test) {
      var self = this;

      var vc = new ViewContext();

      vc.name = 'Some Name';

      vc.toViewObject('*', function(err, viewObject){
        if (err) return test.done(err);

        test.equal(viewObject.name, undefined);
        test.done();
      });
    },
    
    'with map and wildcard template': function(test) {
      var self = this;

      var vc = new ViewContext();

      vc.name = 'Some Name';

      // Must map
      vc.map({
        name: 'name'
      });

      vc.toViewObject('*', function(err, viewObject){
        if (err) return test.done(err);

        test.equal(viewObject.name, vc.name);
        test.done();
      });
    },
    
    'without template': function(test) {
      var self = this;

      var vc = new ViewContext();

      vc.name = 'Some Name';

      // Must map
      vc.map({
        name: 'name'
      });      

      vc.toViewObject(function(err, viewObject){
        if (err) return test.done(err);

        test.equal(viewObject.name, undefined);
        test.done();
      });
    },
    
    'with map and template': function(test) {
      var self = this;

      var vc = new ViewContext();

      vc.name = 'Some Name';
      vc.otherProperty = 'Other';

      // Must map
      vc.map({
        name: 'name',
        otherProperty: 'otherProperty'
      });
      
      vc.toViewObject({
        otherProperty: true
      }, function(err, viewObject){
        if (err) return test.done(err);

        test.equal(viewObject.name, undefined);
        test.equal(viewObject.otherProperty, 'Other');

        test.done();
      });
    },
    
    'with a chained wildcard template': function(test) {
      var self = this;

      var vc = new ViewContext();

      vc.name = 'Some Name';
      vc.otherProperty = 'Other';

      vc.map({
        name: 'name',
        otherProperty: 'otherProperty'
      }).template('*');
      
      vc.toViewObject(function(err, viewObject){
        if (err) return test.done(err);

        test.equal(viewObject.name, 'Some Name');
        test.equal(viewObject.otherProperty, 'Other');

        test.done();
      });      
    }
  }

}