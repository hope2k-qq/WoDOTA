// import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
//
// const R2_ACCOUNT_ID = process.env.REACT_APP_R2_ACCOUNT_ID;
// const R2_ACCESS_KEY = process.env.REACT_APP_R2_ACCESS_KEY;
// const R2_SECRET_KEY = process.env.REACT_APP_R2_SECRET_KEY;
//
// const s3Client = new S3Client({
//     region: 'auto',
//     endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
//     credentials: {
//         accessKeyId: R2_ACCESS_KEY!,
//         secretAccessKey: R2_SECRET_KEY!,
//     },
// });
//

// export const getImageUrl = async (objectKey: string): Promise<string | null> => {
//     try {
//
//         const response = await fetch(`https://cdn.wodota.net/${objectKey}`);
//
//         if (!response.ok) {
//             console.error('Failed to fetch image:', response.statusText);
//             return null;
//         }
//         return response.url;
//     } catch (error) {
//         console.error('Error fetching image:', error);
//         return null;
//     }
// };

const CDN_VERSION = "5";

export const getImageUrl = (objectKey: string): string => {
    return `https://cdn.wodota.net/${objectKey}?v=${CDN_VERSION}`;
};