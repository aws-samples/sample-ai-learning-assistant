import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import awsExports from '../../aws-exports';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CompleteMultipartUploadCommandOutput,
    CreateMultipartUploadCommand,
    GetObjectCommand,
    S3Client,
    UploadPartCommand
} from '@aws-sdk/client-s3';

// Load AWS configuration from environment variables or AWS exports
const S3_BUCKET_NAME = import.meta.env.VITE_S3_BUCKET_NAME || awsExports.mediaS3BucketName;
const REGION = import.meta.env.VITE_REGION || awsExports.region;
const IDENTITY_POOL_ID = import.meta.env.VITE_IDENTITY_POOL_ID || awsExports.identityPoolId;
const USER_POOL_ID = import.meta.env.VITE_USER_POOL_ID || awsExports.userPoolId;

/**
 * Retrieves the AWS Cognito credentials for the current user.
 * @returns The AWS credentials, including access key ID, secret access key, and session token.
 */
async function getCognitoCredentials(): Promise<{
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
  }> {
    try {
      // Replace this with your actual method to fetch the ID token
      const idToken = (await fetchAuthSession()).tokens?.idToken?.toString();
  
      if (!idToken) {
        throw new Error("ID token not found");
      }
  
      // Create a CognitoIdentityClient
      const client = new CognitoIdentityClient({ region: REGION });
  
      // Configure the credentials provider
      const credentialsProvider = fromCognitoIdentityPool({
        client,
        identityPoolId: IDENTITY_POOL_ID,
        logins: {
          [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: idToken
        },
      });
  
      // Get credentials
      const credentials = await credentialsProvider();
  
      return {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken!,
      };
    } catch (err) {
      console.error("Error retrieving Cognito credentials:", err);
      throw err;
    }
  }


/**
 * Creates an S3 client instance using the current user's Cognito credentials.
 * @returns The S3 client instance.
 */
export async function getS3Client(): Promise<S3Client> {
    try {

        const { accessKeyId, secretAccessKey, sessionToken } = await getCognitoCredentials();
        const region = REGION;
        const s3Client = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
                sessionToken,
            }
        });

        return s3Client;

    } catch (err) {
        console.error(err);
        throw err;
    }
}

/**
 * Downloads a file from the S3 bucket.
 * @param fileKey - The key of the file to download.
 * @returns The downloaded file as a stream.
 */
export async function downloadFromS3(fileKey: string) {
    var download = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: fileKey,
    });
    const s3 = await getS3Client();
    const response = await s3.send(download);

    return response.Body;
};

/**
 * Uploads a file to the S3 bucket using multipart upload.
 * @param fileKey - The key of the file to upload.
 * @param file - The file to upload.
 * @returns The result of the multipart upload operation.
 */
export async function uploadToS3(fileKey: string, file: File): Promise<CompleteMultipartUploadCommandOutput | undefined> {
    var arrayBuffer = await file.arrayBuffer();
    var array = new Uint8Array(arrayBuffer);
    let uploadId;
    const s3 = await getS3Client();

    try {
        const multipartUpload = await s3.send(
            new CreateMultipartUploadCommand({
                Bucket: S3_BUCKET_NAME,
                Key: fileKey,
            })
        );
        uploadId = multipartUpload.UploadId;

        const uploadPromises = [];
        // Multipart uploads require a minimum size of 5 MB per part.
        const partSize = 5 * 1024 * 1024; // Set minimum part size to 5 MB
        const totalParts = Math.ceil(array.length / partSize);
        // Upload each part.
        for (let i = 0; i < totalParts; i++) {
            const start = i * partSize;
            const end = (i + 1) * partSize > array.length ? array.length : (i + 1) * partSize;

            uploadPromises.push(
                s3
                    .send(
                        new UploadPartCommand({
                            Bucket: S3_BUCKET_NAME,
                            Key: fileKey,
                            UploadId: uploadId,
                            Body: array.subarray(start, end),
                            PartNumber: i + 1,
                        }),
                    )
                    .then((d) => {
                        return d;
                    }),
            );
        }

        const uploadResults = await Promise.all(uploadPromises);

        return await s3.send(
            new CompleteMultipartUploadCommand({
                Bucket: S3_BUCKET_NAME,
                Key: fileKey,
                UploadId: uploadId,
                MultipartUpload: {
                    Parts: uploadResults.map(({ ETag }, i) => ({
                        ETag,
                        PartNumber: i + 1,
                    })),
                },
            }),
        );

    } catch (err) {
        console.error(err);

        if (uploadId) {
            const abortCommand = new AbortMultipartUploadCommand({
                Bucket: S3_BUCKET_NAME,
                Key: fileKey,
                UploadId: uploadId,
            });

            await s3.send(abortCommand);
        }
    }
}
