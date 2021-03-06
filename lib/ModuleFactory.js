var _ = require('lodash');
var fs = require('graceful-fs');
var minimatch = require('minimatch');
var mutil = require('miaow-util');
var path = require('path');

var Module = require('./Module');
var destTask = require('./tasks/dest');

function ModuleFactory(options) {
  this.options = options;
}

ModuleFactory.prototype.create = function(src, contents, callback) {
  if (_.isFunction(contents)) {
    callback = contents;
    contents = null;
  }

  var module = new Module();
  module.src = src;
  module.srcDir = path.dirname(src);

  // 设置模块的参数
  var options = _.find(this.options, function(item) {
    return minimatch(src, item.test, {matchBase: true, dot: true});
  });

  // 追加输出任务
  module.tasks = options.tasks.concat({
    task: destTask,
    options: {}
  });

  // 扩展信息
  _.assign(module, _.pick(options, ['context', 'output', 'domain', 'hashLength', 'hashConnector', 'ext', 'charset', 'debug', 'environment']));

  // 设置模块的输出目录
  module.destDir = (options.release || '$0').replace('$0', module.srcDir);

  // 设置URL
  module.url = (options.url || '$0').replace('$0', module.srcDir);

  // 设置扩展信息
  module.extra = {};

  function setContents(err, contents) {
    if (err) {
      return callback(err);
    }

    // 设置模块内容及Hash值
    module.srcContents = module.contents = contents;
    module.srcHash = mutil.hash(contents);

    callback(null, module);
  }

  if (contents) {
    setContents(null, contents);
  } else {
    fs.readFile(path.resolve(options.context, src), setContents);
  }
};

module.exports = ModuleFactory;
