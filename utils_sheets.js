const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function getTextsByLanguage(language) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const range = 'Texts!A:C';

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) return [];

  return rows
    .filter((row) => row[1] && row[1].toLowerCase() === language.toLowerCase())
    .map((row) => ({ id: row[0], language: row[1], text: row[2] }));
}

module.exports = { getTextsByLanguage };
