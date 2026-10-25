
/* =========================================================
   WEBSITE KESEHATAN MENTAL REMAJA
   File: js/script.js

   Fungsi:
   1. Menu navigasi mobile
   2. Check-in suasana hati
   3. Kuesioner refleksi diri
   4. Latihan pernapasan
   5. Jurnal harian
   6. Kebiasaan positif
   7. Tombol kembali ke atas

   Catatan:
   Data jurnal dan kebiasaan disimpan di browser menggunakan
   localStorage, bukan database atau server.
   ========================================================= */

"use strict";

// =========================================================
// 1. FUNGSI BANTU
// =========================================================

const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];

function getLocalData(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    console.warn("Data lokal tidak dapat dibaca:", error);
    return fallback;
  }
}

function saveLocalData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Data tidak dapat disimpan:", error);
    alert("Penyimpanan gagal. Periksa ruang penyimpanan browser.");
    return false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function showMessage(element, message) {
  if (!element) return;

  element.textContent = message;
  element.hidden = false;
  element.setAttribute("role", "status");
}

// =========================================================
// 2. MENU NAVIGASI MOBILE
// =========================================================

function initMobileMenu() {
  const menuButton = $(".menu-toggle");
  const navigation = $(".primary-nav");

  if (!menuButton || !navigation) return;

  menuButton.setAttribute("aria-expanded", "false");

  function closeMenu() {
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  }

  menuButton.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  // Tutup menu setelah tautan navigasi dipilih.
  $$("a", navigation).forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Tutup menu menggunakan tombol Escape.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

// =========================================================
// 3. CHECK-IN SUASANA HATI
// =========================================================

function initMoodCheckIn() {
  const form = $(".mood-form");
  if (!form) return;

  const moodOptions = $$(".mood-option", form);
  const result = $("#mood-result") || $(".mood-result");
  const historyContainer = $("#mood-history") || $(".mood-history");

  const moodAdvice = {
    senang: "Bagus! Nikmati momen ini dan syukuri hal-hal baik yang kamu alami.",
    tenang: "Luangkan waktu untuk menjaga keseimbangan dan menikmati kegiatanmu.",
    biasa: "Tidak apa-apa merasa biasa saja. Coba lakukan satu hal kecil yang kamu sukai.",
    sedih: "Kamu tidak harus selalu terlihat kuat. Coba istirahat atau ceritakan perasaanmu kepada orang tepercaya.",
    cemas: "Tarik napas perlahan, kurangi tekanan sejenak, dan fokus pada hal yang bisa kamu kendalikan."
  };

  let selectedMood = "";

  moodOptions.forEach((option) => {
    option.setAttribute("aria-pressed", "false");

    option.addEventListener("click", () => {
      moodOptions.forEach((item) => {
        item.classList.remove("is-selected");
        item.setAttribute("aria-pressed", "false");
      });

      option.classList.add("is-selected");
      option.setAttribute("aria-pressed", "true");

      selectedMood =
        option.dataset.mood ||
        option.value ||
        option.textContent.trim().toLowerCase();
    });
  });

  function renderMoodHistory() {
    if (!historyContainer) return;

    const history = getLocalData("mentalHealthMood", []);

    if (!history.length) {
      historyContainer.textContent = "Belum ada catatan suasana hati.";
      return;
    }

    historyContainer.replaceChildren();

    history.slice(0, 5).forEach((item) => {
      const entry = document.createElement("p");
      entry.textContent = `${item.date} — ${item.mood}`;
      historyContainer.appendChild(entry);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!selectedMood) {
      showMessage(result, "Pilih suasana hati terlebih dahulu, ya.");
      return;
    }

    const history = getLocalData("mentalHealthMood", []);

    history.unshift({
      mood: selectedMood,
      date: new Date().toLocaleString("id-ID")
    });

    if (!saveLocalData("mentalHealthMood", history.slice(0, 30))) {
      return;
    }

    const advice =
      moodAdvice[selectedMood.toLowerCase()] ||
      "Terima perasaanmu tanpa menghakimi diri sendiri. Kamu boleh mengambil waktu untuk beristirahat.";

    showMessage(result, `Terima kasih sudah berbagi. ${advice}`);

    moodOptions.forEach((option) => {
      option.classList.remove("is-selected");
      option.setAttribute("aria-pressed", "false");
    });

    selectedMood = "";
    renderMoodHistory();
  });

  renderMoodHistory();
}

// =========================================================
// 4. KUESIONER REFLEKSI DIRI
// =========================================================

function initQuestionnaire() {
  const form = $(".questionnaire-form") ||
    $("#questionnaire-form");

  const result = $("#questionnaire-result") ||
    $(".questionnaire-result");

  if (!form || !result) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const questions = $$(
      'input[type="radio"]:checked, input[type="checkbox"]:checked',
      form
    );

    const questionGroups = new Set(
      $$('input[type="radio"]', form).map((input) => input.name)
    );

    let unanswered = false;

    questionGroups.forEach((name) => {
      if (!form.querySelector(
        `input[type="radio"][name="${CSS.escape(name)}"]:checked`
      )) {
        unanswered = true;
      }
    });

    if (unanswered) {
      showMessage(
        result,
        "Silakan jawab semua pertanyaan sebelum melihat hasil refleksi."
      );
      return;
    }

    if (questions.length === 0) {
      showMessage(
        result,
        "Belum ada jawaban yang dapat dievaluasi. Periksa kembali kuesioner HTML."
      );
      return;
    }

    /*
      Setiap pertanyaan dapat menggunakan:
      data-score="0" sampai data-score="3"

      Contoh:
      <input type="radio" name="q1" value="Tidak pernah"
             data-score="0">

      Skor ini hanya digunakan untuk refleksi umum,
      bukan untuk mendiagnosis kondisi kesehatan mental.
    */

    const scoredAnswers = $$(
      'input[type="radio"]:checked',
      form
    );

    const hasScore = scoredAnswers.some(
      (input) => input.dataset.score !== undefined
    );

    if (!hasScore) {
      showMessage(
        result,
        "Jawabanmu sudah diterima. Gunakan hasil refleksi ini untuk mengenali perasaanmu, bukan sebagai diagnosis."
      );
      return;
    }

    const score = scoredAnswers.reduce((total, input) => {
      const value = Number(input.dataset.score);
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);

    const maxScore = scoredAnswers.reduce((total, input) => {
      const radios = $$(
        `input[type="radio"][name="${CSS.escape(input.name)}"]`,
        form
      );

      const values = radios
        .map((radio) => Number(radio.dataset.score))
        .filter(Number.isFinite);

      return total + (values.length ? Math.max(...values) : 0);
    }, 0);

    const ratio = maxScore > 0 ? score / maxScore : 0;

    let reflection;

    if (ratio < 0.34) {
      reflection =
        "Jawabanmu menunjukkan bahwa beberapa hal mungkin terasa cukup ringan saat ini. Tetap jaga rutinitas, istirahat, dan hubungan yang mendukungmu.";
    } else if (ratio < 0.67) {
      reflection =
        "Sepertinya ada beberapa hal yang cukup membebani pikiranmu. Coba kenali pemicunya, beri waktu untuk beristirahat, dan berbicaralah dengan orang yang kamu percaya.";
    } else {
      reflection =
        "Kamu mungkin sedang menghadapi banyak tekanan. Kamu tidak harus menghadapinya sendirian. Pertimbangkan untuk berbicara dengan orang dewasa tepercaya, guru BK, atau tenaga profesional.";
    }

    showMessage(
      result,
      `${reflection} Ini bukan diagnosis medis. Jika perasaan berat berlangsung lama atau mengganggu aktivitasmu, carilah dukungan yang sesuai.`
    );
  });
}

