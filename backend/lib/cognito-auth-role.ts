import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

// Extend CognitoAuthRoleProps to send role creation parameters
interface CognitoAuthRoleProps {
    identityPool: cognito.CfnIdentityPool;
    resources?: string[];
    actions?: string[][];
    conditions?: { [key: string]: any }[];  
}

export class CognitoAuthRole extends Construct {

    public readonly role: iam.Role;

    constructor(scope: Construct, id: string, props: CognitoAuthRoleProps) {
        super(scope, id);

        const { identityPool } = props;

        // Create Cognito role for users
        this.role = new iam.Role(this, `${id}Role`, {
            assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com',
                {
                    StringEquals: {
                        "cognito-identity.amazonaws.com:aud": identityPool.ref,
                    },
                    "ForAnyValue:StringLike": {
                        "cognito-identity.amazonaws.com:amr": "authenticated",
                    },
                },
                "sts:AssumeRoleWithWebIdentity"
            ),
        });

        // Create Cognito policies
        let cognitoUserPolicyStatements: iam.PolicyStatement[] = [];

        // Create all the policy statements defines in props 
        if (props.resources && props.actions) {
            for (let i = 0; i < props.resources.length; i++) {
                const resource = props.resources[i];
                const actions = props.actions[i];

                const cognitoUserPolicyStatement = new iam.PolicyStatement({
                    actions: actions,
                    resources: [resource],
                });
                if (props.conditions && props.conditions[i]) {
                    cognitoUserPolicyStatement.addConditions(props.conditions[i]);
                }
                cognitoUserPolicyStatements.push(cognitoUserPolicyStatement);
            }
        }

        // If there are statements create a policy and attach to the role
        if (cognitoUserPolicyStatements.length > 0) {
            const cognitoUserPolicy = new iam.ManagedPolicy(this, `${id}CognitoPolicy`, {
                statements: cognitoUserPolicyStatements,
                description: `scope policy allows cognito users to call actions to be performed on their behalf on aws.`
              });
            cognitoUserPolicy.attachToRole(this.role);
        }

        new cognito.CfnIdentityPoolRoleAttachment(
            this,
            "identityPoolRoleAttachment",
            {
                identityPoolId: identityPool.ref,
                roles: { authenticated: this.role.roleArn },
            }
        );
    }
}