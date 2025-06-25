/**
 * Flashcard Interface
 * Represents a single flashcard with a question and answer.
 */
export interface Flashcard {
    question: string;
    answer: string;
}

/**
 * FlashcardsResponse Interface
 * Represents the response from an API that returns a list of flashcards.
 */
export interface FlashcardsResponse {
    flashcards: Flashcard[];
}

/**
 * QuestionType Interface
 * Represents a single question.
 */
export type QuestionType = {
    question: string
}

/**
 * StartTranscriptionApiRequest Interface
 * Represents the request body for starting a transcription job.
 */
export type StartTranscriptionApiRequest = {
    fileKey: string
}

/**
 * StartTranscriptionApiResponse Interface
 * Represents the response from the API when starting a transcription job.
 */
export interface StartTranscriptionApiResponse {
    transcriptionJobName: string;
}

/**
 * GetTranscriptionApiResponse Interface
 * Represents the response from the API when retrieving the status of a transcription job.
 */
export interface GetTranscriptionApiResponse {
    status: string;
    fileKey: string;
    language: string;
    message?: string;
}

/**
 * TranscriptionS3Response Interface
 * Represents the response from the API when retrieving the transcription results from S3.
 */
export interface TranscriptionS3Response {
    results: {
        transcripts: { transcript: string }[];
    };
}

/**
 * ApiResponse Interface
 * Represents a generic API response with a value and a file key and possibly its related audio.
 */
export interface ApiResponse {
    value?: string;
    fileKey: string;
    audioFileKey?: string;
    taskId?: string;
}

/**
 * GetAudioApiResponse Interface
 * Represents the response from the API when retrieving the status of a text to audio synthesis task.
 */
export interface GetAudioApiResponse {
    status: string;
    audioFileKey?: string;
    message?: string;
}

/**
 * StartTranscriptionApiResponse Interface
 * Represents a map of modelName to modelId.
 */
export interface ModelMap {
    [modelName: string]: string | string;
}

/**
 * GetModelsApiResponse Interface
 * Represents the response from the API when retrieving the map of available foundation models.
 */
export interface GetModelsApiResponse {
    modelMap: ModelMap;
}

/**
 * ErrorResponse Interface
 * Represents the response from the API when there is an error.
 */
export interface ErrorResponse {
    code: number;
    status: string;
    message: string;
  }
