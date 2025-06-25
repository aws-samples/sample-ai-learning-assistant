"""
Lambda Function: Get Translation

This Lambda function handles the translation of data stored in Amazon S3. It retrieves the content, translates it using Amazon Translate, and optionally synthesizes it into audio using Amazon Polly. The function responds with the translated content and, if applicable, the audio file key.

Imports:
---------
- boto3: AWS SDK for Python to interact with AWS services.
- os: Provides access to environment variables.
- logging: Provides log levels and structured logging.
- parameter_utils: Custom utility functions for extracting parameters from the event (imported from Lambda layer).
- constants: Defines constants used throughout the module (imported from Lambda layer).
- cognito_utils: Custom utility functions for handling AWS Cognito operations (imported from Lambda layer).
- s3_utils: Custom utility functions for interacting with S3 (imported from Lambda layer).
- response_utils: Custom utility functions for formatting and sending responses (imported from Lambda layer).
- polly_utils: Custom utility functions for interacting with Amazon Polly (imported from Lambda layer).
- s3_cache_utils: Custom utility functions for caching and retrieving responses from Amazon S3. 
- bedrock_utils: Custom utility functions for interacting with Bedrock AI models (imported from Lambda layer).

Environment Variables:
----------------------
- MEDIA_BUCKET: The name of the S3 bucket used for storing media files.
- REGION: The AWS region where the resources are located.
- IDENTITY_POOL_ID: The ID of the Cognito Identity Pool.
- USER_POOL_ID: The ID of the Cognito User Pool.

AWS Clients:
-------------
- `translate`: Boto3 client for interacting with Amazon Translate.

Functions:
----------
1. get_translation(text: str, source_language: str, target_language: str) -> str:
   Translates the provided text from the source language to the target language using Amazon Translate.

2. handler(event: dict, context: object) -> dict:
   Main entry point for the Lambda function. Processes the incoming event, retrieves and translates the content, and stores the translated content and optionally the synthesized audio in S3.

"""
import boto3
import os
import logging
import parameter_utils # from layer
import constants # from layer
import cognito_utils # from layer
import s3_utils # from layer
import response_utils # from layer
import s3_cache_utils # from layer
import bedrock_utils # from layer

logger = logging.getLogger()
logger.setLevel(logging.INFO)
MEDIA_BUCKET = os.environ[constants.MEDIA_BUCKET]
REGION = os.environ[constants.REGION]
IDENTITY_POOL_ID = os.environ[constants.IDENTITY_POOL_ID]
USER_POOL_ID = os.environ[constants.USER_POOL_ID]
translate = boto3.client('translate', region_name=REGION)\

def get_translation(text, source_language, target_language):
    """
    Translates the provided text from the source language to the target language using Amazon Translate.

    Parameters:
    -----------
    text : str
        The text to be translated.
    source_language : str
        The language code of the source language (e.g., 'en' for English).
    target_language : str
        The language code of the target language (e.g., 'es' for Spanish).

    Returns:
    --------
    str
        The translated text.

    Raises:
    -------
        ValueError
        If there are issues with the content type or format.
    """
    translate_languages = translate.list_languages()[constants.LANGUAGES]
    translate_supported_languages = {lang[constants.LANGUAGE_CODE] for lang in translate_languages}
    if source_language in translate_supported_languages\
        and target_language in translate_supported_languages:
        response = translate.translate_text(
            Text=text,
            SourceLanguageCode=source_language,
            TargetLanguageCode=target_language
        )
        return response[constants.TRANSLATED_TEXT]
    else:
        raise ValueError(f"Source language {source_language} or target language {target_language} not supported by Amazon Translate.")

def get_translate_language_code(language_code):
    """
    Returns a language code for Amazon Translate based on Amazon Polly's language codes.
    It also handles a list of exceptions on the coding between the two services.

    Parameters:
    -----------
    language_code : str
        The language code to be checked.

    Returns:
    --------
    str
        The new language code to be used by Amazon Translate
    """
    language_code = language_code[:2]
    if language_code == "nb":
        language_code = "no"
    return language_code

