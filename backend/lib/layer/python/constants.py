"""
Constants for file paths, parameters, and AWS configuration.

This module defines constant values used throughout the project. These constants 
are mostly folder paths for organizing files such as transcriptions, summaries, 
flashcards, and audios, as well as various parameters and AWS configuration 
keys related to media handling, language processing, and identity management.
"""

# Folder Paths
TRANSCRIPTIONS_FOLDER_PATH = 'transcriptions/'
SUMMARIES_FOLDER_PATH = 'summaries/'
FLASHCARDS_FOLDER_PATH = 'flashcards/'
ASSISTANT_FOLDER_PATH = 'assistant/'
TRANSLATIONS_FOLDER_PATH = 'translations/'
AUDIOS_FOLDER_PATH = 'audios/'
TEMPORARY_FOLDER_PATH = 'temp/'

# Parameters
TRANSCRIPTION_JOB_NAME_PARAMETER = 'transcriptionJobName'
LANGUAGE_PARAMETER = 'language'
SOURCE_LANGUAGE_PARAMETER = 'source_language'
DESTINATION_LANGUAGE_PARAMETER = 'destination_language'
RESOURCE_PATH_PARAMETER = 'resource_path'
SYNTHESIS_TASK_ID_PARAMETER = "taskId"
SYNTHESIS_RESULT_TASK_ID ='task_id'
SYNTHESIS_RESULT_AUDIO_KEY = 'audio_key'
BODY = 'body'
FILE_KEY = 'fileKey' 
QUESTION = 'question'

# Translate Parameters
LANGUAGES = 'Languages'
LANGUAGE_CODE = 'LanguageCode'
TRANSLATED_TEXT = 'TranslatedText'

# Transcribe Parameters
TRANSCRIPTION_JOB_STATUS = 'TranscriptionJobStatus'
TRANSCRIPTION_JOB = 'TranscriptionJob'

# Polly Parameters
TASK_STATUS = 'TaskStatus'
OUTPUT_URI = 'OutputUri'
SYNTHESIS_TASK = 'SynthesisTask'

# Service Response Status
COMPLETED_STATUS = "COMPLETED"
FAILED_STATUS = 'FAILED'

# Response status
OK_STATUS = "OK"
OK_CODE = 200

PROCESSING_STATUS = "PROCESSING"
PROCESSING_CODE = 102

BAD_REQUEST_STATUS = "BAD_REQUEST"
BAD_REQUEST_CODE = 400

ACCESS_DENIED_STATUS = "ACCESS_DENIED"
ACCESS_DENIED_CODE = 403

NOT_FOUND_STATUS = "NOT_FOUND"
NOT_FOUND_CODE = 404

CONFLICT_ERROR_STATUS = "CONFLICT"
CONFLICT_ERROR_CODE = 409

INTERNAL_SERVER_ERROR_STATUS = "INTERNAL_SERVER_ERROR"
INTERNAL_SERVER_ERROR_CODE = 500

UNPROCESSABLE_CONTENT_STATUS = "UNPROCESSABLE_CONTENT"
UNPROCESSABLE_CONTENT_CODE = 422

# AWS Configuration
MEDIA_BUCKET = 'MEDIA_BUCKET'
REGION = 'REGION'
IDENTITY_POOL_ID = 'IDENTITY_POOL_ID'
USER_POOL_ID = 'USER_POOL_ID'
PIPELINE_NAME = 'PIPELINE_NAME'
NUMBER_OF_FLASHCARDS = 'NUMBER_OF_FLASHCARDS'
BEDROCK_GUARDRAIL_IDENTIFIER = 'BEDROCK_GUARDRAIL_IDENTIFIER'
BEDROCK_GUARDRAIL_VERSION = 'BEDROCK_GUARDRAIL_VERSION'

# File formats
MP3 = "mp3"