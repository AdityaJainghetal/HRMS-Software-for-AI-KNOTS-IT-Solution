export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong",
) => {
  if (typeof error === "string" && error.trim()) return error;

  const responseData = error?.response?.data;
  const message =
    responseData?.message || responseData?.error || error?.message;

  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message)) return message.join(", ");
  if (message && typeof message === "object") {
    return message.message || message.error || fallback;
  }
  return fallback;
};
