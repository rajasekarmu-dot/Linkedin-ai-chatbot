import { linkedInClient } from '../lib/linkedin';
import { whatsAppClient } from '../lib/whatsapp';

async function main() {
  try {
    console.log("Sending LinkedIn Post...");
    // Inject mock tokens if no real ones exist in .env to ensure the test works
    if (!process.env.LINKEDIN_ACCESS_TOKEN) process.env.LINKEDIN_ACCESS_TOKEN = 'mock_token';
    if (!process.env.WHATSAPP_ACCESS_TOKEN) process.env.WHATSAPP_ACCESS_TOKEN = 'mock_token';
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID) process.env.WHATSAPP_PHONE_NUMBER_ID = 'mock_id';
    
    const postResult = await linkedInClient.createPost(
      "Ready to scale your business? Click our WhatsApp link to start! https://wa.me/1234567890"
    );
    console.log("LinkedIn Post Result:", postResult);

    console.log("\nSending WhatsApp Message...");
    const waResult = await whatsAppClient.sendMessage(
      "1234567890", 
      "Hello! This is a test message from the AI Assistant."
    );
    console.log("WhatsApp Send Result:", waResult);

  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

main();
