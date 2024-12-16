import { APIGatewayProxyHandler } from "aws-lambda";
import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";
import archiver from "archiver";
import Busboy from "busboy";

export const handler: any = async (event) => {
  try {
    const busboy = Busboy({ headers: event.headers });
    const tempDir = path.resolve("/tmp/temp_metadata");
    const zipPath = path.resolve(tempDir, "uploaded.zip");
    let numberOfEdits = 1;
    let previousHash: any = 0;

    // Ensure the temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    await new Promise<void>((resolve, reject) => {
      busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        console.log(`Receiving file [${filename}]`);
        const saveTo = path.join(tempDir, "uploaded.zip");
        const writeStream = fs.createWriteStream(saveTo);
        file.pipe(writeStream);

        writeStream.on("finish", () => {
          console.log(`File [${filename}] written to ${saveTo}`);
          resolve();
        });

        writeStream.on("error", (err) => {
          console.error(`Error writing file [${filename}] to ${saveTo}: ${err.message}`);
          reject(err);
        });
      });

      busboy.on("field", (fieldname, val) => {
        console.log(`Received field [${fieldname}]: ${val}`);
        if (fieldname === "numberOfEdits") {
          numberOfEdits = parseInt(val, 10) || 1;
        } else if (fieldname === "previousHash") {
          previousHash = val || 0;
        }
      });

      busboy.on("finish", () => {
        console.log("Busboy finished parsing the request.");
      });

      busboy.on("error", (err: any) => {
        console.error(`Busboy error: ${err.message}`);
        reject(err);
      });

      busboy.end(Buffer.from(event.body, "base64"));
    });

    // Verify the integrity of the zip file
    const zipStats = fs.statSync(zipPath);
    console.log(`Zip file size: ${zipStats.size} bytes`);
    if (zipStats.size === 0) {
      throw new Error("Uploaded zip file is empty or corrupted.");
    }

    // Extract the zip file using adm-zip
    try {
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(tempDir, true);
    } catch (err) {
      console.error(`Error extracting zip file: ${err.message}`);
      throw err;
    }

    const modifiedFiles: string[] = [];
    const filesList = fs.readdirSync(tempDir).filter((file) => file.endsWith(".json"));

    console.log(`Total files extracted: ${filesList.length}`);

    // Randomly modify attributes in a subset of files
    for (let i = 0; i < numberOfEdits; i++) {
      const randomFileIndex = Math.floor(Math.random() * filesList.length);
      const filePath = path.join(tempDir, filesList[randomFileIndex]);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Modify attributes randomly
      data.attributes.legado_level = Math.floor(Math.random() * 100) + 1;
      data.attributes.carbon_offset = Math.floor(Math.random() * 100000) + 1;
      data.attributes.legado_user = Math.floor(Math.random() * 10000);
      data.last_record_hash = previousHash + data.id + '.json';

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      modifiedFiles.push(filePath);
    }

    console.log(`Total files modified: ${modifiedFiles.length}`);

    // Remove the uploaded zip file before creating the new zip archive
    fs.rmSync(zipPath, { force: true });

    // Create a new zip archive
    const newZipPath = path.resolve("/tmp/modified_metadata.zip");
    const output = fs.createWriteStream(newZipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      archive.on("error", (err) => reject(err));
      output.on("close", () => {
        try {
          // Read the zip file and return it as a Base64-encoded string
          const zipContent = fs.readFileSync(newZipPath);

          // Cleanup: Remove the temp directory and zip file
          fs.rmSync(tempDir, { recursive: true, force: true });
          fs.rmSync(newZipPath, { force: true });

          resolve({
            statusCode: 200,
            headers: {
              "Content-Type": "application/zip",
              "Content-Disposition": `attachment; filename=modified_metadata.zip`,
            },
            body: zipContent.toString("base64"),
            isBase64Encoded: true,
          });
        } catch (cleanupError) {
          reject(cleanupError);
        }
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Append files from the temp directory
      fs.readdirSync(tempDir).forEach((file) => {
        const filePath = path.join(tempDir, file);
        archive.file(filePath, { name: file });
      });

      archive.finalize();
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
