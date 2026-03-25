/**
 * Suppress stderr noise from expected GET /health → 503 when Postgres is not running.
 * Nest's ConsoleLogger uses process.stderr.write by default (not console.error).
 */
const origStderrWrite = process.stderr.write.bind(process.stderr);

function shouldSuppressHealthCheckStderr(chunk: string): boolean {
  if (chunk.includes('Health Check has failed!')) return true;
  if (chunk.includes('[HttpExceptionFilter]') && chunk.includes('/health'))
    return true;
  if (
    chunk.includes('ServiceUnavailableException') &&
    chunk.includes('@nestjs/terminus')
  )
    return true;
  return false;
}

beforeAll(() => {
  (
    process.stderr as NodeJS.WriteStream & { write: typeof process.stderr.write }
  ).write = (
    chunk: string | Uint8Array,
    encodingOrCb?: BufferEncoding | ((err?: Error) => void),
    cb?: (err?: Error) => void,
  ): boolean => {
    const s =
      typeof chunk === 'string'
        ? chunk
        : Buffer.isBuffer(chunk)
          ? chunk.toString()
          : Buffer.from(chunk).toString();
    if (shouldSuppressHealthCheckStderr(s)) {
      if (typeof encodingOrCb === 'function') encodingOrCb();
      else if (typeof cb === 'function') cb();
      return true;
    }
    if (typeof encodingOrCb === 'function') {
      return origStderrWrite(chunk, encodingOrCb);
    }
    return origStderrWrite(
      chunk,
      encodingOrCb as BufferEncoding | undefined,
      cb,
    );
  };
});

afterAll(() => {
  (process.stderr as { write: typeof origStderrWrite }).write = origStderrWrite;
});
