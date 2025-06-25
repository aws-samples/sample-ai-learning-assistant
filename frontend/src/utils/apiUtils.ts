import { get, post } from "aws-amplify/api";
import { fetchAuthSession } from 'aws-amplify/auth';
import awsExports from '../../aws-exports';
import { Validator, isErrorResponse, isGetAudioApiResponse } from './validators';
import { GetAudioApiResponse } from "./apiDataUtils";
import { downloadAudio } from "./downloadUtils";
import { SetStateAction } from "react";

// Retrieve the API_NAME from environment variables or AWS exports
const API_NAME = import.meta.env.VITE_API_NAME || awsExports.apiName;

// Define the available API Paths
export enum ApiPath {
  Transcriptions = 'transcriptions/',
  Summaries = 'summaries/',
  Flashcards = 'flashcards/',
  Translations = 'translations/',
  Assistant = 'assistant/',
  Audios = 'audios/',
  Models = 'models/'
}

// Define the available HTTP request methods
export enum RequestMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

// Define the available HTTP codes to check
export enum HTTPCodes {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT_ERROR = 409,
  UNPROCESSABLE_CONTENT = 422,
  INTERNAL_SERVER_ERROR = 500,
  GATEWAY_TIMEOUT = 504
}

// A class to return an API error to be processed 
export class ApiError extends Error {
  public readonly name: string;
  public readonly statusCode: number;

  constructor(message: string, name: string, statusCode: number) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
  }
}

/**
* Handles a POST request to the API
* @param apiName - The name of the API to use
* @param path - The path of the API endpoint
* @param idToken - The user's authentication token
* @param queryParams - Any query parameters to include in the request
* @param body - The request body
* @returns The response from the API
*/
async function handlePost(
  apiName: string,
  path: string,
  idToken: string,
  queryParams: { [key: string]: any },
  body: any
) {
  try {
    const response = await post({
      apiName,
      path,
      options: {
        body,
        headers: {
          Accept: "*/*",
          "content-type": "application/json; charset=UTF-8",
          Authorization: idToken,
        },
        queryParams
      }
    }).response;

    return response;
  } catch (error) {
    throw error;
  }
}

