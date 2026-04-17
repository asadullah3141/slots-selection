// app/actions/getSlots.ts
"use server";

import { google } from "googleapis";

export async function getSlotAvailability() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    
    // Fetch all rows from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:D", // Adjust to match your sheet name
    });

    const rows = response.data.values || [];
    
    // Skip header row if it exists, then count occurrences of each SlotID
    const counts: Record<string, number> = {};
    
    rows.slice(1).forEach((row) => {
      const slotId = row[2]; // Column C
      counts[slotId] = (counts[slotId] || 0) + 1;
    });

    return { success: true, counts };
  } catch (error) {
    console.error("Fetch error:", error);
    return { success: false, counts: {} };
  }
}