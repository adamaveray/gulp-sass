import { readdirSync, readFileSync, statSync } from 'node:fs';
import { relative } from 'node:path';
import { cwd } from 'node:process';
import type { Transform } from 'node:stream';
import * as sass from 'sass-embedded';
import Vinyl from 'vinyl';

import gulpSass, { sass as sassReexported } from '../src';
import { RawSourceMap } from 'source-map-js';
import PluginError from '../src/lib/PluginError';

const resourcesDir = `${cwd()}/test/__resources__`;

interface VinylWithSourceMap extends Vinyl {
  sourceMap?: RawSourceMap;
}

async function readStream<T>(stream: Transform): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const chunks: T[] = [];
    stream.on('data', (chunk: T) => {
      chunks.push(chunk);
    });
    stream.on('end', () => {
      resolve(chunks);
    });
    stream.on('error', (error) => {
      reject(error);
    });
  });
}

function makeVinylFile(pathname: string, base?: string): Vinyl {
  const file = new Vinyl();
  file.path = pathname;
  if (base != null) {
    file.base = base;
  }
  file.contents = readFileSync(pathname);
  file.stat = statSync(pathname);
  return file;
}

function loadVinylDir(directory: string): VinylWithSourceMap[] {
  return readdirSync(directory).map((basename) => makeVinylFile(`${directory}/${basename}`, directory));
}

describe('the plugin', () => {
  it('exports the underlying library', () => {
    expect(sassReexported).toStrictEqual(sass);
  });

  it('compiles stylesheets', async () => {
    const stream = gulpSass();

    // Load all testing stylesheets
    for (const file of loadVinylDir(resourcesDir)) {
      file.sourceMap = '' as any;
      stream.write(file);
    }

    // Add null file to ensure correctly ignored
    const nullFile = new Vinyl();
    nullFile.contents = null;
    stream.write(nullFile);

    stream.end();

    // Load results
    const files = await readStream<VinylWithSourceMap>(stream);
    const results = Object.fromEntries(
      files.map((file) => [relative(file.base, file.path), file.contents?.toString('utf8')]),
    );

    // Ensure stylesheets generated correctly
    const expectedStylesheet = `
body {
  background: black;
}

a {
  background: blue;
  color: #f0f;
}
    `.trim();
    expect(results).toEqual({
      'example-css.css': expectedStylesheet,
      'example-sass.css': expectedStylesheet,
      'example-scss.css': expectedStylesheet,
    });

    // Ensure source maps are at least set
    expect(files.map((file) => file.sourceMap)).not.toEqual([{}, {}, {}]);
  });

  it('rejects invalid files', async () => {
    const stream = gulpSass();

    const file = {
      isNull: () => false,
      isBuffer: () => false,
      isStream: () => false,
      basename: '',
    } as any;

    stream.write(file);
    stream.end();

    await expect(readStream<VinylWithSourceMap>(stream)).rejects.toThrowError(PluginError);
  });

  it('supports custom functions', async () => {
    // language=SCSS
    const inputScss = `
div {
  width: pow(10, 3) * 1px;
}
`.trim();
    // language=CSS
    const outputCss = `
div {
  width: 1000px;
}
`.trim();

    const stream = gulpSass({
      functions: {
        'pow($base, $exponent)': (args) => {
          const base = args[0]?.assertNumber('base').assertNoUnits('base');
          const exponent = args[1]?.assertNumber('exponent').assertNoUnits('exponent');
          return new sass.SassNumber(Math.pow(base?.value ?? 0, exponent?.value ?? 0));
        },
      },
    });

    const inputFile = new Vinyl();
    inputFile.path = '/dev/null/test.scss';
    inputFile.contents = Buffer.from(inputScss, 'utf8');

    stream.write(inputFile);
    stream.end();

    const [outputFile] = await readStream<VinylWithSourceMap>(stream);
    expect(outputFile?.contents?.toString('utf8')).toEqual(outputCss);
  });
});
