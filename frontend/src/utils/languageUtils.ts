
// The default language to be used by the app
export const DEFAULT_LANGUAGE  = 'English (US)';

/**
 * A list of available languages in the app for translation.
 */
export const AVAILABLE_LANGUAGES: string[] = [
    'Arabic (Gulf)',
    'Catalan',
    'Danish',
    'Dutch (BE)',
    'Dutch (NL)',
    'English (US)',
    'Finnish',
    'French (FR)',
    'German (DE)',
    'Hebrew',
    'Icelandic',
    'Italian',
    'Norwegian',
    'Portuguese (BR)',
    'Portuguese (PT)',
    'Spanish',
    'Swedish'
  ];
  
  /**
 * The Amazon Polly language code for each of the languages in AVAILABLE_LANGUAGES.
 */
  export const LANGUAGE_CODE_MAP: { [key: string]: string } = {
    'Arabic (Gulf)': 'ar-AE',
    'Catalan': 'ca-ES',
    'Danish': 'da-DK',
    'Dutch (BE)': 'nl-BE',
    'Dutch (NL)': 'nl-NL',
    'English (US)': 'en-US',
    'Finnish': 'fi-FI',
    'French (FR)': 'fr-FR',
    'German (DE)': 'de-DE',
    'Hebrew': 'he-IL',
    'Icelandic': 'is-IS',
    'Italian': 'it-IT',
    'Norwegian': 'nb-NO',
    'Portuguese (BR)': 'pt-BR',
    'Portuguese (PT)': 'pt-PT',
    'Spanish': 'es-ES',
    'Swedish': 'sv-SE'
  };

// Reverse map: Language Code to Language Name
export const LANGUAGE_NAME_MAP: { [key: string]: string } = Object.fromEntries(
    Object.entries(LANGUAGE_CODE_MAP).map(([name, code]) => [code, name])
);

/**
 * Checks if a given language code is in the list of available languages
 * @param language - The language to check.
 * @returns True if the language is in the list of available languages, false otherwise.
 */
export function isAvailable(language: string) {
    return Object.values(LANGUAGE_CODE_MAP).includes(language);
}

/**
 * A list of language codes that should be aligned to the right.
 * This is typically for languages that are written from right to left, such as Arabic and Hebrew.
 */
export const ALIGN_TO_RIGHT_LANGUAGES = ['ar-AE', 'he-IL'];

/**
 * Checks if a given language code is a right-to-left (RTL) language.
 * @param languageCode - The language code to check.
 * @returns True if the language is a right-to-left language, false otherwise.
 */
export function isRTL(languageCode: string | null) {
     return languageCode && ALIGN_TO_RIGHT_LANGUAGES.includes(languageCode);
}