to-view-object
===================

Inherit from this base class to enable recursive conversion to a view-friendly object structure, mapped to standard templates with per-endpoint overrides.

## Use case

1. You need to present objects to views. (JSON or HTML)
2. Your objects need to selectively include properties and entities from the underlying data model.
3. The properties and entities you present need to be transformed, asynchronously fetched or otherwise consistently mapped.
4. You want to keep all this logic DRY. (see [Don't repeat yourself](http://en.wikipedia.org/wiki/Don't_repeat_yourself))

## Example

To output a collection of Assets from this object model:

![Models to view-friendly objects](https://rawgithub.com/jupiter/node-to-view-object/master/examples/support/models.svg)

Do this:

```
Asset.findAll(function(err, assets, summary){
  ...
  
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
    ...
    
    res.send(viewObject);
  });
});
```

And re-use mapping and fetching logic elsewhere:

```
Asset.findById(req.params.id, function(err, asset){
  ...
  
  ViewContext.create({
    asset: asset
  }).template({
    asset: { owner: true }
  }).toViewObject(function(err, viewObject){
    ...
    
    res.send(viewObject);
  });
});
```

See:

- [examples/assets.js](https://github.com/jupiter/node-to-view-object/tree/master/examples/assets.js)
- [examples/support/data.js](https://github.com/jupiter/node-to-view-object/tree/master/examples/support/data.js)
- [examples/support/models.js](https://github.com/jupiter/node-to-view-object/tree/master/examples/support/models.js)

## How

### Inherit from Base

For each of the classes in your object model, inherit from Base.

```
function MyClass(){
  MyClass.super_.apply(this);
}
util.inherits(MyClass, require('to-view-object').Base);
```

If your class already inherits from something else, consider wrapping it within
a class that inherits from Base, or wrap instances using ViewContext.

###  Define the mappings and transforming operations

```
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

### Define the default values included in a view object

```
MyClass.prototype.__defineViewTemplate__({
  deepValue: true,
  syncValue: true
});
```

### Convert your object to a view object

```
myInstance.toViewObject(true, function(err, viewObject){})
```

Or, use a ViewContext to convert multiple objects:

```
require('to-view-object').ViewContext.create({
  instances: myInstances
}).toViewObject(function(err, viewObject){});
```

