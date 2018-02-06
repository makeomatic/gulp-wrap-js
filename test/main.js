const fs = require('fs');
const gulp = require('gulp');
const assert = require('assert');
const streamAssert = require('stream-assert');
const sourcemaps = require('gulp-sourcemaps');

delete require.cache[require.resolve('../')];

const gutil = require('gulp-util');
const wrapJS = require('../');

describe('gulp-wrap-js', () => {
  const expectedFile = new gutil.File({
    path: 'test/expected/index.js',
    cwd: 'test/',
    base: 'test/expected',
    contents: fs.readFileSync('test/expected/index.js'),
  });

  it('should produce expected file and source map', (done) => {
    gulp.src('./fixtures/index.js')
      .pipe(sourcemaps.init())
      .pipe(wrapJS('// template comment\ndefine("%= file.relative %", function () {%= body %});'))
      .pipe(streamAssert.first((file) => {
        assert.equal(file.contents.toString, expectedFile.contents.toString().trim());
        assert.equalDeep(file.sourceMap.sources, [file.relative]);
        assert.equal(file.sourceMap.file, expectedFile.relative);
        assert.ok(file.sourceMap.names);
      }))
      .pipe(streamAssert.end(done));
  });
});
