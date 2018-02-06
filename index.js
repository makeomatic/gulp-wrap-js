const through = require('through2');
const gutil = require('gulp-util');
const esprima = require('esprima');
const estemplate = require('estemplate');
const escodegen = require('escodegen');
const applySourceMap = require('vinyl-sourcemaps-apply');
const path = require('path');

module.exports = function wrap(_tmpl, format = escodegen.FORMAT_DEFAULTS) {
  if (!_tmpl) {
    throw new gutil.PluginError('gulp-wrap-js', 'No template supplied');
  }

  const tmpl = estemplate.compile(_tmpl, { attachComment: true });

  return through.obj((file, enc, callback) => {
    // Do nothing if no contents
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(new gutil.PluginError('gulp-wrap-js', 'Stream content is not supported'));
    }

    // check if file.contents is a `Buffer`
    if (file.isBuffer()) {
      let result;
      try {
        let ast = esprima.parse(file.contents, {
          loc: true,
          source: file.relative,
          range: true,
          tokens: true,
          comment: true,
        });
        escodegen.attachComments(ast, ast.comments, ast.tokens);
        ast.file = file;
        ast = tmpl(ast);

        result = escodegen.generate(ast, {
          comment: true,
          format,
          sourceMap: true,
          sourceMapWithCode: true,
          file: file.relative,
        });
      } catch (e) {
        // Relative to gulpfile.js filepath with forward slashes
        const err = gutil.colors.magenta(path.relative('.', file.path).split(path.sep).join('/'));
        return callback(new gutil.PluginError('gulp-wrap-js', `${err} ${e.message}`));
      }

      file.contents = Buffer.from(result.code);
      if (file.sourceMap) {
        applySourceMap(file, JSON.parse(result.map.toString()));
      }

      return callback(null, file);
    }

    // noop
    return callback(new Error('unsupported format'));
  });
};
