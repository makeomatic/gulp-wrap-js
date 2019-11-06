const fs = require('fs');
const gulp = require('gulp');
const assert = require('assert');
const streamAssert = require('stream-assert');
const sourcemaps = require('gulp-sourcemaps');
const File = require('vinyl');

delete require.cache[require.resolve('../')];

const wrapJS = require('../');

describe('gulp-wrap-js', () => {
  const expectedFile = new File({
    path: 'test/expected/index.js',
    cwd: 'test/',
    base: 'test/expected',
    contents: fs.readFileSync('test/expected/index.js'),
  });

  it('should produce expected file and source map', (done) => {
    gulp.src('./fixtures/index.js', { cwd: __dirname })
      .pipe(sourcemaps.init())
      .pipe(wrapJS('// template comment\ndefine("%= file.relative %", function () {%= body %});'))
      .pipe(streamAssert.first((file) => {
        assert.equal(file.contents.toString(), expectedFile.contents.toString().trim());
        assert.deepEqual(file.sourceMap.sources, [file.relative]);
        assert.equal(file.sourceMap.file, expectedFile.relative);
        assert.ok(file.sourceMap.names);
      }))
      .pipe(streamAssert.end(done));
  });
});
