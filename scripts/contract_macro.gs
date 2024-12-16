function sendPostRequest() {
  const baseSheetName = "General"; // Sheet containing the input data
  const outputSheetName = "ERC-721"; // Sheet for output data

  // Get the sheets
  const baseSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(baseSheetName);
  const outputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(outputSheetName)
                      || SpreadsheetApp.getActiveSpreadsheet().insertSheet(outputSheetName);

  if (!baseSheet) {
    throw new Error("Base sheet does not exist!");
  }

  // Retrieve cell values from the Base sheet
  const to = baseSheet.getRange("B8").getValue();
  const privateKey = baseSheet.getRange("B9").getValue();
  const contractAddress = baseSheet.getRange("B2").getValue();
  const numberOfMints = baseSheet.getRange("C3").getValue();
  const errorCell = baseSheet.getRange("B14");
  const statusCell = baseSheet.getRange("B19");

  // Ethereum hash validation regex
  const ethHashRegex = /^0x[a-fA-F0-9]{40}$/;

  // Validate input
  if (!ethHashRegex.test(to)) {
    errorCell.setValue("Error: Invalid 'to' address in B8.");
    return;
  }
  if (!ethHashRegex.test(contractAddress)) {
    errorCell.setValue("Error: Invalid 'contractAddress' in B2.");
    return;
  }
  if (!privateKey) {
    errorCell.setValue("Error: Private key in B9 is missing.");
    return;
  }

  // Clear error cell if validations pass
  errorCell.setValue("");

  // Create POST request payload
  const payload = {
    to: to,
    privateKey: privateKey,
    contractAddress: contractAddress,
    numberOfMints: numberOfMints,
  };

  const url = "https://f48l3fwh28.execute-api.us-east-1.amazonaws.com/basicMint";

  try {
    // Make POST request
    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    });

    // Parse response
    const responseData = JSON.parse(response.getContentText());
    const message = responseData.message || "No message";
    const transactionHashes = responseData.transactiosnHash || [];

    // Clear the output sheet and create a table for the response
    outputSheet.clear();
    outputSheet.appendRow(["Minting Results"]); // Header
    outputSheet.appendRow(["Message", "Transaction Hash"]); // Column headers
    outputSheet.getRange(1, 1, 1, 2).setFontWeight("bold"); // Style headers

    // Add response data
    outputSheet.getRange(2, 1).setValue(message); // Add the message
    transactionHashes.forEach((hash, index) => {
      const row = index + 3; // Starting from row 3
      const url = `https://amoy.polygonscan.com/tx/${hash}`;
      outputSheet.getRange(row, 2).setFormula(`=HYPERLINK("${url}", "${hash}")`); // Add hyperlink
    });

    statusCell.setValue("Proceso finalizado sin errores, ver la hoja ERC-721 para mas detalles")
  } catch (error) {
    // Handle request errors
    const errorMessage = error.message || "";

    if (errorMessage.includes("invalid private key")) {
      // Specific error for private key
      errorCell.setValue("La llave privada no es válida, verifica nuevamente");
    } else {
      // General error
      errorCell.setValue(`Error: ${error.message}`);
    }
  }
}

