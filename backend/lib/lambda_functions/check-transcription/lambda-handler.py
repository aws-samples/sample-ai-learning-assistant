"""
Lambda Function: Check Transcription Job

This Lambda function interacts with Amazon Transcribe to monitor the status of transcription jobs, move completed transcription files within S3, and respond with the appropriate status and file location.

Imports:
--------
- boto3: AWS SDK for Python to interact with AWS services.
- os: Provides access to environment variables.
- logging: Provides log levels and structured logging.
- constants: Defines constants used throughout the module (imported from Lambda layer).
- parameter_utils: Custom utility functions for extracting parameters from the event (imported from Lambda layer).
- response_utils: Custom utility functions for formatting and sending responses (imported from Lambda layer).
- cognito_utils: Custom utility functions for handling AWS Cognito operations (imported from Lambda layer).
- s3_utils: Custom utility functions for interacting with S3 (imported from Lambda layer).
- polly_utils: Custom utility functions for using Amazon Polly to synthesize speech (imported from Lambda layer).

Environment Variables:
----------------------
- MEDIA_BUCKET: The name of the S3 bucket used for storing media files.
- REGION: The AWS region where the resources are located.
- IDENTITY_POOL_ID: The ID of the Cognito Identity Pool.
- USER_POOL_ID: The ID of the Cognito User Pool.

AWS Clients:
-------------
- `transcribe`: Boto3 client for interacting with Amazon Transcribe.

Functions:
----------
1. get_transcription_job(transcription_job_name: str) -> dict:
   Retrieves the details of a specified transcription job from Amazon Transcribe.

2. handler(event: dict, context: object) -> dict:
   Main entry point for the Lambda function. Handles the event, retrieves the transcription job details, processes the transcription file, and responds with the status and file location.
"""

import boto3
import os
import logging
import constants # from layer
import parameter_utils # from layer
import cognito_utils # from layer
import response_utils # from layer
import s3_utils # from layer

logger = logging.getLogger()
logger.setLevel(logging.INFO)
MEDIA_BUCKET = os.environ[constants.MEDIA_BUCKET]
REGION = os.environ[constants.REGION]
IDENTITY_POOL_ID = os.environ[constants.IDENTITY_POOL_ID]
USER_POOL_ID = os.environ[constants.USER_POOL_ID]
transcribe = boto3.client('transcribe', region_name=REGION)\

def get_transcription_job(transcription_job_name):
    response = transcribe.get_transcription_job(
        TranscriptionJobName=transcription_job_name
    )
    return response[constants.TRANSCRIPTION_JOB]

def handler(event, context):
    logger.debug(f"Full event: {event}") # Only log full event in debug mode 
    try:
        transcription_job_name = parameter_utils.get_path_parameter(event, constants.TRANSCRIPTION_JOB_NAME_PARAMETER) 
        transcription_job = get_transcription_job(transcription_job_name)
        
        if transcription_job[constants.TRANSCRIPTION_JOB_STATUS] == constants.COMPLETED_STATUS:
            identity_id = cognito_utils.get_cognito_identity_id(REGION, IDENTITY_POOL_ID, USER_POOL_ID, cognito_utils.get_authorization_token(event))
            temp_file_key = f'{constants.TEMPORARY_FOLDER_PATH}{constants.TRANSCRIPTIONS_FOLDER_PATH}{transcription_job_name}.json'
            file_key = s3_utils.get_file_key(transcription_job_name, constants.TRANSCRIPTIONS_FOLDER_PATH, identity_id)
            s3_utils.move_s3_object(MEDIA_BUCKET, temp_file_key, MEDIA_BUCKET, file_key)

            return response_utils.format_response(code=constants.OK_CODE, body={
                    'status': constants.COMPLETED_STATUS,
                    'language': transcription_job[constants.LANGUAGE_CODE],
                    'fileKey': file_key
                })
        elif transcription_job['TranscriptionJobStatus'] == 'NOT_FOUND':
            return response_utils.format_response(code=constants.NOT_FOUND_CODE, body={
                    "status": constants.NOT_FOUND_STATUS,
                    'message': "Transcription job not found."
                })
        else:
            return response_utils.format_response(code=constants.PROCESSING_CODE, body={
                    "status": constants.PROCESSING_STATUS,
                    'message': "Video is still ongoing the transcription process."
                })
    except Exception as e:
        return response_utils.format_exception(e)
            
        
    
    