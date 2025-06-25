"""
Lambda Function: Answer Questions Based on Transcript with Bedrock AI

This Lambda function processes a transcript and a question, utilizes an AI model to generate an answer, and optionally synthesizes speech for the answer using Amazon Polly. The function then stores the answer and the synthesized speech in S3 and responds with their locations.

Imports:
--------
- json: Used for handling JSON data.
- boto3: AWS SDK for Python to interact with AWS services.
- os: Provides access to environment variables.
- logging: Provides log levels and structured logging.
- constants: Defines constants used throughout the module (imported from Lambda layer).
- parameter_utils: Custom utility functions for extracting parameters from the event (imported from Lambda layer).
- response_utils: Custom utility functions for formatting and sending responses (imported from Lambda layer).
- bedrock_utils: Custom utility functions for interacting with Bedrock AI models (imported from Lambda layer).
- cognito_utils: Custom utility functions for handling AWS Cognito operations (imported from Lambda layer).
- s3_utils: Custom utility functions for interacting with S3 (imported from Lambda layer).
- s3_cache_utils: Custom utility functions for caching and retrieving responses from Amazon S3. 

Environment Variables:
----------------------
- MEDIA_BUCKET: The name of the S3 bucket used for storing media files.
- REGION: The AWS region where the resources are located.
- IDENTITY_POOL_ID: The ID of the Cognito Identity Pool.
- USER_POOL_ID: The ID of the Cognito User Pool. 

AWS Clients:
-------------
- `brt`: Boto3 client for interacting with Amazon Bedrock.

Functions:
----------
1. ask_assistant(transcript: str, question: str, language: str, model_id: str) -> str:
   Sends a transcription and a question to the AI model and retrieves an answer.

2. handler(event: dict, context: object) -> dict:
   Main entry point for the Lambda function. Handles the event, retrieves the transcription, generates an answer using the AI model, and optionally synthesizes speech for the answer. Stores the answer and audio in S3 and returns their locations.
"""
import json
import boto3
import os
import logging
import constants # from layer
import parameter_utils # from layer
import response_utils # from layer
import bedrock_utils # from layer
import cognito_utils # from layer
import s3_utils # from layer
import s3_cache_utils # from layer

logger = logging.getLogger()
logger.setLevel(logging.INFO)
MEDIA_BUCKET = os.environ[constants.MEDIA_BUCKET]
REGION = os.environ[constants.REGION]
IDENTITY_POOL_ID = os.environ[constants.IDENTITY_POOL_ID]
USER_POOL_ID = os.environ[constants.USER_POOL_ID]
BEDROCK_GUARDRAIL_IDENTIFIER = os.environ[constants.BEDROCK_GUARDRAIL_IDENTIFIER]
BEDROCK_GUARDRAIL_VERSION = os.environ[constants.BEDROCK_GUARDRAIL_VERSION]
brt = boto3.client(service_name='bedrock-runtime', region_name=REGION)\

def ask_assistant(transcript, question, language, model_id):
    """
    Sends a transcription and a question to the AI model and retrieves an answer.

    Parameters:
    -----------
    transcript : str
        The transcription text that provides the context for answering the question.
    question : str
        The question to be answered based on the provided transcript.
    language : str
        The language in which the answer should be provided.
    model_id : str
        The ID of the AI model to be used for generating the answer.

    Returns:
    --------
    str
        The generated answer to the question based on the AI model's response.
    """
    prompt =    "Based on the following transcript content from a video or audio file, answer the question below. \n\n " + \
                "Use the information from the transcript to provide your answer. \n\n " + \
                "If the answer is not clear or cannot be determined from the transcript, respond with  \"Unsure about answer.\" . \n\n" + \
                "Please answer in " + language + ". \n\n "  + \
                "Transcript: \n\n" + \
                transcript + " \n\n " + \
                "Question: \n\n" + \
                question 
                
    system =    "You are an assistant trained to answer questions based on the provided transcript content from a video or audio file. \n\n " + \
                "Your responses should be accurate and relevant to the information in the transcript. \n\n " + \
                "If you cannot find an answer based on the content, respond with \"Unsure about answer.\" . \n\n " + \
                "Provide clear and concise answers without unnecessary elaboration. \n\n " + \
                "You will be given a prompt please answer in " + language + ". \n\n " 
   
    enclosed_prompt = "\n\nHuman: " + \
    system + " \n\n " + \
    "Prompt: " + prompt + " \n\n " + \
    "\n\nAssistant:"
    
    response = brt.invoke_model(
        modelId=model_id, guardrailIdentifier=BEDROCK_GUARDRAIL_IDENTIFIER, guardrailVersion=BEDROCK_GUARDRAIL_VERSION, body=json.dumps(bedrock_utils.get_model_body(model_id, enclosed_prompt, system, prompt))
    )

    return bedrock_utils.get_model_response(model_id, response)