function sendBatchMintRequest721A() {
  const baseSheetName = "General"; // Sheet containing the input data
  const outputSheetName = "ERC-721a"; // Sheet for output data

  // Get the sheets
  const baseSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(baseSheetName);
  const outputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(outputSheetName)
                      || SpreadsheetApp.getActiveSpreadsheet().insertSheet(outputSheetName);

  if (!baseSheet) {
    throw new Error("Base sheet does not exist!");
  }

  // Retrieve cell values from the Base sheet
  const to = baseSheet.getRange("B4").getValue();
  const amount = baseSheet.getRange("C3").getValue();
  const privateKey = baseSheet.getRange("B9").getValue();
  const contractAddress = baseSheet.getRange("B3").getValue();
  const errorCell = baseSheet.getRange("B14");
  const statusCell = baseSheet.getRange("B19");

  // Ethereum hash validation regex
  const ethHashRegex = /^0x[a-fA-F0-9]{40}$/;

  // Validate input
  if (!ethHashRegex.test(to)) {
    errorCell.setValue("Error: Invalid 'to' address in B4.");
    return;
  }
  if (!ethHashRegex.test(contractAddress)) {
    errorCell.setValue("Error: Invalid 'contractAddress' in B4.");
    return;
  }
  if (!privateKey) {
    errorCell.setValue("Error: Private key in B9 is missing.");
    return;
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    errorCell.setValue("Error: Amount in C4 must be a positive number.");
    return;
  }

  // Clear error cell if validations pass
  errorCell.setValue("");

  // Create POST request payload
  const payload = {
    to: to,
    amount: parseInt(amount, 10), // Ensure amount is sent as a number
    privateKey: privateKey,
    contractAddress: contractAddress,
  };

  const url = "https://f48l3fwh28.execute-api.us-east-1.amazonaws.com/batchMint";

  try {
    // Make POST request
    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    });

    // Parse response
    const responseData = JSON.parse(response.getContentText());
    const message = responseData.message || "No message";
    const transactionHash = responseData.transactionHash || "";

    // Clear the output sheet and create a table for the response
    outputSheet.clear();
    outputSheet.appendRow(["Batch Minting Results"]); // Header
    outputSheet.appendRow(["Message", "Transaction Hash"]); // Column headers
    outputSheet.getRange(1, 1, 1, 2).setFontWeight("bold"); // Style headers

    // Add response data
    outputSheet.getRange(2, 1).setValue(message); // Add the message
    if (transactionHash) {
      const url = `https://amoy.polygonscan.com/tx/${transactionHash}`;
      outputSheet.getRange(2, 2).setFormula(`=HYPERLINK("${url}", "${transactionHash}")`); // Add hyperlink
    }

    statusCell.setValue("Proceso finalizado sin errores, ver la hoja ERC-721a para mas detalles")
  } catch (error) {
    // Handle request errors
    const errorMessage = error.message || "";

    if (errorMessage.includes("invalid private key")) {
      // Specific error for private key
      errorCell.setValue("La llave privada no es válida, verifica nuevamente");
    } else {
      // General error
      errorCell.setValue(`Error: ${error.message}`);
    }
  }
}

function sendBatchMintRequest1155() {
  const baseSheetName = "General"; // Sheet containing the input data
  const outputSheetName = "ERC-1155"; // Sheet for output data

  // Get the sheets
  const baseSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(baseSheetName);
  const outputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(outputSheetName)
                      || SpreadsheetApp.getActiveSpreadsheet().insertSheet(outputSheetName);

  if (!baseSheet) {
    throw new Error("Base sheet does not exist!");
  }

  // Retrieve cell values from the Base sheet
  const to = baseSheet.getRange("B4").getValue();
  const amount = baseSheet.getRange("C4").getValue();
  const privateKey = baseSheet.getRange("B9").getValue();
  const contractAddress = baseSheet.getRange("B4").getValue();
  const errorCell = baseSheet.getRange("B14");
  const statusCell = baseSheet.getRange("B19");

  // Ethereum hash validation regex
  const ethHashRegex = /^0x[a-fA-F0-9]{40}$/;

  // Validate input
  if (!ethHashRegex.test(to)) {
    errorCell.setValue("Error: Invalid 'to' address in B4.");
    return;
  }
  if (!ethHashRegex.test(contractAddress)) {
    errorCell.setValue("Error: Invalid 'contractAddress' in B4.");
    return;
  }
  if (!privateKey) {
    errorCell.setValue("Error: Private key in B9 is missing.");
    return;
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    errorCell.setValue("Error: Amount in C4 must be a positive number.");
    return;
  }

  // Clear error cell if validations pass
  errorCell.setValue("");

  // Create POST request payload
  const payload = {
    to: to,
    amount: parseInt(amount, 10), // Ensure amount is sent as a number
    privateKey: privateKey,
    contractAddress: contractAddress,
  };

  const url = "https://f48l3fwh28.execute-api.us-east-1.amazonaws.com/batchMint";

  try {
    // Make POST request
    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    });

    // Parse response
    const responseData = JSON.parse(response.getContentText());
    const message = responseData.message || "No message";
    const transactionHash = responseData.transactionHash || "";

    // Clear the output sheet and create a table for the response
    outputSheet.clear();
    outputSheet.appendRow(["Batch Minting Results"]); // Header
    outputSheet.appendRow(["Message", "Transaction Hash"]); // Column headers
    outputSheet.getRange(1, 1, 1, 2).setFontWeight("bold"); // Style headers

    // Add response data
    outputSheet.getRange(2, 1).setValue(message); // Add the message
    if (transactionHash) {
      const url = `https://amoy.polygonscan.com/tx/${transactionHash}`;
      outputSheet.getRange(2, 2).setFormula(`=HYPERLINK("${url}", "${transactionHash}")`); // Add hyperlink
    }

    statusCell.setValue("Proceso finalizado sin errores, ver la hoja ERC-1155 para mas detalles")

  } catch (error) {
    // Handle request errors
    const errorMessage = error.message || "";

    if (errorMessage.includes("invalid private key")) {
      // Specific error for private key
      errorCell.setValue("La llave privada no es válida, verifica nuevamente");
    } else {
      // General error
      errorCell.setValue(`Error: ${error.message}`);
    }
  }
}

