/**
 * APPLICATION_BASE_PATHNAME is the base URL of the application
 */
const APPLICATION_BASE_PATHNAME = import.meta.env.APP_URL; // This is the base URL of the application

/**
 * APPLICATION_LANGUAGE is the language setting for the application
 */
const APPLICATION_LANGUAGE = import.meta.env.VITE_LANGUAGE || 'en';
// --------------------------------------------

/**
 * AVAILABLE_LANGUAGES is the list of available languages for the application
 */
const AVAILABLE_LANGUAGES = 
  import.meta.env.VITE_AVAILABLE_LANGUAGES && typeof import.meta.env.VITE_AVAILABLE_LANGUAGES === 'string'
  ? import.meta.env.VITE_AVAILABLE_LANGUAGES.split(',') 
  : [];

// --------------------------------------------

export{
    APPLICATION_BASE_PATHNAME,

    APPLICATION_LANGUAGE,
    AVAILABLE_LANGUAGES
}