// =========================================================
// 5. LATIHAN PERNAPASAN
// =========================================================

function initBreathingExercise() {
  const startButton = $("#start-breathing") ||
    $(".start-breathing");

  const stopButton = $("#stop-breathing") ||
    $(".stop-breathing");

  const circle = $(".breathing-circle");
  const instruction = $("#breathing-instruction") ||
    $(".breathing-instruction");

  const timerDisplay = $("#breathing-timer") ||
    $(".breathing-timer");

  if (!startButton || !circle) return;

  let intervalId = null;
  let remainingSeconds = 60;
  let phaseIndex = 0;
  let running = false;

  // Durasi setiap tahap dalam detik.
  const phases = [
    { label: "Tarik napas perlahan", duration: 4, className: "inhale" },
    { label: "Tahan napas dengan nyaman", duration: 4, className: "hold" },
    { label: "Hembuskan napas perlahan", duration: 6, className: "exhale" }
  ];

  function updateDisplay() {
    if (timerDisplay) {
      timerDisplay.textContent =
        `${Math.floor(remainingSeconds / 60)}:${String(
          remainingSeconds % 60
        ).padStart(2, "0")}`;
    }
  }

  function setPhase() {
    const phase = phases[phaseIndex];

    circle.classList.remove("inhale", "hold", "exhale");
    circle.classList.add(phase.className);

    if (instruction) {
      instruction.textContent = phase.label;
    }
  }

  function stopBreathing(message = "Latihan selesai. Luangkan waktu untuk beristirahat.") {
    clearInterval(intervalId);
    intervalId = null;
    running = false;

    circle.classList.remove("inhale", "hold", "exhale");

    startButton.disabled = false;

    if (stopButton) stopButton.disabled = true;

    if (instruction) instruction.textContent = message;
  }

  startButton.addEventListener("click", () => {
    if (running) return;

    running = true;
    remainingSeconds = 60;
    phaseIndex = 0;

    startButton.disabled = true;
    if (stopButton) stopButton.disabled = false;

    setPhase();
    updateDisplay();

    let phaseElapsed = 0;

    intervalId = setInterval(() => {
      remainingSeconds--;
      phaseElapsed++;

      if (phaseElapsed >= phases[phaseIndex].duration) {
        phaseIndex = (phaseIndex + 1) % phases.length;
        phaseElapsed = 0;
        setPhase();
      }

      updateDisplay();

      if (remainingSeconds <= 0) {
        stopBreathing();
      }
    }, 1000);
  });

  if (stopButton) {
    stopButton.disabled = true;

    stopButton.addEventListener("click", () => {
      stopBreathing("Latihan dihentikan. Tidak apa-apa untuk berhenti kapan saja.");
      updateDisplay();
    });
  }

  // Jangan memaksa pola napas. Pengguna boleh bernapas normal
  // atau menghentikan latihan jika merasa pusing/tidak nyaman.
  updateDisplay();
}

