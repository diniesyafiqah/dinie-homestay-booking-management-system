import {serve} from "https://deno.land/std@0.177.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("BOOKING_SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("BOOKING_SERVICE_ROLE_KEY")!;
const adminToken = Deno.env.get("ADMIN_API_TOKEN") || "";
console.log("ADMIN TOKEN ENV", adminToken);

const supabase = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-token, apikey",
};

serve(async (req) => {
  // Add CORS headers to all responses
  const responseHeaders = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", {headers: responseHeaders});
  }

  // TEMPORARY: skip auth for testing
  // const token = req.headers.get("x-admin-token");
  // if (!token || token !== adminToken) {
  //   return new Response(JSON.stringify({error: "Unauthorized"}), {status: 401, headers: responseHeaders});
  // }

  if (req.method === "GET") {
    const {data, error} = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", {ascending: false});

    if (error) {
      console.error(error);
      return new Response(JSON.stringify({error: "Failed to load bookings"}), {
        status: 500,
        headers: responseHeaders,
      });
    }

    const normalized = (data || []).map(normalizeBooking);
    return new Response(JSON.stringify(normalized), {headers: responseHeaders});
  }

  if (req.method === "PATCH") {
    const body = await req.json().catch(() => null);
    if (!body?.code || !body?.status) {
      return new Response(JSON.stringify({error: "code and status required"}), {
        status: 400,
        headers: responseHeaders,
      });
    }

    const allowedStatuses = new Set(["pending", "confirmed", "cancelled"]);
    if (!allowedStatuses.has(String(body.status).toLowerCase())) {
      return new Response(JSON.stringify({error: "Status tidak sah"}), {
        status: 400,
        headers: responseHeaders,
      });
    }

    console.log("Updating booking:", body.code, "to status:", body.status);

    const {data, error} = await supabase
      .from("bookings")
      .update({
        status: String(body.status).toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq("code", body.code)
      .select("*");

    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify({error: "Tidak dapat kemas kini status", details: error.message}), {
        status: 500,
        headers: responseHeaders,
      });
    }

    if (!data || data.length === 0) {
      console.error("No booking found with code:", body.code);
      return new Response(JSON.stringify({error: "Booking not found"}), {
        status: 404,
        headers: responseHeaders,
      });
    }

    return new Response(JSON.stringify(normalizeBooking(data[0])), {headers: responseHeaders});
  }

  return new Response(JSON.stringify({error: "Method not allowed"}), {
    status: 405,
    headers: responseHeaders,
  });
});

function normalizeBooking(row: Record<string, unknown>) {
  const record = row as Record<string, any>;
  return {
    code: record.code,
    fullName: record.full_name,
    phoneNumber: record.phone,
    stayPurpose: record.stay_purpose,
    checkIn: record.check_in,
    checkOut: record.check_out,
    nights: record.nights,
    guestCount: record.guest_count,
    adultCount: record.adult_count,
    childCount: record.child_count,
    vehicleCount: record.vehicle_count,
    total: record.total,
    payNow: record.pay_now,
    balance: record.balance,
    paymentOption: record.payment_option,
    status: record.status || "pending",
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}
