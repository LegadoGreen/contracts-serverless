import { APIGatewayProxyHandler } from "aws-lambda";
import { ethers } from "ethers";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const { newBaseURI, privateKey, contractAddress } = body;

    if (!newBaseURI) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing newBaseURI." }),
      };
    }
    if (!privateKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing private key." }),
      };
    }

    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(
        "https://rpc-amoy.polygon.technology"
    );
    const wallet = new ethers.Wallet(privateKey, provider);

    // ChangeUri contract details
    const contractABI = [
      "function baseURI() public view returns (string memory)",
      "function setBaseURI(string memory _baseURI) external"
    ];

    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    // Retrieve the current base URI
    const currentBaseURI = await contract.baseURI();

    // Update the base URI
    const tx = await contract.setBaseURI(newBaseURI);
    const receipt = await tx.wait(1);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Base URI updated successfully.",
        currentBaseURI,
        newBaseURI,
        transactionHash: tx.hash,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