function sendChangeUriRequestERC721() {
  const baseSheetName = "General"; // Sheet containing the input data
  const outputSheetName = "ERC-721"; // Sheet for output data

  // Get the sheets
  const baseSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(baseSheetName);
  const outputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(outputSheetName)
                      || SpreadsheetApp.getActiveSpreadsheet().insertSheet(outputSheetName);

  if (!baseSheet) {
    throw new Error("Base sheet does not exist!");
  }

  // Retrieve cell values from the Base sheet
  const newBaseURI = baseSheet.getRange("D2").getValue();
  const privateKey = baseSheet.getRange("B9").getValue();
  const contractAddress = baseSheet.getRange("B2").getValue();
  const errorCell = baseSheet.getRange("B14");
  const statusCell = baseSheet.getRange("B19");

  // Ethereum hash validation regex
  const ethHashRegex = /^0x[a-fA-F0-9]{40}$/;

  // Validate input
  if (!newBaseURI) {
    errorCell.setValue("Error: New Base URI in D2 is missing.");
    return;
  }
  if (!ethHashRegex.test(contractAddress)) {
    errorCell.setValue("Error: Invalid 'contractAddress' in B2.");
    return;
  }
  if (!privateKey) {
    errorCell.setValue("Error: Private key in B9 is missing.");
    return;
  }

  // Clear error cell if validations pass
  errorCell.setValue("");

  // Create POST request payload
  const payload = {
    newBaseURI: newBaseURI,
    privateKey: privateKey,
    contractAddress: contractAddress,
  };

  const url = "https://f48l3fwh28.execute-api.us-east-1.amazonaws.com/basicChangeUri";

  try {
    // Make POST request
    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    });

    // Parse response
    const responseData = JSON.parse(response.getContentText());
    const message = responseData.message || "No message";
    const currentBaseURI = responseData.currentBaseURI || "Unknown";
    const updatedBaseURI = responseData.newBaseURI || "Unknown";
    const transactionHash = responseData.transactionHash || "";

    // Clear the output sheet and create a table for the response
    outputSheet.clear();
    outputSheet.appendRow(["Change URI Results"]); // Header
    outputSheet.appendRow(["Message", "Current Base URI", "New Base URI", "Transaction Hash"]); // Column headers
    outputSheet.getRange(1, 1, 1, 4).setFontWeight("bold"); // Style headers

    // Add response data
    outputSheet.getRange(2, 1).setValue(message); // Add the message
    outputSheet.getRange(2, 2).setValue(currentBaseURI); // Add current base URI
    outputSheet.getRange(2, 3).setValue(updatedBaseURI); // Add new base URI
    if (transactionHash) {
      const url = `https://amoy.polygonscan.com/tx/${transactionHash}`;
      outputSheet.getRange(2, 4).setFormula(`=HYPERLINK("${url}", "${transactionHash}")`); // Add hyperlink
    }

    statusCell.setValue("Proceso finalizado sin errores, ver la hoja ERC-721 para mas detalles")

  } catch (error) {
    // Handle request errors
    const errorMessage = error.message || "";

    if (errorMessage.includes("invalid private key")) {
      // Specific error for private key
      errorCell.setValue("La llave privada no es válida, verifica nuevamente");
    } else {
      // General error
      errorCell.setValue(`Error: ${error.message}`);
    }
  }
}

