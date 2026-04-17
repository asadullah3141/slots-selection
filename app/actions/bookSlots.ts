"use server";
import { google } from "googleapis";
import { SLOTS } from "@/app/data/slots";

export async function bookSlot(formData: { fullName: string; slotId: number; slotTime: string }) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // 1. Fetch current bookings
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A:C", 
    });

    const rows = response.data.values || [];
    const currentBookings = rows.filter(row => row[2] === formData.slotId.toString()).length;

    // 2. Find the specific quota for this slot ID
    const selectedSlotConfig = SLOTS.find(s => s.id === formData.slotId);
    if (!selectedSlotConfig) throw new Error("Invalid slot selected.");

    if (currentBookings >= selectedSlotConfig.quota) {
      throw new Error(`The ${selectedSlotConfig.time} slot is now full.`);
    }

    // 3. Append data
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[new Date().toLocaleString(), formData.fullName, formData.slotId, formData.slotTime]],
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}