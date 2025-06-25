import { FlashcardsResponse, TranscriptionS3Response } from './apiDataUtils';
import { showErrorResponse } from './apiUtils';
import { downloadFromS3 } from './awsUtils';
import { SetStateAction } from 'react';

/**
 * Downloads JSON content from an S3 bucket with retry logic.
 * @param fileKey - The key of the file to download.
 * @param maxTries - The maximum number of retries to attempt.
 * @param minTimeoutWait - The minimum time to wait between retries (in milliseconds).
 * @param setAlert   - A function to set an alert visible in the page. 
 * @returns The parsed JSON content, or an error if the maximum number of retries is reached.
 */
export async function downloadJsonContent(fileKey: string, maxTries: number, minTimeoutWait: number,
  setAlert: (value: SetStateAction<{
    status: "Success" | "Error" | "Warning" | null;
    message: string;
  }>) => void): Promise<string | TranscriptionS3Response | FlashcardsResponse> {
    let max_not_found = 0;
    while (max_not_found < maxTries) {
      try {
        const body = await downloadFromS3(fileKey);
        if (body) {
          const body_string = await body.transformToString();
          return JSON.parse(body_string);
        } else {
          console.error('Error downloading file');
          max_not_found = max_not_found + 1;
          await new Promise(resolve => setTimeout(resolve, minTimeoutWait));
        }
      } catch (error) {
        showErrorResponse(error, setAlert);
        console.error('Error downloading file:', error);
        max_not_found = max_not_found + 1;
        await new Promise(resolve => setTimeout(resolve, minTimeoutWait));
      }
    }
    throw new Error('Error download json content from S3');
};
  
/**
 * Downloads an audio file from an S3 bucket with retry logic.
 * @param fileKey - The key of the file to download.
 * @param maxTries - The maximum number of retries to attempt.
 * @param minTimeoutWait - The minimum time to wait between retries (in milliseconds).
 * @param setAlert   - A function to set an alert visible in the page.
 * @returns The URL of the downloaded audio file, or an error if the maximum number of retries is reached.
 */
export async function downloadAudio(fileKey: string, maxTries: number, minTimeoutWait: number,
  setAlert: (value: SetStateAction<{
    status: "Success" | "Error" | "Warning" | null;
    message: string;
  }>) => void) {
    let max_not_found = 0;
    while (max_not_found < maxTries) {
      try {
        const body = await downloadFromS3(fileKey) as ReadableStream;;
        if (body) {
          const arrayBuffer = await streamToArrayBuffer(body);
          const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          return audioUrl;
        } else {
          console.error('Error: Response body of audio file is undefined');
          max_not_found = max_not_found + 1;
          await new Promise(resolve => setTimeout(resolve, minTimeoutWait));
        }
      } catch (error) {
        showErrorResponse(error, setAlert);
        console.error('Error downloading audio file:', error);
        max_not_found = max_not_found + 1;
        await new Promise(resolve => setTimeout(resolve, minTimeoutWait));
      }
    }
    throw new Error('Error downloading audio. Maximum tries reached');
};

/**
 * Converts a ReadableStream to an ArrayBuffer.
 * @param stream - The ReadableStream to convert.
 * @returns The ArrayBuffer representation of the stream.
 */
async function streamToArrayBuffer(stream: ReadableStream): Promise<ArrayBuffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;
  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }
  
    const arrayBuffer = new Uint8Array(totalLength);
    let position = 0;
    for (const chunk of chunks) {
      arrayBuffer.set(chunk, position);
      position += chunk.length;
    }
    
    return arrayBuffer.buffer;
  }