function sendChangeUriRequestERC1155() {
  const baseSheetName = "General"; // Sheet containing the input data
  const outputSheetName = "ERC-1155"; // Sheet for output data

  // Get the sheets
  const baseSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(baseSheetName);
  const outputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(outputSheetName)
                      || SpreadsheetApp.getActiveSpreadsheet().insertSheet(outputSheetName);

  if (!baseSheet) {
    throw new Error("Base sheet does not exist!");
  }

  // Retrieve cell values from the Base sheet
  const newBaseURI = baseSheet.getRange("D4").getValue();
  const privateKey = baseSheet.getRange("B9").getValue();
  const contractAddress = baseSheet.getRange("B4").getValue();
  const errorCell = baseSheet.getRange("B14");
  const statusCell = baseSheet.getRange("B19");


  // Ethereum hash validation regex
  const ethHashRegex = /^0x[a-fA-F0-9]{40}$/;

  // Validate input
  if (!newBaseURI) {
    errorCell.setValue("Error: New Base URI in D2 is missing.");
    return;
  }
  if (!ethHashRegex.test(contractAddress)) {
    errorCell.setValue("Error: Invalid 'contractAddress' in B2.");
    return;
  }
  if (!privateKey) {
    errorCell.setValue("Error: Private key in B9 is missing.");
    return;
  }

  // Clear error cell if validations pass
  errorCell.setValue("");

  // Create POST request payload
  const payload = {
    newBaseURI: newBaseURI,
    privateKey: privateKey,
    contractAddress: contractAddress,
  };

  const url = "https://f48l3fwh28.execute-api.us-east-1.amazonaws.com/basicChangeUri";

  try {
    // Make POST request
    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    });

    // Parse response
    const responseData = JSON.parse(response.getContentText());
    const message = responseData.message || "No message";
    const currentBaseURI = responseData.currentBaseURI || "Unknown";
    const updatedBaseURI = responseData.newBaseURI || "Unknown";
    const transactionHash = responseData.transactionHash || "";

    // Clear the output sheet and create a table for the response
    outputSheet.clear();
    outputSheet.appendRow(["Change URI Results"]); // Header
    outputSheet.appendRow(["Message", "Current Base URI", "New Base URI", "Transaction Hash"]); // Column headers
    outputSheet.getRange(1, 1, 1, 4).setFontWeight("bold"); // Style headers

    // Add response data
    outputSheet.getRange(2, 1).setValue(message); // Add the message
    outputSheet.getRange(2, 2).setValue(currentBaseURI); // Add current base URI
    outputSheet.getRange(2, 3).setValue(updatedBaseURI); // Add new base URI
    if (transactionHash) {
      const url = `https://amoy.polygonscan.com/tx/${transactionHash}`;
      outputSheet.getRange(2, 4).setFormula(`=HYPERLINK("${url}", "${transactionHash}")`); // Add hyperlink
    }

    statusCell.setValue("Proceso finalizado sin errores, ver la hoja ERC-1155 para mas detalles")

  } catch (error) {
    // Handle request errors
    const errorMessage = error.message || "";

    if (errorMessage.includes("invalid private key")) {
      // Specific error for private key
      errorCell.setValue("La llave privada no es válida, verifica nuevamente");
    } else {
      // General error
      errorCell.setValue(`Error: ${error.message}`);
    }
  }
}
