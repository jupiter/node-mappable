node-mappable ![Project status](https://secure.travis-ci.org/jupiter/node-mappable.png)
===================

Inherit from this base class to enable recursive mapping to a view-friendly object structure.

## Use case

1. You need to present objects to views. (JSON or HTML)
2. Your objects need to selectively include properties and entities from the underlying data model.
3. The properties and entities you present need to be transformed, asynchronously fetched or otherwise consistently mapped.
4. You want to keep all this logic DRY. (see [Don't repeat yourself](http://en.wikipedia.org/wiki/Don't_repeat_yourself))

## Example

To output Assets from this object model:

![Models to view-friendly objects](https://rawgithub.com/jupiter/node-mappable/master/examples/support/models.svg)

Do this:

```javascript
Asset.findById(req.params.id, function(err, asset){

  asset.toViewObject({
    // Selectively include non-default properties in output
    asset: { owner: { lastSeenAt: true } }
  }, function(err, viewObject){

    res.send(viewObject);
  });
});
```

Or for collections of Assets:

```javascript
Asset.findAll(function(err, assets, summary){

  ViewContext.create({
    assets: assets,
    summary: summary
  }).template({
    assets: { owner: { lastSeenAt: true } },
    summary: true
  }).toViewObject(function(err, viewObject){

    res.send(viewObject);
  });
});
```

See examples:

- [examples/assets.js](https://github.com/jupiter/node-mappable/tree/master/examples/assets.js)
- [examples/support/data.js](https://github.com/jupiter/node-mappable/tree/master/examples/support/data.js)
- [examples/support/models.js](https://github.com/jupiter/node-mappable/tree/master/examples/support/models.js)

## Installation

```
$ npm install mappable
```

## How to use

### Inherit from mappable Base

For each of the classes in your object model, inherit from Base.

```javascript
function MyClass(){
  MyClass.super_.apply(this);
}
util.inherits(MyClass, require('mappable').Base);
```

(If your class already inherits from something else, wrap instances using
ViewContext or consider wrapping it within a class that inherits from Base.)

###  Define the mappings

```javascript
MyClass.prototype.__defineViewMappings__({
  // Simple deep map by specifying the path
  'deepValue': 'doc.deeper.value',

  // Synchronously return a value
  'syncValue': function(){
    return new Date(doc.updatedAtMs);
  },

  // Asynchronously return a value
  'asyncValue': function(done) {
    this.fetchValue(done);
  },

  // Or with `self` already declared, for use with deeper callbacks
  'asyncValueSelf': function(self, done) {
    self.fetchValueAlt(function(err, valueAlt){
      if (err) return done(err);

      self.fetchWithAlt(valueAlt, done);
    });
  }
});
```

### Define the default properties

```javascript
MyClass.prototype.__defineViewTemplate__({
  deepValue: true,
  syncValue: true
});
```

### Convert a single mappable instance to a view object

**Mappable#toViewObject(template, callback)**

Arguments:

- **template** (optional) specifies which properties to include in addition to the default properties:
  * `'*'` will include all properties available, recursively (not recommended for production)
  * _Object_ to extend default properties, with values of either `true` or a sub-template _Object_, e.g. `{ updatedAt: true, owner: { updatedAt: true }}`
- **callback** function taking arguments for error and the new view object, e.g. `function(err, viewObject){}`

### Convert a custom object structure to a view object

Use a ViewContext instance to recursively convert a custom object containing instances.

`var ViewContext = require('mappable').ViewContext;`

**ViewContext.create(obj)**

Returns a new ViewContext instance.

Arguments:

- **obj** an _Object_ containing individual instances or arrays of instances

**ViewContext#map(mappings)**

Returns the same ViewContext instance for chaining.

**ViewContext#template(template)**

Returns the same ViewContext instance for chaining.

**ViewContext#toViewObject(template, callback)**

See _instance#toViewObject_.

**ViewContext#on(eventName, fn)**

Events:

- `'error'` e.g `function(err){}`
- `'complete'` e.g. `function(viewObject){}`

### Concurrency

The default is to run mapping operations in _parallel_. To limit the number of concurrent mappings:

```
require('mappable').setConcurrencyLimit(5);
```

Or, for _series_:

```
require('mappable').setConcurrencyLimit(1);
```
