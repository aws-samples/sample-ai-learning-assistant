"""
Lambda Function: Get foundation models

This Lambda function get a list of available foundation models.

Imports:
--------
- boto3: AWS SDK for Python to interact with AWS services.
- os: Provides access to environment variables.
- logging: Provides log levels and structured logging.
- constants: Defines constants used throughout the module (imported from Lambda layer).
- response_utils: Custom utility functions for formatting and sending responses (imported from Lambda layer).

AWS Clients:
-------------
- `brt`: Boto3 client for interacting with Amazon Bedrock.

Functions:
----------
1. get_models():
   Gets a list of available foundation models.

2. build_model_map(models):
   Builds a dictionary mapping model names to model IDs.

3. handler(event: dict, context: object) -> dict:
   Main entry point for the Lambda function. Handles the event and returns the response from the get_models function.

"""
import boto3
import os
import logging
import constants # from layer
import response_utils # from layer

logger = logging.getLogger()
logger.setLevel(logging.INFO)

REGION = os.environ[constants.REGION]
brt = boto3.client(service_name='bedrock', region_name=REGION)\
    
def get_models():
    """
    Gets a list of available foundation models.

    Returns:
    --------
    list
        A list of available foundation models.
    """
    response = brt.list_foundation_models(
        byOutputModality='TEXT',
        byInferenceType='ON_DEMAND'
    )

    return response["modelSummaries"]


def build_model_map(models):
    """
    Builds a dictionary mapping model names to model IDs.

    Parameters:
    -----------
    models : list
        A list of available foundation models.

    Returns:
    --------
    dict
        A dictionary mapping model names to model IDs.
    """
    model_map = {}
    
    for model in models:
        model_name = model["providerName"] + " " + model["modelName"]
        index_v = model["modelId"].find('-v')
        if index_v != -1:
            version = model["modelId"][index_v + 1:]
            model_name = model["providerName"] + " " + model["modelName"] + " " + version
        model_id = model['modelId']
        model_map[model_name] = model_id

    return model_map

def handler(event, context):
    """
    Calls the get_models function and returns the response.

    Parameters:
    -----------
    event : dict
        The input event containing parameters and data for processing.
    context : object
        The context object provides runtime information to the handler.

    Returns:
    --------
    dict
        The response from the get_models function, containing the list of available foundation models.
    """
    logger.debug(f"Full event: {event}") # Only log full event in debug mode 
    try:
        models = get_models()
        model_map = build_model_map(models)
        return response_utils.format_response(code=constants.OK_CODE, body={
                'modelMap': model_map
        })

    except Exception as e:
        return response_utils.format_exception(e)
    
    