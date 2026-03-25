const CREATE_BOOKING_URL = "https://mwekjjgrllkqnvesdcvt.supabase.co/functions/v1/create-booking";
const ADMIN_BOOKINGS_URL = "https://mwekjjgrllkqnvesdcvt.supabase.co/functions/v1/admin-bookings";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZWtqamdybGxrcW52ZXNkY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDU4NzIsImV4cCI6MjA4ODgyMTg3Mn0.AlHmv252NwDbf14AfB2LZ_g9ez4IHy37ZkSfBxpgy0k";
const RATE_PER_NIGHT = 300;
const FLAT_DEPOSIT = 100;
const WHATSAPP_LINK = "https://wasap.my/6014-3388944/DiniesHomestay";
const STORAGE_KEY = "homestay_bookings_v1";
const DRAFT_KEY = "homestay_booking_draft_v2";
const LAST_BOOKING_KEY = "homestay_booking_last_v1";
const ADMIN_TOKEN_STORAGE = "homestay_admin_token_v1";

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

function loadAdminAccessKey() {
  return sessionStorage.getItem(ADMIN_TOKEN_STORAGE) || "";
}

function storeAdminAccessKey(value) {
  if (!value) return;
  sessionStorage.setItem(ADMIN_TOKEN_STORAGE, value);
}