def handler(event, context):
    """
    Main entry point for the Lambda function. Handles the event, retrieves the transcription,
    generates an answer using the AI model, and optionally synthesizes speech for the answer. 
    Stores the answer and audio in S3 and returns their locations.

    Parameters:
    -----------
    event : dict
        The input event containing parameters and data for processing.
    context : object
        The context object provides runtime information to the handler.

    Returns:
    --------
    dict
        The HTTP response with the status code and message, including the S3 keys for the generated answer and audio (if applicable).

    Raises:
    -------
    Exception:
        For any unexpected errors during execution, which are caught and formatted into a response.
    """
    logger.debug(f"Full event: {event}") # Only log full event in debug mode 
    try:
        body_json = json.loads(event[constants.BODY])
        if constants.QUESTION in body_json:
            question = body_json[constants.QUESTION]
            transcription_job_name = parameter_utils.get_path_parameter(event, constants.TRANSCRIPTION_JOB_NAME_PARAMETER) 
            language = parameter_utils.get_query_string_parameter(event, constants.LANGUAGE_PARAMETER) 
            model_id = bedrock_utils.get_model_id(event) 
            identity_id = cognito_utils.get_cognito_identity_id(REGION, IDENTITY_POOL_ID, USER_POOL_ID, cognito_utils.get_authorization_token(event))
             
            transcription = s3_utils.get_transcription(transcription_job_name, MEDIA_BUCKET, identity_id)
            
            answer_key = s3_utils.get_file_key(transcription_job_name, constants.ASSISTANT_FOLDER_PATH, identity_id, model_id=model_id, language=language, timestamp=True)
            answer, repeated_requested = s3_cache_utils.get_or_generate_bedrock_response(MEDIA_BUCKET, answer_key, ask_assistant, transcription, question, language, model_id)
            try:
                audio_key =  s3_utils.get_file_key(transcription_job_name, f'{constants.ASSISTANT_FOLDER_PATH}{constants.AUDIOS_FOLDER_PATH}', identity_id, output_format=constants.MP3, model_id=model_id, language=language, timestamp=True)
                synthesis_result = s3_cache_utils.get_or_synthesize_speech(MEDIA_BUCKET, audio_key, answer, constants.MP3, language, async_processing=repeated_requested)
                if constants.SYNTHESIS_RESULT_TASK_ID in synthesis_result:
                    return response_utils.send_response_speech_synthesis(answer, answer_key, synthesis_result[constants.SYNTHESIS_RESULT_TASK_ID])
                elif constants.SYNTHESIS_RESULT_AUDIO_KEY in synthesis_result:
                    return response_utils.send_response_with_file_key_and_audio_key(answer, answer_key, synthesis_result[constants.SYNTHESIS_RESULT_AUDIO_KEY])
            except Exception as e:
                logger.debug(f"Polly synthesis failed: {str(e)}") # Log the exception in debug model but proceed without failing the entire function
            
            return response_utils.send_response_with_file_key(answer, answer_key)
        else:
            return response_utils.format_response(code=constants.BAD_REQUEST_CODE, body={
                    "status": constants.BAD_REQUEST_STATUS,
                    'message': "Missing question in request. Question needed to ask the assistant."
                })
    except Exception as e:
        return response_utils.format_exception(e)