import { APIGatewayProxyHandler } from "aws-lambda";
import { ethers } from "ethers";
import axios from "axios";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const { tokenId, contractAddress } = body;

    if (tokenId === undefined || tokenId === null) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing tokenId." }),
      };
    }
    if (!contractAddress) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing contract address." }),
      };
    }

    // Initialize provider
    const provider = new ethers.JsonRpcProvider(
      "https://rpc-amoy.polygon.technology"
    );

    // TokenURI contract details
    const contractABI = [
      "function tokenURI(uint256 tokenId) public view returns (string memory)",
    ];

    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // Metadata history array
    const uriHistory: string[] = [];

    // Retrieve the initial token URI
    const tokenUriIpfs = await contract.tokenURI(tokenId);

    // Replace ipfs:// with https://ipfs.filebase.io/ipfs/
    let tokenUriHttps = tokenUriIpfs.replace(
      "ipfs://",
      "https://ipfs.filebase.io/ipfs/"
    );
    uriHistory.push(tokenUriHttps);

    while (true) {
      // Fetch metadata from the URI
      const metadataResponse = await axios.get(tokenUriHttps);
      const metadata = metadataResponse.data;

      // Check the last_record_hash
      const lastRecordHash = metadata.last_record_hash;
      if (!lastRecordHash || lastRecordHash === "0") {
        break;
      }

      // Convert last_record_hash to HTTPS URL
      tokenUriHttps = lastRecordHash.replace(
        "ipfs://",
        "https://ipfs.filebase.io/ipfs/"
      );

      // Add metadata to history
      uriHistory.push(tokenUriHttps);
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        message: "Metadata history retrieved successfully.",
        uriHistory,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
