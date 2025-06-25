import { ApiResponse, ErrorResponse, Flashcard, FlashcardsResponse, GetAudioApiResponse, GetModelsApiResponse, GetTranscriptionApiResponse, ModelMap, StartTranscriptionApiResponse, TranscriptionS3Response } from "./apiDataUtils";
import { HTTPCodes } from "./apiUtils";

/**
 * Validator Type
 * A function that takes any value and returns a boolean indicating whether the value is of the expected type.
 */
export type Validator<T> = (data: any) => data is T;

/**
 * createValidator Function
 * Creates a validator function based on a set of property checks and an optional custom check.
 * @param checks - An object of property checks, where the keys are the property names and the values are functions that check the validity of the property value.
 * @param customCheck - An optional custom check function that can be used to perform additional validation on the data.
 * @returns A validator function that checks if the input data is a valid object, validates each property using the provided checks, and executes the custom check if it's provided.
 */
function createValidator<T>(
    checks: { [K in keyof T]?: (value: any) => boolean },
    customCheck?: (data: any) => boolean
): Validator<T> {
    return (data: any): data is T => {
        // Check if the data is a valid object
        if (typeof data !== 'object' || data === null) {
            return false;
        }

        // Validate each property using the provided checks
        for (const key in checks) {
            if (checks.hasOwnProperty(key)) {
                const check = checks[key];
                if (check && !check(data[key])) {
                    return false;
                }
            }
        }

        // Execute custom check if provided
        if (customCheck && !customCheck(data)) {
            return false;
        }

        return true;
    };
}

/**
 * isApiResponse Validator
 * Validates the structure of an API response object.
 */
export const isApiResponse = createValidator<ApiResponse>(
    {
        value: (value) => typeof value === 'string' || value === undefined, // Allows for optional
        fileKey: (value) => typeof value === 'string', // Allows for optional
        audioFileKey: (value) => typeof value === 'string' || value === undefined,  // Optional
        taskId: (value) => typeof value === 'string' || value === undefined,  // Optional
    },
    (data) => {
        return (typeof data.fileKey === 'string');
    }
);

/**
* isFlashcard Validator
* Validates the structure of a flashcard object.
*/
export const isFlashcard = createValidator<Flashcard>(
    {
        question: (value) => typeof value === 'string',
        answer: (value) => typeof value === 'string',
    },
    (data) => {
        return typeof data.question === 'string' && typeof data.answer === 'string';
    }
);

/**
* isFlashcardArray Validator
* Validates the structure of a list of flashcards.
*/
export const isFlashcardArray = createValidator<FlashcardsResponse>(
    {
        flashcards: (value): value is Flashcard[] =>
            Array.isArray(value) && value.every(item => isFlashcard(item))
    }
);

/**
* isStartTranscriptionApiResponse Validator
* Validates the structure of the response from the "start transcription" API.
*/
export const isStartTranscriptionApiResponse = createValidator<StartTranscriptionApiResponse>(
    {
        transcriptionJobName: (value) => typeof value === 'string',  // Mandatory check
    },
    (data) => {
        return (typeof data.transcriptionJobName === 'string');
    }
);


/**
* isGetTranscriptionApiResponse Validator
* Validates the structure of the response from the "get transcription" API.
*/
export const isGetTranscriptionApiResponse = createValidator<GetTranscriptionApiResponse>(
    {
        status: (value) => typeof value === 'string',  // Mandatory check
        fileKey: (value) => typeof value === 'string',  // Mandatory check
        language: (value) => typeof value === 'string',  // Mandatory check
        message: (value) => typeof value === 'string' || value === undefined,  // Optional
    },
    (data) => {
        return (data.status === "COMPLETED") && (typeof data.fileKey === 'string') && (typeof data.language === 'string');
    });

/**
* isGetAudioApiResponse Validator
* Validates the structure of the response from the "get audio" API.
*/
export const isGetAudioApiResponse = createValidator<GetAudioApiResponse>(
    {
        status: (value) => typeof value === 'string',  // Mandatory check
        message: (value) => typeof value === 'string' || value === undefined,  // Optional
        audioFileKey: (value) => typeof value === 'string' || value === undefined,  // Optional
    },
    (data) => {
        return (data.status === "COMPLETED");
    });

/**
* isGetModelsApiResponse Validator
* Validates the structure of the response from the "get models" API.
*/
export const isGetModelsApiResponse = createValidator<GetModelsApiResponse>(
    {
        modelMap: (value): value is ModelMap =>
            typeof value === 'object' &&
            value !== null &&
            Object.entries(value).every(([key, val]) =>
                typeof key === 'string' &&
                (typeof val === 'string')
            )
    }
);

/**
 * Checks if the provided data is a valid TranscriptionS3Response.
 * This function ensures that the data returned from the S3 bucket has the expected structure, with an array of transcripts
 * and each transcript having a string value.
 * @param data - The data to be validated.
 * @returns True if the data is a valid TranscriptionS3Response, false otherwise.
 */
export function isTranscriptionS3Response(data: any): data is TranscriptionS3Response {
    return data &&
        typeof data === 'object' &&
        Array.isArray(data.results.transcripts) &&
        typeof data.results.transcripts[0].transcript === 'string';
}

/**
* showErrorResponse Validator
* Validates the structure of the response gotten and if it is an error to be shown.
*/
export const isErrorResponse = createValidator<ErrorResponse>(
    {
        code: (value) => typeof value === 'number',  // Mandatory check
        status: (value) => typeof value === 'string', // Mandatory check
        message: (value) => typeof value === 'string', // Mandatory check
    },
    (data) => {
        return Object.values(HTTPCodes).includes(data.code);
    });

 