/**
* Handles a GET request to the API
* @param apiName - The name of the API to use
* @param path - The path of the API endpoint
* @param idToken - The user's authentication token
* @param queryParams - Any query parameters to include in the request
* @returns The response from the API
*/
async function handleGet(
  apiName: string,
  path: string,
  idToken: string,
  queryParams: { [key: string]: any }
) {
  try {
    const response = await get({
      apiName,
      path,
      options: {
        headers: {
          Accept: "*/*",
          "content-type": "application/json; charset=UTF-8",
          Authorization: idToken,
        },
        queryParams,
      }
    }).response;

    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves the API response and validates the data
 * @param method - The HTTP request method (GET, POST, etc.)
 * @param path - The path of the API endpoint
 * @param validator - A function to validate the response data
 * @param queryParams - Any query parameters to include in the request
 * @param request_body - The request body for POST requests
 * @param apiName - The name of the API to use (optional)
 * @returns The validated response data
 */
async function getApiResponse<T>(method: RequestMethod, path: string, validator: Validator<T>, queryParams?: { [key: string]: any }, request_body?: any, apiName?: string): Promise<T> {
  const idToken = (await fetchAuthSession()).tokens?.idToken?.toString()!;
  try {
    let response;
    switch (method) {
      case RequestMethod.GET:
        response = handleGet(apiName ? apiName : API_NAME, path, idToken, queryParams ? queryParams : {});
        break;
      case RequestMethod.POST:
        response = handlePost(apiName ? apiName : API_NAME, path, idToken, queryParams ? queryParams : {}, request_body);
        break;
      default:
        throw new Error(`Unsupported request method: ${method}`);
    }

    const { body } = await response;
    const jsonData: T = (await body.json()) as T;
    if (validator(jsonData)) {
      return jsonData; // Safe to use as T
    } else {
      throw new TypeError('Response has an invalid data structure for the expected type.');
    }
  } catch (error) {
    console.error("Error fetching API response:", error);
    throw error;
  }
}

/**
 * Calls the API with retries and error handling
 * @param method - The HTTP request method (GET, POST, etc.)
 * @param path - The path of the API endpoint
 * @param maxTries - The maximum number of retries to attempt
 * @param minTimeoutWait - The minimum time to wait between retries (in milliseconds)
 * @param validator - A function to validate the response data
 * @param setAlert - A function to set an alert visible in the page
 * @param queryParams - Any query parameters to include in the request
 * @param request_body - The request body for POST requests
 * @param apiName - The name of the API to use (optional)
 * @returns The validated response data
 */
export async function callApi<T>(method: RequestMethod, path: string, maxTries: number, minTimeoutWait: number, validator: Validator<T>,
  setAlert: (value: SetStateAction<{
    status: "Success" | "Error" | "Warning" | null;
    message: string;
  }>) => void, queryParams?: { [key: string]: any }, request_body?: any, apiName?: string): Promise<T> {
  let max_not_found = 0;
  while (max_not_found < maxTries) {
    try {
      return await getApiResponse<T>(method, path, validator, queryParams, request_body, apiName);
    } catch (error) {
      showErrorResponse(error, setAlert);
      console.error('Error calling api:', error);
      max_not_found = max_not_found + 1;
      await new Promise(resolve => setTimeout(resolve, minTimeoutWait));
    }
  };
  throw new Error('Error calling the api. Maximum tries reached');
}

/**
 * Handles the display of error responses by checking the error object, 
 * parsing the response body as JSON, and updating an alert with the error message.
 * If a valid error response is found, it sets the alert and throws an error with details.
 *
 * @param {any} error - The error object that may contain the response body to be processed.
 * @param setAlert   - A function to set an alert visible in the page.
 * @throws {Error}    - If a valid error response is found, it throws an error containing the parsed error message, status, and code.
 */
export const showErrorResponse = (error: any,
  setAlert: (value: SetStateAction<{
    status: "Success" | "Error" | "Warning" | null;
    message: string;
  }>) => void
): void => {
  if (error && typeof error === 'object') {
    const errorObject = error as { response?: { body: string | undefined; } };
    if (errorObject.response && errorObject.response.body) {
      const jsonError = JSON.parse(errorObject.response.body);
      if (isErrorResponse(jsonError)) {
        const { message, status, code } = jsonError;
        setAlert({
          status: "Error",
          message: message
        });
        throw new Error(`Error: ${message} (Status: ${status}, Code: ${code})`)
      }
    }
  }
}

/**
* Fetches an audio file.
* If the requested audio is for a long text First it verifies if the task status is complete and then downloads the audio.
* If no task id is presented then it was a simple synthesis task and the audio can be downloaded without further processing.
* @async
* @param {string} taskId - The ID of the speech synthesis task to check the status of.
* @param {string} fileKey - The S3 key for the audio file to be downloaded.
* @returns {Promise<string>} - A promise that resolves to the URL of the downloaded audio file or null if no audio is available.
* @throws Will throw an error if the API call to check the task status fails or if the download fails.
*/
export const getAudio = async (taskId: string | undefined, fileKey: string | undefined,
  setAlert: (value: SetStateAction<{
    status: "Success" | "Error" | "Warning" | null;
    message: string;
  }>) => void): Promise<string | null> => {
  try {
    if (taskId) {
      const path = `${ApiPath.Audios}${taskId}`;
      var { audioFileKey } = await callApi<GetAudioApiResponse>(RequestMethod.GET, path, 20, 10000, isGetAudioApiResponse, setAlert);
    }
    if (fileKey || audioFileKey) {
      // If the API call succeeds or fileKey is present, proceed to download the audio
      return await downloadAudio(fileKey ? fileKey : audioFileKey!, 10, 2000, setAlert);
    }
    // Audio is not available
    return null;
  } catch (error) {
    throw error;
  }
};