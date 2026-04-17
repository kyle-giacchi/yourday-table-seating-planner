import { defaultRepository } from '@/services/DataRepository';

/**
 * Triggers a browser download of the full configuration as a JSON file.
 * Uses DOM APIs (Blob, createElement) so this stays in a utility, not in the repository.
 */
export const downloadConfiguration = (): void => {
  const configData = defaultRepository.exportConfiguration();
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

/**
 * Imports a complete configuration from a JSON string.
 * Thin wrapper kept for backward compatibility with components that don't
 * have direct repository access.
 */
export const importCompleteConfiguration = (
  jsonString: string,
): { success: boolean; error?: string } => {
  return defaultRepository.importConfiguration(jsonString);
};
