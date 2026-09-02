/** Typed direct-fact failure for a present record outside the current contract.  * Authority: openspec/specs/node-specification/spec.md
 */
export const CURRENT_PROTOCOL_INVALID = "current_protocol_invalid";

export class CurrentProtocolInvalidError extends Error {
  constructor(message = "the production record cannot establish current protocol identity") {
    super(message);
    this.name = "CurrentProtocolInvalidError";
    this.code = CURRENT_PROTOCOL_INVALID;
  }
}

export function currentProtocolInvalid(message) {
  return new CurrentProtocolInvalidError(message);
}

export function isCurrentProtocolInvalid(error) {
  return error?.code === CURRENT_PROTOCOL_INVALID;
}
