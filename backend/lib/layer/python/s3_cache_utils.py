"""
s3_cache_utils.py

This module provides utility functions for caching and retrieving responses from Amazon S3. 
It helps optimize API calls (e.g., to Bedrock) by checking for existing responses in S3 before 
making a new request.

Functions:
----------
1. get_or_generate_bedrock_response(bucket_name, file_key, call_bedrock_function, *args, **kwargs):
   Checks if a response exists in S3. If found, returns it. Otherwise, calls the provided 
   function (e.g., a Bedrock API call), saves the response in S3, and returns it.
   
2. get_or_synthesize_speech(bucket_name, file_key, text_to_synthesize, output_format, language_code):
   Checks if a response exists in S3. If found, returns the audio_key. Otherwise, calls the synthesis function 
   which saves the response in S3, and returns the result.

3. get_or_generate_translation(bucket_name, file_key, call_translation_function, text_to_translate, source_language_code, destination_language_code)
   Checks if a response exists in S3. If found, returns it. Otherwise, calls the translation function 
   which saves the response in S3, and returns the result.
"""
import s3_utils
import polly_utils
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_or_generate_bedrock_response(bucket_name: str, file_key: str, call_bedrock_function, *args, **kwargs):
    """
    Check if the response exists in S3 before calling Bedrock.
    If the response exists, return it from S3. Otherwise, generate it using Bedrock, save it, and return it.
    This function was introduced to handle Gateway Timeouts from API Gateway -  Lambda integration.

    Parameters:
    - bucket_name (str): Name of the S3 bucket.
    - file_key (str): S3 key (file path).
    - call_bedrock_function (callable): Function that calls Bedrock and returns the response.

    Returns:
    - dict: The final response.
    """
    try:
        file_exists = s3_utils.check_s3_file_exists(bucket_name, file_key)
        if file_exists:
            bedrock_response = s3_utils.get_json_from_s3(bucket_name, file_key)
        else: 
            bedrock_response = call_bedrock_function(*args, **kwargs)
            s3_utils.write_json_to_s3(bucket_name, file_key, bedrock_response)
        return bedrock_response, file_exists
    except Exception as e:
        logger.debug("An error occurred: %s", str(e))
        raise e

def get_or_synthesize_speech(bucket_name: str, file_key: str, text_to_synthesize: str, output_format: str, language_code: str, async_processing: bool):
    """
    Check if the response exists in S3 before calling Polly.
    If the response exists, return the audio_key. Otherwise, generate it using Polly, save it, and return it.
    This function was introduced to handle Gateway Timeouts from API Gateway -  Lambda integration.

    Parameters:
    - bucket_name (str): Name of the S3 bucket.
    - file_key (str): S3 key (file path).
    - call_bedrock_function (callable): Function that calls Bedrock and returns the response.
    - text_to_synthesize (str): The text to be synthesized into speech.
    - output_format (str): The format of the audio output (e.g., 'mp3', 'pcm').
    - language_code (str): The language code to use for speech synthesis (e.g., 'en-US').
        
    Returns:
    - dict: The synthesis result.
    """
    try:
        file_exists = s3_utils.check_s3_file_exists(bucket_name, file_key)
        if file_exists:
            synthesis_result = {'audio_key': file_key}
        else: 
            synthesis_result = polly_utils.synthesize_speech(bucket_name, file_key, text_to_synthesize, output_format, language_code, async_processing=async_processing)
        return synthesis_result
    except Exception as e:
        logger.debug("An error occurred: %s", str(e))
        raise e
    
def get_or_generate_translation(bucket_name: str, file_key: str, call_translation_function, text_to_translate: str, source_language_code: str, destination_language_code: str):
    """
    Check if the response exists in S3 before calling Translate.
    If the response exists, return it from S3. Otherwise, generate it using Translate, save it, and return it.
    This function was introduced to handle Gateway Timeouts from API Gateway -  Lambda integration.

    Parameters:
    - bucket_name (str): Name of the S3 bucket.
    - file_key (str): S3 key (file path).
    - call_translation_function (callable): Function that calls Translate and returns the response.
    - text_to_translate(str): The text to be translated.
    - source_language_code(str): The language code for the original language of the translation.
    - destination_language_code(str): The language code for the selected language for the translation.

    Returns:
    - dict: The final response.
    """
    try:
        file_exists = s3_utils.check_s3_file_exists(bucket_name, file_key)
        if file_exists:
            translation_response = s3_utils.get_json_from_s3(bucket_name, file_key)
        else: 
            translation_response = call_translation_function(text_to_translate, source_language_code, destination_language_code)
            s3_utils.write_json_to_s3(bucket_name, file_key, translation_response)
        return translation_response, file_exists
    except Exception as e:
        logger.debug("An error occurred: %s", str(e))
        raise e