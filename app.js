const CREATE_BOOKING_URL = "https://mwekjjgrllkqnvesdcvt.supabase.co/functions/v1/create-booking";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZWtqamdybGxrcW52ZXNkY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDU4NzIsImV4cCI6MjA4ODgyMTg3Mn0.AlHmv252NwDbf14AfB2LZ_g9ez4IHy37ZkSfBxpgy0k";
const RATE_PER_NIGHT = 300;
const FLAT_DEPOSIT = 100;
const WHATSAPP_LINK = "https://wasap.my/6014-3388944/DiniesHomestay";
const STORAGE_KEY = "homestay_bookings_v1";
const DRAFT_KEY = "homestay_booking_draft_v2";
const LAST_BOOKING_KEY = "homestay_booking_last_v1";

const currentPage = document.body?.dataset.page || "landing";

function loadBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to parse bookings", error);
    return [];
  }
}

function saveBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function storeDraft(data) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

function loadDraft() {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

function storeLastBooking(data) {
  sessionStorage.setItem(LAST_BOOKING_KEY, JSON.stringify(data));
}

function loadLastBooking() {
  const raw = sessionStorage.getItem(LAST_BOOKING_KEY);
  return raw ? JSON.parse(raw) : null;
}

function formatRM(value) {
  const amount = Number(value || 0);
  return `RM ${amount.toFixed(2)}`;
}

function toDate(value) {
  return new Date(`${value}T00:00:00`);
}

function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = toDate(checkIn);
  const end = toDate(checkOut);
  const diff = (end - start) / (1000 * 60 * 60 * 24);
  return diff > 0 ? diff : 0;
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function getActiveBookings() {
  return loadBookings().filter((booking) => booking.status !== "Cancelled");
}

function getBlockedRanges() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getActiveBookings()
    .filter((booking) => toDate(booking.checkOut) > today)
    .map((booking) => ({
      code: booking.code,
      start: booking.checkIn,
      end: booking.checkOut,
    }));
}

function findConflict(checkInValue, checkOutValue) {
  if (!checkInValue || !checkOutValue) return null;
  const start = toDate(checkInValue);
  const end = toDate(checkOutValue);
  return getActiveBookings().find((booking) =>
    rangesOverlap(start, end, toDate(booking.checkIn), toDate(booking.checkOut))
  );
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function createBookingCode() {
  const partA = Date.now().toString(36).slice(-4).toUpperCase();
  const partB = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `SD-${partA}${partB}`;
}

function whatsappLink() {
  return WHATSAPP_LINK;
}

function setYear() {
  const node = document.getElementById("year");
  if (node) {
    node.textContent = new Date().getFullYear();
  }
}

function attachChatButtons() {
  const buttons = document.querySelectorAll(".chat-owner");
  buttons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event?.preventDefault?.();
      window.open(whatsappLink(), "_blank");
    });
  });
}

function initLandingPage() {
  const locationColumns = document.querySelector("[data-location-columns]");
  const toggleButton = document.querySelector("[data-toggle-locations]");

  if (locationColumns && toggleButton) {
    const toggleWrapper = toggleButton.closest(".location-toggle");
    let collapsed = true;
    const mq = window.matchMedia("(max-width: 640px)");

    function updateCollapseState() {
      if (!mq.matches) {
        locationColumns.classList.remove("collapsed");
        collapsed = true;
        if (toggleWrapper) toggleWrapper.hidden = true;
        toggleButton.textContent = "Lihat semua lokasi";
        return;
      }

      if (toggleWrapper) toggleWrapper.hidden = false;
      locationColumns.classList.toggle("collapsed", collapsed);
      toggleButton.textContent = collapsed ? "Lihat semua lokasi" : "Sembunyi lokasi";
    }

    toggleButton.addEventListener("click", () => {
      collapsed = !collapsed;
      locationColumns.classList.toggle("collapsed", collapsed);
      toggleButton.textContent = collapsed ? "Lihat semua lokasi" : "Sembunyi lokasi";
    });

    if (mq.addEventListener) {
      mq.addEventListener("change", updateCollapseState);
    } else if (mq.addListener) {
      mq.addListener(updateCollapseState);
    }
    updateCollapseState();
  }

  const galleryTrack = document.querySelector("[data-gallery-track]");
  const prevBtn = document.querySelector("[data-gallery-prev]");
  const nextBtn = document.querySelector("[data-gallery-next]");

  if (galleryTrack && prevBtn && nextBtn) {
    const scrollStep = () => Math.max(280, galleryTrack.clientWidth * 0.9);

    function updateNavState() {
      const maxScroll = Math.max(0, galleryTrack.scrollWidth - galleryTrack.clientWidth - 2);
      prevBtn.disabled = galleryTrack.scrollLeft <= 0;
      nextBtn.disabled = galleryTrack.scrollLeft >= maxScroll;
    }

    prevBtn.addEventListener("click", () => {
      galleryTrack.scrollBy({ left: -scrollStep(), behavior: "smooth" });
    });

    nextBtn.addEventListener("click", () => {
      galleryTrack.scrollBy({ left: scrollStep(), behavior: "smooth" });
    });

    galleryTrack.addEventListener("scroll", updateNavState, { passive: true });
    window.addEventListener("resize", updateNavState);
    requestAnimationFrame(updateNavState);
  }
}

