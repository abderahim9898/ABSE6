import { RequestHandler } from "express";

export const handleTelegramNotification: RequestHandler = async (req, res) => {
  try {
    const { date, language } = req.query;

    if (!date || typeof date !== "string") {
      return res.status(400).json({
        success: false,
        error: "Date parameter is required",
      });
    }

    const lang = language === "fr" ? "fr" : "en";

    const botToken = "7914915084:AAFy5X26pPqYwDJU84jgBWWRt_7PqgPBvQg";
    const chatId = "-1002697037825";

    const messageText = lang === "fr"
      ? `✅ Suivi des absences complété pour: ${date}`
      : `✅ Absence tracking completed for: ${date}`;

    const message = messageText;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      console.error("Telegram API error:", result);
      return res.status(500).json({
        success: false,
        error: "Failed to send Telegram message",
        details: result,
      });
    }

    res.json({
      success: true,
      message: `Notification sent for ${date}`,
    });
  } catch (err) {
    console.error("Error sending Telegram notification:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
