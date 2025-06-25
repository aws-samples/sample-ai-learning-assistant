"""
Lambda Function: Generate Flashcards with Bedrock AI

This Lambda function processes transcription data stored in Amazon S3, generates educational flashcards using a specified AI model (via Bedrock AI), and stores the flashcards back in S3. The function responds with the location of the generated flashcards and audio (if available).

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
- NUMBER_OF_FLASHCARDS: The number of flashcards to generate.

AWS Clients:
-------------
- `brt`: Boto3 client for interacting with Amazon Bedrock.

Functions:
----------
1. get_flashcards(transcription: str, language: str, model_id: str) -> dict: 
   Generates flashcards based on the provided transcription using a specified AI model.

2. format_flashcards_for_polly(flashcards_json: str) -> str:
    Converts a JSON string containing flashcards into a formatted text suitable for reading by Amazon Polly.

3. validate_flashcard_json(response: str) -> str:
    Converts the response containing the flashcards into a formatted json suitable to be used by the frontend.
    
4. process_flashcards(item: dict) -> dict:
    Converts the response containing each flashcard into a formatted json suitable to be used by the frontend.

4. handler(event: dict, context: object) -> dict:
   Main entry point for the Lambda function. Handles the event, retrieves the transcription, generates flashcards, and stores them in S3.
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
NUMBER_OF_FLASHCARDS = os.environ[constants.NUMBER_OF_FLASHCARDS]
BEDROCK_GUARDRAIL_IDENTIFIER = os.environ[constants.BEDROCK_GUARDRAIL_IDENTIFIER]
BEDROCK_GUARDRAIL_VERSION = os.environ[constants.BEDROCK_GUARDRAIL_VERSION]
brt = boto3.client(service_name='bedrock-runtime', region_name=REGION)\

    
def get_flashcards(transcription, language, model_id):
    """
    Generates educational flashcards based on the provided transcription using a specified AI model.

    Parameters:
    -----------
    transcription : str
        The transcription text from which the flashcards will be generated.
    language : str
        The language in which the flashcards should be created.
    model_id : str
        The ID of the AI model to be used for generating the flashcards.

    Returns:
    --------
    dict
        The response from the AI model, containing the generated flashcards in a JSON array format.
    """
    prompt =    "Generate " + str(NUMBER_OF_FLASHCARDS) + " flashcards from the following transcription. \n\n " + \
                "Each flashcard should be formatted as a JSON object with the following structure: \n\n" + \
                "{\"question\": \"The question text\", \"answer\": \"The answer text\"}" + \
                "Please answer in " + language + ". \n\n " + \
                "Here is the transcription: \n\n" + \
                transcription + " \n\n " + \
                "Output the flashcards in a JSON array format. Please provide a direct response without any introductory phrases or preamble."
                
    system =    "You are a flashcard generation assistant. " + \
                "Your task is to create 5 flashcards based on the most important information from the provided transcription. \n\n " + \
                "Each flashcard should be formatted as a JSON object with the following structure: \n\n" + \
                "{\"question\": \"The question text\", \"answer\": \"The answer text\"} \n\n " + \
                "Output the flashcards in a JSON array format. \n\n " + \
                "Ensure that the flashcards are clear and informative and that each flashcard clearly captures key concepts and important details. \n\n " + \
                "Avoid any introductory text or preamble. \n\n " + \
                "You will be given a prompt please answer in " + language + ". \n\n " 
    
    enclosed_prompt = "\n\nHuman: " + \
    system + " \n\n " + \
    "Prompt: " + prompt + " \n\n " + \
    "\n\nAssistant:"
    
    response = brt.invoke_model(
        modelId=model_id, guardrailIdentifier=BEDROCK_GUARDRAIL_IDENTIFIER, guardrailVersion=BEDROCK_GUARDRAIL_VERSION, body=json.dumps(bedrock_utils.get_model_body(model_id, enclosed_prompt, system, prompt))
    )

    return validate_flashcard_json(bedrock_utils.get_model_response(model_id, response))

def format_flashcards_for_polly(flashcards_json: str) -> str:
    """
    Converts a JSON string containing flashcards into a formatted text suitable for reading by Amazon Polly.

    This function takes a JSON string with an array of flashcard objects, each containing a question and an answer.
    It formats the content into a plain text string where each flashcard is presented as a "Question" followed by 
    its corresponding "Answer", making it suitable for text-to-speech processing by Amazon Polly.

    Parameters:
        flashcards_json (str): A JSON string representing a list of flashcards. Each flashcard should have 
                               'question' and 'answer' fields.

    Returns:
        str: A formatted string containing the questions and answers, ready for processing by Amazon Polly.
    """
    flashcards = json.loads(flashcards_json)
    polly_text = ""
    for flashcard in flashcards:
        polly_text += f"Question: {flashcard['question']}. Answer: {flashcard['answer']}. "
    polly_text = ''.join(polly_text)
    return polly_text

def validate_flashcard_json(response: str) -> str:
    """
    Converts the response containing the flashcards into a formatted json suitable to be used by the frontend.
    
    Parameters:
        response (str): A string representing a list of flashcards. 

    Returns:
        str: A formatted json containing the flashcards.
    """
    try:
        # Try to directly parse the response as JSON
        json.loads(response)
        flashcards = process_flashcards(response)
        json.loads(flashcards)
        return flashcards
    
    except json.JSONDecodeError:
        # Handle preamble and ending scenario (when there's extra text before or after the JSON)
        
        # Find the first occurrence of '{' and the last occurrence of '}'
        try:
            json_start = response.find('[')
            json_end = response.rfind(']')
            
            if json_start != -1 and json_end != -1 and json_end > json_start:
                    # Extract the part between the first '{' and last '}'
                    cleaned_response = response[json_start:json_end+1]
                    flashcards = process_flashcards(cleaned_response)
                    json.loads(flashcards)
                    return flashcards
            else:
                raise ValueError('Response does not contain a valid set of flashcards.')
        except (TypeError, json.JSONDecodeError):
            raise ValueError('Response does not contain a valid set of flashcards.')
    except TypeError:
        raise ValueError('Response does not contain a valid set of flashcards.')
        

def process_flashcards(response):
    """
    Function to process each item in the list of flashcards.

    Parameters:
        flashcards (dict): A dictionary representing an array of flashcard with keys 'question' and 'answer'.

    Returns:
        dict: The dictionary with keys renamed to 'question' and 'answer'.
    """
    flashcards = json.loads(response)
    updated_flashcards = []
    for item in flashcards: 
        keys = list(item.keys())
        # If the first key is already "question", return the item unchanged
        if keys[0] == "question":
            return response
        updated_flashcards.append({
            "question": item[keys[0]],  # The first key is the question
            "answer": item[keys[1]]      # The second key is the answer
        })
    # Otherwise, replace the first and second keys with "question" and "value"
    return json.dumps(updated_flashcards)

def handler(event, context):
    """
    AWS Lambda function handler. Manages the process of generating flashcards from a transcription,
    storing the flashcards in S3, and returning the S3 key of the stored flashcards.

    Parameters:
    -----------
    event : dict
        The input event containing parameters and data for processing.
    context : object
        The context object providing runtime information to the handler.

    Returns:
    --------
    dict
        The HTTP response with the status code, message, and the S3 key for the generated flashcards.
    """
    logger.debug(f"Full event: {event}") # Only log full event in debug mode 
    try:
        transcription_job_name = parameter_utils.get_path_parameter(event, constants.TRANSCRIPTION_JOB_NAME_PARAMETER) 
        language = parameter_utils.get_query_string_parameter(event, constants.LANGUAGE_PARAMETER) 
        model_id = bedrock_utils.get_model_id(event) 
        identity_id = cognito_utils.get_cognito_identity_id(REGION, IDENTITY_POOL_ID, USER_POOL_ID, cognito_utils.get_authorization_token(event))
       
        transcription = s3_utils.get_transcription(transcription_job_name, MEDIA_BUCKET, identity_id)
        flashcards_key =  s3_utils.get_file_key(transcription_job_name, constants.FLASHCARDS_FOLDER_PATH, identity_id, model_id=model_id, language=language)
        flashcards, repeated_requested = s3_cache_utils.get_or_generate_bedrock_response(MEDIA_BUCKET, flashcards_key, get_flashcards, transcription, language, model_id)
        try:
            audio_key = s3_utils.get_file_key(transcription_job_name, f'{constants.FLASHCARDS_FOLDER_PATH}{constants.AUDIOS_FOLDER_PATH}', identity_id, output_format=constants.MP3, model_id=model_id, language=language)
            synthesis_result = s3_cache_utils.get_or_synthesize_speech(MEDIA_BUCKET, audio_key, format_flashcards_for_polly(flashcards), constants.MP3, language, async_processing=repeated_requested)
            if constants.SYNTHESIS_RESULT_TASK_ID in synthesis_result:
                return response_utils.send_response_speech_synthesis(flashcards, flashcards_key, synthesis_result[constants.SYNTHESIS_RESULT_TASK_ID])
            elif constants.SYNTHESIS_RESULT_AUDIO_KEY in synthesis_result:
                return response_utils.send_response_with_file_key_and_audio_key(flashcards, flashcards_key, synthesis_result[constants.SYNTHESIS_RESULT_AUDIO_KEY])
        except Exception as e:
            logger.debug(f"Polly synthesis failed: {str(e)}") # Log the exception in debug model but proceed without failing the entire function
            
        return response_utils.send_response_with_file_key(flashcards, flashcards_key)

    except Exception as e:
        return response_utils.format_exception(e)
    
    