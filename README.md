to-view-object
===================

Inherit from this base class to enable recursive conversion to a view-friendly object structure, mapped to standard templates with optional overrides.

## Use case

1. You need to present objects to views. (JSON or HTML)
2. Your objects need to selectively include properties and entities from the underlying data model.
3. The properties and entities you present need to be transformed, asynchronously fetched or otherwise consistently mapped.
4. You want to keep all this logic DRY. (see [Don't repeat yourself](http://en.wikipedia.org/wiki/Don't_repeat_yourself))

## Example

To output a collection of Assets from this object model:

![Models to view-friendly objects](https://rawgithub.com/jupiter/node-to-view-object/master/examples/support/models.svg)

Do this:

```javascript
Asset.findAll(function(err, assets, summary){
  //...//
  ViewContext.create({
    assets: assets,
    summary: summary
  }).template({
    // Selectively include non-default properties in output
    assets: {
      owner: { lastSeenAt: true }
    },
    summary: true
  }).toViewObject(function(err, viewObject){
    //...//
    res.send(viewObject);
  });
});
```

And re-use mapping and fetching logic elsewhere:

```javascript
Asset.findById(req.params.id, function(err, asset){
  //...//
  ViewContext.create({
    asset: asset
  }).template({
    asset: { owner: true }
  }).toViewObject(function(err, viewObject){
    //...//
    res.send(viewObject);
  });
});
```

See:

- [examples/assets.js](https://github.com/jupiter/node-to-view-object/tree/master/examples/assets.js)
- [examples/support/data.js](https://github.com/jupiter/node-to-view-object/tree/master/examples/support/data.js)
- [examples/support/models.js](https://github.com/jupiter/node-to-view-object/tree/master/examples/support/models.js)

## Installation

`$ npm install to-view-object`

## To use

### Inherit from Base

For each of the classes in your object model, inherit from Base.

```javascript
function MyClass(){
  MyClass.super_.apply(this);
}
util.inherits(MyClass, require('to-view-object').Base);
```

(If your class already inherits from something else, consider wrapping it within
a class that inherits from Base, or wrap instances using ViewContext.)

###  Define the mappings

```javascript
MyClass.prototype.__defineViewOps__({
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

### Convert a single instance to a view object

**instance#toViewObject(template, callback)**

Arguments:

- **template** (optional) specifies which properties to include in addition to the default properties:
  * `'*'` will include all properties available, recursively (not recommended for production)
  * _Object_ to extend default properties, with values of either `true` or a sub-template _Object_, e.g. `{ updatedAt: true, owner: { updatedAt: true }}`
- **callback** function taking arguments for error and the new view object, e.g. `function(err, viewObject){}`

### Convert a custom object structure to a view object

Use a ViewContext instance to recursively convert a custom object containing instances.

`var ViewContext = require('to-view-object');`

**ViewContext.create(obj)**

Returns a new ViewContext instance.

Arguments:

- **obj** an _Object_ containing individual instances or arrays of instances

**ViewContext#map(ops)**

Returns the same ViewContext instance for chaining.

**ViewContext#template(template)**

Returns the same ViewContext instance for chaining.

**ViewContext#toViewObject(template, callback)**

See _instance#toViewObject_.

**ViewContext#on(eventName, fn)**

Events:

- `'error'` e.g `function(err){}`
- `'complete'` e.g. `function(viewObject){}`