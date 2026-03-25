import {serve} from "https://deno.land/std@0.177.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("BOOKING_SUPABASE_URL")!;
const serviceKey = Deno.env.get("BOOKING_SERVICE_ROLE_KEY")!;
const telegramBotToken = Deno.env.get("telegram_bot_token");
const telegramChatId = Deno.env.get("telegram_owner_chat_id");

console.log("Telegram setup - Token exists:", !!telegramBotToken, "Chat ID:", telegramChatId);

const supabase = createClient(supabaseUrl, serviceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {headers: corsHeaders});
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({error: "Method not allowed"}),
      {status: 405, headers: corsHeaders},
    );
  }

  const payload = await req.json().catch(() => null);
  if (!payload) {
    return new Response(
      JSON.stringify({error: "Invalid JSON"}),
      {status: 400, headers: corsHeaders},
    );
  }

  const required = ["fullName", "phoneNumber", "checkIn", "checkOut", "nights", "total", "paymentOption"];
  const missing = required.filter((field) => !payload[field]);
  if (missing.length) {
    return new Response(
      JSON.stringify({error: `Missing fields: ${missing.join(", ")}`}),
      {status: 400, headers: corsHeaders},
    );
  }

  const {data, error} = await supabase
    .from("bookings")
    .insert({
      code: generateCode(),
      full_name: payload.fullName,
      phone: payload.phoneNumber,
      stay_purpose: payload.stayPurpose ?? "",
      check_in: payload.checkIn,
      check_out: payload.checkOut,
      nights: Number(payload.nights),
      guest_count: Number(payload.guestCount || 0),
      adult_count: Number(payload.adultCount || 0),
      child_count: Number(payload.childCount || 0),
      vehicle_count: Number(payload.vehicleCount || 0),
      total: Number(payload.total),
      pay_now: Number(payload.payNow || 0),
      balance: Number(payload.balance || 0),
      payment_option: payload.paymentOption,
    })
    .select("code")
    .single();

  if (error) {
    console.error(error);
    return new Response(
      JSON.stringify({error: "Failed to create booking"}),
      {status: 500, headers: corsHeaders},
    );
  }

  // Send Telegram notification to owner
  if (telegramBotToken && telegramChatId) {
    console.log("Sending Telegram notification - Token:", telegramBotToken?.slice(0, 10), "Chat:", telegramChatId);
    const message = `🆕 *Ada Booking Baru!*

📋 Kod Tempahan: \`${data.code}\`
👤 Nama: ${payload.fullName}
📱 No. Tel: ${payload.phoneNumber}

📅 Check-in: ${payload.checkIn}
📅 Check-out: ${payload.checkOut}
🛏️ Malam: ${payload.nights}

💰 Jumlah: RM ${Number(payload.total).toFixed(2)}
💵 Bayar Sekarang: RM ${Number(payload.payNow || 0).toFixed(2)}
⚖️ Baki: RM ${Number(payload.balance || 0).toFixed(2)}

💳 Kaedah Pembayaran: ${payload.paymentOption}`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "👉 Buka Admin Panel",
            url: "https://dinieshomestay.com/admin/",
          },
        ],
      ],
    };

    sendTelegramMessage(message, keyboard).catch((err) => {
      console.error("Failed to send Telegram notification:", err);
    });
  } else {
    console.warn("Telegram not configured - Token:", !!telegramBotToken, "Chat:", !!telegramChatId);
  }

  return new Response(
    JSON.stringify({code: data.code}),
    {status: 200, headers: corsHeaders},
  );
});

async function sendTelegramMessage(message: string, keyboard?: Record<string, unknown>) {
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  const body: Record<string, unknown> = {
    chat_id: telegramChatId,
    text: message,
    parse_mode: "Markdown",
  };

  if (keyboard) {
    body.reply_markup = keyboard;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Telegram API error:", error);
    throw new Error("Failed to send Telegram message");
  }
}

function generateCode() {
  const partA = Date.now().toString(36).slice(-4).toUpperCase();
  const partB = crypto.randomUUID().slice(0, 2).toUpperCase();
  return `SD-${partA}${partB}`;
}