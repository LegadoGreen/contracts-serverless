import { APIGatewayProxyHandler } from "aws-lambda";
import { ethers } from "ethers";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    // Validate inputs
    const { to, privateKey, contractAddress, numberOfMints } = body;
    if (!ethers.isAddress(to)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid 'to' address." }),
      };
    }
    if (!privateKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing 'privateKey'." }),
      };
    }
    if (!numberOfMints || numberOfMints < 1 || numberOfMints > 10) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "'numberOfMints' should be between 1 and 10.",
        }),
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
      "function mint(address to) external",
    ];

    // Create a contract instance
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    let txs: string[] = [];

    for (let i = 0; i < numberOfMints; i++) {
      // Call the `batchMint` method
      const tx = await contract.mint(to);

      // Wait for the transaction to be mined
      await tx.wait(1);

      txs.push(tx.hash as string);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Mint successful.",
        transactiosnHash: txs,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