def handler(event, context):
    """
    Main entry point for the Lambda function. Processes the incoming event, retrieves and translates the content,
    and stores the translated content and optionally the synthesized audio in S3.

    Parameters:
    -----------
    event : dict
        The input event containing parameters and data for processing.
    context : object
        The context object provides runtime information to the handler.

    Returns:
    --------
    dict
        The HTTP response with the status code and message, including the S3 keys for the translation and audio if applicable.

    Raises:
    -------
    KeyError
        If required parameters are missing in the event.
    ValueError
        If there are issues with the content type or format.
    Exception
        For any other unexpected errors during execution.
    """
    logger.debug(f"Full event: {event}") # Only log full event in debug mode 
    try:
        transcription_job_name = parameter_utils.get_path_parameter(event, constants.TRANSCRIPTION_JOB_NAME_PARAMETER) 
        resource_path = parameter_utils.get_query_string_parameter(event, constants.RESOURCE_PATH_PARAMETER) 
        source_language = parameter_utils.get_query_string_parameter(event, constants.SOURCE_LANGUAGE_PARAMETER) 
        model_id = bedrock_utils.get_model_id(event) 
        destination_language = parameter_utils.get_query_string_parameter(event, constants.DESTINATION_LANGUAGE_PARAMETER) 
        identity_id = cognito_utils.get_cognito_identity_id(REGION, IDENTITY_POOL_ID, USER_POOL_ID, cognito_utils.get_authorization_token(event))
        text = ""
        if resource_path == constants.TRANSCRIPTIONS_FOLDER_PATH:
            text = s3_utils.get_transcription(transcription_job_name, MEDIA_BUCKET, identity_id)
            translation_key = s3_utils.get_file_key(transcription_job_name, f'{constants.TRANSLATIONS_FOLDER_PATH}{resource_path}', identity_id, language=destination_language)
            audio_key = s3_utils.get_file_key(transcription_job_name, f'{constants.TRANSLATIONS_FOLDER_PATH}{constants.AUDIOS_FOLDER_PATH}', identity_id, output_format=constants.MP3, language=destination_language)
        elif resource_path == constants.SUMMARIES_FOLDER_PATH:
            text = s3_utils.get_json_from_s3(MEDIA_BUCKET, s3_utils.get_file_key(transcription_job_name, resource_path, identity_id, model_id=model_id, language=source_language))
            translation_key = s3_utils.get_file_key(transcription_job_name, f'{constants.TRANSLATIONS_FOLDER_PATH}{resource_path}', identity_id, model_id=model_id, language=destination_language)
            audio_key = s3_utils.get_file_key(transcription_job_name, f'{constants.TRANSLATIONS_FOLDER_PATH}{constants.AUDIOS_FOLDER_PATH}', identity_id, output_format=constants.MP3, model_id=model_id, language=destination_language)
        else:
            return response_utils.format_response(code=constants.BAD_REQUEST_CODE, body={
                    "status": constants.BAD_REQUEST_STATUS,
                    "message": "Resource path is not transcriptions, summaries, judgments or information."
                })   
        
        translation, repeated_requested = s3_cache_utils.get_or_generate_bedrock_response(MEDIA_BUCKET, translation_key, get_translation, text, get_translate_language_code(source_language), get_translate_language_code(destination_language))
        try:
            synthesis_result = s3_cache_utils.get_or_synthesize_speech(MEDIA_BUCKET, audio_key, translation, constants.MP3, destination_language, async_processing=repeated_requested)
            if constants.SYNTHESIS_RESULT_TASK_ID in synthesis_result:
                return response_utils.send_response_speech_synthesis(translation, translation_key, synthesis_result[constants.SYNTHESIS_RESULT_TASK_ID])
            elif constants.SYNTHESIS_RESULT_AUDIO_KEY in synthesis_result:
                return response_utils.send_response_with_file_key_and_audio_key(translation, translation_key, synthesis_result[constants.SYNTHESIS_RESULT_AUDIO_KEY])
        except Exception as e:
            logger.debug(f"Polly synthesis failed: {str(e)}") # Log the exception in debug model but proceed without failing the entire function
        
        return response_utils.send_response_with_file_key(translation, translation_key)
    
    except Exception as e:
        return response_utils.format_exception(e)