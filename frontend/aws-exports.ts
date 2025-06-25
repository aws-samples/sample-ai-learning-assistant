interface AWSExports {
    apiName:  string;
    apiURL:  string;
    bedrockModelId:  string;
    identityPoolId: string;
    mediaS3BucketName:  string;
    region: string;
    userPoolClientId:  string;
    userPoolDomainName:  string;
    userPoolId: string;
}

// For running and testing the environment locally replace these values with the outputs from cdk 
const awsExports: AWSExports = {
    apiName: '',
    apiURL: '',
    bedrockModelId: 'anthropic.claude-3-sonnet-xxxxxxxx-v1:0',
    identityPoolId : '',
    mediaS3BucketName: '',
    region: 'us-west-2',
    userPoolClientId: '',
    userPoolDomainName: '',
    userPoolId: '',
};

export default awsExports;


