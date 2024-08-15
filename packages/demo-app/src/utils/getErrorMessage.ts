export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes('custom program error: 0x1')) {
      return 'Insufficient lamports';
    }
    return error.message;
  }
  return String(error);
};
