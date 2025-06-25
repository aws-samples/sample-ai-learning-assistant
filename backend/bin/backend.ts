#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MainStack } from '../lib/main-stack';
import * as waf_v2 from 'aws-cdk-lib/aws-wafv2';
import { CLOUDWATCH_LOGS_CREATE_LOG_DELIVERY, CLOUDWATCH_LOGS_DELETE_LOG_DELIVERY, CLOUDWATCH_LOGS_DESCRIBE_LOG_GROUPS, CLOUDWATCH_LOGS_DESCRIBE_RESOURCE_POLICIES, CLOUDWATCH_LOGS_PUT_RESOURCE_POLICY, DEFAULT_RESOURCE_NAME, MAIN_STACK_REGION, WAFV2_DELETE_LOGGING_CONFIGURATION, WAFV2_PUT_LOGGING_CONFIGURATION, WAF_STACK_REGION } from './constants'
import { Stack } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

/** Uncomment the line below to run cdk nag before deploying */
// import { Aspects } from 'aws-cdk-lib';
// import { AwsSolutionsChecks } from 'cdk-nag'

const app = new cdk.App();

/** Uncomment the line below to run cdk nag before deploying */
// Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

// CDk Stack to deploy Waf for cloudfront, only available in us-east-1
const WafCdkStack = new Stack(app, 'AILearningAssistantWafStack', {
  env: {
    region: WAF_STACK_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT
  },
  crossRegionReferences: true,
});

// Web ACL from Waf to associate to Cloudfront - Rules and Logging Configuration
const cloudfrontWebACL = new waf_v2.CfnWebACL(WafCdkStack, "cloudfrontWebACL", {
  defaultAction: { allow: {} },
  scope: 'CLOUDFRONT',
  visibilityConfig: {
    cloudWatchMetricsEnabled: true,
    metricName: 'cloudfrontWebACL',
    sampledRequestsEnabled: true,
  },
  // Common attack patterns rules
  rules: [
    // Rate limiting rule
    {
      name: 'RateBasedRule',
      priority: 1,
      statement: {
        rateBasedStatement: {
          limit: 2000, // Requests per 5 minutes per IP
          aggregateKeyType: 'IP'
        }
      },
      action: { block: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'RateBasedRule'
      }
    },
    // Common attack patterns rule
    {
      name: 'AWSManagedRulesCommonRuleSet',
      priority: 3,
      overrideAction: { none: {} },
      statement: {
        managedRuleGroupStatement: {
          vendorName: 'AWS',
          name: 'AWSManagedRulesCommonRuleSet'
        }
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'AWSManagedRulesCommonRuleSet'
      }
    }
    // Geo-restriction rule
    /** 
    {
      name: 'GeoRestrictionRule',
      priority: 2,
      statement: {
        notStatement: { // noStatement inverts the logic to allow all except specified countries, change to statement for allow only
          statement: {
            geoMatchStatement: {
              countryCodes: [], // Replace with the list of country codes to block
            }
          }
        }
      },
      action: { block: {} }, // Block requests from the specified countries
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'GeoRestrictionRule'
      }
    }, 
    */
  ]
});

// CloudWatch Log Group for WAF logging, must start with `aws-waf-logs-`
const logGroup = new logs.LogGroup(WafCdkStack, 'WafLogGroup', {
  logGroupName: `aws-waf-logs-${DEFAULT_RESOURCE_NAME}`,
  retention: logs.RetentionDays.ONE_WEEK,
  removalPolicy: cdk.RemovalPolicy.DESTROY
});

// Grant WAF permissions to write to the Log Group
const wafLoggingRole = new iam.Role(WafCdkStack, 'WafLoggingRole', {
  assumedBy: new iam.ServicePrincipal('waf.amazonaws.com'),
  description: 'Role for WAF to log traffic to CloudWatch Logs',
});

// WAF Logging Configuration Policy (specific to Web ACL resource)
wafLoggingRole.addToPolicy(new iam.PolicyStatement({
  actions: [
    WAFV2_PUT_LOGGING_CONFIGURATION,
    WAFV2_DELETE_LOGGING_CONFIGURATION
  ],
  resources: [cloudfrontWebACL.attrArn],
  effect: iam.Effect.ALLOW,
}));

// CloudWatch Logs Policy (specific to CloudWatch Log Group)
wafLoggingRole.addToPolicy(new iam.PolicyStatement({
  actions: [
    CLOUDWATCH_LOGS_CREATE_LOG_DELIVERY,
    CLOUDWATCH_LOGS_DELETE_LOG_DELIVERY,
    CLOUDWATCH_LOGS_PUT_RESOURCE_POLICY,
    CLOUDWATCH_LOGS_DESCRIBE_RESOURCE_POLICIES,
    CLOUDWATCH_LOGS_DESCRIBE_LOG_GROUPS
  ],
  resources: [logGroup.logGroupArn],
  effect: iam.Effect.ALLOW,
}));

// WAF Logging
new waf_v2.CfnLoggingConfiguration(WafCdkStack, 'WafLoggingConfiguration', {
  logDestinationConfigs: [logGroup.logGroupArn],
  resourceArn: cloudfrontWebACL.attrArn,
});

// WAF Block Rate CloudWatch Metric
const wafBlockedRequestsMetric = new cloudwatch.Metric({
  namespace: 'AWS/WAFV2',
  metricName: 'BlockedRequests',
  dimensionsMap: {
    WebACL: cloudfrontWebACL.attrId,
    Rule: 'ALL', // Tracks blocks from all rules in the WebACL
  },
  statistic: 'Sum', // Total blocked requests in the period
  period: cdk.Duration.minutes(5), // Metric period
});

// CloudWatch Alarm for High Block Rate
new cloudwatch.Alarm(WafCdkStack, 'HighWafBlockRate', {
  metric: wafBlockedRequestsMetric,
  threshold: 1000, // Trigger alarm if block rate exceeds this value
  evaluationPeriods: 1, // Number of periods to evaluate
  datapointsToAlarm: 1, // Minimum datapoints within evaluationPeriods to trigger the alarm
  alarmDescription: 'Alert when WAF block rate exceeds 1000 requests in 5 minutes',
  actionsEnabled: true, // Enable actions like SNS notifications (attach separately if required)
});

new MainStack(app, 'AILearningAssistantMainStack', {
  crossRegionReferences: true,
  // Pass WAF Arn to associate to Cloudfront
  cloudfrontWebACLAttrArn: cloudfrontWebACL.attrArn,
  env: {
    region: MAIN_STACK_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  }

});