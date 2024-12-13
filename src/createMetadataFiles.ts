import { APIGatewayProxyHandler } from "aws-lambda";
import { v4 as uuidv4 } from 'uuid';
import * as fs from "fs";
import * as path from "path";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse input from the request body
    const body = JSON.parse(event.body || "{}");
    const folderPath = path.resolve("metadata");
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Files created successfully.",
        folder: folderPath,
        fileNumber: fileNumber,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
