import { APIGatewayProxyHandler } from "aws-lambda";
import { v4 as uuidv4 } from 'uuid';
import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";
import Busboy from "busboy";
import AWS from "aws-sdk";
import { execSync } from "child_process";
import 'dotenv/config';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const s3 = new AWS.S3({
      accessKeyId: '6D2EF9C28B5A707BDB85',
      secretAccessKey: '3yZAALxPBzMXkR26E1ZjEfnEv7MtuPP2Wk05PHDn',
      endpoint: 'https://s3.filebase.com',
      region: 'us-east-1',
      signatureVersion: 'v4',
    });

    if (!event.headers["content-type"]) {
      throw new Error("Content-Type header is missing");
    }

    // Parse the multipart body using Busboy
    const busboy = Busboy({ headers: { "content-type": event.headers["content-type"] } });
    const tmpDir = `/tmp/${uuidv4()}`;
    fs.mkdirSync(tmpDir);
    const zipFilePath = path.join(tmpDir, "uploaded.zip");

    // Handle file upload
    const fileWritePromise = new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(zipFilePath);
      busboy.on("file", (fieldname, file) => {
        file.pipe(fileStream);
        file.on("end", () => fileStream.end());
      });

      fileStream.on("finish", resolve);
      fileStream.on("error", reject);
    });

    // Parse the event body
    busboy.end(Buffer.from(event.body || "", "base64"));
    await fileWritePromise;

    // Extract .zip contents
    const zip = new AdmZip(zipFilePath);
    const extractedPath = path.join(tmpDir, "extracted");
    fs.mkdirSync(extractedPath);
    zip.extractAllTo(extractedPath, true);

    // Create CAR file
    const environment = process.env.NODE_ENV || 'production';
    let pathToIpfsCar = './node_modules/.bin/ipfs-car';
    if (environment === 'production'){
      process.env.NPM_CONFIG_CACHE = '/tmp/.npm';
      pathToIpfsCar = 'npx ipfs-car';
    }
    const cidIpfs = execSync(`${pathToIpfsCar} pack ${extractedPath} --output ${tmpDir}/output.car`);

    // Upload CAR file to Filebase
    const carFileBuffer = fs.readFileSync(`${tmpDir}/output.car`);
    const uploadParams = {
      Bucket: 'testing-collection',
      Key: `legado-metadata/${Date.now()}.car`,
      Body: carFileBuffer,
      Metadata: { import: "car" }
    };

    let ipfsCID: string = "";

    await s3.putObject(uploadParams)
      .on('httpHeaders', (statusCode, headers) => {
        ipfsCID = headers['x-amz-meta-cid'];
        console.log(`IPFS CID: ${ipfsCID}`);
      }).promise();

    // delete temporary directory
    fs.rmSync(tmpDir, { recursive: true });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "IPFS created correctly",
        ipfsHash: ipfsCID,
        ipfsUrl: `https://ipfs.filebase.io/ipfs/${ipfsCID}`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
