"""
Lambda Function: Start Transcription

This AWS Lambda function handles the initiation of transcription jobs using AWS Transcribe. 
It extracts necessary parameters from the event object, initiates the transcription process, 
and returns a formatted response.

Imports:
---------
- boto3: AWS SDK for Python to interact with AWS services.
- botocore.exceptions.ClientError: Exception raised for errors returned by AWS services.
- os: Provides access to environment variables.
- json: Used for handling JSON data.
- logging: Provides log levels and structured logging.
- constants: Defines constants used throughout the module (imported from Lambda layer).
- cognito_utils: Custom utility functions for handling AWS Cognito operations (imported from Lambda layer).
- response_utils: Custom utility functions for formatting and sending responses (imported from Lambda layer).
- hash_utils: Custom utility functions for hashing (imported from Lambda layer).

Environment Variables:
----------------------
- MEDIA_BUCKET (str): The name of the S3 bucket where media files and transcription outputs are stored.
- REGION (str): The AWS region where the services are located.
- IDENTITY_POOL_ID (str): The ID of the AWS Cognito identity pool.
- USER_POOL_ID (str): The ID of the AWS Cognito user pool.

AWS Clients:
-------------
- `transcribe_client`: Boto3 client for interacting with Amazon Transcribe.

Functions:
-----------
- start_transcription_job(transcription_job_name: str, file_key: str, identity_id: str) -> dict
  Initiates a transcription job using AWS Transcribe service.

- handler(event: dict, context: object) -> dict
  Lambda function handler that processes incoming requests and starts a transcription job.

"""

import boto3
from botocore.exceptions import ClientError
import os
import json
import logging
import constants # from layer
import cognito_utils # from layer
import response_utils # from layer
import hash_utils # from layer

logger = logging.getLogger()
logger.setLevel(logging.INFO)
MEDIA_BUCKET = os.environ[constants.MEDIA_BUCKET]
REGION = os.environ[constants.REGION]
IDENTITY_POOL_ID = os.environ[constants.IDENTITY_POOL_ID]
USER_POOL_ID = os.environ[constants.USER_POOL_ID]
transcribe_client = boto3.client('transcribe', region_name=REGION)\

def start_transcription_job(transcription_job_name, file_key, identity_id):
    """
    Initiates a transcription job using AWS Transcribe service.

    Parameters:
    -----------
    transcription_job_name : str
        The name for the transcription job.
    file_key : str
        The key of the media file in S3.
    identity_id : str
        The Cognito Identity ID associated with the request.

    Returns:
    --------
    dict
        A formatted response containing the transcription job name if the initiation is successful.

    Raises:
    -------
    Exception
        For general errors, including:
            - AWS Transcribe client errors (e.g., ConflictException if the job already exists).
    """
    try:
        transcribe_client.start_transcription_job(
            TranscriptionJobName= f'{transcription_job_name}', 
            IdentifyLanguage=True,
            Media={
                'MediaFileUri': f's3://{MEDIA_BUCKET}/{identity_id}/{file_key}' 
            },
            OutputBucketName=f'{MEDIA_BUCKET}',
            OutputKey=f'{constants.TEMPORARY_FOLDER_PATH}{constants.TRANSCRIPTIONS_FOLDER_PATH}',
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConflictException':
            logger.debug("A transcription job with this name already exists. Continuing with this job.") 
        else:
            raise e
    return response_utils.format_response(code=constants.OK_CODE, body={
                'transcriptionJobName': transcription_job_name,
    })
    
def handler(event, context):
    """
    Lambda function handler for processing requests to start transcription jobs.

    Parameters:
    -----------
    event : dict
        The event dictionary containing the input data for the Lambda function.
    context : object
        The context object containing information about the execution environment.

    Returns:
    --------
    dict
        A formatted response indicating the result of the transcription job initiation.

    Raises:
    -------
    Exception
        For general errors encountered during event processing and transcription job initiation.
    """
    logger.debug(f"Full event: {event}") # Only log full event in debug mode 
    try:
        body_json = json.loads(event[constants.BODY])
        if constants.FILE_KEY in body_json:
            file_key = body_json[constants.FILE_KEY]
            transcription_job_name = hash_utils.deterministic_hash(file_key)
            identity_id = cognito_utils.get_cognito_identity_id(REGION, IDENTITY_POOL_ID, USER_POOL_ID, cognito_utils.get_authorization_token(event))
            return start_transcription_job(transcription_job_name, file_key, identity_id)
        else:
            return response_utils.format_response(code=constants.BAD_REQUEST_CODE, body={
                    "status": constants.BAD_REQUEST_STATUS,
                    "message": "Missing file key in request. File key needed to initiate transcription job"
                })   
    except Exception as e:
        return response_utils.format_exception(e)
    
    