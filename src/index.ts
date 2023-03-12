import { Transform } from 'node:stream';
import { pathToFileURL } from 'node:url';

import * as logger from 'gulplog';
import * as sass from 'sass-embedded';
import { type CompileResult, type StringOptions, type Syntax } from 'sass-embedded';
import { type RawSourceMap } from 'source-map-js';
import type Vinyl from 'vinyl';
import applySourceMap from 'vinyl-sourcemaps-apply';

import PluginError from './lib/PluginError';
import readVinylFile from './lib/readVinylFile';

export * as sass from 'sass-embedded';

export type SassOptions = Omit<StringOptions<'async'>, 'sourceMap' | 'sourceMapIncludeSources' | 'url'>;

interface VinylWithSourceMap extends Vinyl {
  sourceMap?: RawSourceMap;
}

const extensionSyntaxes: Record<string, Syntax> = {
  '.scss': 'scss',
  '.sass': 'indented',
  '.css': 'css',
};

async function compileSass(
  file: VinylWithSourceMap,
  contents: string,
  commonOptions: SassOptions,
): Promise<CompileResult> {
  const options: StringOptions<'async'> = { ...commonOptions };

  // Set current file path
  options.url = pathToFileURL(file.path);

  // Control sourcemaps
  const sourceMapsEnabled = file.sourceMap != null;
  options.sourceMap = sourceMapsEnabled;
  options.sourceMapIncludeSources = sourceMapsEnabled;

  // Determine correct syntax
  options.syntax ??= extensionSyntaxes[file.extname.toLowerCase()];

  // Add file's current directory for relative imports
  options.loadPaths ??= [];
  options.loadPaths.unshift(file.dirname);

  // Use Gulp logging
  options.logger ??= logger;

  const result = await sass.compileStringAsync(contents, options);
  if (result.sourceMap != null) {
    result.sourceMap.file = file.path;
  }

  return result;
}

export default function gulpSass(options: SassOptions = {}): Transform {
  return new Transform({
    objectMode: true,
    async transform(file: Vinyl, encoding, callback): Promise<void> {
      if (file.isNull()) {
        callback();
        return;
      }

      if (file.basename.startsWith('_')) {
        // Ignored file
        callback();
        return;
      }

      // Load file
      const contents = await readVinylFile(file);
      if (contents == null) {
        callback(new PluginError('Unsupported file'));
        return;
      }

      // Compile stylesheet
      const { css, sourceMap } = await compileSass(file, contents.toString(encoding), options);

      // Output compiled file
      const newFile = file.clone({ contents: false });
      newFile.contents = Buffer.from(css, encoding);
      newFile.extname = '.css';
      if (newFile.stat != null) {
        // Update modification time
        const now = new Date();
        newFile.stat.atime = now;
        newFile.stat.mtime = now;
        newFile.stat.ctime = now;
      }
      if (sourceMap != null) {
        applySourceMap(newFile, sourceMap);
      }
      this.push(newFile);

      callback();
    },
  });
}
