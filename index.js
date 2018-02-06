const through = require('through2');
const gutil = require('gulp-util');
const esprima = require('esprima');
const estemplate = require('estemplate');
const escodegen = require('escodegen');
const applySourceMap = require('vinyl-sourcemaps-apply');
const path = require('path');
const debug = require('debug')('gulp-wrap-js');

module.exports = function wrap(_tmpl, options = {}) {
  if (!_tmpl) {
    throw new gutil.PluginError('gulp-wrap-js', 'No template supplied');
  }

  const tmpl = estemplate.compile(_tmpl, { attachComment: true });
  const {
    format = escodegen.FORMAT_DEFAULTS,
  } = options;

  debug('template', tmpl);
  debug('format', format);

  return through.obj(function transform(file, enc, callback) {
    // generate source maps if plugin source-map present
    if (file.sourceMap) {
      options.makeSourceMaps = true;
    }

    // Do nothing if no contents
    if (file.isNull()) {
      debug('null file');
      this.push(file);
      return callback();
    }

    if (file.isStream()) {
      return callback(new gutil.PluginError('gulp-wrap-js', 'Stream content is not supported'));
    }

    // check if file.contents is a `Buffer`
    if (file.isBuffer()) {
      let result;
      try {
        debug('parse', file.contents);
        let ast = esprima.parseScript(file.contents.toString(), {
          loc: true,
          range: true,
          tokens: true,
          comment: true,
          source: file.relative,
        });

        debug('comments');
        escodegen.attachComments(ast, ast.comments, ast.tokens);

        debug('template');
        ast.file = file;
        ast = tmpl(ast);

        debug('result');
        result = escodegen.generate(ast, {
          comment: true,
          format,
          sourceMap: true,
          sourceMapWithCode: true,
          file: file.relative,
        });
      } catch (e) {
        debug('error', e);
        // Relative to gulpfile.js filepath with forward slashes
        const err = gutil.colors.magenta(path.relative('.', file.path).split(path.sep).join('/'));
        return callback(new gutil.PluginError('gulp-wrap-js', `${err} ${e.message}`));
      }

      debug('result', result.map);

      file.contents = Buffer.from(result.code);
      if (file.sourceMap) {
        applySourceMap(file, result.map.toJSON());
      }

      this.push(file);
      return callback();
    }

    // noop
    return callback(new Error('unsupported format'));
  });
};
