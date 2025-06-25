"""
s3_utils.py

This module provides utility functions for interacting with Amazon S3. It includes functions to fetch, 
write, move JSON files within S3 buckets, and handle transcription files.

Functions:
----------
1. get_json_from_s3(s3_bucket, file_key):
   Fetches a JSON file from the specified S3 bucket and returns its content.

2. write_json_to_s3(bucket_name, file_key, json_data_to_write):
   Writes a JSON object to an S3 bucket under a specified key.

3. move_s3_object(source_bucket, source_key, destination_bucket, destination_key):
   Moves an object from one S3 bucket/key to another by copying and then deleting the original object.

4. get_file_key(transcription_job_name, folder_path, identity_id, output_format='json', language=None, model_id=None, timestamp=None ):
   Generates an S3 key for a transcription file based on job name, folder path, identity ID, output format, 
   and optionally, language.

5. get_transcription(transcription_job_name, s3_bucket, identity_id):
   Fetches the transcription text from an S3 bucket based on the transcription job name and identity ID.

6. check_s3_file_exists(bucket_name, file_key):
   Checks if a file exists in an S3 bucket by attempting to retrieve the file's metadata.
"""

import boto3
import os
import logging
import json
import constants # from layer
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize the S3 client
REGION = os.environ[constants.REGION]
s3 = boto3.client('s3', region_name=REGION)

def get_json_from_s3(s3_bucket: str, file_key: str) -> dict:
    """
    Fetches a JSON file from the specified S3 bucket and returns its content as a Python dictionary.

    Parameters:
    -----------
    s3_bucket : str
        The name of the S3 bucket from which to fetch the file.
    file_key : str
        The key (path) of the file within the S3 bucket.

    Returns:
    --------
    dict
        The JSON content of the file as a Python dictionary.

    Raises:
    -------
    botocore.exceptions.ClientError
        For errors related to S3 operations, including:
            - `NoSuchKey`: Raised if the specified file does not exist in the S3 bucket. This indicates that the `file_key` provided does not match any object in the `s3_bucket`.
            - `AccessDenied`: Raised if the credentials used to access the S3 bucket do not have sufficient permissions to read the file. This could be due to incorrect IAM policies or missing permissions for the `s3:GetObject` action.
            - `NoSuchBucket`: Raised if the specified S3 bucket does not exist. This indicates that the `s3_bucket` provided is not valid or has been deleted.
            - `InvalidBucketName`: Raised if the bucket name provided is invalid according to S3 naming rules. This might occur if the bucket name contains invalid characters or formatting issues.
            - `InvalidObjectState`: Raised if the object is in an invalid state for the requested operation, such as being archived in Glacier and not available for immediate access.
            - `ServiceUnavailable`: Raised if the S3 service is temporarily unavailable due to maintenance or issues with AWS infrastructure.

    ValueError
        Raised if the content of the fetched file cannot be parsed as JSON. This may occur if the file content is not in valid JSON format or if there is an issue with the encoding.

    JSONDecodeError
        Raised if the `json.loads` function encounters an error while decoding the JSON content. This could be due to corrupted data or unexpected characters in the file content.

    Notes:
    -------
    - The function first performs a `head_object` call to check if the object exists and to validate the key. This is a preliminary check to avoid fetching the object if it does not exist.
    - After confirming the object exists, it retrieves the object using the `get_object` call and attempts to decode its content from UTF-8 to a JSON dictionary.
    - Any errors encountered during these operations will be caught and printed, and then re-raised for further handling.
    """
    try:
        s3.head_object(Bucket=s3_bucket, Key=file_key)
        response = s3.get_object(Bucket=s3_bucket, Key=file_key)
        json_content = json.loads(response['Body'].read().decode('utf-8'))
        return json_content
    except Exception as e:
        logger.debug("Error getting json file from S3: %s", str(e))
        raise e


