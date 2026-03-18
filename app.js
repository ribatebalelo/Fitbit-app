/* FitBit Gym Membership Management System (Front-end only)
   Persistence: JSON seeds -> localStorage mock DB
*/
(function () {
  "use strict";

  const APP = {};
  const LS = {
    ready: "fb.ready.v1",
    seedMode: "fb.seedMode.v1",
    session: "fb.session.v1",
    members: "fb.data.members.v1",
    trainers: "fb.data.trainers.v1",
    payments: "fb.data.payments.v1",
    sessions: "fb.data.sessions.v1",
  };

  const ADMIN = { email: "admin@fitbitgym.local", password: "admin123" };
  const DEFAULT_SEEDS = {
    members: [
      {
        id: "m_seed_01",
        fullName: "Sibusiso Dlamini",
        email: "sibusiso.dlamini@example.co.za",
        password: "pass1234",
        plan: "Monthly",
        status: "Active",
        createdAt: "2026-03-01T10:00:00.000Z",
        membershipStart: "2026-03-01",
        membershipEnd: "2026-03-31",
      },
      {
        id: "m_seed_02",
        fullName: "Lerato Mokoena",
        email: "lerato.mokoena@example.co.za",
        password: "pass1234",
        plan: "Annual",
        status: "Pending",
        createdAt: "2026-03-10T12:30:00.000Z",
        membershipStart: null,
        membershipEnd: null,
      },
    ],
    trainers: [
      { id: "t_01", name: "Thabo Mokoena", specialty: "Strength & Conditioning", experienceYears: 8, availability: "Mon–Sat", level: "Elite" },
      { id: "t_02", name: "Nomvula Nkosi", specialty: "HIIT & Fat Loss", experienceYears: 6, availability: "Tue–Sun", level: "Pro" },
      { id: "t_03", name: "Sipho Dlamini", specialty: "Mobility & Rehab", experienceYears: 10, availability: "Mon–Fri", level: "Elite" },
      { id: "t_04", name: "Lerato Molefe", specialty: "Bodybuilding", experienceYears: 7, availability: "Wed–Sun", level: "Pro" },
      { id: "t_05", name: "Ayanda Khumalo", specialty: "Cardio Performance", experienceYears: 5, availability: "Mon–Sat", level: "Coach" },
      { id: "t_06", name: "Zanele Ndlovu", specialty: "Core & Functional Training", experienceYears: 9, availability: "Mon–Thu", level: "Elite" },
    ],
    payments: [
      { id: "p_seed_01", memberId: "m_seed_01", amount: 500, plan: "Monthly", date: "2026-03-01", status: "Paid", createdAt: "2026-03-01T10:01:00.000Z" },
    ],
    sessions: [
      { id: "s_seed_01", memberId: "m_seed_01", trainerId: "t_01", date: "2026-03-20", time: "18:00", focus: "Strength basics", status: "Booked", createdAt: "2026-03-05T09:15:00.000Z" },
    ],
  };

  function nowISODate() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(dateISO, days) {
    const d = new Date(dateISO + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function durationDaysForPlan(plan) {
    if (plan === "Monthly") return 30;
    if (plan === "Quarterly") return 90;
    if (plan === "Annual") return 365;
    return 30;
  }

  function formatMoney(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return "R0";
    return n.toLocaleString(undefined, { style: "currency", currency: "ZAR" });
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

  function loadLS(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveLS(key, value) {
    localStorage.setItem(key, JSON.stringify(value, null, 2));
  }

  async function fetchJsonOrThrow(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`Failed to load ${path} (${r.status})`);
    return await r.json();
  }

  async function seedIfNeeded() {
    if (localStorage.getItem(LS.ready) === "1") return;

    let members, trainers, payments, sessions;
    try {
      [members, trainers, payments, sessions] = await Promise.all([
        fetchJsonOrThrow("./data/members.json"),
        fetchJsonOrThrow("./data/trainers.json"),
        fetchJsonOrThrow("./data/payments.json"),
        fetchJsonOrThrow("./data/sessions.json"),
      ]);
      localStorage.setItem(LS.seedMode, "fetch");
    } catch {
      // Use built-in seeds so the app still works even if external files are blocked.
      members = DEFAULT_SEEDS.members;
      trainers = DEFAULT_SEEDS.trainers;
      payments = DEFAULT_SEEDS.payments;
      sessions = DEFAULT_SEEDS.sessions;
      localStorage.setItem(LS.seedMode, "fallback");
    }

    saveLS(LS.members, members);
    saveLS(LS.trainers, trainers);
    saveLS(LS.payments, payments);
    saveLS(LS.sessions, sessions);
    localStorage.setItem(LS.ready, "1");
  }

  function getDB() {
    return {
      members: loadLS(LS.members, []),
      trainers: loadLS(LS.trainers, []),
      payments: loadLS(LS.payments, []),
      sessions: loadLS(LS.sessions, []),
    };
  }

  function setDB(partial) {
    if (partial.members) saveLS(LS.members, partial.members);
    if (partial.trainers) saveLS(LS.trainers, partial.trainers);
    if (partial.payments) saveLS(LS.payments, partial.payments);
    if (partial.sessions) saveLS(LS.sessions, partial.sessions);
  }

  function getSession() {
    return loadLS(LS.session, null);
  }

  function setSession(session) {
    saveLS(LS.session, session);
  }

  function clearSession() {
    localStorage.removeItem(LS.session);
  }

  function isAdminSession() {
    const s = getSession();
    return !!(s && s.role === "admin");
  }

  function getMemberById(members, id) {
    return members.find((m) => m.id === id) || null;
  }

  function getMemberByEmail(members, email) {
    const e = String(email || "").trim().toLowerCase();
    return members.find((m) => String(m.email).toLowerCase() === e) || null;
  }

  function computeMembershipStatus(member) {
    if (!member) return "Pending";
    if (member.status === "Cancelled") return "Cancelled";
    if (member.status === "Pending") return "Pending";
    if (member.status === "Active") {
      if (!member.membershipEnd) return "Active";
      return member.membershipEnd < nowISODate() ? "Expired" : "Active";
    }
    return member.status || "Pending";
  }

  function badgeClassForStatus(status) {
    if (status === "Active") return "badge-fitbit";
    if (status === "Pending") return "badge-fitbit";
    if (status === "Expired") return "badge bg-secondary";
    if (status === "Cancelled") return "badge bg-danger";
    return "badge bg-secondary";
  }

  function renderAlert(host, type, title, message, timeoutMs = 4500) {
    if (!host) return;
    const id = uid("a");
    const klass =
      type === "success"
        ? "alert-success"
        : type === "danger"
          ? "alert-danger"
          : type === "warning"
            ? "alert-warning"
            : "alert-info";
    host.insertAdjacentHTML(
      "afterbegin",
      `<div id="${id}" class="alert ${klass} alert-dismissible fade show" role="alert">
         <div class="fw-bold">${escapeHtml(title || "")}</div>
         <div>${escapeHtml(message || "")}</div>
         <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
       </div>`
    );
    if (timeoutMs > 0) {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;
        try {
          bootstrap.Alert.getOrCreateInstance(el).close();
        } catch {
          el.remove();
        }
      }, timeoutMs);
    }
  }

  function maybeWarnSeedMode(host) {
    const mode = localStorage.getItem(LS.seedMode);
    if (mode !== "fallback") return;
    const key = "fb.seedWarned.v1";
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
    renderAlert(host, "warning", "Running in demo mode", "Some data is coming from built-in demo seeds. For the best experience, open this project through a local web server (for example, VS Code Live Server).", 8000);
  }

  function requireMember() {
    const s = getSession();
    if (!s || s.role !== "member" || !s.memberId) {
      window.location.href = "./login.html";
      return null;
    }
    return s;
  }

  function requireAdminSoft() {
    const s = getSession();
    if (!s || s.role !== "admin") return null;
    return s;
  }

  function requireAdmin() {
    const s = getSession();
    if (!s || s.role !== "admin") {
      window.location.href = "./login.html";
      return null;
    }
    return s;
  }

  function wireLogout() {
    const btn = document.getElementById("logoutBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      clearSession();
      window.location.href = "./login.html";
    });
  }

  function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function computeDefaultAmount(plan) {
    // Flat pricing: every membership payment is R500
    return 500;
  }

  // Pages
  APP.pages = {};

  APP.pages.register = function () {
    wireLogout();
    const form = document.getElementById("registerForm");
    const alertHost = document.getElementById("alertHost");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) return;

      await seedIfNeeded();
      maybeWarnSeedMode(alertHost);
      const db = getDB();
      const fullName = document.getElementById("fullName").value.trim();
      const email = document.getElementById("email").value.trim().toLowerCase();
      const password = document.getElementById("password").value;
      const plan = document.getElementById("plan").value;

      if (getMemberByEmail(db.members, email)) {
        renderAlert(alertHost, "danger", "Email already exists", "Please login or use a different email.");
        return;
      }

      const member = {
        id: uid("m"),
        fullName,
        email,
        password,
        plan,
        status: "Pending",
        createdAt: new Date().toISOString(),
        membershipStart: null,
        membershipEnd: null,
      };

      db.members.unshift(member);
      setDB({ members: db.members });

      renderAlert(alertHost, "success", "Registration submitted", "Your membership is Pending until admin approval.");
      setSession({ role: "member", memberId: member.id, createdAt: Date.now() });
      setTimeout(() => (window.location.href = "./dashboard.html"), 700);
    });
  };

  APP.pages.login = function () {
    wireLogout();
    const form = document.getElementById("loginForm");
    const alertHost = document.getElementById("alertHost");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) return;

      await seedIfNeeded();
      maybeWarnSeedMode(alertHost);
      const email = document.getElementById("email").value.trim().toLowerCase();
      const password = document.getElementById("password").value;

      if (email === ADMIN.email && password === ADMIN.password) {
        setSession({ role: "admin", createdAt: Date.now() });
        window.location.href = "./admin.html";
        return;
      }

      const db = getDB();
      const member = getMemberByEmail(db.members, email);
      if (!member || member.password !== password) {
        renderAlert(alertHost, "danger", "Login failed", "Incorrect email or password.");
        return;
      }

      setSession({ role: "member", memberId: member.id, createdAt: Date.now() });
      window.location.href = "./dashboard.html";
    });
  };

  APP.pages.dashboard = async function () {
    wireLogout();
    const session = requireMember();
    if (!session) return;
    await seedIfNeeded();
    const alertHost = document.getElementById("alertHost");
    maybeWarnSeedMode(alertHost);

    const memberName = document.getElementById("memberName");
    const statusBadge = document.getElementById("statusBadge");
    const planText = document.getElementById("planText");
    const startDate = document.getElementById("startDate");
    const endDate = document.getElementById("endDate");
    const paymentsTbody = document.getElementById("paymentsTbody");
    const sessionsTbody = document.getElementById("sessionsTbody");
    const trainersGrid = document.getElementById("trainersGrid");

    const renewBtn = document.getElementById("renewBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    const paymentForm = document.getElementById("paymentForm");
    const paymentPlan = document.getElementById("paymentPlan");
    const paymentAmount = document.getElementById("paymentAmount");
    const paymentDate = document.getElementById("paymentDate");
    const paymentPurpose = document.getElementById("paymentPurpose");

    const bookingModalEl = document.getElementById("bookingModal");
    const paymentModalEl = document.getElementById("paymentModal");
    const bookingTrainerName = document.getElementById("bookingTrainerName");
    const bookingTrainerId = document.getElementById("bookingTrainerId");
    const bookingForm = document.getElementById("bookingForm");

    function readMember() {
      const db = getDB();
      const member = getMemberById(db.members, session.memberId);
      return { db, member };
    }

    function render() {
      const { db, member } = readMember();
      if (!member) {
        clearSession();
        window.location.href = "./login.html";
        return;
      }

      const status = computeMembershipStatus(member);
      memberName.textContent = member.fullName || "Member";
      statusBadge.textContent = status;
      statusBadge.className = `badge ${badgeClassForStatus(status)}`;
      planText.textContent = member.plan || "—";
      startDate.textContent = member.membershipStart || "—";
      endDate.textContent = member.membershipEnd || "—";

      // payments
      const myPayments = db.payments
        .filter((p) => p.memberId === member.id)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));

      paymentsTbody.innerHTML = "";
      if (myPayments.length === 0) {
        paymentsTbody.innerHTML = `<tr><td colspan="4" class="text-center text-white-50 py-4">No payments yet.</td></tr>`;
      } else {
        for (const p of myPayments) {
          paymentsTbody.insertAdjacentHTML(
            "beforeend",
            `<tr>
              <td>${escapeHtml(p.date || "")}</td>
              <td>${escapeHtml(p.plan || "")}</td>
              <td class="text-end">${escapeHtml(formatMoney(p.amount))}</td>
              <td class="text-end"><span class="badge badge-fitbit">${escapeHtml(p.status || "Paid")}</span></td>
            </tr>`
          );
        }
      }

      // trainers
      trainersGrid.innerHTML = "";
      for (const t of db.trainers) {
        trainersGrid.insertAdjacentHTML(
          "beforeend",
          `<div class="col-12 col-md-6 col-lg-4">
            <div class="trainer-card">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <div class="trainer-name">${escapeHtml(t.name)}</div>
                  <div class="trainer-meta">${escapeHtml(t.specialty)}</div>
                </div>
                <span class="trainer-pill">${escapeHtml(t.level || "Pro")}</span>
              </div>
              <div class="trainer-meta mt-2">Experience: <span class="text-white">${escapeHtml(String(t.experienceYears))} yrs</span></div>
              <div class="trainer-meta">Available: <span class="text-white">${escapeHtml(t.availability || "Mon–Sat")}</span></div>
              <div class="d-grid mt-3">
                <button class="btn btn-outline-fitbit btn-sm" type="button" data-trainer-id="${escapeHtml(t.id)}" data-trainer-name="${escapeHtml(t.name)}">
                  Book session
                </button>
              </div>
            </div>
          </div>`
        );
      }
      trainersGrid.querySelectorAll("button[data-trainer-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          bookingTrainerId.value = btn.getAttribute("data-trainer-id") || "";
          bookingTrainerName.textContent = btn.getAttribute("data-trainer-name") || "—";
          document.getElementById("sessionDate").value = nowISODate();
          document.getElementById("sessionTime").value = "18:00";
          document.getElementById("sessionFocus").value = "";
          bootstrap.Modal.getOrCreateInstance(bookingModalEl).show();
        });
      });

      // sessions
      const mySessions = db.sessions
        .filter((s) => s.memberId === member.id)
        .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

      sessionsTbody.innerHTML = "";
      if (mySessions.length === 0) {
        sessionsTbody.innerHTML = `<tr><td colspan="5" class="text-center text-white-50 py-4">No sessions booked.</td></tr>`;
      } else {
        for (const s of mySessions) {
          const tr = db.trainers.find((t) => t.id === s.trainerId);
          sessionsTbody.insertAdjacentHTML(
            "beforeend",
            `<tr>
              <td>${escapeHtml(s.date || "")}</td>
              <td>${escapeHtml(s.time || "")}</td>
              <td>${escapeHtml(tr?.name || "Trainer")}</td>
              <td>${escapeHtml(s.focus || "")}</td>
              <td class="text-end"><span class="badge badge-fitbit">${escapeHtml(s.status || "Booked")}</span></td>
            </tr>`
          );
        }
      }

      // defaults for payment modal
      if (paymentPlan) paymentPlan.value = member.plan || "";
      if (paymentAmount) paymentAmount.value = computeDefaultAmount(member.plan);
      if (paymentDate) paymentDate.value = nowISODate();
      if (paymentPurpose) paymentPurpose.value = "manual";
    }

    renewBtn?.addEventListener("click", () => {
      const { member } = readMember();
      if (!member) return;
      if (member.status === "Pending") {
        renderAlert(alertHost, "warning", "Pending approval", "Admin must approve before renewal.");
        return;
      }
      if (member.status === "Cancelled") {
        renderAlert(alertHost, "danger", "Cancelled", "Your membership is cancelled. Contact admin to reactivate.");
        return;
      }
      if (paymentPlan) paymentPlan.value = member.plan || "";
      if (paymentAmount) paymentAmount.value = computeDefaultAmount(member.plan);
      if (paymentDate) paymentDate.value = nowISODate();
      if (paymentPurpose) paymentPurpose.value = "renewal";
      try {
        bootstrap.Modal.getOrCreateInstance(paymentModalEl).show();
      } catch {}
    });

    cancelBtn?.addEventListener("click", () => {
      const { db, member } = readMember();
      if (!member) return;
      if (!window.confirm("Are you sure you want to cancel your membership?")) return;
      member.status = "Cancelled";
      setDB({ members: db.members });
      renderAlert(alertHost, "success", "Membership cancelled", "Your membership has been cancelled.");
      render();
    });

    paymentForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      paymentForm.classList.add("was-validated");
      if (!paymentForm.checkValidity()) return;

      const { db, member } = readMember();
      if (!member) return;
      const plan = paymentPlan.value;
      const amount = Number(paymentAmount.value);
      const date = paymentDate.value;

      const p = {
        id: uid("p"),
        memberId: member.id,
        amount,
        plan,
        date,
        status: "Paid",
        createdAt: new Date().toISOString(),
      };
      db.payments.unshift(p);

      // If payment was triggered via "Renew membership", also renew the membership term
      if (paymentPurpose && paymentPurpose.value === "renewal") {
        const start = nowISODate();
        const end = addDays(start, durationDaysForPlan(member.plan));
        member.status = "Active";
        member.membershipStart = start;
        member.membershipEnd = end;
        setDB({ members: db.members, payments: db.payments });
        try {
          bootstrap.Modal.getOrCreateInstance(document.getElementById("paymentModal")).hide();
        } catch {}
        paymentForm.reset();
        paymentForm.classList.remove("was-validated");
        renderAlert(alertHost, "success", "Membership renewed", `Payment captured and membership active until ${end}.`);
        render();
        return;
      }

      setDB({ payments: db.payments });

      try {
        bootstrap.Modal.getOrCreateInstance(document.getElementById("paymentModal")).hide();
      } catch {}
      paymentForm.reset();
      paymentForm.classList.remove("was-validated");
      renderAlert(alertHost, "success", "Payment saved", "Payment recorded in the mock database.");
      render();
    });

    bookingForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      bookingForm.classList.add("was-validated");
      if (!bookingForm.checkValidity()) return;

      const { db, member } = readMember();
      if (!member) return;

      const s = {
        id: uid("s"),
        memberId: member.id,
        trainerId: bookingTrainerId.value,
        date: document.getElementById("sessionDate").value,
        time: document.getElementById("sessionTime").value,
        focus: document.getElementById("sessionFocus").value.trim(),
        status: "Booked",
        createdAt: new Date().toISOString(),
      };
      db.sessions.unshift(s);
      setDB({ sessions: db.sessions });

      try {
        bootstrap.Modal.getOrCreateInstance(bookingModalEl).hide();
      } catch {}
      bookingForm.reset();
      bookingForm.classList.remove("was-validated");
      renderAlert(alertHost, "success", "Session booked", "Your trainer session has been booked.");
      render();
    });

    render();
  };

  APP.pages.admin = async function () {
    wireLogout();
    const adminSession = requireAdmin();
    if (!adminSession) return;
    await seedIfNeeded();

    const alertHost = document.getElementById("alertHost");
    maybeWarnSeedMode(alertHost);
    const membersTbody = document.getElementById("membersTbody");
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");

    const rTotalMembers = document.getElementById("rTotalMembers");
    const rActiveMembers = document.getElementById("rActiveMembers");
    const rPendingMembers = document.getElementById("rPendingMembers");
    const rPaymentsTotal = document.getElementById("rPaymentsTotal");

    const exportMembersBtn = document.getElementById("exportMembersBtn");
    const exportPaymentsBtn = document.getElementById("exportPaymentsBtn");
    const exportSessionsBtn = document.getElementById("exportSessionsBtn");

    function approveMember(memberId) {
      const db = getDB();
      const m = getMemberById(db.members, memberId);
      if (!m) return;
      m.status = "Active";
      const start = nowISODate();
      m.membershipStart = start;
      m.membershipEnd = addDays(start, durationDaysForPlan(m.plan));
      setDB({ members: db.members });
      renderAlert(alertHost, "success", "Approved", `${m.fullName} is now Active.`);
      render();
    }

    function rejectMember(memberId) {
      const db = getDB();
      const m = getMemberById(db.members, memberId);
      if (!m) return;
      m.status = "Cancelled";
      setDB({ members: db.members });
      renderAlert(alertHost, "success", "Rejected", `${m.fullName} has been set to Cancelled.`);
      render();
    }

    function renderReports(db) {
      const total = db.members.length;
      const statuses = db.members.map((m) => computeMembershipStatus(m));
      const active = statuses.filter((s) => s === "Active").length;
      const pending = statuses.filter((s) => s === "Pending").length;
      const paymentsTotal = db.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      if (rTotalMembers) rTotalMembers.textContent = String(total);
      if (rActiveMembers) rActiveMembers.textContent = String(active);
      if (rPendingMembers) rPendingMembers.textContent = String(pending);
      if (rPaymentsTotal) rPaymentsTotal.textContent = formatMoney(paymentsTotal);
    }

    function renderMembers(db) {
      const q = (searchInput?.value || "").trim().toLowerCase();
      const sf = statusFilter?.value || "all";

      const rows = db.members
        .map((m) => ({ m, status: computeMembershipStatus(m) }))
        .filter(({ m, status }) => {
          if (sf !== "all" && status !== sf) return false;
          if (!q) return true;
          return (
            String(m.fullName || "").toLowerCase().includes(q) ||
            String(m.email || "").toLowerCase().includes(q)
          );
        })
        .sort((a, b) => String(b.m.createdAt).localeCompare(String(a.m.createdAt)));

      membersTbody.innerHTML = "";
      if (rows.length === 0) {
        membersTbody.innerHTML = `<tr><td colspan="6" class="text-center text-white-50 py-4">No members match.</td></tr>`;
        return;
      }

      for (const { m, status } of rows) {
        const disabled = adminSession ? "" : "disabled";
        const actions =
          status === "Pending"
            ? `<div class="d-flex justify-content-end gap-2">
                 <button class="btn btn-fitbit btn-sm" data-action="approve" data-id="${escapeHtml(m.id)}" ${disabled}>Approve</button>
                 <button class="btn btn-outline-danger btn-sm" data-action="reject" data-id="${escapeHtml(m.id)}" ${disabled}>Reject</button>
               </div>`
            : `<div class="d-flex justify-content-end gap-2">
                 <button class="btn btn-outline-fitbit btn-sm" data-action="reject" data-id="${escapeHtml(m.id)}" ${disabled}>Set Cancelled</button>
               </div>`;

        membersTbody.insertAdjacentHTML(
          "beforeend",
          `<tr>
            <td class="fw-semibold">${escapeHtml(m.fullName || "")}</td>
            <td class="text-white-50">${escapeHtml(m.email || "")}</td>
            <td>${escapeHtml(m.plan || "")}</td>
            <td><span class="badge ${badgeClassForStatus(status)}">${escapeHtml(status)}</span></td>
            <td class="text-white-50">${escapeHtml(m.membershipEnd || "—")}</td>
            <td class="text-end">${actions}</td>
          </tr>`
        );
      }

      membersTbody.querySelectorAll("button[data-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const action = btn.getAttribute("data-action");
          const id = btn.getAttribute("data-id");
          if (!adminSession) {
            renderAlert(alertHost, "warning", "Admin login required", "Login as admin to perform actions.");
            return;
          }
          if (action === "approve") approveMember(id);
          if (action === "reject") rejectMember(id);
        });
      });
    }

    function render() {
      const db = getDB();
      renderReports(db);
      renderMembers(db);
    }

    searchInput?.addEventListener("input", render);
    statusFilter?.addEventListener("change", render);

    exportMembersBtn?.addEventListener("click", () => downloadJson("members.json", getDB().members));
    exportPaymentsBtn?.addEventListener("click", () => downloadJson("payments.json", getDB().payments));
    exportSessionsBtn?.addEventListener("click", () => downloadJson("sessions.json", getDB().sessions));

    render();
  };

  APP.bootstrap = function () {
    // minimal: ensure seeds exist for any page
    seedIfNeeded().catch(() => {});

    // toggle admin-only nav visibility based on session
    try {
      const isAdmin = isAdminSession();
      const adminNavEls = document.querySelectorAll("[data-role='admin-nav']");
      adminNavEls.forEach((el) => {
        el.style.display = isAdmin ? "" : "none";
      });
    } catch {}
  };

  window.FitBitApp = APP;
})();
