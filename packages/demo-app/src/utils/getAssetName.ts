export const getAssetName = (name?: string) => {
  if (!name) {
    return 'none';
  }
  return name.replaceAll('#', '');
};
