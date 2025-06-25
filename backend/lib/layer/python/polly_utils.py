"""
polly_utils.py

This module provides utility functions for interacting with AWS Polly to synthesize speech from text
and manage audio data. It includes functionality to:
- Retrieve the default voice for a specified language.
- Split text into manageable chunks for synthesis.
- Generate and store speech audio in an S3 bucket.

Imports:
---------
- boto3: AWS SDK for Python to interact with AWS services.
- os: Provides access to environment variables.
- logging: Provides log levels and structured logging.
- io: Provides Python's core tools for working with I/O streams.
- constants: Defines constants used throughout the module (imported from Lambda layer).

Functions:
-----------
- get_default_voice_for_language(polly, language_code)
- split_text_into_chunks(text, max_length)
- synthesize_speech(bucket_name, file_key, text, output_format, language_code)
- get_synthesis_file_key(file_key, task_id, output_format)
- extract_file_key_from_url(s3_url)
- process_audio_stream_and_upload_to_s3(bucket, key, audio_stream)
"""

import boto3
import os
import logging
import io
import constants # from layer

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# The max length for the SynthesizeSpeech API is 3000 billed characters (6000 total characters).
# However, long texts cannot be processed within the 29s timeout. In those cases an async synthesis is triggered instead.
# The max length for the SpeechSynthesisTask API is 100,000 billed characters (200,000 total characters).
# Check https://docs.aws.amazon.com/polly/latest/dg/limits.html for updated values.
SYNTHESIZE_MAX_LENGTH = 3000 
ASYNC_SYNTHESIZE_MAX_LENGTH = 180000 

REGION = os.environ[constants.REGION]
polly = boto3.client('polly', region_name=REGION)
s3 = boto3.client('s3', region_name=REGION)\

def get_default_voice_for_language(polly, language_code):
    """
    Retrieves the default voice for a specified language using the AWS Polly service.
    
    The function queries AWS Polly to list available voices for the given language code and 
    returns the first available voice as the default.

    Parameters:
    -----------
    polly : boto3.client
        The boto3 Polly client used to interact with the AWS Polly service.
    language_code : str
        The language code (e.g., 'en-US', 'fr-FR') for which the default voice should be retrieved.

    Returns:
    --------
    dict
        A dictionary containing information about the default voice for the specified language, 
        including fields such as `Id`.

    Raises:
    -------
    ValueError
        If no voices are available for the specified language code.
    botocore.exceptions.ClientError
        For errors returned by the AWS Polly service, such as:
            - AccessDeniedException: If the IAM role or user lacks the required permissions.
            - InvalidParameterValueException: If the provided language code is invalid.
            - ServiceUnavailableException: If AWS Polly is temporarily unavailable.
    botocore.exceptions.NoCredentialsError
        If AWS credentials are not found or are invalid.
    botocore.exceptions.EndpointConnectionError
        If there is a connection issue with the AWS Polly service.
    """
    # Call DescribeVoices to get a list of available voices for the specified language
    try:
        response = polly.describe_voices(LanguageCode=language_code)

        # Extract the first voice as the default voice for the specified language
        if 'Voices' in response and len(response['Voices']) > 0:
            return response['Voices'][0]
        else:
            # Handle the case when no voices are available for the specified language
            raise ValueError(f"No voices available for language: {language_code}")
    except Exception as e:
        logger.debug("Error getting Polly default voice for language: %s", str(e))
        raise e
    
def split_text_into_chunks(text, max_length):
    """
    Splits the text into chunks of a maximum specified length.

    Parameters:
    -----------
    text : str
        The text to be split into smaller chunks.
    max_length : int
        The maximum length for each chunk.

    Returns:
    --------
    list
        A list of text chunks.
    """
    chunks = []
    while len(text) > max_length:
        split_index = text[:max_length].rfind('.') + 1  # Try to split at the end of a sentence
        if split_index == 0:  # If no period found, split at max_length
            split_index = max_length
        chunks.append(text[:split_index].strip())
        text = text[split_index:]
    chunks.append(text.strip())
    return chunks
    
