"""
parameter_utils.py

This module provides utility functions for extracting parameters from an event object.

Functions:
-----------
- get_path_parameter(event: dict, param_name: str) -> str
  Retrieves a specified path parameter from the event object.

- get_query_string_parameter(event: dict, param_name: str) -> str
  Retrieves a specified query string parameter from the event object.

Usage:
------
These functions are designed to handle extraction of path and query string parameters
from an event dictionary, such as those used in AWS Lambda functions or API Gateway events.
"""
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
    
def get_path_parameter(event: dict, param_name: str) -> str:
    """
    Retrieves a path parameter from the event object.

    Parameters:
    -----------
    event : dict
        The event dictionary containing the path parameters.
    param_name : str
        The name of the path parameter to retrieve.

    Returns:
    --------
    str
        The value of the specified path parameter.

    Raises:
    -------
    KeyError
        If the path parameter is missing from the event object.
    """
    try:
        path_parameters = event.get('pathParameters', {})
        if param_name in path_parameters:
            return path_parameters[param_name]
        else:
            raise KeyError(f"Missing path parameter: {param_name}")
    except Exception as e:
        logger.warning(e)
        raise e


def get_query_string_parameter(event: dict, param_name: str) -> str:
    """
    Retrieves a query string parameter from the event object.

    Parameters:
    -----------
    event : dict
        The event dictionary containing the query string parameters.
    param_name : str
        The name of the query string parameter to retrieve.

    Returns:
    --------
    str
        The value of the specified query string parameter.

    Raises:
    -------
    KeyError
        If the query string parameter is missing from the event object.
    """
    try:
        query_string_parameters = event.get('queryStringParameters', {})
        if param_name in query_string_parameters:
            return query_string_parameters[param_name]
        else:
            raise KeyError(f"Missing query string parameter: {param_name}")
    except Exception as e:
        logger.warning(e)
        raise e