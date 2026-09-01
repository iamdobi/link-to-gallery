const DEFAULT_DELAYS = [300, 900];

type RetryOptions = {
  delays?: readonly number[];
  wait?: (delay: number) => Promise<void>;
};

function isJwtIssuedAtFutureError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("jwt issued at future");
}

function waitFor(delay: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export async function retryOnJwtIssuedAtFuture<T>(
  operation: () => Promise<T>,
  { delays = DEFAULT_DELAYS, wait = waitFor }: RetryOptions = {},
): Promise<T> {
  for (const delay of delays) {
    try {
      return await operation();
    } catch (error) {
      if (!isJwtIssuedAtFutureError(error)) throw error;
      await wait(delay);
    }
  }

  return operation();
}
