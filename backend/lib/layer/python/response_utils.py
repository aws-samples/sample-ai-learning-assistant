"""
response_utils.py

This module provides utility functions for handling HTTP responses and exceptions in an AWS Lambda context.
Functions include formatting responses, handling exceptions, and determining response size.

Functions:
----------
1. format_response(code, body):
   Formats the HTTP response with a given status code and body content.

2. get_response_formatting_size():
   Calculates the size of the formatted response in bytes.

3. format_exception(exception):
   Formats an exception into an HTTP response with an error message.

4. send_response_with_file_key(value, file_key):
   Sends an HTTP response containing a file key and optionally a value, depending on response size.

5. send_response_with_file_key_and_audio_key(value, file_key, audio_key):
   Sends an HTTP response containing a file key, an audio file key, and optionally a value, depending on response size.

6. send_response_with_file_key_and_task_id(value, file_key, task_id):
   Sends an HTTP response containing a file key, a task id for the s3 polly synthesis job, and optionally a value, depending on response size.
"""

import logging
import json
import sys
import constants

logger = logging.getLogger()
logger.setLevel(logging.INFO)

MAX_RESPONSE_SIZE = 5 * 1024 * 1024  # 5 MB

def format_response(code, body):
    """
    Formats the HTTP response with the given status code and body content.

    Parameters:
    -----------
    code : int
        The HTTP status code to include in the response.
    body : dict
        The content to include in the response body, typically a dictionary.

    Returns:
    --------
    dict
        A dictionary representing the formatted HTTP response, including status code, headers, and body.
    """
    data = {
        'statusCode': code,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Credentials': 'true',
        },
        'body': json.dumps(body)
    }
    return data

def get_response_formatting_size():
    """
    Calculates the size of the formatted response in bytes.

    Returns:
    --------
    int
        The size of the formatted response in bytes.
    """
    data = {
        'statusCode': 'XXX',
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Credentials': 'true',
        },
        'body': {}
    }
    return sys.getsizeof(data)

def format_exception(exception):
    """
    Formats an exception into an HTTP response with an error message.

    Parameters:
    -----------
    exception : Exception
        The exception to format.

    Returns:
    --------
    dict
        A dictionary representing the formatted error response, including status code, headers, and body.
    """
    logger.error("An error occurred: %s", str(exception))
    
    code = constants.INTERNAL_SERVER_ERROR_CODE
    status = constants.INTERNAL_SERVER_ERROR_STATUS
    message = 'Internal Server Error.'
    if type(exception) == KeyError:
        code = constants.BAD_REQUEST_CODE
        status = constants.BAD_REQUEST_STATUS
        message = str(exception)
    elif type(exception) == ValueError:
        code = constants.UNPROCESSABLE_CONTENT_CODE
        status = constants.UNPROCESSABLE_CONTENT_STATUS
        message = str(exception)
    elif hasattr(exception, 'response') and 'Error' in exception.response:
        response = exception.response
        error = response['Error']
        if 'Code' in error and 'Message' in error:
            message = error['Message']
            if error['Code'] == 'AccessDeniedException':
                code = constants.ACCESS_DENIED_CODE
                status = constants.ACCESS_DENIED_STATUS
            elif error['Code'] == 'ConflictException':
                code = constants.CONFLICT_ERROR_CODE
                status = constants.CONFLICT_ERROR_STATUS
            elif error['Code'] == 'NoSuchKey' or error['Code'] == 'ResourceNotFoundException':
                code = constants.NOT_FOUND_CODE
                status = constants.NOT_FOUND_STATUS
            elif error['Code'] == 'ValidationException':
                code = constants.UNPROCESSABLE_CONTENT_CODE
                status = constants.UNPROCESSABLE_CONTENT_STATUS
            elif error['Code'].isnumeric():
                code = error['Code']
    return format_response(code=code, body={
        'code': code,
        'status': status,
        'message': message
    })

def send_response_with_file_key(value, file_key):
    """
    Sends an HTTP response containing a file key and optionally a value, depending on response size.

    Parameters:
    -----------
    value : any
        The value to include in the response, if applicable.
    file_key : str
        The S3 file key to include in the response.

    Returns:
    --------
    dict
        A dictionary representing the formatted HTTP response, potentially including both file key and value.
    """
    # Get the size of the response in bytes
    response_size = get_response_formatting_size() + sys.getsizeof({
        'body': json.dumps({"fileKey": file_key, "value": value})
    })

    # If its bigger than the allowed size send only file key
    if response_size >= MAX_RESPONSE_SIZE:
        return format_response(code=200, body={"fileKey": file_key})
    else:
        return format_response(code=200, body={"fileKey": file_key, "value": value})

def send_response_with_file_key_and_audio_key(value, file_key, audio_key):
    """
    Sends an HTTP response containing a file key, an audio file key, and optionally a value, depending on response size.

    Parameters:
    -----------
    value : any
        The value to include in the response, if applicable.
    file_key : str
        The S3 file key to include in the response.
    audio_key : str
        The S3 key for the audio file to include in the response.

    Returns:
    --------
    dict
        A dictionary representing the formatted HTTP response, potentially including file key, audio key, and value.
    """
    # Get the size of the response in bytes
    response_size = get_response_formatting_size() + sys.getsizeof({
        'body': json.dumps({"fileKey": file_key, "audioFileKey": audio_key, "value": value})
    })

    # If its bigger than the allowed size send only file key
    if response_size >= MAX_RESPONSE_SIZE:
        return format_response(code=200, body={"fileKey": file_key, "audioFileKey": audio_key})
    else:
        return format_response(code=200, body={"fileKey": file_key, "audioFileKey": audio_key, "value": value})

def send_response_speech_synthesis(value, file_key, task_id):
    """
    Sends an HTTP response containing a file key, a task id for the s3 polly synthesis job, and optionally a value, depending on response size.

    Parameters:
    -----------
    value : any
        The value to include in the response, if applicable.
    file_key : str
        The S3 file key to include in the response.
    task_id : str
        The task id for S3 key for the s3 polly synthesis job.

    Returns:
    --------
    dict
        A dictionary representing the formatted HTTP response, potentially including file key, audio key, and value.
    """
    # Get the size of the response in bytes
    response_size = get_response_formatting_size() + sys.getsizeof({
        'body': json.dumps({"fileKey": file_key, "taskId": task_id, "value": value})
    })

    # If its bigger than the allowed size send only file key
    if response_size >= MAX_RESPONSE_SIZE:
        return format_response(code=200, body={"fileKey": file_key, "taskId": task_id})
    else:
        return format_response(code=200, body={"fileKey": file_key,  "taskId": task_id, "value": value})

