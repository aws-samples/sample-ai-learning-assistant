"""
cognito_utils.py

Module for interacting with AWS Cognito to retrieve identity IDs and authorization functions.

Imports:
---------
- boto3: AWS SDK for Python to interact with AWS services.
- os: Provides access to environment variables.
- logging: Provides log levels and structured logging.
- constants: Defines constants used throughout the module (imported from Lambda layer).

Functions:
-----------
- get_authorization_token(event)
- get_cognito_identity_id(region: str, identity_pool_id: str, user_pool_id: str, authorization_token: str) -> str

"""
import boto3
import os
import logging
import constants # from layer

logger = logging.getLogger()
logger.setLevel(logging.INFO)

REGION = os.environ[constants.REGION]
cognito_identity = boto3.client('cognito-identity', region_name=REGION)\

def get_authorization_token(event):
    """
    Extracts the authorization token from an event object.

    This function retrieves the authorization token from the event object,
    typically used in the context of AWS Lambda functions triggered by API Gateway or similar
    services. The function assumes that the authorization token is located within
    the 'headers' or 'queryStringParameters' of the event object.

    Parameters:
    -----------
    event : dict
        The event object containing details of the HTTP request. This is usually provided
        by API Gateway or a similar service when the function is invoked. The event object
        may contain headers or query parameters that include the authorization token.

    Returns:
    --------
    str
        The authorization token extracted from the event object. If the token is not found,
        the function will return an empty string.

    Raises:
    -------
    KeyError
        If the event object does not contain the expected keys ('headers' or 'queryStringParameters').
    """
    if event['headers'] and \
            event['headers']['Authorization']:
        return event['headers']['Authorization']
    else:
        raise KeyError("Missing user identifier (sub) in request context authorizer claim.")

def get_cognito_identity_id(region : str, identity_pool_id:str, user_pool_id: str, authorization_token: str) -> str:
    """
    Retrieves a Cognito Identity ID using the AWS Cognito Identity service.

    This function uses the provided identity pool ID, user pool ID, and authorization token to get
    an identity ID from AWS Cognito. It constructs the logins key for the Cognito Identity service and
    handles any exceptions that may occur during the process.

    Parameters:
    -----------
    region : str
        The AWS region where the Cognito Identity Pool is located (e.g., 'us-west-2').
    identity_pool_id : str
        The ID of the Cognito Identity Pool.
    user_pool_id : str
        The ID of the Cognito User Pool.
    authorization_token : str
        The authorization token from the Cognito User Pool.

    Returns:
    --------
    str
        The Cognito Identity ID if the request is successful.

    Raises:
    -------
    ValueError
        If the 'IdentityId' key is not found in the response from Cognito.
    botocore.exceptions.ClientError
        For errors related to AWS Cognito services, such as:
            - InvalidParameterException: If the parameters provided are invalid.
            - ResourceNotFoundException: If the specified resource does not exist.
            - NotAuthorizedException: If the authorization token is invalid or expired.
            - InternalError: For internal errors from the Cognito service.
    """
    logins_key = f'cognito-idp.{region}.amazonaws.com/{user_pool_id}'
    try:
        response = cognito_identity.get_id(
            IdentityPoolId=identity_pool_id,
            Logins={
                logins_key: authorization_token
            }
        )
        if 'IdentityId' not in response:
            raise ValueError("IdentityId not found in the response.")
        
        return response['IdentityId']
    
    except Exception as e:
        logger.debug("Error getting Cognito Identity ID: %s", str(e))
        raise e