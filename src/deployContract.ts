import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import Busboy from "busboy";
import { ethers } from "ethers";
import * as solc from "solc";
import * as fs from "fs";
import * as path from "path";

// Helper function to compile a Solidity contract
const compileContract = (source: string) => {
    const findImports = (importPath: string) => {
      try {
        // Resolve the import path to node_modules
        const resolvedPath = path.resolve("node_modules", importPath);
        const content = fs.readFileSync(resolvedPath, "utf8");
        return { contents: content };
      } catch (error) {
        return { error: `Import ${importPath} not found` };
      }
    };
  
    const input = {
      language: "Solidity",
      sources: {
        "contract.sol": {
          content: source,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode"],
          },
        },
      },
    };
  
    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
    if (output.errors) {
      throw new Error(output.errors.map((err: any) => err.formattedMessage).join("\n"));
    }
  
    const contractName = Object.keys(output.contracts["contract.sol"])[0];
    const { abi, evm } = output.contracts["contract.sol"][contractName];
    return { abi, bytecode: evm.bytecode.object };
};

// Lambda handler
export const handler: APIGatewayProxyHandler = async (event) => {
  return new Promise<APIGatewayProxyResult>((resolve, reject) => {
    const bb = Busboy({ headers: event.headers });

    let secretKey = "";
    let contractSource = "";
    let contractArgs: string[] = [];

    bb.on("file", (fieldname, file, filename, encoding, mimetype) => {
        if (fieldname === "contract") {
          let buffer = "";
          file.on("data", (data) => (buffer += data.toString()));
          file.on("end", () => {
            contractSource = buffer;
          });
        }
      });
  
    bb.on("field", (fieldname, value) => {
        if (fieldname === "secretKey") {
            secretKey = value;
        } else if (fieldname.startsWith("arg")) {
          // Collect constructor arguments (e.g., arg0, arg1)
            contractArgs.push(value);
        }
    });

    bb.on("finish", async () => {
      if (!contractSource || !secretKey) {
        resolve({
          statusCode: 400,
          body: JSON.stringify({ error: "Both contract file and secretKey are required." }),
        });
        return;
      }

      try {
        // Compile the contract
        const { abi, bytecode } = compileContract(contractSource);

        // Set up provider and signer
        const provider = new ethers.JsonRpcProvider(
          "https://rpc-amoy.polygon.technology"
        );
        const wallet = new ethers.Wallet(secretKey, provider);

        // Deploy the contract with constructor arguments
        const factory = new ethers.ContractFactory(abi, bytecode, wallet);
        const contract = await factory.deploy(...contractArgs);

        // Wait for the deployment to be mined
        const tx = await contract.deploymentTransaction()?.wait(1);

        resolve({
          statusCode: 200,
          body: JSON.stringify({
            transactionHash: tx?.hash,
            contractAddress: contract.target,
          }),
        });
      } catch (error) {
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: error.message }),
        });
      }
    });

    bb.end(Buffer.from(event.body || "", "base64"));
  });
};
