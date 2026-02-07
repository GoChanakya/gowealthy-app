// upload.js
import express from 'express';
import { Storage } from '@google-cloud/storage';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: 'gowealthy-app',
  keyFilename: './service-account-key.json'
});

const bucketName = 'document-ocr203'; // Replace with your bucket name
const bucket = storage.bucket(bucketName);

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// app.post('/api/generate-upload-url', async (req, res) => {
//   try {
//     const { fileName, contentType, userId, docType } = req.body;
    
//     const folderName = docType === 'aadhaar' ? 'adhar' : docType;
//     const filePath = `${folderName}/${userId}/${fileName}`;
//     const file = bucket.file(filePath);
    
//     const [url] = await file.getSignedUrl({
//       version: 'v4',
//       action: 'write',
//       expires: Date.now() + 15 * 60 * 1000,
//       contentType: contentType,
//     });
    
//     res.json({ 
//       uploadUrl: url,
//       fileUrl: `gs://${bucketName}/${filePath}` // <- Change this to gs:// format
//     });
    
//   } catch (error) {
//     console.error('Error generating signed URL:', error);
//     res.status(500).json({ error: 'Failed to generate upload URL' });
//   }
// });

app.post('/api/generate-upload-url', async (req, res) => {
  try {
    const { fileName, contentType, userId, docType } = req.body;

    const folderName = docType === 'aadhaar' ? 'adhar' : docType;
    const filePath = `${folderName}/${userId}/${fileName}`;
    const file = bucket.file(filePath);

    const [policy] = await file.generateSignedPostPolicyV4({
      expires: Date.now() + 15 * 60 * 1000,
      fields: {
        'Content-Type': contentType,
      },
    });

    res.json({
      url: policy.url,
      fields: policy.fields,
      fileUrl: `https://storage.googleapis.com/${bucketName}/${filePath}`,
      gcsUri: `gs://${bucketName}/${filePath}`,
    });

  } catch (error) {
    console.error('Error generating signed POST URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});


app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});