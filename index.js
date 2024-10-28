import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

app.use(bodyParser.json());

// Root Route
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

// WhatsApp Webhook Endpoint
app.post("/webhook", async (req, res) => {
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const phone_number_id =
    req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

  if (message && message.text) {
    console.log(message);
    console.log(phone_number_id);
    const userMessage = message.text.body;
    const from = message.from;

    try {
      // Send user message to OpenAI API
      const openaiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a whats app assistant chatbot" },
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      const aiResponse = openaiResponse.choices[0].message.content;

      // Send the response back to the user on WhatsApp
      const whatsappUrl = `https://graph.facebook.com/v16.0/${phone_number_id}/messages`;

      await fetch(whatsappUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          text: { body: aiResponse },
        }),
      });
    } catch (error) {
      console.error("Error sending message:", error.message);
    }
  }
  res.sendStatus(200);
});

// WhatsApp Webhook Verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // check the mode and token sent are correct
  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    // respond with 200 OK and challenge token from the request
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    // respond with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const sendWhatsAppMessage = async () => {
  const url = "https://graph.facebook.com/v21.0/489350484253608/messages";

  const headers = {
    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    "Content-Type": "application/json",
  };

  const body = {
    messaging_product: "whatsapp",
    to: "919893490505",
    type: "template",
    template: {
      name: "hello_world",
      language: {
        code: "en_US",
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Message sent successfully:", data);
    } else {
      console.error("Error sending message:", data);
    }
  } catch (error) {
    console.error("Request failed:", error.message);
  }
};
