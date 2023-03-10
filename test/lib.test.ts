import { PassThrough } from 'node:stream';
import Vinyl from 'vinyl';

import { name as packageName } from '../package.json';
import PluginError from '../src/lib/PluginError';
import readVinylFile from '../src/lib/readVinylFile';

describe('lib', () => {
  it('PluginError prefixes the plugin name', () => {
    expect(new PluginError('Hello World').message).toEqual(`${packageName}: Hello World`);
  });

  describe('reading vinyl files', () => {
    const fileContent = 'Hello world';

    it('reads buffer files', async () => {
      const file = new Vinyl();
      file.contents = Buffer.from(fileContent, 'utf8');

      const result = await readVinylFile(file);
      expect(result?.toString('utf8')).toEqual(fileContent);
    });

    it('reads stream files', async () => {
      const stream = new PassThrough();
      setTimeout(() => {
        // Write to stream word-by-word
        for (const part of fileContent.split(/\b/g)) {
          stream.write(part);
        }
        stream.end();
      }, 1);

      const file = new Vinyl();
      file.contents = stream;

      const result = await readVinylFile(file);
      expect(result?.toString('utf8')).toEqual(fileContent);
    });

    it('ignores other files', async () => {
      const file = new Vinyl();
      file.contents = null;

      const result = await readVinylFile(file);
      expect(result).toBeUndefined();
    });
  });
});
