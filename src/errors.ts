/** Apache Velocity: Core Errors | OWNER: vela | STATUS: READY */

/**
 * Parse error thrown when template parsing fails
 */
export class ParseErrorException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseErrorException';
  }
}

/**
 * Resource not found exception
 */
export class ResourceNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceNotFoundException';
  }
}

/**
 * Method invocation exception
 */
export class MethodInvocationException extends Error {
  declare readonly cause: Error | undefined;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'MethodInvocationException';
    this.cause = cause;
  }
}
