import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway'; // This version is used for REST APIs
import { LambdaIntegration } from './lambda-integration';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as waf_v2 from 'aws-cdk-lib/aws-wafv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';

import {
  BUILD_ARTIFACT_NAME,
  GET,
  LOCAL_HOST,
  CLOUDFRONT_DISTRIBUTION_DESCRIPTION,
  DEFAULT_RESOURCE_NAME,
  STATIC_CONTENT_S3_BUCKET_SUFFIX,
  FRONT_END_S3_BUCKET_SUFFIX,
  POST,
  MEDIA_BUCKET_SUFFIX,
  START_TRANSCRIPTION_JOB,
  GET_TRANSCRIPTION_JOB,
  CODE_COMMIT_STAGE_NAME,
  CODE_BUILD_ACTION_NAME,
  CODE_BUILD_STAGE_NAME,
  BEDROCK_MODEL_ID,
  PUT_OBJECT,
  GET_OBJECT,
  PUT_OBJECT_ACL,
  LIST_BUCKET,
  INVOKE_MODEL,
  LIST_FOUNDATION_MODELS,
  LIST_MULTIPART_UPLOAD_PARTS,
  ABORT_MULTIPART_UPLOAD,
  SYNTHESIZE_SPEECH,
  DESCRIBE_VOICES,
  DELETE_OBJECT,
  TRANSLATE_TEXT,
  START_SPEECH_SYNTHESIS_TASK,
  LIST_LANGUAGES,
  GET_SPEECH_SYNTHESIS_TASK,
  FRONTEND_ZIP,
  NUMBER_OF_FLASHCARDS,
  LOGS_S3_BUCKET_SUFFIX,
  HEAD_OBJECT,
  BEDROCK_GUARDRAIL_BLOCKED_INPUT_MESSAGING,
  BEDROCK_GUARDRAIL_DESCRIPTION,
  BEDROCK_GUARDRAIL_BLOCKED_OUTPUT_MESSAGING,
  APPLY_GUARDRAIL
} from '../bin/constants';
import { CognitoAuthRole } from './cognito-auth-role';
import { CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafv2';


// Extend StackProps
interface MainStackProps extends cdk.StackProps {
  // Waf ACL Attr Arn declared in the default waf region for cloudfront
  cloudfrontWebACLAttrArn: string;
}

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MainStackProps) {
    super(scope, id, props);

    // Service log bucket
    const logsBucket = new s3.Bucket(this, 'ServiceLogsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      bucketName: `${this.account}-${this.region}` + LOGS_S3_BUCKET_SUFFIX,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      lifecycleRules: [
        {
          id: 'TransitionToIA',  // Move logs to IA after 30 days
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
        {
          id: 'TransitionToGlacier',  // Move logs to Glacier after 90 days
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(60),
            },
          ],
        },
        {
          id: 'DeleteAfter365Days',
          enabled: true,
          expiration: cdk.Duration.days(365),  // Delete logs after 365 days
        },
      ],
    });

    // Additional security best practice to enforce HTTPS access for logsBucket
    logsBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:*'],
      resources: [logsBucket.bucketArn, `${logsBucket.bucketArn}/*`],
      conditions: {
        Bool: { 'aws:SecureTransport': 'false' },
      },
    }));

    // S3 bucket to serve static content (frontend)
    const staticContentS3BucketName = `${this.account}-${this.region}` + STATIC_CONTENT_S3_BUCKET_SUFFIX;
    const staticContentS3Bucket = new s3.Bucket(this, 'staticContentS3Bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      bucketName: staticContentS3BucketName,
      enforceSSL: true,
      serverAccessLogsBucket: logsBucket, // Enable server access logging
      serverAccessLogsPrefix: `${staticContentS3BucketName}/access-logs/`, // Set prefix for logs
    })

    /// Permission to write logs
    logsBucket.addToResourcePolicy(new iam.PolicyStatement({
      principals: [new iam.ServicePrincipal('logging.s3.amazonaws.com')],
      actions: [PUT_OBJECT],
      resources: [
        `${logsBucket.bucketArn}/${staticContentS3BucketName}/access-logs/*`,
      ],
      conditions: {
        'ArnLike': {
          'aws:SourceArn': staticContentS3Bucket.bucketArn,
        },
        'StringEquals': {
          'aws:SourceAccount': cdk.Stack.of(this).account,
          's3:x-amz-acl': 'bucket-owner-full-control',
        },
      },
    }));

    // CloudFront distribution to serve static content
    /// Cloudfront error response pages
    const errorResponse404: cloudfront.ErrorResponse = {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
      ttl: cdk.Duration.seconds(10),
    };

    /// CloudFront distribution
    const cloudfrontDistribution = new cloudfront.Distribution(this, 'cloudfrontDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(staticContentS3Bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        // Implement caching strategies
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        // Enable compression
        compress: true,
      },
      webAclId: props.cloudfrontWebACLAttrArn,
      defaultRootObject: 'index.html',
      errorResponses: [errorResponse404],
      comment: CLOUDFRONT_DISTRIBUTION_DESCRIPTION,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021, // Enforce TLS 1.2
      enableLogging: true,
      logBucket: logsBucket,
      // WARNING: 
      // Logging cookies in CloudFront can expose sensitive user information, 
      // which may lead to privacy risks and compliance issues (e.g., GDPR, CCPA). 
      // **DO NOT LOG COOKIES WITHOUT IMPLEMENTING ADEQUATE SECURITY CONTROLS**
      // logIncludesCookies: true, 
      logFilePrefix: 'cloudfront/access-logs/',
    });

    /// Cloudfront permission to write logs
    logsBucket.addToResourcePolicy(new iam.PolicyStatement({
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      actions: [PUT_OBJECT],
      resources: [
        `${logsBucket.bucketArn}/cloudfront/access-logs/*`,
      ],
      conditions: {
        'ArnLike': {
          'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${cloudfrontDistribution.distributionId}`,
        },
        'StringEquals': {
          'aws:SourceAccount': cdk.Stack.of(this).account,
          's3:x-amz-acl': 'bucket-owner-full-control',
        },
      },
    }));

    // S3 bucket to store videos, transcriptions, etc
    const mediaS3BucketName = `${this.account}-${this.region}` + MEDIA_BUCKET_SUFFIX;
    const mediaS3Bucket = new s3.Bucket(this, 'mediaS3Bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      bucketName: mediaS3BucketName,
      cors: [{
        allowedHeaders: ['*'],
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE],
        allowedOrigins: [`https://${cloudfrontDistribution.distributionDomainName}`, LOCAL_HOST],
        exposedHeaders: ["ETag"],
        maxAge: 3000,
      }],
      enforceSSL: true,
      serverAccessLogsBucket: logsBucket, // Enable server access logging
      serverAccessLogsPrefix: `${mediaS3BucketName}/access-logs/`, // Set prefix for logs
      lifecycleRules: [
        // Transition to Infrequent Access after 30 days, files can be transitioned as after closing the tab users can't interact with them
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            }
          ],
        },
        {
          id: 'TransitionToGlacier',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(60),
            },
          ],
        },
        // Enable this rule to delete files after X number of days
        /** {
          id: 'DeleteAfter365Days',
          enabled: true,
          expiration: cdk.Duration.days(365), // Delete after 365 days
        }, **/
      ],
    });

    /// Permission to write logs
    logsBucket.addToResourcePolicy(new iam.PolicyStatement({
      principals: [new iam.ServicePrincipal('logging.s3.amazonaws.com')],
      actions: [PUT_OBJECT],
      resources: [
        `${logsBucket.bucketArn}/${mediaS3BucketName}/access-logs/*`,
      ],
      conditions: {
        'ArnLike': {
          'aws:SourceArn': mediaS3Bucket.bucketArn,
        },
        'StringEquals': {
          'aws:SourceAccount': cdk.Stack.of(this).account,
          's3:x-amz-acl': 'bucket-owner-full-control',
        },
      },
    }));

    // Alarm when storage is over 50GB
    const storageMetric = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: 'BucketSizeBytes',
      dimensionsMap: {
        BucketName: mediaS3Bucket.bucketName,
      },
      statistic: 'Average',
      period: cdk.Duration.days(1),
    });
    new cloudwatch.Alarm(this, 'StorageUsageAlarm', {
      metric: storageMetric,
      threshold: 50 * 1024 * 1024 * 1024, // 50 GB limit
      evaluationPeriods: 1,
      alarmDescription: 'Alert when S3 bucket size exceeds 50 GB',
    });

    // Cognito
    /// User Pool
    const userPool = new cognito.UserPool(this, 'userPool', {
      userPoolName: DEFAULT_RESOURCE_NAME,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        }
      },
      autoVerify: {
        email: true
      },
      passwordPolicy: {
        minLength: 8, // Minimum password length
        requireUppercase: true, // Require at least one uppercase letter
        requireLowercase: true, // Require at least one lowercase letter
        requireDigits: true, // Require at least one digit
        requireSymbols: true, // Require at least one special character
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      mfa: cognito.Mfa.OPTIONAL,
    });

    /// Custom domain name for cognito
    const userPoolDomain = userPool.addDomain('hostedDomain', {
      cognitoDomain: {
        domainPrefix: `${this.account}-${this.region}-` + DEFAULT_RESOURCE_NAME,
      }
    });

    // User pool client
    const userPoolClient = userPool.addClient('userPoolClient', {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,

        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.PHONE, cognito.OAuthScope.PROFILE, cognito.OAuthScope.OPENID, cognito.OAuthScope.COGNITO_ADMIN],
        callbackUrls: [`https://${cloudfrontDistribution.distributionDomainName}/`, LOCAL_HOST],
        logoutUrls: [`https://${cloudfrontDistribution.distributionDomainName}/`, LOCAL_HOST]
      },
      authFlows: {
        userPassword: true,
        userSrp: true
      },
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
      preventUserExistenceErrors: true,
      enableTokenRevocation: true,
      refreshTokenValidity: Duration.days(30),
      accessTokenValidity: Duration.minutes(7),
      idTokenValidity: Duration.minutes(7),
    });

    // Identity pool 
    const identityPool = new cognito.CfnIdentityPool(this, "identityPool", {
      allowUnauthenticatedIdentities: false, // Don't allow unauthenticated users
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    // Failed Login Attempts Alarm
    const failedLoginAttemptsMetric = new cloudwatch.Metric({
      namespace: 'AWS/Cognito',
      metricName: 'FailedAuthentication',
      dimensionsMap: {
        UserPool: userPool.userPoolId,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, 'FailedLoginAttemptsAlarm', {
      metric: failedLoginAttemptsMetric,
      threshold: 50, // Adjust based on expected traffic
      evaluationPeriods: 1,
      alarmDescription: 'Alert when failed authentication attempts exceed 50 in 5 minutes',
    });

    /// Cognito Auth Role
    new CognitoAuthRole(this, 'cognitoAuthRole', {
      identityPool: identityPool,
      resources: [
        mediaS3Bucket.bucketArn, // S3 Bucket
        `${mediaS3Bucket.bucketArn}/\${cognito-identity.amazonaws.com:sub}/*`], // S3 Objects
      actions: [
        [ // S3 Bucket Actions
          LIST_BUCKET
        ],
        [ // S3 Object Actions
          HEAD_OBJECT,
          GET_OBJECT,
          PUT_OBJECT,
          PUT_OBJECT_ACL,
          LIST_MULTIPART_UPLOAD_PARTS,
          ABORT_MULTIPART_UPLOAD,
        ]
      ],
      conditions: [
        { // Conditions for the S3 Bucket
          StringLike: {
            "s3:prefix": [
              "${cognito-identity.amazonaws.com:sub}/*"
            ]
          },
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "s3:x-amz-acl": "private"
          },
          Bool: {
            "aws:SecureTransport": "true" // Enforce HTTPS
          }
        },
        { // Conditions for the S3 Objects
          StringEquals: {
            "aws:RequestedRegion": this.region,
          },
          Bool: {
            "aws:SecureTransport": "true" // Enforce HTTPS
          },
        },
      ],
    });

    // API

    // CloudWatch Log Group for API access logging
    const apiLogGroup = new logs.LogGroup(this, 'ApiAccessLogs', {
      logGroupName: `aws-api-logs-${DEFAULT_RESOURCE_NAME}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // API definition
    const api = new apigateway.RestApi(this, `api`, {
      restApiName: DEFAULT_RESOURCE_NAME,
      deployOptions: {
        throttlingRateLimit: 500,
        throttlingBurstLimit: 1000,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        dataTraceEnabled: false,
        accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true
        }),
        tracingEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'Access-Control-Allow-Credentials',
          'Access-Control-Allow-Headers',
          'Impersonating-User-Sub'
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: [`https://${cloudfrontDistribution.distributionDomainName}`, LOCAL_HOST]
      },
      cloudWatchRole: true,
    });

    /// Web ACL from Waf to associate to Api Gateway
    const apiGatewayWebACL = new waf_v2.CfnWebACL(this, 'apiGatewayWebACL', {
      defaultAction: {
        allow: {}
      },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'apiGatewayWebACL',
        sampledRequestsEnabled: true
      }
    });

    /// Associate web acl to Api Gateway
    new CfnWebACLAssociation(this, 'ApiWebACLAssociation', {
      resourceArn: api.deploymentStage.stageArn,
      webAclArn: apiGatewayWebACL.attrArn
    });

    /// API Gateway Authorizer
    const apiAuthorizer = new apigateway.CfnAuthorizer(this, "apiAuthorizer", {
      restApiId: api.restApiId,
      type: 'COGNITO_USER_POOLS',
      name: DEFAULT_RESOURCE_NAME,
      providerArns: [userPool.userPoolArn],
      identitySource: 'method.request.header.Authorization',
    });

    /// Lambda Layer
    const utilsLayer = new lambda.LayerVersion(this, 'UtilsLayer', {
      layerVersionName: `${this.stackName}UtilsLayer`,
      code: lambda.Code.fromAsset('lib/layer/'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
      description: 'Common methods for Lambda functions.',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    // Guardrail for bedrock
    const bedrock_guardrail = new bedrock.CfnGuardrail(this, 'BedrockGuardrail', {
      name: DEFAULT_RESOURCE_NAME,
      description: BEDROCK_GUARDRAIL_DESCRIPTION,
      blockedInputMessaging: BEDROCK_GUARDRAIL_BLOCKED_INPUT_MESSAGING,
      blockedOutputsMessaging: BEDROCK_GUARDRAIL_BLOCKED_OUTPUT_MESSAGING,
      contentPolicyConfig: {
        filtersConfig: [{
          inputStrength: 'HIGH',
          outputStrength: 'HIGH',
          type: 'SEXUAL'
        },
        {
          inputStrength: 'HIGH',
          outputStrength: 'HIGH',
          type: 'VIOLENCE'
        },
        {
          inputStrength: 'HIGH',
          outputStrength: 'HIGH',
          type: 'HATE'
        },
        {
          inputStrength: 'HIGH',
          outputStrength: 'HIGH',
          type: 'INSULTS'
        },
        {
          inputStrength: 'HIGH',
          outputStrength: 'HIGH',
          type: 'MISCONDUCT'
        },
        {
          inputStrength: 'NONE',
          outputStrength: 'NONE',
          type: 'PROMPT_ATTACK'
        }],
      }
    });

    const bedrock_guardrail_version = new bedrock.CfnGuardrailVersion(this, 'BedrockGuardrailVersion', {
      guardrailIdentifier: bedrock_guardrail.attrGuardrailId
    });

    // Transcriptions Resource
    const transcriptionsResource = api.root.addResource("transcriptions");

    /// Start Transcription Lambda
    new LambdaIntegration(this, 'startTranscription', {
      functionName: "start-transcription",
      environment: {
        'MEDIA_BUCKET': mediaS3Bucket.bucketName,
        'REGION': this.region,
        'IDENTITY_POOL_ID': identityPool.ref,
        'USER_POOL_ID': userPool.userPoolId
      },
      resources: [
        `arn:aws:transcribe:${this.region}:${this.account}:transcription-job/*`, // Amazon Transcribe - StartTranscriptionJob
        mediaS3Bucket.bucketArn,
        `${mediaS3Bucket.bucketArn}/*`
      ],
      actions: [
        [ // Transcribe Actions
          START_TRANSCRIPTION_JOB,
        ],
        [ // S3 Bucket Actions
          LIST_BUCKET
        ],
        [ // S3 Object Actions
          HEAD_OBJECT,
          GET_OBJECT,
          PUT_OBJECT,
          PUT_OBJECT_ACL,
        ]
      ],
      conditions: [
        { // Conditions for Amazon Transcribe
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "aws:PrincipalAccount": this.account
          },
          StringLike: {
            "transcribe:OutputBucketName": mediaS3BucketName,
          }
        },
        { // Conditions for S3 bucket
          StringEquals: {
            "aws:RequestedRegion": this.region,
          }
        },
        { // Conditions for S3 Objects
          StringEquals: {
            "aws:RequestedRegion": this.region,
          }
        },
      ],
      apiResource: transcriptionsResource,
      method: POST,
      authorizer: apiAuthorizer,
      layers: [utilsLayer]
    });

    const transcriptionsWithNameResource = transcriptionsResource.addResource('{transcriptionJobName}');

    ///// Check Transcription Lambda
    new LambdaIntegration(this, 'checkTranscription', {
      functionName: "check-transcription",
      environment: {
        'MEDIA_BUCKET': mediaS3Bucket.bucketName,
        'REGION': this.region,
        'IDENTITY_POOL_ID': identityPool.ref,
        'USER_POOL_ID': userPool.userPoolId,
      },
      resources: [
        `arn:aws:transcribe:${this.region}:${this.account}:transcription-job/*`, // Amazon Transcribe - GetTranscriptionJob
        "*", // Amazon Polly 
        mediaS3Bucket.bucketArn, // S3 Bucket
        `${mediaS3Bucket.bucketArn}/*` // S3 Objects
      ],
      actions: [
        [ // Transcribe Actions
          GET_TRANSCRIPTION_JOB,
        ],
        [ // Polly Actions
          DESCRIBE_VOICES,
          SYNTHESIZE_SPEECH,
          START_SPEECH_SYNTHESIS_TASK
        ],
        [ // S3 Bucket Actions
          LIST_BUCKET
        ],
        [ // S3 Object Actions
          HEAD_OBJECT,
          GET_OBJECT,
          PUT_OBJECT,
          PUT_OBJECT_ACL,
          DELETE_OBJECT
        ]
      ],
      conditions: [
        { // Conditions for Amazon Transcribe
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "aws:PrincipalAccount": this.account
          }
        },
        { // Conditions for Amazon Polly
          StringEquals: {
            "aws:RequestedRegion": this.region,
          }
        },
        { // Conditions for S3 bucket
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "s3:ResourceAccount": this.account,
          },
          Bool: {
            "aws:SecureTransport": "true"
          }
        },
        { // Conditions for S3 objects
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "s3:ResourceAccount": this.account,
          },
          Bool: {
            "aws:SecureTransport": "true"
          }
        }
      ],
      apiResource: transcriptionsWithNameResource,
      method: GET,
      authorizer: apiAuthorizer,
      layers: [utilsLayer]
    });

    //// Summaries Resource
    const summariesResource = api.root.addResource("summaries");

    const summariesWithNameResource = summariesResource.addResource('{transcriptionJobName}');

    ///// Get Summary Lambda
    new LambdaIntegration(this, 'getSummary', {
      functionName: "get-summary",
      environment: {
        'MEDIA_BUCKET': mediaS3Bucket.bucketName,
        'REGION': this.region,
        'IDENTITY_POOL_ID': identityPool.ref,
        'USER_POOL_ID': userPool.userPoolId,
        'BEDROCK_GUARDRAIL_IDENTIFIER': bedrock_guardrail.attrGuardrailId,
        'BEDROCK_GUARDRAIL_VERSION': bedrock_guardrail_version.attrVersion,
      },
      resources: [
        "*", // Amazon Bedrock - ListFoundationModels
        `arn:aws:bedrock:${this.region}::foundation-model/*`, // Amazon Bedrock - InvokeModel
        `arn:aws:bedrock:${this.region}:${this.account}:guardrail/${bedrock_guardrail.attrGuardrailId}`, // Amazon Bedrock - Apply guardrail
        "*", // Amazon Polly 
        mediaS3Bucket.bucketArn, // S3 Bucket
        `${mediaS3Bucket.bucketArn}/*` // S3 Objects
      ],
      actions: [
        [ // Bedrock Actions
          LIST_FOUNDATION_MODELS,
        ],
        [ // Bedrock Model Actions
          INVOKE_MODEL,
        ],
        [ // Bedrock Guardrail Actions
          APPLY_GUARDRAIL,
        ],
        [ // Polly Actions
          DESCRIBE_VOICES,
          SYNTHESIZE_SPEECH,
          START_SPEECH_SYNTHESIS_TASK
        ],
        [ // S3 Bucket Actions
          LIST_BUCKET
        ],
        [ // S3 Object Actions
          HEAD_OBJECT,
          GET_OBJECT,
          PUT_OBJECT,
          PUT_OBJECT_ACL,
        ]
      ],
      conditions: [
        { // Conditions for Amazon Bedrock
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "aws:PrincipalAccount": this.account
          }
        },
        { // Conditions for Amazon Bedrock Models
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "aws:PrincipalAccount": this.account
          }
        },
        { // Conditions for Bedrock Guardrails
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "aws:PrincipalAccount": this.account
          }
        },
        { // Conditions for Amazon Polly
          StringEquals: {
            "aws:RequestedRegion": this.region,
          }
        },
        { // Conditions for S3 bucket
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "s3:ResourceAccount": this.account,
          },
          Bool: {
            "aws:SecureTransport": "true"
          }
        },
        { // Conditions for S3 objects
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "s3:ResourceAccount": this.account,
          },
          Bool: {
            "aws:SecureTransport": "true"
          }
        }
      ],
      apiResource: summariesWithNameResource,
      method: GET,
      authorizer: apiAuthorizer,
      layers: [utilsLayer]
    });

    //// Flashcards Resource
    const flashcardsResource = api.root.addResource("flashcards");

    const flashcardsWithNameResource = flashcardsResource.addResource('{transcriptionJobName}');

    ///// Get Flashcards Lambda
    new LambdaIntegration(this, 'getFlashcards', {
      functionName: "get-flashcards",
      environment: {
        'MEDIA_BUCKET': mediaS3Bucket.bucketName,
        'REGION': this.region,
        'IDENTITY_POOL_ID': identityPool.ref,
        'USER_POOL_ID': userPool.userPoolId,
        'NUMBER_OF_FLASHCARDS': NUMBER_OF_FLASHCARDS,
        'BEDROCK_GUARDRAIL_IDENTIFIER': bedrock_guardrail.attrGuardrailId,
        'BEDROCK_GUARDRAIL_VERSION': bedrock_guardrail_version.attrVersion,
      },
      resources: [
        "*", // Amazon Bedrock - ListFoundationModels
        `arn:aws:bedrock:${this.region}::foundation-model/*`, // Amazon Bedrock - InvokeModel
        `arn:aws:bedrock:${this.region}:${this.account}:guardrail/${bedrock_guardrail.attrGuardrailId}`, // Amazon Bedrock - Apply guardrail
        "*", // Amazon Polly 
        mediaS3Bucket.bucketArn, // S3 Bucket
        `${mediaS3Bucket.bucketArn}/*` // S3 Objects
      ],
      actions: [
        [ // Bedrock Actions
          LIST_FOUNDATION_MODELS,
        ],
        [ // Bedrock Model Actions
          INVOKE_MODEL
        ],
        [ // Bedrock Guardrail Actions
          APPLY_GUARDRAIL,
        ],
        [ // Polly Actions
          DESCRIBE_VOICES,
          SYNTHESIZE_SPEECH,
          START_SPEECH_SYNTHESIS_TASK
        ],
        [ // S3 Bucket Actions
          LIST_BUCKET
        ],
        [ // S3 Object Actions
          HEAD_OBJECT,
          GET_OBJECT,
          PUT_OBJECT,
          PUT_OBJECT_ACL,
        ]
      ],
      conditions: [
        { // Conditions for Amazon Bedrock
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "aws:PrincipalAccount": this.account
          }
        },
        { // Conditions for Amazon Bedrock Models
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "aws:PrincipalAccount": this.account
          }
        },
        { // Conditions for Bedrock Guardrails
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "aws:PrincipalAccount": this.account
          }
        },
        { // Conditions for Amazon Polly
          StringEquals: {
            "aws:RequestedRegion": this.region,
          }
        },
        { // Conditions for S3 bucket
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "s3:ResourceAccount": this.account,
          },
          Bool: {
            "aws:SecureTransport": "true"
          }
        },
        { // Conditions for S3 objects
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "s3:ResourceAccount": this.account,
          },
          Bool: {
            "aws:SecureTransport": "true"
          }
        }
      ],
      apiResource: flashcardsWithNameResource,
      method: GET,
      authorizer: apiAuthorizer,
      layers: [utilsLayer]
    });

    //// Assistant Resource
    const assistantResource = api.root.addResource("assistant");

    const assistantWithNameResource = assistantResource.addResource('{transcriptionJobName}');

    ///// Ask Assistant Lambda
    new LambdaIntegration(this, 'askAssistant', {
      functionName: "ask-assistant",
      environment: {
        'MEDIA_BUCKET': mediaS3Bucket.bucketName,
        'REGION': this.region,
        'IDENTITY_POOL_ID': identityPool.ref,
        'USER_POOL_ID': userPool.userPoolId,
        'BEDROCK_GUARDRAIL_IDENTIFIER': bedrock_guardrail.attrGuardrailId,
        'BEDROCK_GUARDRAIL_VERSION': bedrock_guardrail_version.attrVersion,
      },
      resources: [
        "*", // Amazon Bedrock - ListFoundationModels
        `arn:aws:bedrock:${this.region}::foundation-model/*`, // Amazon Bedrock - InvokeModel
        `arn:aws:bedrock:${this.region}:${this.account}:guardrail/${bedrock_guardrail.attrGuardrailId}`, // Amazon Bedrock - Apply guardrail
        "*", // Amazon Polly 
        mediaS3Bucket.bucketArn, // S3 Bucket
        `${mediaS3Bucket.bucketArn}/*` // S3 Objects
      ],
      actions: [
        [ // Bedrock Actions
          LIST_FOUNDATION_MODELS,
        ],
        [ // Bedrock Model Actions
          INVOKE_MODEL
        ],
        [ // Bedrock Guardrail Actions
          APPLY_GUARDRAIL,
        ],
        [ // Polly Actions
          DESCRIBE_VOICES,
          SYNTHESIZE_SPEECH,
          START_SPEECH_SYNTHESIS_TASK
        ],
        [ // S3 Bucket Actions
          LIST_BUCKET
        ],
        [ // S3 Object Actions
          HEAD_OBJECT,
          GET_OBJECT,
          PUT_OBJECT,
          PUT_OBJECT_ACL,
        ]
      ],
      conditions: [
        { // Conditions for Amazon Bedrock
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "aws:PrincipalAccount": this.account
          }
        },
        { // Conditions for Amazon Bedrock Models
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "aws:PrincipalAccount": this.account
          }
        },
        { // Conditions for Bedrock Guardrails
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "aws:PrincipalAccount": this.account
          }
        },
        { // Conditions for Amazon Polly
          StringEquals: {
            "aws:RequestedRegion": this.region,
          }
        },
        { // Conditions for S3 bucket
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "s3:ResourceAccount": this.account,
          },
          Bool: {
            "aws:SecureTransport": "true"
          }
        },
        { // Conditions for S3 objects
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "s3:ResourceAccount": this.account,
          },
          Bool: {
            "aws:SecureTransport": "true"
          }
        }
      ],
      apiResource: assistantWithNameResource,
      method: POST,
      authorizer: apiAuthorizer,
      layers: [utilsLayer]
    });

    //// Translations Resource
    const translationsResource = api.root.addResource("translations");

    const translationsWithNameResource = translationsResource.addResource('{transcriptionJobName}');

    ///// Get Translation Lambda
    new LambdaIntegration(this, 'getTranslation', {
      functionName: "get-translation",
      environment: {
        'MEDIA_BUCKET': mediaS3Bucket.bucketName,
        'REGION': this.region,
        'IDENTITY_POOL_ID': identityPool.ref,
        'USER_POOL_ID': userPool.userPoolId,
      },
      resources: [
        "*", // Amazon Polly 
        "*", // Amazon Translate 
        mediaS3Bucket.bucketArn, // S3 Bucket
        `${mediaS3Bucket.bucketArn}/*` // S3 Objects
      ],
      actions: [
        [ // Polly Actions
          DESCRIBE_VOICES,
          SYNTHESIZE_SPEECH,
          START_SPEECH_SYNTHESIS_TASK
        ],
        [ // Translate 
          LIST_LANGUAGES,
          TRANSLATE_TEXT
        ],
        [ // S3 Bucket Actions
          LIST_BUCKET
        ],
        [ // S3 Object Actions
          HEAD_OBJECT,
          GET_OBJECT,
          PUT_OBJECT,
          PUT_OBJECT_ACL,
        ]
      ],
      conditions: [
        { // Conditions for Amazon Polly
          StringEquals: {
            "aws:RequestedRegion": this.region,
          }
        },
        { // Conditions for Amazon Translate 
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "aws:PrincipalAccount": this.account
          }
        },
        { // Conditions for S3 bucket
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "s3:ResourceAccount": this.account,
          },
          Bool: {
            "aws:SecureTransport": "true"
          }
        },
        { // Conditions for S3 objects
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "s3:ResourceAccount": this.account,
          },
          Bool: {
            "aws:SecureTransport": "true"
          }
        }
      ],
      apiResource: translationsWithNameResource,
      method: GET,
      authorizer: apiAuthorizer,
      layers: [utilsLayer]
    });

    //// Audios Resource
    const audiosResource = api.root.addResource("audios");

    const audiosWithTaskIdResource = audiosResource.addResource('{taskId}');

    ///// Check Audio Lambda
    new LambdaIntegration(this, 'checkAudio', {
      functionName: "check-audio",
      environment: {
        'REGION': this.region,
      },
      resources: [
        "*", // Amazon Polly 
      ],
      actions: [
        [ // Polly Actions
          GET_SPEECH_SYNTHESIS_TASK
        ]
      ],
      conditions: [
        { // Conditions for Amazon Polly
          StringEquals: {
            "aws:RequestedRegion": this.region,
          }
        }
      ],
      apiResource: audiosWithTaskIdResource,
      method: GET,
      authorizer: apiAuthorizer,
      layers: [utilsLayer]
    });

    //// Models Resource
    const modelsResource = api.root.addResource("models");

    ///// Get Models Lambda
    new LambdaIntegration(this, 'getModels', {
      functionName: "get-models",
      environment: {
        'REGION': this.region,
      },
      resources: [
        "*", // ListFoundationModels
      ],
      actions: [
        [ // Bedrock Actions
          LIST_FOUNDATION_MODELS,
        ]
      ],
      conditions: [
        { // Conditions for Amazon Bedrock
          StringEquals: {
            "aws:RequestedRegion": this.region,
            "aws:PrincipalAccount": this.account
          }
        }
      ],
      apiResource: modelsResource,
      method: GET,
      authorizer: apiAuthorizer,
      layers: [utilsLayer]
    });

    // S3 bucket to upload the frontend
    const frontEndS3BucketName = `${this.account}-${this.region}` + FRONT_END_S3_BUCKET_SUFFIX;
    const frontEndS3Bucket = new s3.Bucket(this, 'frontEndS3Bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: frontEndS3BucketName,
      versioned: true,
      autoDeleteObjects: true,
      eventBridgeEnabled: true,
      enforceSSL: true,
      serverAccessLogsBucket: logsBucket, // Enable server access logging
      serverAccessLogsPrefix: `${frontEndS3BucketName}/access-logs/`, // Set prefix for logs
    })

    /// Permission to write logs
    logsBucket.addToResourcePolicy(new iam.PolicyStatement({
      principals: [new iam.ServicePrincipal('logging.s3.amazonaws.com')],
      actions: [PUT_OBJECT],
      resources: [
        `${logsBucket.bucketArn}/${frontEndS3BucketName}/access-logs/*`,
      ],
      conditions: {
        'ArnLike': {
          'aws:SourceArn': frontEndS3Bucket.bucketArn,
        },
        'StringEquals': {
          'aws:SourceAccount': cdk.Stack.of(this).account,
          's3:x-amz-acl': 'bucket-owner-full-control',
        },
      },
    }));

    // Create a Trail
    const frontEndTrail = new cloudtrail.Trail(this, 'frontEndCodeTrail', {
      isMultiRegionTrail: false
    });

    // Enable Data Events for the Frontend S3 Bucket
    frontEndTrail.addS3EventSelector(
      [{ bucket: frontEndS3Bucket, objectPrefix: FRONTEND_ZIP }],
      {
        includeManagementEvents: false,
        readWriteType: cloudtrail.ReadWriteType.WRITE_ONLY
      }
    );

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'pipeline', {
      pipelineName: DEFAULT_RESOURCE_NAME,
      crossAccountKeys: false,
      pipelineType: codepipeline.PipelineType.V2
    });

    /// CodeCommit Source Action
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.S3SourceAction({
      actionName: 'S3Source',
      bucketKey: FRONTEND_ZIP,
      bucket: frontEndS3Bucket,
      output: sourceOutput,
      trigger: codepipeline_actions.S3Trigger.EVENTS,
    });

    /// Associate CodeCommit Source Stage
    pipeline.addStage({
      stageName: CODE_COMMIT_STAGE_NAME,
      actions: [sourceAction],
    });

    /// CodeBuild specification
    const build_spec = {
      version: '0.2',
      phases: {
        install: {
          "runtime-versions": {
            nodejs: 20,
          }
        },
        pre_build: {
          commands: [
            'echo Installing NPM dependencies...',
            'npm install'
          ]
        },
        build: {
          commands: [
            'echo VITE_ENV=${ENV} >> .env',
            `echo VITE_REGION=${this.region} >> .env`,
            `echo VITE_API_NAME=${api.restApiName} >> .env`,
            `echo VITE_API_URL=${api.url} >> .env`,
            `echo VITE_MEDIA_BUCKET=${mediaS3Bucket.bucketName} >> .env`,
            `echo VITE_USER_POOL_ID=${userPool.userPoolId} >> .env`,
            `echo VITE_USER_POOL_CLIENT_ID=${userPoolClient.userPoolClientId} >> .env`,
            `echo VITE_USER_POOL_DOMAIN_NAME=${userPoolDomain.domainName} >> .env`,
            `echo VITE_IDENTITY_POOL_ID=${identityPool.ref} >> .env`,
            `echo VITE_BEDROCK_MODEL_ID=${BEDROCK_MODEL_ID} >> .env`,
            `echo VITE_S3_BUCKET_NAME=${mediaS3Bucket.bucketName} >> .env`,

            'ln -fs /usr/local/bin/pip3.12 /usr/bin/pip3',
            'ln -fs /usr/local/bin/python3.12 /usr/bin/python3',
            'pip3 install --user pipenv',
            'npm run build',
            `echo $CODEBUILD_SRC_DIR`,
          ]
        },
        post_build: {
          commands: [
            'echo Build completed on `date`',
            `aws s3 cp --recursive ./dist s3://${staticContentS3Bucket.bucketName}/`
          ]
        }
      },
    };

    // Create a new KMS Key
    const buildKey = new kms.Key(this, 'buildKey', {
      enableKeyRotation: true
    });

    /// CodeBuild Project
    const buildProject = new codebuild.PipelineProject(this, 'buildProject', {
      buildSpec: codebuild.BuildSpec.fromObjectToYaml(build_spec),
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5
      },
      encryptionKey: buildKey, // Use KMS key for encryption
      // encryptionKey: for Artifacts the AWS-managed CMK for Amazon Simple Storage Service (Amazon S3) is used. - didn't find a way to turn it off
    });

    /// CodeBuild Action
    const buildOutput = new codepipeline.Artifact(BUILD_ARTIFACT_NAME);
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: CODE_BUILD_ACTION_NAME,
      project: buildProject,
      input: sourceOutput,
      type: codepipeline_actions.CodeBuildActionType.BUILD,
      outputs: [buildOutput], // Use default output artifact
    });

    /// Associate CodeBuild Stage
    pipeline.addStage({
      stageName: CODE_BUILD_STAGE_NAME,
      actions: [buildAction],
    });

    /// Add permissions to the CodeBuild so it can write the static bucket files
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [PUT_OBJECT, PUT_OBJECT_ACL],
      resources: [staticContentS3Bucket.bucketArn + '/*'],
    }));

    // Outputs
    new cdk.CfnOutput(this, 'frontEndS3BucketName', {
      value: frontEndS3Bucket.bucketName,
    });
    new cdk.CfnOutput(this, 'region', {
      value: this.region,
    });
    new cdk.CfnOutput(this, 'apiName', {
      value: api.restApiName,
    });
    new cdk.CfnOutput(this, 'apiURL', {
      value: api.url,
    });
    new cdk.CfnOutput(this, 'userPoolId', {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'userPoolDomainName', {
      value: userPoolDomain.domainName + ".auth." + this.region + ".amazoncognito.com",
    });
    new cdk.CfnOutput(this, 'cloudfrontDomainUrl', {
      value: "https://" + cloudfrontDistribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, 'bedrockModelId', {
      value: BEDROCK_MODEL_ID,
    });
    new cdk.CfnOutput(this, 'mediaS3BucketName', {
      value: mediaS3Bucket.bucketName,
    });
    new cdk.CfnOutput(this, 'identityPoolId', {
      value: identityPool.ref,
    });
  }
}