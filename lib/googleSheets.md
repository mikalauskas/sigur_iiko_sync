To read data from a Google Sheets table using a public link and convert it into an object in Node.js, you can use the `google-spreadsheet` package. Here's how you can do it step by step:

### Step 1: Install the required package
First, you'll need to install the `google-spreadsheet` package. You can do this by running the following command:

```bash
npm install google-spreadsheet
```

### Step 2: Create a Google Sheet and make it public
1. Open the Google Sheet.
2. Click on **File** > **Share** > **Publish to the web**.
3. Make sure the link is public (Anyone with the link can view).
4. Copy the **Google Sheet ID** from the URL. It's the part between `/d/` and `/edit`.

For example, in the URL `https://docs.google.com/spreadsheets/d/1AbCdEfGHIjKlMnOpQrS/edit`, the Sheet ID is `1AbCdEfGHIjKlMnOpQrS`.

### Step 3: Write the Node.js code

```javascript
const { GoogleSpreadsheet } = require('google-spreadsheet');

// Replace with your Google Sheet ID
const SHEET_ID = 'your-google-sheet-id';

async function accessSpreadsheet() {
    try {
        // Initialize the sheet
        const doc = new GoogleSpreadsheet(SHEET_ID);

        // Load the document (make sure it's public)
        await doc.loadInfo(); // Loads document properties and worksheets

        console.log(`Loaded sheet: ${doc.title}`);

        // Access the first sheet (or use `doc.sheetsById[id]` for other sheets)
        const sheet = doc.sheetsByIndex[0]; // First sheet of the document

        // Load rows
        const rows = await sheet.getRows();

        // Convert rows to an array of objects
        const data = rows.map(row => row._rawData);

        console.log('Data:', data);

        return data; // You can now use the data as a JavaScript object/array
    } catch (error) {
        console.error('Error reading spreadsheet:', error);
    }
}

accessSpreadsheet();
```

### Explanation:
- **GoogleSpreadsheet(SHEET_ID):** Initializes access to the Google Sheet by ID.
- **doc.loadInfo():** Loads information about the document.
- **doc.sheetsByIndex[0]:** Refers to the first sheet in the document.
- **sheet.getRows():** Fetches all rows from the sheet.
- **row._rawData:** Extracts raw data from each row.

### Step 4: Run the code
Run your script with:

```bash
node your-script.js
```

This will print out the sheet's data as an array of objects.

### Additional Notes:
- If the sheet is not public, you'll need to use OAuth for authentication.
- You can modify the code to fetch specific sheets or work with specific columns depending on the structure of your Google Sheet.

Let me know if you need help with further customizations!