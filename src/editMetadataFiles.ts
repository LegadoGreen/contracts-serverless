import { APIGatewayProxyHandler } from "aws-lambda";
import * as fs from "fs";
import * as path from "path";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse input from the request body
    const body = JSON.parse(event.body || "{}");
    const folderPath = path.resolve("metadata");
    const numberOfEdits = parseInt(body.numberOfEdits, 10) || 1;
    const previousHash = body.previousHash || 0;

    if (!fs.existsSync(folderPath)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Folder does not exist." }),
      };
    }

    const modifiedFiles: string[] = [];
    const files = fs.readdirSync(folderPath).filter((file) => file.endsWith(".json"));

    // Randomly modify attributes in a subset of files
    for (let i = 0; i < numberOfEdits; i++) {
      const randomFileIndex = Math.floor(Math.random() * files.length);
      const filePath = path.join(folderPath, files[randomFileIndex]);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Modify attributes randomly
      data.attributes.legado_level = Math.floor(Math.random() * 100) + 1;
      data.attributes.carbon_offset = Math.floor(Math.random() * 100000) + 1;
      data.attributes.legado_user = Math.floor(Math.random() * 10000);
      data.last_record_hash = previousHash;

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      modifiedFiles.push(filePath);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Metadata modified successfully.",
        folder: folderPath,
        numberOfEdits: numberOfEdits,
        modifiedFiles: modifiedFiles,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
