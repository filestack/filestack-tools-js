/**
 * Slice buffer
 *
 * @param buf - buffer
 * @param start - start bute
 * @param end- end byte
 */
export const slice = (buf: Uint8Array, start: number, end: number) => buf.subarray(start, end);

/**
 * Copy from one buffer to another
 * @param src - source buffer
 * @param dst - destination buffer
 * @param dstOffset - copy destination offset
 */
export const copy = (src: Uint8Array, dst: Uint8Array, dstOffset: number) => {
  if (src.length + dstOffset > dst.length) {
    throw new Error('buffer is too small');
  }

  src.set(dst, dstOffset);
};

/**
 * Native buffer allocate function
 */
export const alloc = (args: any) => new Uint8Array(args);
export const from = (args: any) => new Uint8Array(args);
