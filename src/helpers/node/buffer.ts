/**
 * Slice buffer
 *
 * @param buf - buffer
 * @param start - start bute
 * @param end- end byte
 */
export const slice = (buf: Buffer, start: number, end: number) => buf.slice(start, end);

/**
 * Copy from one buffer to another
 * @param src - source buffer
 * @param dst - destination buffer
 * @param dstOffset - copy destination offset
 */
export const copy = (src: Buffer, dst: Buffer, dstOffset: number) => {
  if (src.length + dstOffset > dst.length) {
    throw new Error('buffer is too small');
  }

  src.copy(dst, dstOffset);
};

/**
 * Native buffer allocate function
 */
export const alloc = Buffer.alloc;

export const from = Buffer.from;
