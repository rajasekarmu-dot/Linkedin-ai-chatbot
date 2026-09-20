import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({
  version: "v3",
  auth: oauth2Client,
});

export async function createBooking(params: {
  name: string;
  email?: string;
  phone?: string;
  start: string;
  end: string;
}) {
  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `Session with ${params.name}`,
      description: `
Lead Name: ${params.name}
Phone: ${params.phone || ""}
Email: ${params.email || ""}
Booked through WhatsApp AI chatbot
      `.trim(),
      start: {
        dateTime: params.start,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: params.end,
        timeZone: "Asia/Kolkata",
      },
      attendees: params.email ? [{ email: params.email }] : undefined,
    },
  });

  return response.data;
}

export async function isSlotAvailable(start: string, end: string): Promise<boolean> {
  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: start,
    timeMax: end,
    singleEvents: true,
  });

  const events = response.data.items;
  return !events || events.length === 0;
}
