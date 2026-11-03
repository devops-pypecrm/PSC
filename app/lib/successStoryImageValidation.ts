export const MAX_STORED_SUCCESS_IMAGE_BYTES = 1024 * 1024;

export function isValidSuccessImageDataUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;

  const base64 = match[1];
  if (base64.length > Math.ceil(MAX_STORED_SUCCESS_IMAGE_BYTES / 3) * 4) {
    return false;
  }

  const bytes = Buffer.from(base64, "base64");
  return (
    bytes.length > 0 &&
    bytes.length <= MAX_STORED_SUCCESS_IMAGE_BYTES &&
    bytes.toString("base64") === base64 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  );
}
