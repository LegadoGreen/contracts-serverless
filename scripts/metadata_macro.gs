/** @OnlyCurrentDoc */

function createMetadataFiles() {
  const sheetMain = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("main");
  const sheetMetadata = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("metadata-creation");

  // Get the file number from cell B2
  const fileNumber = sheetMain.getRange("B2").getValue();

  if (!fileNumber) {
    SpreadsheetApp.getUi().alert("File number in B2 is empty. Please provide a valid file number.");
    return;
  }

  const url = "https://f48l3fwh28.execute-api.us-east-1.amazonaws.com/createMetadataFiles";
  const payload = JSON.stringify({ fileNumber: fileNumber });
  const options = {
    method: "post",
    contentType: "application/json",
    payload: payload
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      // Success: Save the .zip file and display success message
      const blob = response.getBlob(); // Get the zip file as a blob
      const file = DriveApp.createFile(blob); // Save it to Google Drive

      // Notify success
      sheetMain.getRange("B19").setValue("Metadata files created successfully!");

      // Update A2 on metadata-creation sheet with the file's download link
      const fileUrl = file.getUrl();
      sheetMetadata.getRange("A2").setValue(fileUrl);
    } else {
      // Error: Display the error message in B14
      const errorMessage = response.getContentText();
      sheetMain.getRange("B14").setValue(`Error: ${errorMessage}`);
    }
  } catch (error) {
    // Handle exceptions
    sheetMain.getRange("B14").setValue(`Error: ${error.message}`);
  }
}

function editMetadataFiles() {
  const sheetMain = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("main");
  const sheetEdit = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("metadata-edit");

  // Get inputs from the main sheet
  const fileLink = sheetMain.getRange("C3").getValue(); // File link from Google Drive
  const numberOfEdits = sheetMain.getRange("E3").getValue(); // Number of edits
  const previousHash = sheetMain.getRange("D3").getValue(); // Previous hash

  if (!fileLink || !numberOfEdits || !previousHash) {
    sheetMain.getRange("B14").setValue("Error: One or more required fields (C3, D3, E3) are empty.");
    return;
  }

  // Extract the file ID from the URL
  const fileId = extractFileId(fileLink);
  if (!fileId) {
    sheetMain.getRange("B14").setValue("Error: Invalid Google Drive file link.");
    return;
  }

  try {
    // Get the file from Google Drive
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();

    // Prepare the multipart request
    const url = "https://f48l3fwh28.execute-api.us-east-1.amazonaws.com/editMetadataFiles";
    const formData = {
      file: blob,
      numberOfEdits: numberOfEdits.toString(),
      previousHash: previousHash
    };

    const options = {
      method: "post",
      payload: formData,
      muteHttpExceptions: true
    };

    // Make the POST request
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      // Success: Save the returned .zip file and display success message
      const responseBlob = response.getBlob();
      const savedFile = DriveApp.createFile(responseBlob);

      // Notify success
      sheetMain.getRange("B19").setValue("Metadata files edited successfully!");

      // Update A2 on metadata-edit sheet with the file's download link
      const fileUrl = savedFile.getUrl();
      sheetEdit.getRange("A2").setValue(fileUrl);
    } else {
      // Error: Display the error message in B14
      const errorMessage = response.getContentText();
      sheetMain.getRange("B14").setValue(`Error: ${errorMessage}`);
    }
  } catch (error) {
    // Handle exceptions
    sheetMain.getRange("B14").setValue(`Error: ${error.message}`);
  }
}

function convertMetadataFolderToIpfs() {
  const sheetMain = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("main");
  const sheetIpfs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("metadata-IPFS");

  // Get inputs from the main sheet
  const fileLink = sheetMain.getRange("C4").getValue(); // File link from Google Drive

  if (!fileLink) {
    sheetMain.getRange("B14").setValue("Error: C4 is empty. Please provide a valid Google Drive file link.");
    return;
  }

  // Extract the file ID from the URL
  const fileId = extractFileId(fileLink);
  if (!fileId) {
    sheetMain.getRange("B14").setValue("Error: Invalid Google Drive file link.");
    return;
  }

  try {
    // Get the file from Google Drive
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();

    // Prepare the multipart request
    const url = "https://f48l3fwh28.execute-api.us-east-1.amazonaws.com/convertMetadataFolderToIpfs";
    const formData = {
      file: blob
    };

    const options = {
      method: "post",
      payload: formData,
      muteHttpExceptions: true
    };

    // Make the POST request
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      // Success: Parse the JSON response
      const responseData = JSON.parse(response.getContentText());

      // Populate the metadata-IPFS sheet with the response data
      sheetIpfs.getRange("A1").setValue("Message");
      sheetIpfs.getRange("B1").setValue("IPFS Hash");
      sheetIpfs.getRange("C1").setValue("IPFS URL");

      sheetIpfs.getRange("A2").setValue(responseData.message);
      sheetIpfs.getRange("B2").setValue(responseData.ipfsHash);
      sheetIpfs.getRange("C2").setValue(responseData.ipfsUrl);

      // Notify success
      sheetMain.getRange("B19").setValue("Metadata folder converted to IPFS successfully!");
    } else {
      // Error: Display the error message in B14
      const errorMessage = response.getContentText();
      sheetMain.getRange("B14").setValue(`Error: ${errorMessage}`);
    }
  } catch (error) {
    // Handle exceptions
    sheetMain.getRange("B14").setValue(`Error: ${error.message}`);
  }
}

// Helper function to extract the file ID from a Google Drive file link
function extractFileId(fileLink) {
  const regex = /\/d\/([a-zA-Z0-9_-]+)/;
  const match = fileLink.match(regex);
  return match ? match[1] : null;
}


