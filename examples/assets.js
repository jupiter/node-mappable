var ViewContext = require('../lib').ViewContext;

var Asset = require('./support/models').Asset;

Asset.findAll(function(err, assets){
  
  ViewContext.create({
    assets: assets
  }).toViewObject({
    assets: {
      owner: {
        lastSeenAt: true
      }
    }
  }, function(err, viewObject){
    
    console.log(JSON.stringify(viewObject, null, '  '));
  });
});