def write_json_to_s3(bucket_name : str, file_key : str, json_data_to_write):
    """
    Writes a JSON object to an S3 bucket under a specified key.

    Parameters:
    -----------
    bucket_name : str
        The name of the S3 bucket where the JSON data will be stored.
    file_key : str
        The key (path) under which the JSON data will be stored.
    json_data_to_write : dict
        The JSON data to be written to the S3 bucket.

    Returns:
    --------
    str
        The S3 key under which the JSON data was stored.

    Raises:
    -------
    ValueError
        If `json_data_to_write` cannot be serialized to JSON. This may occur if the dictionary contains non-serializable data types.
    botocore.exceptions.ClientError
        For errors related to S3 operations, such as:
            - `NoSuchBucket`: If the specified bucket does not exist.
            - `AccessDenied`: If the credentials used do not have permission to write to the bucket.
            - `InvalidBucketName`: If the bucket name is invalid.
            - `InvalidObjectState`: If the object is in an invalid state for the requested operation.
            - `ServiceUnavailable`: If the S3 service is temporarily unavailable.
            - `QuotaExceeded`: If the storage quota for the bucket has been exceeded.
    boto3.exceptions.S3UploadFailedError
        If the upload to S3 fails for reasons not specifically covered by `ClientError`.
    """
    json_string = json.dumps(json_data_to_write, indent=2)
    try:
        s3.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=json_string.encode('utf-8'),  # Encode JSON data to bytes
            ContentType='application/json'
        )
        return file_key
    except Exception as e:
        logger.debug("Error writing json file to S3: %s", str(e))
        raise e

def move_s3_object(source_bucket: str, source_key: str, 
                   destination_bucket: str, destination_key: str):
    """
    Moves an object from one S3 bucket to another by copying it to the destination bucket and then deleting the original object.

    Parameters:
    -----------
    source_bucket : str
        The name of the S3 bucket where the original object is located.
    source_key : str
        The key (path) of the object in the source bucket that needs to be moved.
    destination_bucket : str
        The name of the S3 bucket where the object will be copied to.
    destination_key : str
        The key (path) under which the object will be stored in the destination bucket.

    Returns:
    --------
    None

    Raises:
    -------
    botocore.exceptions.ClientError
        For various S3 errors that may occur during the copy and delete operations, including:
            - `NoSuchBucket`: If the source or destination bucket does not exist.
            - `AccessDenied`: If the credentials used do not have permission to access or modify the source or destination bucket.
            - `InvalidBucketName`: If the bucket name is invalid.
            - `NoSuchKey`: If the source key does not exist in the source bucket.
            - `InvalidObjectState`: If the object is in an invalid state for the requested operation.
            - `ServiceUnavailable`: If the S3 service is temporarily unavailable.
    boto3.exceptions.S3UploadFailedError
        If the copy operation fails, such as due to network issues or internal failures during the copy process.
    Exception
        For other unexpected errors that might occur during the operation, including errors not specifically related to S3 or boto3.

    Notes:
    -------
    - The function first copies the object from the source bucket to the destination bucket using the `copy` method of the S3 client.
    - After a successful copy, it deletes the original object from the source bucket using the `delete_object` method.
    """
    if check_s3_file_exists(destination_bucket, destination_key):
        logger.debug("File already exists in destination S3 bucket. Continuing with this file.")
    else:
        try:
            # Copy the object from the source bucket to the destination bucket
            copy_source = {'Bucket': source_bucket, 'Key': source_key}
            s3.copy(copy_source, destination_bucket, destination_key)

            # Delete the original object from the source bucket
            s3.delete_object(Bucket=source_bucket, Key=source_key)
            
        except Exception as e:
            logger.debug("Error moving json file to and from S3: %s", str(e))
            raise e