function initBookingPage() {
  const form = document.getElementById("bookingStepForm");
  if (!form) return;

  const checkInInput = document.getElementById("checkIn");
  const checkOutInput = document.getElementById("checkOut");
  const summaryNights = document.getElementById("summaryNights");
  const summaryTotal = document.getElementById("summaryTotal");
  const notice = document.getElementById("dateNotice");
  const blockedList = document.getElementById("blockedDatesList");

  const today = new Date().toISOString().split("T")[0];
  if (checkInInput) checkInInput.min = today;
  if (checkOutInput) checkOutInput.min = today;

  const blocked = getBlockedRanges();
  const blockedDateSet = buildBlockedDateSet(blocked);
  if (blocked.length && blockedList) {
    blockedList.innerHTML = blocked
      .map((range) => `<span>${formatDate(range.start)} → ${formatDate(range.end)}</span>`)
      .join("");
  }

  let checkInPicker = null;
  let checkOutPicker = null;

  if (typeof flatpickr === "function" && checkInInput && checkOutInput) {
    const sharedOptions = {
      altInput: true,
      altFormat: "d M Y",
      dateFormat: "Y-m-d",
      minDate: today,
      disable: [
        (date) => isBlockedDate(date),
      ],
      onDayCreate: (_dObj, _dStr, fp, dayElem) => {
        if (isBlockedDate(dayElem.dateObj)) {
          dayElem.classList.add("reserved-date");
        }
      },
    };

    checkInPicker = flatpickr(checkInInput, {
      ...sharedOptions,
      onChange: (selectedDates) => {
        if (selectedDates[0]) {
          const nextDay = new Date(selectedDates[0]);
          nextDay.setDate(nextDay.getDate() + 1);
          checkOutPicker?.set("minDate", nextDay);
        }
        checkInInput.dispatchEvent(new Event("change", { bubbles: true }));
      },
    });

    checkOutPicker = flatpickr(checkOutInput, {
      ...sharedOptions,
      onChange: () => {
        checkOutInput.dispatchEvent(new Event("change", { bubbles: true }));
      },
    });
  }

  const existingDraft = loadDraft();
  if (existingDraft) {
    const fieldMap = {
      fullName: "fullName",
      checkIn: "checkIn",
      checkOut: "checkOut",
      guestCount: "guestCount",
      adultCount: "adultCount",
      childCount: "childCount",
      vehicleCount: "vehicleCount",
      stayPurpose: "stayPurpose",
      phoneNumber: "phoneNumber",
    };

    Object.entries(fieldMap).forEach(([key, id]) => {
      const field = document.getElementById(id);
      if (field && existingDraft[key] !== undefined && existingDraft[key] !== null) {
        field.value = existingDraft[key];
      }
    });

    if (existingDraft.checkIn) {
      checkInPicker?.setDate(existingDraft.checkIn, false);
      const minCheckout = new Date(existingDraft.checkIn);
      minCheckout.setDate(minCheckout.getDate() + 1);
      checkOutInput.min = minCheckout.toISOString().split("T")[0];
      checkOutPicker?.set("minDate", minCheckout);
    }

    if (existingDraft.checkOut) {
      checkOutPicker?.setDate(existingDraft.checkOut, false);
    }

    updateSummary();
  }

  function toISODateString(dateObj) {
    if (!(dateObj instanceof Date)) return "";
    const offset = dateObj.getTimezoneOffset();
    const adjusted = new Date(dateObj.getTime() - offset * 60000);
    return adjusted.toISOString().slice(0, 10);
  }

  function buildBlockedDateSet(ranges) {
    const dates = new Set();
    ranges.forEach((range) => {
      if (!range?.start || !range?.end) return;
      const cursor = toDate(range.start);
      const end = toDate(range.end);
      while (cursor < end) {
        dates.add(toISODateString(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return dates;
  }

  function isBlockedDate(value) {
    if (!value) return false;
    const key = value instanceof Date ? toISODateString(value) : value;
    return blockedDateSet.has(key);
  }

  function updateSummary() {
    const nights = calculateNights(checkInInput.value, checkOutInput.value);
    summaryNights.textContent = `${nights} malam`;
    summaryTotal.textContent = formatRM(nights * RATE_PER_NIGHT);
  }

  function showNotice(message) {
    if (!notice) return;
    notice.textContent = message;
    notice.classList.toggle("hidden", !message);
  }

  function validateDates() {
    if (!checkInInput.value || !checkOutInput.value) {
      showNotice("");
      return false;
    }

    const nights = calculateNights(checkInInput.value, checkOutInput.value);
    if (nights < 1) {
      showNotice("Tarikh keluar mesti selepas tarikh masuk.");
      return false;
    }

    const conflict = findConflict(checkInInput.value, checkOutInput.value);
    if (conflict) {
      showNotice(
        `Tarikh dipilih bertembung dengan tempahan ${conflict.code} (${formatDate(
          conflict.checkIn
        )} → ${formatDate(conflict.checkOut)}). Sila pilih tarikh lain.`
      );
      return false;
    }

    showNotice("");
    return true;
  }

  checkInInput.addEventListener("change", () => {
    if (checkInInput.value) {
      const nextDay = new Date(checkInInput.value);
      nextDay.setDate(nextDay.getDate() + 1);
      checkOutInput.min = nextDay.toISOString().split("T")[0];
      checkOutPicker?.set("minDate", nextDay);
      if (checkOutInput.value && checkOutInput.value <= checkInInput.value) {
        checkOutInput.value = "";
        checkOutPicker?.clear();
      }
    }
    validateDates();
    updateSummary();
  });

  checkOutInput.addEventListener("change", () => {
    validateDates();
    updateSummary();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateDates()) {
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const nights = calculateNights(data.checkIn, data.checkOut);

    const payload = {
      fullName: data.fullName.trim(),
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guestCount: Number(data.guestCount || 0),
      adultCount: Number(data.adultCount || 0),
      childCount: Number(data.childCount || 0),
      vehicleCount: Number(data.vehicleCount || 0),
      stayPurpose: data.stayPurpose?.trim() || "",
      phoneNumber: data.phoneNumber.trim(),
      nights,
      total: nights * RATE_PER_NIGHT,
    };

    storeDraft(payload);
    window.location.href = "payment.html";
  });

  updateSummary();
}

function initPaymentPage() {
  const summaryCard = document.getElementById("bookingSummary");
  const form = document.getElementById("paymentForm");
  if (!form || !summaryCard) return;

  const draft = loadDraft();
  if (!draft) {
    window.location.replace("booking.html");
    return;
  }

  const payNowNode = document.getElementById("payNowAmount");
  const balanceNode = document.getElementById("balanceAmount");
  const alertBox = document.getElementById("paymentAlert");
  const receiptInput = document.getElementById("paymentReceipt");

  summaryCard.innerHTML = `
    <h2>Ringkasan tempahan</h2>
    <div class="summary-row">
      <span>Nama</span><strong>${draft.fullName}</strong>
    </div>
    <div class="summary-row">
      <span>Tarikh</span><strong>${formatDate(draft.checkIn)} → ${formatDate(draft.checkOut)}</strong>
    </div>
    <div class="summary-row">
      <span>Malam</span><strong>${draft.nights}</strong>
    </div>
    <div class="summary-row">
      <span>Jumlah tetamu</span><strong>${draft.guestCount} orang</strong>
    </div>
    <div class="summary-row">
      <span>Jumlah</span><strong class="highlight">${formatRM(draft.total)}</strong>
    </div>
  `;

  function computeValues(option) {
    const deposit = Math.min(FLAT_DEPOSIT, draft.total);
    const payNow = option === "deposit" ? deposit : draft.total;
    const balance = Math.max(draft.total - payNow, 0);
    return { payNow, balance };
  }

  function updateBreakdown(option) {
    const values = computeValues(option);
    payNowNode.textContent = formatRM(values.payNow);
    balanceNode.textContent = formatRM(values.balance);
    document
      .querySelectorAll(".option-tile")
      .forEach((tile) => tile.classList.toggle("active", tile.querySelector("input").value === option));
  }

  form.addEventListener("change", (event) => {
    if (event.target.name === "paymentOption") {
      updateBreakdown(event.target.value);
      alertBox?.classList.add("hidden");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const option = (new FormData(form).get("paymentOption") || "deposit").toString();

    if (!receiptInput.files.length) {
      alertBox.textContent = "Sila muat naik resit pembayaran terlebih dahulu.";
      alertBox.classList.remove("hidden");
      return;
    }

    const { payNow, balance } = computeValues(option);
    const payload = {
      fullName: draft.fullName,
      phoneNumber: draft.phoneNumber,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      nights: draft.nights,
      guestCount: draft.guestCount,
      adultCount: draft.adultCount,
      childCount: draft.childCount,
      vehicleCount: draft.vehicleCount,
      stayPurpose: draft.stayPurpose,
      total: draft.total,
      payNow,
      balance,
      paymentOption: option,
    };

    const submitButton = form.querySelector("[type='submit']");
    submitButton?.setAttribute("disabled", "true");
    submitButton?.classList.add("is-loading");
    alertBox?.classList.add("hidden");

    try {
      const response = await fetch(CREATE_BOOKING_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const data = await response.json();

      storeLastBooking({
        code: data.code,
        name: draft.fullName,
        paymentOption: option,
        balance,
        total: draft.total,
        nights: draft.nights,
        checkIn: draft.checkIn,
        checkOut: draft.checkOut,
        payNow,
      });

      clearDraft();
      window.location.href = "confirmation.html";
    } catch (error) {
      alertBox.textContent = "Tidak dapat hantar tempahan. Sila cuba lagi.";
      alertBox.classList.remove("hidden");
      console.error(error);
    } finally {
      submitButton?.removeAttribute("disabled");
      submitButton?.classList.remove("is-loading");
    }
  });

  updateBreakdown("deposit");
}

function initConfirmationPage() {
  const box = document.getElementById("confirmationBox");
  if (!box) return;

  const booking = loadLastBooking();
  if (!booking) {
    box.innerHTML = `
      <h1>Tiada tempahan ditemui</h1>
      <p class="muted">Sila mulakan semula tempahan.</p>
      <a class="btn primary" href="booking.html">Buka borang tempahan</a>
    `;
    return;
  }

  const balanceMessage =
    booking.paymentOption === "deposit"
      ? "Sila langsaikan baki sebelum check-in dan simpan resit untuk pengesahan."
      : "Tiada baki. Kami akan sahkan tempahan anda melalui WhatsApp.";

  box.innerHTML = `
    <h1>Tempahan diterima</h1>
    <p class="muted">Kami akan menyemak resit anda dalam masa terdekat.</p>
    <div class="code-pill">${booking.code}</div>
    <p><strong>Nama:</strong> ${booking.name}</p>
    <p><strong>Tarikh:</strong> ${formatDate(booking.checkIn)} → ${formatDate(booking.checkOut)}</p>
    <p><strong>Jumlah bayar:</strong> ${formatRM(booking.total)}</p>
    <p class="notice">${balanceMessage}</p>
  `;
}

setYear();
attachChatButtons();

if (currentPage === "landing") {
  initLandingPage();
}

if (currentPage === "booking") {
  initBookingPage();
}

if (currentPage === "payment") {
  initPaymentPage();
}

if (currentPage === "confirmation") {
  initConfirmationPage();
}
