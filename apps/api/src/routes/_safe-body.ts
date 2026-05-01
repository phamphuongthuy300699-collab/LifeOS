type SafeBodyResult = {
  body: Record<string, unknown>;
  parseTimedOut: boolean;
  parseError: string | null;
};

export async function readJsonBodySafe(
  request: Request,
  timeoutMs = 1500,
): Promise<SafeBodyResult> {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD') {
    return { body: {}, parseTimedOut: false, parseError: null };
  }

  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader === '0') {
    return { body: {}, parseTimedOut: false, parseError: null };
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return { body: {}, parseTimedOut: false, parseError: null };
  }

  try {
    const timedText = await Promise.race<string>([
      request.text(),
      new Promise<string>((resolve) => {
        setTimeout(() => resolve('__LIFEOS_BODY_PARSE_TIMEOUT__'), timeoutMs);
      }),
    ]);

    if (timedText === '__LIFEOS_BODY_PARSE_TIMEOUT__') {
      return {
        body: {},
        parseTimedOut: true,
        parseError: `Body parse timeout after ${timeoutMs}ms`,
      };
    }

    if (!timedText.trim()) {
      return { body: {}, parseTimedOut: false, parseError: null };
    }

    try {
      const parsed = JSON.parse(timedText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {
          body: {},
          parseTimedOut: false,
          parseError: 'JSON body must be an object',
        };
      }

      return {
        body: parsed as Record<string, unknown>,
        parseTimedOut: false,
        parseError: null,
      };
    } catch (error) {
      return {
        body: {},
        parseTimedOut: false,
        parseError: error instanceof Error ? error.message : 'Invalid JSON body',
      };
    }
  } catch (error) {
    return {
      body: {},
      parseTimedOut: false,
      parseError: error instanceof Error ? error.message : 'Failed to read request body',
    };
  }
}
