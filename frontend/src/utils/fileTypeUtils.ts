/**
 * A list of file types that are allowed for uploads.
 * This includes common video and audio file formats.
 */
export const UPLOAD_FILE_TYPES = ['.amr', '.flac', '.m4a', '.ogg', '.webm', '.mp3', '.mp4', '.wav'];

/**
 * Checks if a given file key represents an audio file.
 * @param fileKey - The file key to check.
 * @returns True if the file key represents an audio file, false otherwise.
 */
export function isAudio(fileKey: string) {
    return fileKey.endsWith('.mp3') || fileKey.endsWith('.wav');
}