function clearAdminAccessKey() {
  sessionStorage.removeItem(ADMIN_TOKEN_STORAGE);
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

function formatDateTime(dateValue) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleString("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sanitizePhoneNumber(value) {
  if (!value) return "";
  return value.replace(/[^+\d]/g, "");
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

  let blocked = [];
  let blockedDateSet = new Set();

  const today = new Date().toISOString().split("T")[0];
  if (checkInInput) checkInInput.min = today;
  if (checkOutInput) checkOutInput.min = today;

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

  async function loadBlockedFromServer() {
    try {
      if (blockedList) {
        blockedList.innerHTML = `<span>Memuatkan tarikh yang telah ditempah…</span>`;
      }

      const response = await fetch(ADMIN_BOOKINGS_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load bookings ${response.status}`);
      }

      const data = await response.json();
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      blocked = (Array.isArray(data) ? data : [])
        .filter((item) => {
          const status = (item.status || "pending").toLowerCase();
          if (status === "cancelled") return false;
          const end = toDate(item.checkOut || item.check_out);
          return end > todayDate;
        })
        .map((item) => ({
          code: item.code,
          start: item.checkIn || item.check_in,
          end: item.checkOut || item.check_out,
        }));

      blockedDateSet = buildBlockedDateSet(blocked);

      if (blockedList) {
        if (!blocked.length) {
          blockedList.innerHTML = `<span>Tiada tempahan lagi.</span>`;
        } else {
          blockedList.innerHTML = blocked
            .map((range) => `<span>${formatDate(range.start)} → ${formatDate(range.end)}</span>`)
            .join("");
        }
      }

      // Refresh calendar pickers after blocked dates loaded
      if (checkInPicker) {
        checkInPicker.redraw();
      }
      if (checkOutPicker) {
        checkOutPicker.redraw();
      }
    } catch (error) {
      console.error(error);
      if (blockedList) {
        blockedList.innerHTML = `<span>Tidak dapat memuatkan tarikh ditempah.</span>`;
      }
    }
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

  function saveDraft() {
    const data = Object.fromEntries(new FormData(form).entries());
    const nights = calculateNights(data.checkIn, data.checkOut) || 0;
    const payload = {
      fullName: data.fullName?.trim() || "",
      checkIn: data.checkIn || "",
      checkOut: data.checkOut || "",
      guestCount: Number(data.guestCount || 0),
      adultCount: Number(data.adultCount || 0),
      childCount: Number(data.childCount || 0),
      vehicleCount: Number(data.vehicleCount || 0),
      stayPurpose: data.stayPurpose?.trim() || "",
      phoneNumber: data.phoneNumber?.trim() || "",
      nights,
      total: nights * RATE_PER_NIGHT,
    };
    storeDraft(payload);
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

    const start = toDate(checkInInput.value);
    const end = toDate(checkOutInput.value);
    const conflict = blocked.find((range) =>
      rangesOverlap(start, end, toDate(range.start), toDate(range.end))
    );
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
    saveDraft();
  });

  checkOutInput.addEventListener("change", () => {
    validateDates();
    updateSummary();
    saveDraft();
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

  // Add auto-save on all form inputs
  const formInputs = form.querySelectorAll("input[name], textarea[name], select[name]");
  formInputs.forEach((input) => {
    if (input.id !== "checkIn" && input.id !== "checkOut") {
      input.addEventListener("change", saveDraft);
      input.addEventListener("input", saveDraft);
    }
  });

  updateSummary();

  // Load blocked dates from Supabase so semua device nampak tarikh penuh yang sama
  loadBlockedFromServer();
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
    <p><strong>Jumlah bayar:</strong> ${formatRM(booking.payNow || booking.total)}</p>
    <p class="notice">${balanceMessage}</p>
  `;
}

function initAdminPage() {
  const tableBody = document.getElementById("bookingTableBody");
  if (!tableBody) return;

  const lock = document.getElementById("adminLock");
  const lockForm = document.getElementById("adminAccessForm");
  const lockInput = document.getElementById("adminAccessKey");
  const lockError = document.getElementById("lockError");
  const refreshButton = document.getElementById("refreshBookings");
  const clearTokenButton = document.getElementById("clearAdminToken");
  const statusFilter = document.getElementById("statusFilter");
  const rangeFilter = document.getElementById("rangeFilter");
  const searchInput = document.getElementById("searchInput");
  const alertBox = document.getElementById("adminAlert");
  const emptyState = document.getElementById("emptyState");

  const statNodes = {
    total: document.getElementById("statTotal"),
    pending: document.getElementById("statPending"),
    confirmed: document.getElementById("statConfirmed"),
    cancelled: document.getElementById("statCancelled"),
  };

  let adminToken = loadAdminAccessKey();
  let bookings = [];
  let searchDebounce = 0;
  const refreshLabel = refreshButton?.textContent?.trim() || "Refresh data";

  function showLock(message = "") {
    if (!lock) return;
    lock.hidden = false;
    if (lockError) {
      lockError.textContent = message;
      lockError.classList.toggle("hidden", !message);
    }
    lockInput?.focus();
  }

  function hideLock() {
    if (!lock) return;
    lock.hidden = true;
    if (lockError) {
      lockError.classList.add("hidden");
      lockError.textContent = "";
    }
  }

  function setLoading(state) {
    if (refreshButton) {
      refreshButton.disabled = state;
      refreshButton.classList.toggle("is-loading", state);
      refreshButton.textContent = state ? "Loading…" : refreshLabel;
    }
  }

  function showAlert(message) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.toggle("hidden", !message);
  }

  function handleUnauthorized(message) {
    clearAdminAccessKey();
    adminToken = "";
    bookings = [];
    renderBookings();
    updateStats();
    showAlert(message);
    showLock(message || "Access key tidak sah.");
  }

  async function fetchBookings() {
    if (!adminToken) {
      showLock();
      return;
    }

    setLoading(true);
    showAlert("");

    try {
      const response = await fetch(ADMIN_BOOKINGS_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "x-admin-token": adminToken,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized("Access key salah atau telah tamat.");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch admin data ${response.status}`);
      }

      const data = await response.json();
      bookings = Array.isArray(data) ? data : [];
      renderBookings();
      updateStats();
    } catch (error) {
      console.error(error);
      showAlert("Tidak dapat tarik data dari server.");
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingStatus(code, nextStatus) {
    if (!code || !nextStatus || !adminToken) return;

    setLoading(true);
    showAlert("");

    try {
      const response = await fetch(ADMIN_BOOKINGS_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({code, status: nextStatus}),
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized("Access key tidak sah untuk kemas kini.");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to update booking ${response.status}`);
      }

      const updated = await response.json();
      if (updated?.code) {
        bookings = bookings.map((item) => (item.code === updated.code ? {...item, ...updated} : item));
        renderBookings();
        updateStats();
      }
    } catch (error) {
      console.error(error);
      showAlert("Tidak dapat kemas kini status. Cuba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function getFilteredBookings() {
    const statusValue = statusFilter?.value || "all";
    const rangeValue = rangeFilter?.value || "all";
    const query = (searchInput?.value || "").trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookings.filter((booking) => {
      const status = (booking.status || "pending").toLowerCase();
      if (statusValue !== "all" && status !== statusValue) {
        return false;
      }

      if (rangeValue !== "all") {
        const endDate = toDate(booking.checkOut);
        if (rangeValue === "upcoming" && endDate < today) {
          return false;
        }
        if (rangeValue === "past" && endDate >= today) {
          return false;
        }
      }

      if (query) {
        const haystack = [booking.code, booking.fullName, booking.phoneNumber, booking.stayPurpose]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }

  function renderBookings() {
    const filtered = getFilteredBookings();
    if (!filtered.length) {
      tableBody.innerHTML = "";
      emptyState?.classList.remove("hidden");
      return;
    }

    emptyState?.classList.add("hidden");
    tableBody.innerHTML = filtered
      .map((booking) => {
        const status = (booking.status || "pending").toLowerCase();
        const whatsappNumber = sanitizePhoneNumber(booking.phoneNumber);
        const nightsLabel = booking.nights ? `${booking.nights} malam` : "-";
        const actionButtons = [];

        if (status !== "confirmed") {
          actionButtons.push(
            `<button class="btn primary small" type="button" data-action="status" data-status="confirmed" data-code="${booking.code}">Confirm</button>`
          );
        }
        if (status !== "pending") {
          actionButtons.push(
            `<button class="btn outline small" type="button" data-action="status" data-status="pending" data-code="${booking.code}">Mark pending</button>`
          );
        }
        if (status !== "cancelled") {
          actionButtons.push(
            `<button class="btn outline small" type="button" data-action="status" data-status="cancelled" data-code="${booking.code}">Cancel</button>`
          );
        }

        actionButtons.push(
          `<button class="btn outline small" type="button" data-action="chat" data-phone="${whatsappNumber}" data-code="${booking.code}" data-name="${booking.fullName}">Chat</button>`
        );
        actionButtons.push(
          `<button class="btn outline small" type="button" data-action="copy" data-value="${booking.code}">Copy kod</button>`
        );

        return `
          <tr>
            <td>
              <strong>${booking.code}</strong><br />
              <span class="muted small">${formatDateTime(booking.createdAt)}</span>
            </td>
            <td>
              ${booking.fullName || "-"}<br />
              <span class="muted small">${booking.phoneNumber || "-"}</span>
            </td>
            <td>
              ${formatDate(booking.checkIn)} → ${formatDate(booking.checkOut)}<br />
              <span class="muted small">${nightsLabel}</span>
            </td>
            <td>
              ${formatRM(booking.payNow || 0)} <span class="muted small">dibayar</span><br />
              <span class="muted small">Baki ${formatRM(booking.balance || 0)}</span>
            </td>
            <td>
              <span class="status-pill ${status}">${status}</span>
            </td>
            <td>
              <div class="action-group">${actionButtons.join("")}</div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function updateStats() {
    const totals = bookings.reduce(
      (acc, booking) => {
        const status = (booking.status || "pending").toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      {total: 0}
    );

    if (statNodes.total) statNodes.total.textContent = totals.total || 0;
    if (statNodes.pending) statNodes.pending.textContent = totals.pending || 0;
    if (statNodes.confirmed) statNodes.confirmed.textContent = totals.confirmed || 0;
    if (statNodes.cancelled) statNodes.cancelled.textContent = totals.cancelled || 0;
  }

  function handleTableAction(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    if (action === "status") {
      updateBookingStatus(target.dataset.code, target.dataset.status);
      return;
    }

    if (action === "chat") {
      const phone = target.dataset.phone;
      if (!phone) {
        showAlert("Nombor pelanggan tiada.");
        return;
      }
      const name = target.dataset.name || "tetamu";
      const code = target.dataset.code || "tempahan";
      const message = `Assalamualaikum ${name}, saya maz, owner Dinie's Homestay. Tempahan ${code} anda telah diterima ya.`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener");
      return;
    }

    if (action === "copy") {
      const value = target.dataset.value;
      if (!value) return;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard
          .writeText(value)
          .then(() => {
            target.textContent = "Disalin";
            setTimeout(() => {
              target.textContent = "Copy kod";
            }, 1500);
          })
          .catch(() => {
            window.prompt("Copy kod tempahan secara manual", value);
          });
      } else {
        window.prompt("Copy kod tempahan secara manual", value);
      }
    }
  }

  lockForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = lockInput?.value?.trim();
    if (!value) {
      showLock("Access key diperlukan.");
      return;
    }
    adminToken = value;
    storeAdminAccessKey(value);
    hideLock();
    fetchBookings();
  });

  refreshButton?.addEventListener("click", fetchBookings);

  clearTokenButton?.addEventListener("click", () => {
    clearAdminAccessKey();
    adminToken = "";
    bookings = [];
    renderBookings();
    updateStats();
    showLock();
  });

  statusFilter?.addEventListener("change", renderBookings);
  rangeFilter?.addEventListener("change", renderBookings);
  searchInput?.addEventListener("input", () => {
    window.clearTimeout(searchDebounce);
    searchDebounce = window.setTimeout(renderBookings, 200);
  });

  tableBody.addEventListener("click", handleTableAction);

  if (adminToken) {
    fetchBookings();
  } else {
    showLock();
  }
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

if (currentPage === "admin") {
  initAdminPage();
}
