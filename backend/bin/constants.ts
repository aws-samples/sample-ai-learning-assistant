/**
 * The set of constants used in the configuration of the resources in the stack deployment.
 */

// The default name for resources
export const DEFAULT_RESOURCE_NAME = 'ai-learning-assistant';

// Region for the main stack assumed from cdk configuration, can be changed to desired value
export const MAIN_STACK_REGION = 'us-west-2';

// The model id to use in the front end for this stack
export const BEDROCK_MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0";

// The description for Bedrock Guardrail
export const BEDROCK_GUARDRAIL_DESCRIPTION = 'Guardrail for safe AI responses in the education app'

// The message to be sent to the user when the Bedrock Guardrail blocks the input
export const BEDROCK_GUARDRAIL_BLOCKED_INPUT_MESSAGING = "Your input was flagged as potentially inappropriate or outside the allowed topics. Please modify your request and try again."  

// The message to be sent to the user when the Bedrock Guardrail blocks the output
export const BEDROCK_GUARDRAIL_BLOCKED_OUTPUT_MESSAGING = "For safety and compliance reasons, we couldn't generate a response for this request. If you believe this was a mistake, please try rewording your query."  

// The number of flashcards to be generated
export const NUMBER_OF_FLASHCARDS = '5';

// The name for the S3 bucket to store static content, can be changed to desired value
export const STATIC_CONTENT_S3_BUCKET_SUFFIX = '-ai-learning-assistant-static-content';

// Media content S3 bucket
export const MEDIA_BUCKET_SUFFIX = "-ai-learning-assistant-media";

// Front end S3 bucket
export const FRONT_END_S3_BUCKET_SUFFIX = "-ai-learning-assistant-frontend";

// The name for the S3 bucket to store logs
export const LOGS_S3_BUCKET_SUFFIX = '-ai-learning-assistant-s3-logs';

// The description for the cloudfront distribution used to identify it in the AWS console, can be changed to desired value
export const CLOUDFRONT_DISTRIBUTION_DESCRIPTION = 'AI Learning Assistant cloudfront distribution';

// The name for the CodeCommit Stage, can be changed to desired value
export const CODE_COMMIT_STAGE_NAME = 'Source';

// The name for the CodeBuild Action, can be changed to desired value
export const CODE_BUILD_ACTION_NAME = 'CodeBuild_Build';

// The name for the CodeBuild Stage, can be changed to desired value
export const CODE_BUILD_STAGE_NAME = 'Build';

// The name for build artifact, can be changed to desired value
export const BUILD_ARTIFACT_NAME = 'BuildOutput';

/****************************************************
 *                                                  *
 *   WARNING: DO NOT MODIFY THE CONSTANTS BELOW!    *
 *                                                  *
 *   Modifying this code may cause unexpected       *
 *   behavior and is discouraged unless necessary.  *
 *                                                  *
 ****************************************************/

// Region for deploying WAF, needs to be deployed in us-east-1
export const WAF_STACK_REGION = 'us-east-1';

// The name and port for local host. Only modify this variable if you're not using the default npm run dev configuration.
export const LOCAL_HOST = 'http://localhost:5173';

// Zip file name uploaded with the source code. Only modify this variable if you will also change the name of the file deployed with aws s3 cp command. 
export const FRONTEND_ZIP = 'frontend.zip';

// REST API Methods
export const POST = 'POST';
export const GET = 'GET';
export const PUT = 'PUT';
export const DELETE = 'DELETE';

// Transcribe Actions
export const START_TRANSCRIPTION_JOB = "transcribe:StartTranscriptionJob";
export const GET_TRANSCRIPTION_JOB = "transcribe:GetTranscriptionJob";

// S3 Actions
export const HEAD_OBJECT = "s3:HeadObject";
export const GET_OBJECT = "s3:GetObject";
export const LIST_BUCKET = "s3:ListBucket";
export const PUT_OBJECT = "s3:PutObject";
export const PUT_OBJECT_ACL = "s3:PutObjectAcl";
export const DELETE_OBJECT = "s3:DeleteObject";
export const LIST_MULTIPART_UPLOAD_PARTS = "s3:ListMultipartUploadParts";
export const ABORT_MULTIPART_UPLOAD = "s3:AbortMultipartUpload";

// Bedrock Actions
export const LIST_FOUNDATION_MODELS = "bedrock:ListFoundationModels";
export const INVOKE_MODEL = "bedrock:InvokeModel";
export const APPLY_GUARDRAIL = "bedrock:ApplyGuardrail";

// Polly Actions
export const SYNTHESIZE_SPEECH = "polly:SynthesizeSpeech";
export const DESCRIBE_VOICES = "polly:DescribeVoices";
export const START_SPEECH_SYNTHESIS_TASK = "polly:StartSpeechSynthesisTask";
export const GET_SPEECH_SYNTHESIS_TASK = "polly:GetSpeechSynthesisTask";

// Translate Actions
export const TRANSLATE_TEXT = "translate:TranslateText";
export const LIST_LANGUAGES = "translate:ListLanguages";

// WAFv2 Actions
export const WAFV2_PUT_LOGGING_CONFIGURATION = "wafv2:PutLoggingConfiguration";
export const WAFV2_DELETE_LOGGING_CONFIGURATION = "wafv2:DeleteLoggingConfiguration";

// CloudWatch Logs Actions
export const CLOUDWATCH_LOGS_CREATE_LOG_DELIVERY = "logs:CreateLogDelivery";
export const CLOUDWATCH_LOGS_DELETE_LOG_DELIVERY = "logs:DeleteLogDelivery";
export const CLOUDWATCH_LOGS_PUT_RESOURCE_POLICY = "logs:PutResourcePolicy";
export const CLOUDWATCH_LOGS_DESCRIBE_RESOURCE_POLICIES = "logs:DescribeResourcePolicies";
export const CLOUDWATCH_LOGS_DESCRIBE_LOG_GROUPS = "logs:DescribeLogGroups";