def get_file_key(transcription_job_name: str, folder_path: str, identity_id: str, 
                 output_format: str = 'json', model_id = None, language = None, timestamp = None) -> str:
    """
    Generates an S3 key for a transcription file based on the transcription job name, folder path, identity ID, 
    output format, and optionally, the language.

    Parameters:
    -----------
    transcription_job_name : str
        The name of the transcription job. This will be used as part of the S3 key.
    folder_path : str
        The folder path within the S3 bucket where the transcription file will be stored.
    identity_id : str
        The unique identifier for the user or entity associated with the transcription job. This will be used as part of the S3 key.
    output_format : str, optional
        The format of the output file. Defaults to 'json'. Other formats might be supported depending on the use case.
    model_id : str, optional
        The model_id used for generation. If provided, it will be included in the S3 key. If not provided, the key will not include a model_id suffix.
    language : str, optional
        The language of the transcription. If provided, it will be included in the S3 key. If not provided, the key will not include a language suffix.

    Returns:
    --------
    str
        The generated S3 key for the transcription file. The format of the key is:
        - If `language` is not provided: '{identity_id}/{folder_path}{transcription_job_name}.{output_format}'
        - If `language` is provided: '{identity_id}/{folder_path}{transcription_job_name}-{language}.{output_format}'
        - If `model_id` is provided: '{identity_id}/{folder_path}{transcription_job_name}-{model_id}.{output_format}'
        - If `model_id` and `language` are provided: '{identity_id}/{folder_path}{transcription_job_name}-{model_id}-{language}.{output_format}'
        - If `model_id`, `language` and `timestamp` are provided: '{identity_id}/{folder_path}{transcription_job_name}-{model_id}-{timestamp}-{language}.{output_format}'
        
        where `timestamp` is the Unix timestamp at the moment of key generation.

    Notes:
    -------
    - The function uses the current timestamp if the `language` parameter is provided to ensure unique file keys for different languages.
    - This key is used to reference the transcription file in S3 for storage and retrieval purposes.
    """
    if language and model_id:
        if timestamp is None:
            return f'{identity_id}/{folder_path}{transcription_job_name}-{model_id}-{language}.{output_format}'
        else:
            dt = datetime.now()
            ts = datetime.timestamp(dt)
            return f'{identity_id}/{folder_path}{transcription_job_name}-{model_id}-{ts}-{language}.{output_format}'
    elif language:
        return f'{identity_id}/{folder_path}{transcription_job_name}-{language}.{output_format}'
    elif model_id:
        return f'{identity_id}/{folder_path}{transcription_job_name}-{model_id}.{output_format}'
    else:
        return f'{identity_id}/{folder_path}{transcription_job_name}.{output_format}'

def get_transcription(transcription_job_name: str, s3_bucket: str, identity_id: str) -> str:
    """
    Fetches the transcription text from an S3 bucket based on the transcription job name and identity ID.

    Parameters:
    -----------
    transcription_job_name : str
        The name of the transcription job used to locate the transcription file in S3.
    s3_bucket : str
        The name of the S3 bucket where the transcription file is stored.
    identity_id : str
        The unique identifier for the user or entity associated with the transcription job. This helps form the key for the S3 object.

    Returns:
    --------
    str
        The transcription text extracted from the S3 file.

    Raises:
    -------
    botocore.exceptions.ClientError
        For various client-related errors, such as:
            - `NoSuchBucket`: If the specified S3 bucket does not exist.
            - `NoSuchKey`: If the specified key does not exist in the S3 bucket.
            - `AccessDenied`: If access to the S3 bucket or object is denied.
    ValueError
        Raised if the transcription file does not have the expected format or content. This indicates that the JSON structure of the file is not as anticipated.

    Notes:
    -------
    - The function uses the `get_file_key` function to determine the key of the transcription file in S3.
    - It retrieves the file from S3 and parses it as JSON to extract the transcription text.
    - If the expected data is not found in the JSON structure, a `ValueError` is raised.
    """
    transcription_file_key = get_file_key(transcription_job_name, constants.TRANSCRIPTIONS_FOLDER_PATH, identity_id)
    
    try: 
        json_content = get_json_from_s3(s3_bucket, transcription_file_key)
        if json_content.get("results") and \
            json_content["results"].get("transcripts") and \
                json_content["results"]["transcripts"][0] and \
                    json_content["results"]["transcripts"][0].get("transcript"):
            return json_content["results"]["transcripts"][0]["transcript"]
        else:
            raise ValueError("Transcription file is not as expected.")
    except Exception as e:
        logger.debug("Error getting transcription content from S3: %s", str(e))
        raise e

def check_s3_file_exists(bucket_name: str, file_key: str) -> bool:
    """
    Checks if a file exists in an S3 bucket by attempting to retrieve the file's metadata.

    Parameters:
    -----------
    bucket_name : str
        The name of the S3 bucket where the file is stored.
    file_key : str
        The key (path) of the file within the S3 bucket.

    Returns:
    --------
    bool
        Returns `True` if the file exists in the S3 bucket, otherwise `False`.

    Raises:
    -------
    botocore.exceptions.ClientError
        For various client-related errors, such as:
            - `NoSuchBucket`: If the specified S3 bucket does not exist.
            - `AccessDenied`: If access to the S3 bucket or object is denied.
            - `RequestLimitExceeded`: If request rate exceeds the allowed limit.
    """
    try:
        s3.head_object(Bucket=bucket_name, Key=file_key)
        return True  
    except Exception as e:
        logger.debug("Error getting file from S3: %s", str(e))
        return False
        
        