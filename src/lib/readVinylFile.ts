import type Vinyl from 'vinyl';

async function readStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: string) => {
      chunks.push(Buffer.from(chunk));
    });
    stream.on(
      'error',
      /* istanbul ignore next */
      (error: unknown) => {
        reject(error);
      },
    );
    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

export default async function readVinylFile(file: Vinyl): Promise<Buffer | undefined> {
  if (file.isBuffer()) {
    return file.contents;
  }
  if (file.isStream()) {
    return readStream(file.contents);
  }
  return undefined;
}
