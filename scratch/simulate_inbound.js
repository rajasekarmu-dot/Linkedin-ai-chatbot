const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "mock_waba_id",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "1111111111",
              phone_number_id: "2222222222"
            },
            contacts: [
              {
                profile: {
                  name: "John Doe"
                },
                wa_id: "19876543210"
              }
            ],
            messages: [
              {
                from: "19876543210",
                id: `wamid.mock.${Date.now()}`,
                timestamp: String(Math.floor(Date.now() / 1000)),
                text: {
                  body: "Hey! I saw your post on LinkedIn. How does the $10 session work?"
                },
                type: "text"
              }
            ]
          }
        }
      ]
    }
  ]
};

async function simulateWebhook() {
  try {
    console.log("Simulating INBOUND WhatsApp message from user 'John Doe'...");
    
    const response = await fetch('http://localhost:3000/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log("Server Webhook Response:", JSON.stringify(data, null, 2));
    
    if (data.aiResponse) {
      console.log("\n💬 AI Assistant Replied:", data.aiResponse);
    }
    
  } catch (err) {
    console.error("Error simulating webhook:", err.message);
  }
}

simulateWebhook();
