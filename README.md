# @averay/gulp-sass

[![View code coverage on codecov][codecov-badge]][codecov]

[codecov]: https://codecov.io/gh/adamaveray/gulp-sass
[codecov-badge]: https://codecov.io/gh/adamaveray/gulp-sass/branch/main/graph/badge.svg

A Gulp plugin to compile Sass files with the modern, high performance [sass-embedded] package.

[sass-embedded]: https://www.npmjs.com/package/sass-embedded

```sh
npm install @averay/gulp-sass
```

## Usage

Pipe the exported function into a Gulp stream:

```js
import gulpSass from '@averay/gulp-sass';

function css() {
  gulp
    .src('css/**/*.{sass,scss}')
    .pipe(/* Apply plugins */)
    .pipe(gulpSass())
    .pipe(gulp.dest('...'));
}
```

The underlying Sass library can be accessed through the additional `sass` export (e.g. `import { sass } from '@averay/gulp-sass'`), or by directly importing the `sass-embedded` package.

### Options

The function accepts an optional [Sass JavaScript API StringOptions][options] object argument.

[options]: https://sass-lang.com/documentation/js-api/interfaces/StringOptionsWithoutImporter

### Custom Functions

Custom Sass functions can be declared using the `functions` property of the options object:

```js
import gulpSass, { sass } from '@averay/gulp-sass';

gulp.src('...').pipe(
  gulpSass({
    functions: {
      'pow($base, $exponent)': (args) => {
        const base = args[0].assertNumber('base').assertNoUnits('base');
        const exponent = args[1]
          .assertNumber('exponent')
          .assertNoUnits('exponent');

        return new sass.SassNumber(Math.pow(base.value, exponent.value));
      },
    },
  }),
);
```

See [the Sass documentation][functions] for additional details.

[functions]: https://sass-lang.com/documentation/js-api/interfaces/StringOptionsWithoutImporter#functions

---

[MIT License](./LICENSE)
