var util = require('util');

var Base = require('../../lib').Base;

/**
 * Classes
 */
// Wrapper class contains functionality common to all our objects
function Wrapper(doc) {
  Wrapper.super_.apply(this, arguments);  
  this.doc = doc;
}
util.inherits(Wrapper, Base);

Wrapper.prototype.__defineViewTemplate__({
  id: true,
  name: true
});

Wrapper.prototype.__defineViewMappings__({
  id: 'doc._id',
  type: 'doc.objectType',
  name: 'doc.name'
});

// Asset class, inherits from Wrapper
var Asset = exports.Asset = function Asset(doc) {
  Asset.super_.apply(this, arguments);
}
util.inherits(Asset, Wrapper);

Asset.prototype.__defineViewTemplate__({
  type: true,
  sizeBytes: true,
  dimensions: true
});

Asset.prototype.__defineViewMappings__({
  sizeBytes: 'doc.sizeBytes',
  owner: function(self, cb) {
    Owner.findById(self.doc.ownerId, cb);
  }
});

Asset.create = function(doc) {
  return new ({ image: Image, video: Video }[doc.objectType])(doc);
};

Asset.findAll = function(cb) {
  var foundAssets = require('./data').assets.map(function(doc){
    return Asset.create(doc);
  });
  
  cb(null, foundAssets);
};

// Video class, inherits from Asset
function Video(doc) {
  Video.super_.apply(this, arguments);
}
util.inherits(Video, Asset);

Video.prototype.__defineViewTemplate__({
  durationSeconds: true
});

Video.prototype.__defineViewMappings__({
  durationSeconds: function(){
    return Math.round(this.doc.videoInfo.durationMs / 1000);
  },
  dimensions: function() {
    return {
      x: this.doc.videoInfo.width,
      y: this.doc.videoInfo.height
    };
  }
});

// Image class, inherits from Asset
function Image(doc) {
  Image.super_.apply(this, arguments);
}
util.inherits(Image, Asset);

Image.prototype.__defineViewMappings__({
  dimensions: function() {
    return {
      x: this.doc.imageInfo.width,
      y: this.doc.imageInfo.height
    };
  }
});

// Owner class, inherits from Wrapper
function Owner(doc) {
  Owner.super_.apply(this, arguments);
}
util.inherits(Owner, Wrapper);

Owner.prototype.__defineViewMappings__({
  lastSeenAt: 'doc.lastSeenAt'
});

Owner.findById = function(id, cb) {
  cb(null, new Owner(require('./data').owners[id]));
};