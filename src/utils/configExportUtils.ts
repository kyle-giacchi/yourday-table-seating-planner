/**
 * Triggers a browser download of a serialized configuration (from `useAppData().exportJson()`).
 * Uses DOM APIs (Blob, createElement) so this stays in a utility, not in the store.
 */
export const downloadConfiguration = (configData: string): void => {
  const blob = new Blob([configData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `room-configuration-${timestamp}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
