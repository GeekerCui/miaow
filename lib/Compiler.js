var _ = require('lodash');
var console = require('miaow-util').console;
var mutil = require('miaow-util');
var Tapable = require('tapable');

var Compilation = require('./Compilation');
var ModuleFactory = require('./ModuleFactory');
var Resolver = require('./Resolver');
var Watcher = require('./Watcher');

function Compiler(options) {
  Tapable.call(this);
  _.bindAll(this);

  this.context = options.context;
  this.output = options.output;
  this.debug = options.debug;
  this.options = options;

  this.resolver = new Resolver(options.resolve);
}

Compiler.prototype = Object.create(Tapable.prototype);
Compiler.prototype.constructor = Compiler;

Compiler.prototype.run = function(callback) {
  this.applyPluginsAsync('run', function(err) {
    if (err) {
      return callback(err);
    }

    this.compile(callback);
  }.bind(this));
};

Compiler.prototype.watch = function(callback) {
  var watcher = new Watcher(this, callback);
  watcher.watch(callback);
};

Compiler.prototype.compile = function(callback) {
  var compiler = this;
  var compilation = new Compilation();
  compilation.factory = new ModuleFactory(this.options.modules);
  compilation.resolver = this.resolver;
  compilation.context = this.context;
  compilation.exclude = this.options.exclude;
  compilation.debug = this.debug;
  compilation.output = this.output;
  compilation.startTime = new Date();

  console.log('开始编译');

  this.applyPluginsAsyncSeries('compile', compilation, function(err) {
    if (err) {
      return callback(err);
    }

    compilation.seal(function(err) {
      if (err) {
        console.error('编译失败');
        return compiler.applyPluginsAsyncSeries('compile-failed', compilation, function() {
          callback(err);
        });
      }

      console.log('编译成功，编译' + _.size(compilation.modules) + '个模块，耗时' + mutil.duration(new Date() - compilation.startTime));
      compiler.applyPluginsAsyncSeries('compile-success', compilation, function(err) {
        callback(err);
      });
    });
  });
};

module.exports = Compiler;
