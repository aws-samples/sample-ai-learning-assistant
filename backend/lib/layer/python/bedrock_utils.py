"""
bedrock_utils.py

This module contains utility functions for handling responses from various language models and 
constructing request bodies for those models.

Functions:
-----------
- get_model_id(event)
- get_model_response(model_id, response)
- get_model_body(model_id, enclosed_prompt, system, prompt)

Exceptions:
------------
- KeyError: Raised if expected keys are not found in the response body or body configuration.
- ValueError: Raised if the response body is not in the expected format (e.g., not a JSON object).
"""

import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DEFAULT_BEDROCK_MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0"

def get_model_id(event):
    """
    Extracts the model identifier from an event dictionary, using a default value if not provided.

    Parameters:
    -----------
    event : dict
        A dictionary representing an event, typically containing query parameters.

    Returns:
    --------
    str
        The model identifier extracted from the event's query string parameters. If the model identifier
        is not present in the query parameters, a default value is returned.
    """
    if event['queryStringParameters']:
        return event['queryStringParameters'].get('modelId', DEFAULT_BEDROCK_MODEL_ID)


def get_model_response(model_id: str, response: dict) -> str:
    """
    Extracts and returns the generated text from a model response based on the model identifier.

    Parameters:
    -----------
    model_id : str
        The identifier for the model which determines the structure of the response and how to 
        extract the text.
    response : dict
        The response object from the model which contains the generated text.

    Returns:
    --------
    str
        The generated text from the model response.

    Raises:
    -------
    KeyError
        If expected keys are not found in the response body based on the `model_id`.
    ValueError
        If the response body cannot be parsed as JSON or is not in the expected format.

    Notes:
    ------
    - The function assumes that `response["body"].read()` returns a JSON object and attempts to 
      parse it to extract the text based on the model ID.
    - Supports a variety of model identifiers including:
        - "amazon.titan"
        - "ai21.j2"
        - "anthropic.claude-3"
        - "anthropic.claude"
        - "cohere"
        - "meta.llama2"
        - "mistral"
    - For unsupported or unrecognized `model_id`, the function returns an empty string.
    """
    try:
        response_body = json.loads(response["body"].read())
    except (json.JSONDecodeError, TypeError) as e:
        raise ValueError(f"Error parsing response body: {e}")

    try:
        if "amazon.titan" in model_id:
            text = response_body["results"][0]['outputText']
        elif "ai21.j2" in model_id:
            text = response_body["completions"][0]['data']['text']
        elif "ai21.jamba" in model_id:
            text = response_body['choices'][0]['message']['content']
        elif 'anthropic.claude-3' in model_id:
            text = response_body["content"][0]['text']
        elif 'anthropic.claude' in model_id:
            text = response_body["completion"]
        elif 'cohere' in model_id:
            text = response_body['generations'][0]['text']
        elif 'meta.llama' in model_id:
            text = response_body['generation']
        elif 'mistral' in model_id:
            text = response_body['outputs'][0]['text']
        else:
            raise KeyError(f"Unrecognized model_id: {model_id}. The backend cannot process this model id and needs to be updated.")

        return text
    except Exception as e:
        raise e

def get_model_body(model_id: str, enclosed_prompt: str, system: str = None, prompt: str = None) -> dict:
    """
    Constructs and returns the request body for a specified model based on the model identifier.

    Parameters:
    -----------
    model_id : str
        The identifier for the model which determines the structure of the request body.
    enclosed_prompt : str
        The prompt text to be included in the request body.
    system : str, optional
        Optional system configuration or context for models requiring it (e.g., Anthropic Claude-3).
    prompt : str, optional
        Optional prompt text to be used for models requiring a specific prompt format (e.g., Anthropic Claude).

    Returns:
    --------
    dict
        The request body formatted for the specified model.

    Raises:
    -------
    KeyError
        If the provided `model_id` is not recognized or if required parameters for constructing
        the body are missing.

    Notes:
    ------
    - The function constructs request bodies tailored for a range of model identifiers including:
        - "amazon.titan"
        - "ai21.j2"
        - "anthropic.claude-3"
        - "anthropic.claude"
        - "cohere"
        - "meta.llama2"
        - "mistral"
    - For unrecognized `model_id`, the function returns an empty dictionary.
    """
    body = {}
    if "amazon.titan" in model_id:
        body = {
            "inputText": enclosed_prompt,
            "textGenerationConfig": {
                "temperature": 0.5,
                "topP": 1,
                "maxTokenCount": 1000,
                "stop_sequences": ["\n\nHuman:"]
            }
        }
    elif "ai21.j2" in model_id:
        body = {
            "prompt": enclosed_prompt,
            "temperature": 0.5,
            "topP": 1,
            "maxTokens": 1000,
            "stop_sequences": ["\n\nHuman:"]
            #"countPenalty": {
            #    "scale": 0.5
            #},
            #"presencePenalty": {
            #    "scale": 0.5
            #},
            # "frequencyPenalty": {
            #    "scale": 0.5
            #}
        }
    elif "ai21.jamba" in model_id:
        body = {
            "max_tokens": 1000,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.5,
            "top_p": 1,
            "stop": ["\n\nHuman:"],
        }
    elif 'anthropic.claude-3' in model_id:
        body = {
            "max_tokens": 1000,
            "system": system,
            "messages": [{"role": "user", "content": prompt}],
            "anthropic_version": "bedrock-2023-05-31",
            "temperature": 0.5,
            "top_p": 1,
            #"top_k": int,
            #"tools": [{
            #      "name": string,
            #      "description": string,
            #      "input_schema": json
            #}],
            #"tool_choice": {
            #    "type" :  string,
            #    "name" : string,
            #},
            "stop_sequences": ["\n\nHuman:"]
        }
    elif 'anthropic.claude' in model_id:
        body = {
            "prompt": enclosed_prompt,
            "temperature": 0.5,
            "top_p": 1,
            #"top_k": 1,
            "max_tokens_to_sample": 1000,
            "stop_sequences": ["\n\nHuman:"]
        }
    elif 'cohere' in model_id:
        body = {
            "prompt": enclosed_prompt,
            "temperature": 0.5,
            "p": 1,
            #"k": 0,
            "max_tokens": 1000,
            "stop_sequences": ["\n\nHuman:"],
            #"return_likelihoods": "GENERATION|ALL|NONE",
            #"stream": boolean,
            #"num_generations": int,
            #"logit_bias": {token_id: bias},
            #"truncate": "NONE|START|END"
        }
    elif 'meta.llama' in model_id:
        body = {
            "prompt": enclosed_prompt,
            "temperature": 0.5,
            "top_p": 1,
            "max_gen_len": 1000
        }
    elif 'mistral' in model_id:
        body = {
            "prompt": enclosed_prompt,
            "max_tokens" : 1000,
            "stop" : ["\n\nHuman:"],
            "temperature": 0.5,
            "top_p": 1,
            #"top_k": int
        }
    else:
        raise KeyError(f"Unrecognized model_id: {model_id}. The backend cannot process this model id and needs to be updated.")

    return body
