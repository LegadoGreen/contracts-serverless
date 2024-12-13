import { APIGatewayProxyHandler } from "aws-lambda";
import { v4 as uuidv4 } from 'uuid';
import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";

export const handler: any = async (event) => {
  try {
    // Parse input from the request body
    const body = JSON.parse(event.body || "{}");
    const folderPath = path.resolve("metadata");
    const zipPath = path.resolve("metadata.zip");
    const fileNumber = parseInt(body.fileNumber, 10) || 10;

    // Ensure the folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Generate files with metadata
    for (let i = 0; i < fileNumber; i++) {
      const metadata = {
        id: i,
        description: "This is a test file for LEGADO",
        image: "https://avatars.githubusercontent.com/u/188253427?s=500&v=4",
        creation_date: Date.now(),
        attributes: {
          territory_id: i,
          legado_user: uuidv4(),
          ambassador_title: "classical",
          legado_level: Math.floor(Math.random() * 100) + 1,
          carbon_offset: Math.floor(Math.random() * 100000) + 1,
          distributtion_partner: "Legado",
        },
        last_record_hash: 0,
      };

      const filePath = path.join(folderPath, `${i}.json`);
      fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
    }

    // Create a zip archive
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      archive.on("error", (err) => reject(err));
      output.on("close", () => {
        try {
          // Read the zip file and return it as a Base64-encoded string
          const zipContent = fs.readFileSync(zipPath);

          // Cleanup: Remove the metadata folder and zip file
          fs.rmSync(folderPath, { recursive: true, force: true }); // Remove folder and its contents
          fs.rmSync(zipPath, { force: true }); // Remove zip file

          resolve({
            statusCode: 200,
            headers: {
              "Content-Type": "application/zip",
              "Content-Disposition": `attachment; filename=metadata.zip`,
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

      // Append files from the metadata folder
      fs.readdirSync(folderPath).forEach((file) => {
        const filePath = path.join(folderPath, file);
        archive.file(filePath, { name: file });
      });

      archive.finalize();
    });
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
