import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import * as apigateway from 'aws-cdk-lib/aws-apigateway'; // scope version is used for REST APIs
import { Construct } from 'constructs';
import { ILayerVersion } from "aws-cdk-lib/aws-lambda";
import { DEFAULT_RESOURCE_NAME } from '../bin/constants';

// Extend LambdaIntegrationProps to send lambda creation parameters
interface LambdaIntegrationProps {
  functionName: string;
  resources?: string[];
  actions?: string[][];
  conditions?: { [key: string]: any }[];  
  apiResource?: cdk.aws_apigateway.Resource;
  method?: string;
  authorizer?: cdk.aws_apigateway.CfnAuthorizer;
  environment?: { [key: string]: string };
  layers?: ILayerVersion[];
  lambdaTimeout?: number;
}

export class LambdaIntegration extends Construct {
  
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaIntegrationProps) {
    super(scope, id);

    // Create Lambda role
    const lambdaRole = new iam.Role(this, `${id}Role`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    // Create Lambda function
    this.lambdaFunction = new lambda.Function(this, `${id}Lambda`, {
      runtime: lambda.Runtime.PYTHON_3_12,
      functionName: props.functionName + '-' + DEFAULT_RESOURCE_NAME,
      handler: 'lambda-handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, `/lambda_functions/${sanitizeFunctionName(props.functionName)}/`), {
        bundling: {
          image: lambda.Runtime.PYTHON_3_12.bundlingImage,
          command: [
            'bash', '-c',
            'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output'
          ],
        },
      }),
      environment: props.environment ? props.environment : {},
      role: lambdaRole,
      timeout: props.lambdaTimeout ? cdk.Duration.seconds(props.lambdaTimeout) : cdk.Duration.seconds(29), // same as api gateway
      layers: props.layers
    });

    // Create Lambda policies
    const lambdaPolicy = new iam.ManagedPolicy(this, `${id}LambdaPolicy`, {
      statements: [
        new iam.PolicyStatement({
          actions: [
            "logs:CreateLogGroup"
          ],
          resources: [this.lambdaFunction.logGroup.logGroupArn]
        }),
        new iam.PolicyStatement({
          actions: [
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          resources: [`arn:aws:logs:${cdk.Stack.of(scope).region}:${cdk.Stack.of(scope).account}:log-group:${this.lambdaFunction.logGroup.logGroupName}:log-stream:*`]
        })
      ],
      description: `scope policy allows IAM actions to log actions.`
    });


    // Add all the policy statements defines in props 
    if (props.resources && props.actions) {
      for (let i = 0; i < props.resources.length; i++) {
        const resource = props.resources[i];
        const actions = props.actions[i];
        const lambdaPolicyStatement = new iam.PolicyStatement({
          actions: actions,
          resources: [resource]
        });
        if (props.conditions && props.conditions[i]) {
          lambdaPolicyStatement.addConditions(props.conditions[i]);
        }
        // Add the policy statement to the managed policy
        lambdaPolicy.addStatements(lambdaPolicyStatement);
      }
    }

    lambdaPolicy.attachToRole(lambdaRole);

    // Integrate with API
    if (props.apiResource && props.method && props.authorizer) {
      const lambdaIntegration = new apigateway.LambdaIntegration(this.lambdaFunction, {
        timeout: cdk.Duration.seconds(29), 
      });
      var endpoint = props.apiResource.addMethod(props.method, lambdaIntegration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer: {
          authorizerId: props.authorizer.logicalId,
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
          {
            statusCode: '403',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
          {
            statusCode: '401',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
          {
            statusCode: '404',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
          {
            statusCode: '409',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
          {
            statusCode: '422',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
          {
            statusCode: '400',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
          {
            statusCode: '504',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
        ],
      });

      // Integrate with Cognito Authorization
      const resourceEndpoint = endpoint.node.findChild('Resource');
      (resourceEndpoint as apigateway.CfnResource).addPropertyOverride('AuthorizationType', apigateway.AuthorizationType.COGNITO);
      (resourceEndpoint as apigateway.CfnResource).addPropertyOverride('AuthorizerId', { Ref: props.authorizer.logicalId });
    }
  }
}

/**
 * Sanitize a string to make it a valid function name.
 * @param name The string to sanitize.
 * @returns The sanitized string.
 */
function sanitizeFunctionName(name : string) {
  // Remove any characters that could be used for path traversal
  return name.replace(/[^a-zA-Z0-9_\-]/g, '');
} 