def synthesize_speech(bucket_name, file_key, text, output_format, language_code, async_processing: bool):
    """
    Synthesizes speech from the given text using Amazon Polly and stores the audio in an S3 bucket.

    This function checks if the provided language code is supported by Amazon Polly. If supported,
    it determines whether to use synchronous or asynchronous synthesis based on the length of the text.
    The resulting audio is then stored in the specified S3 bucket.

    Args:
        polly (boto3.client): The boto3 Polly client object.
        language_code (str): The language code to use for speech synthesis (e.g., 'en-US').
        text (str): The text to be synthesized into speech.
        output_format (str): The format of the audio output (e.g., 'mp3', 'ogg_vorbis', 'pcm').
        bucket_name (str): The name of the S3 bucket where the audio will be stored.
        file_key (str): The key (path) in the S3 bucket where the audio file will be stored.
        async_processing(boolean): If the processing should be done asynchronously because of a repeated request. Introduced to handle sync processing repeated failures.
        
    Returns:
        dict: A dictionary with either 'audio_key' or 'task_id' based on the synthesis method:
            - 'audio_key': The S3 key of the stored audio file if synchronous synthesis was used.
            - 'task_id': The ID of the asynchronous synthesis task if asynchronous synthesis was used.

    Raises:
        ValueError: If the language code is not supported by Amazon Polly or if the text is too long.
        Exception: For any errors encountered during the synthesis or S3 upload process.

    """
    # Check Polly's supported languages
    polly_languages = polly.describe_voices()['Voices']
    polly_supported_languages = {voice['LanguageCode'] for voice in polly_languages}
    # Check if the language code is supported by polly
    if language_code in polly_supported_languages:
        try:
            voice = get_default_voice_for_language(polly, language_code)
            # Determine the maximum allowed length based on the engine
            text_length = len(text)
            if text_length < SYNTHESIZE_MAX_LENGTH and not async_processing:
                response = polly.synthesize_speech(
                Text=text,
                OutputFormat=output_format,
                LanguageCode=language_code,
                VoiceId=voice['Id'],
                Engine=voice['SupportedEngines'][0]
                )
                # Check if the response contains audio data
                if "AudioStream" in response:
                    # Store the audio in S3 bucket
                    process_audio_stream_and_upload_to_s3(bucket_name, file_key, response['AudioStream'])
                    return {'audio_key': file_key}
                else:
                    raise ValueError("Error: Response does not contain audio data.")
            elif text_length < ASYNC_SYNTHESIZE_MAX_LENGTH:
                response = polly.start_speech_synthesis_task(
                Text=text,
                OutputFormat=output_format,
                LanguageCode=language_code,
                VoiceId=voice['Id'],
                Engine=voice['SupportedEngines'][0],
                OutputS3BucketName=bucket_name,
                OutputS3KeyPrefix=file_key,
                )
                task_id = response['SynthesisTask']['TaskId']
                return {'task_id': task_id}
            else:
                raise ValueError("Error: Text is too long for polly synthesis task.")
            
        except Exception as e:
            logger.debug("Error synthesizing speech with Polly: %s", str(e))
            raise e
    else: 
        raise ValueError(f"Language Code {language_code} not supported by Amazon Polly.")
    
def get_synthesis_file_key(file_key, task_id, output_format):
    """
    Generate the full S3 key for a synthesized audio file.

    This function constructs a file key by concatenating the provided file key prefix, task ID, and output format.

    Parameters:
    -----------
    file_key : str
        The base S3 key or path prefix where the synthesized file will be stored. 
        This typically represents the location or folder in the S3 bucket.
    
    task_id : str
        The unique identifier for the synthesis task. 
        This ID differentiates the synthesized file from others generated by different tasks.
    
    output_format : str
        The desired format of the synthesized audio file (e.g., "mp3", "wav").
        This determines the file extension of the resulting file.

    Returns:
    --------
    str
        The full S3 key for the synthesized audio file, combining the base file key, task ID, and file extension.
    """
    return f"{file_key}{task_id}.{output_format}"

def extract_file_key_from_url(s3_url):
    """
    Extracts the S3 file key from a URL provided by Amazon Polly.

    Args:
        s3_url (str): The URL of the S3 object. For example:
                      'https://s3.us-west-2.amazonaws.com/my-bucket/resource/audios/2024-09-04/output.mp3'
    
    Raises:
        ValueError: If the no path or file key are found in the url.

    Returns:
        str: The S3 file key extracted from the URL. For example:
             'resource/audios/2024-09-04/output.mp3'
    """
    # Find the start of the S3 path by locating the first '/' after the domain
    path_start = s3_url.find('/', s3_url.find('//') + 2)
    
    if path_start == -1:
        raise ValueError("Invalid S3 URL: No path found in the URL.")
    
    # Remove the bucket name from the path
    parts = s3_url[path_start + 1:].split('/', 1)  # Split once to remove the bucket name
    if len(parts) < 2:
        raise ValueError("Invalid S3 URL: Could not find the file key.")
    
    file_key = parts[1]
    
    return file_key


def process_audio_stream_and_upload_to_s3(bucket, file_key, audio_stream):
    """
    Processes an audio stream in chunks, accumulates the data in memory, 
    and uploads the full file to an S3 bucket once the entire stream has been processed.

    Args:
        bucket (str): The name of the S3 bucket where the audio file will be uploaded.
                      For example: 'my-audio-bucket'.
        file_key (str): The key (file name/path) in the S3 bucket for the uploaded audio file.
                   For example: 'audios/2024-09-04/output.mp3'.
        audio_stream (StreamingBody): The streaming body containing the audio data.
                                       Typically passed from an event (e.g., API Gateway, S3 event, etc.).
    
    Raises:
        ValueError: If there is an issue reading the audio stream.
        Exception: If the S3 upload fails for any reason.
    """
    # Define a chunk size 
    chunk_size = 100 * 1024  # 100 KB per chunk
    full_data = io.BytesIO()  # In-memory buffer to accumulate the data
    
    # Read and process the stream in chunks
    chunk = audio_stream.read(chunk_size)  # First read to check if there's data
    while chunk:
        full_data.write(chunk)  # Accumulate the chunk in memory
        
        # Read the next chunk
        chunk = audio_stream.read(chunk_size)

    # After all chunks are read, upload the full file to S3
    full_data.seek(0)  # Rewind the buffer to the beginning before uploading
    s3.put_object(Bucket=bucket, Key=file_key, Body=full_data.getvalue())