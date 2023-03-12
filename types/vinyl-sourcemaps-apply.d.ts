declare module 'vinyl-sourcemaps-apply' {
  import { type RawSourceMap } from 'source-map-js';
  import type Vinyl from 'vinyl';

  export default function applySourceMap(file: Vinyl, sourceMap: RawSourceMap | string): void;
}
