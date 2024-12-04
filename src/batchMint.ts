import { APIGatewayProxyHandler } from "aws-lambda";
import { ethers } from "ethers";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    // Validate inputs
    const { to, amount, privateKey, contractAddress } = body;
    if (!ethers.isAddress(to)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid 'to' address." }),
      };
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid 'amount' value." }),
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
      // Add only the relevant ABI entries for `batchMint`
      "function batchMint(address to, uint256 amount) external",
    ];

    // Create a contract instance
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    // Call the `batchMint` method
    const tx = await contract.batchMint(to, amount);

    // Wait for the transaction to be mined
    const receipt = await tx.wait(1);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Batch mint successful.",
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
