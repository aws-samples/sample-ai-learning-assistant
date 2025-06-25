"""
Lambda Function: Check Polly S3 synthesis tasks

This Lambda function interacts with Amazon Polly to monitor the status of S3 synthesis tasks and respond with the appropriate status.

Imports:
--------
- boto3: AWS SDK for Python to interact with AWS services.
- os: Provides access to environment variables.
- logging: Provides log levels and structured logging.
- constants: Defines constants used throughout the module (imported from Lambda layer).
- parameter_utils: Custom utility functions for extracting parameters from the event (imported from Lambda layer).
- response_utils: Custom utility functions for formatting and sending responses (imported from Lambda layer).
- polly_utils: Custom utility functions for using Amazon Polly to synthesize speech (imported from Lambda layer).

AWS Clients:
-------------
- `polly`: Boto3 client for interacting with Amazon Polly.

Functions:
----------
1. get_speech_synthesis_task(task_id) -> dict:
   Retrieves the details of a specified task id from Amazon Polly.

2. handler(event: dict, context: object) -> dict:
   Main entry point for the Lambda function. Handles the event, retrieves the task id and responds with the status.
"""

import boto3
import os
import logging
import constants # from layer
import parameter_utils # from layer
import response_utils # from layer
import polly_utils # from layer

logger = logging.getLogger()
logger.setLevel(logging.INFO)

REGION = os.environ[constants.REGION]
polly = boto3.client('polly', region_name=REGION)\

def get_speech_synthesis_task(task_id):
    """
    Retrieves the status and details of a speech synthesis task from Amazon Polly.

    Args:
        task_id (str): The unique identifier for the speech synthesis task.

    Returns:
        dict: A dictionary containing the details of the speech synthesis task, 
              including its status, output file location, and any other relevant information.

    Raises:
        Exception: If there is an error in retrieving the task information, the exception is raised to be handled by the caller.
    """
    try:
        response = polly.get_speech_synthesis_task(
            TaskId=task_id
        )
        return response[constants.SYNTHESIS_TASK]
    except Exception as e:
        logger.debug("An error occurred: %s", str(e))
        raise e
        
def handler(event, context):
    """
    AWS Lambda function handler to process the status of a speech synthesis task.

    This function retrieves the synthesis task ID from the event, fetches the task details,
    and returns a response indicating whether the task is completed, failed, or still processing.

    Args:
        event (dict): The event data passed to the Lambda function, which should include the synthesis task ID.
        context (object): The runtime information of the Lambda function (not used in this function).

    Returns:
        dict: A response formatted with the status of the synthesis task:
              - "COMPLETED" if the task is finished.
              - "FAILED" if the task encountered an error.
              - "PROCESSING" if the task is still ongoing.

    Raises:
        Exception: If there is an error in processing the event or retrieving the task details, 
                   the exception is caught and formatted into a response using the `format_exception` utility.
    """
    logger.debug(f"Full event: {event}") # Only log full event in debug mode 
    try:
        synthesis_task_id = parameter_utils.get_path_parameter(event, constants.SYNTHESIS_TASK_ID_PARAMETER)
        synthesis_task = get_speech_synthesis_task(synthesis_task_id)
        if synthesis_task[constants.TASK_STATUS].upper() == constants.COMPLETED_STATUS:
            return response_utils.format_response(code=constants.OK_CODE, body={
                    'status': constants.COMPLETED_STATUS,
                    'audioFileKey': polly_utils.extract_file_key_from_url(synthesis_task[constants.OUTPUT_URI])
                })
        elif synthesis_task[constants.TASK_STATUS].upper() == constants.FAILED_STATUS:
            return response_utils.format_response(code=constants.INTERNAL_SERVER_ERROR_CODE, body={
                    "status": constants.FAILED_STATUS,
                    'message': "Text synthesis task to audio failed."
                })
        else:
            return response_utils.format_response(code=constants.PROCESSING_CODE, body={
                    "status": constants.PROCESSING_STATUS,
                    'message': "The text is still ongoing the audio synthesis process."
                })
    except Exception as e:
        return response_utils.format_exception(e)
            