// =========================================================
// 6. JURNAL HARIAN
// =========================================================

function initJournal() {
  const form = $(".journal-form") ||
    $("#journal-form");

  const input = $("#journal-entry") ||
    $('textarea[name="journal"]', form || document) ||
    $(".journal-input");

  const list = $(".journal-list") ||
    $("#journal-list");

  if (!form || !input || !list) return;

  function renderJournal() {
    const entries = getLocalData("mentalHealthJournal", []);

    list.replaceChildren();

    if (entries.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "Belum ada catatan. Kamu bisa mulai menulis hari ini.";
      list.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const article = document.createElement("article");
      article.className = "journal-entry";

      const date = document.createElement("p");
      date.className = "journal-date";
      date.textContent = entry.date;

      const content = document.createElement("p");
      content.className = "journal-content";
      content.textContent = entry.text;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-journal";
      deleteButton.textContent = "Hapus catatan";

      deleteButton.addEventListener("click", () => {
        const confirmed = window.confirm(
          "Yakin ingin menghapus catatan jurnal ini?"
        );

        if (!confirmed) return;

        const currentEntries = getLocalData(
          "mentalHealthJournal",
          []
        );

        const updatedEntries = currentEntries.filter(
          (item) => item.id !== entry.id
        );

        if (saveLocalData("mentalHealthJournal", updatedEntries)) {
          renderJournal();
        }
      });

      article.append(date, content, deleteButton);
      list.appendChild(article);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = input.value.trim();

    if (!text) {
      input.focus();
      return;
    }

    const entries = getLocalData("mentalHealthJournal", []);

    entries.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text,
      date: new Date().toLocaleString("id-ID")
    });

    if (saveLocalData("mentalHealthJournal", entries.slice(0, 100))) {
      input.value = "";
      renderJournal();
    }
  });

  renderJournal();
}

// =========================================================
// 7. KEBIASAAN POSITIF
// =========================================================

function initHabits() {
  const habitCards = $$(".habit-card");

  if (!habitCards.length) return;

  const STORAGE_KEY = "mentalHealthHabits";
  const savedHabits = getLocalData(STORAGE_KEY, {});

  habitCards.forEach((card, index) => {
    const checkbox = $('input[type="checkbox"]', card);
    if (!checkbox) return;

    const habitId =
      card.dataset.habit ||
      checkbox.name ||
      `habit-${index}`;

    checkbox.checked = Boolean(savedHabits[habitId]);

    checkbox.addEventListener("change", () => {
      const habits = getLocalData(STORAGE_KEY, {});
      habits[habitId] = checkbox.checked;

      if (!saveLocalData(STORAGE_KEY, habits)) {
        checkbox.checked = !checkbox.checked;
        return;
      }

      card.classList.toggle("is-complete", checkbox.checked);
    });

    card.classList.toggle("is-complete", checkbox.checked);
  });
}

// =========================================================
// 8. TOMBOL KEMBALI KE ATAS
// =========================================================

function initBackToTop() {
  const button = $("#back-to-top") ||
    $(".back-to-top");

  if (!button) return;

  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

// =========================================================
// 9. TAHUN OTOMATIS DI FOOTER
// =========================================================

function initFooterYear() {
  const yearElement = $("#current-year") ||
    $(".current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// =========================================================
// 10. INISIALISASI SEMUA FITUR
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initMoodCheckIn();
  initQuestionnaire();
  initBreathingExercise();
  initJournal();
  initHabits();
  initBackToTop();
  initFooterYear();

  console.log("Website kesehatan mental berhasil dimuat.");
});
