// ══════════════════════════════════════════════════════════
// TechAssess Pro — Main Application Logic
// ══════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ── State ───────────────────────────────────────────────
  const state = {
    candidate: { name: "", email: "", id: "" },
    currentQuestion: 0,
    answers: {},         // { questionIndex: selectedOptionIndex | codeString }
    flagged: new Set(),
    visited: new Set(),
    timeRemaining: 90 * 60, // 90 minutes in seconds
    timerInterval: null,
    mediaStream: null,
    mediaRecorder: null,
    recordedChunks: [],
    warnings: [],
    examStartTime: null,
    examEndTime: null,
    submitted: false,
    allQuestions: []      // merged: programming first, then MCQ
  };

  // ── Question order: Programming first, then MCQs ────────
  state.allQuestions = [...programmingQuestions, ...mcqQuestions];

  // ── DOM References ──────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const screens = {
    landing: $("#landing-screen"),
    proctor: $("#proctor-screen"),
    exam: $("#exam-screen"),
    results: $("#results-screen"),
  };

  // ── Server Upload ───────────────────────────────────────
  async function uploadToServer(examRecord, recordingBlob) {
    const formData = new FormData();
    formData.append("sessionId", examRecord.id);
    formData.append("examData", JSON.stringify(examRecord));

    if (recordingBlob && recordingBlob.size > 0) {
      formData.append("recording", recordingBlob, `${examRecord.id}.webm`);
    }

    const response = await fetch("/api/submit", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    return response.json();
  }

  // ── Screen Navigation ──────────────────────────────────
  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  // ── Registration ────────────────────────────────────────
  $("#registration-form").addEventListener("submit", (e) => {
    e.preventDefault();
    state.candidate.name = $("#candidate-name").value.trim();
    state.candidate.email = $("#candidate-email").value.trim();
    state.candidate.id = $("#candidate-id").value.trim();
    showScreen("proctor");
  });

  // ── Proctoring Setup ───────────────────────────────────
  $("#enable-media-btn").addEventListener("click", async () => {
    try {
      state.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: true,
      });

      // Show camera preview
      const video = $("#proctor-video");
      video.srcObject = state.mediaStream;
      $("#video-placeholder").classList.add("hidden");

      // Update permission status
      $("#perm-camera .perm-status").textContent = "✅";
      $("#perm-camera .perm-status").classList.add("granted");
      $("#perm-mic .perm-status").textContent = "✅";
      $("#perm-mic .perm-status").classList.add("granted");

      // Animate mic bars
      startMicVisualization();

      // Enable start button
      $("#perm-fullscreen .perm-status").textContent = "✅";
      $("#perm-fullscreen .perm-status").classList.add("granted");
      $("#start-exam-btn").disabled = false;
      $("#enable-media-btn").style.display = "none";
    } catch (err) {
      alert(
        "Camera/Microphone access is required for this exam.\nPlease allow permissions and try again.\n\nError: " +
          err.message
      );
    }
  });

  function startMicVisualization() {
    if (!state.mediaStream) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(state.mediaStream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 32;
    source.connect(analyser);

    const bars = $$("#mic-indicator .mic-bar");
    const data = new Uint8Array(analyser.frequencyBinCount);

    function update() {
      analyser.getByteFrequencyData(data);
      bars.forEach((bar, i) => {
        const val = data[i * 3] || 0;
        bar.style.height = Math.max(4, (val / 255) * 28) + "px";
      });
      requestAnimationFrame(update);
    }
    update();
  }

  // ── Start Recording ─────────────────────────────────────
  function startRecording() {
    if (!state.mediaStream) return;

    try {
      // Prefer webm with VP9 + opus for best quality/size ratio
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm";

      state.mediaRecorder = new MediaRecorder(state.mediaStream, {
        mimeType,
        videoBitsPerSecond: 500000, // 500kbps to keep file sizes manageable
      });

      state.recordedChunks = [];

      state.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          state.recordedChunks.push(event.data);
        }
      };

      // Collect data every 5 seconds
      state.mediaRecorder.start(5000);
      console.log("[Proctor] Recording started:", mimeType);
    } catch (err) {
      console.warn("[Proctor] Recording failed to start:", err);
    }
  }

  function stopRecording() {
    return new Promise((resolve) => {
      if (!state.mediaRecorder || state.mediaRecorder.state === "inactive") {
        resolve(null);
        return;
      }

      state.mediaRecorder.onstop = () => {
        const blob = new Blob(state.recordedChunks, { type: state.mediaRecorder.mimeType });
        console.log("[Proctor] Recording stopped. Size:", (blob.size / 1024 / 1024).toFixed(2), "MB");
        resolve(blob);
      };

      state.mediaRecorder.stop();
    });
  }

  // ── Start Exam ──────────────────────────────────────────
  $("#start-exam-btn").addEventListener("click", () => {
    showScreen("exam");

    // Mirror camera to mini preview
    const miniCam = $("#mini-camera");
    if (state.mediaStream) {
      miniCam.srcObject = state.mediaStream;
    }

    // Try fullscreen
    try {
      document.documentElement.requestFullscreen().catch(() => {});
    } catch (e) {}

    state.examStartTime = new Date();
    buildQuestionGrid();
    renderQuestion(0);
    startTimer();
    startProctoring();
    startRecording();
  });

  // ── Timer ───────────────────────────────────────────────
  function startTimer() {
    updateTimerDisplay();
    state.timerInterval = setInterval(() => {
      state.timeRemaining--;
      updateTimerDisplay();
      if (state.timeRemaining <= 0) {
        clearInterval(state.timerInterval);
        submitExam();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const mins = Math.floor(state.timeRemaining / 60);
    const secs = state.timeRemaining % 60;
    $("#timer-display").textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    const timer = $("#exam-timer");
    timer.classList.remove("warning", "danger");
    if (state.timeRemaining <= 300) timer.classList.add("danger");
    else if (state.timeRemaining <= 600) timer.classList.add("warning");
  }

  // ── Proctoring Monitoring ──────────────────────────────
  function startProctoring() {
    // Tab visibility
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && !state.submitted) {
        addWarning("Tab switch detected");
      }
    });

    // Fullscreen exit
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement && !state.submitted) {
        addWarning("Exited fullscreen mode");
        try {
          document.documentElement.requestFullscreen().catch(() => {});
        } catch (e) {}
      }
    });

    // Right-click prevention
    document.addEventListener("contextmenu", (e) => {
      if (!state.submitted) {
        e.preventDefault();
        addWarning("Right-click attempt blocked");
      }
    });

    // Copy/paste prevention
    document.addEventListener("copy", (e) => {
      if (!state.submitted) {
        // Allow in code editor
        const ae = document.activeElement;
        if (ae && ae.classList.contains("code-editor")) return;
        e.preventDefault();
        addWarning("Copy attempt blocked");
      }
    });
  }

  function addWarning(message) {
    const time = new Date();
    state.warnings.push({ time, message });
    const badge = $("#warning-badge");
    badge.style.display = "flex";
    $("#warning-count").textContent = state.warnings.length;

    // Flash effect
    badge.style.animation = "none";
    badge.offsetHeight;
    badge.style.animation = "pulse 0.5s ease 3";
  }

  // ── Question Grid ──────────────────────────────────────
  function buildQuestionGrid() {
    const grid = $("#question-grid");
    grid.innerHTML = "";
    state.allQuestions.forEach((_, i) => {
      const btn = document.createElement("button");
      btn.className = "q-nav-btn";
      btn.textContent = i + 1;
      btn.addEventListener("click", () => renderQuestion(i));
      grid.appendChild(btn);
    });
    $("#total-count").textContent = state.allQuestions.length;
    updateQuestionGrid();
  }

  function updateQuestionGrid() {
    const btns = $$(".q-nav-btn");
    btns.forEach((btn, i) => {
      btn.classList.remove("current", "answered", "flagged");
      if (i === state.currentQuestion) btn.classList.add("current");
      else if (state.flagged.has(i)) btn.classList.add("flagged");
      else if (state.answers[i] !== undefined) btn.classList.add("answered");
    });
    $("#answered-count").textContent = Object.keys(state.answers).length;
  }

  // ── Detect question type ───────────────────────────────
  function isProgrammingQuestion(index) {
    return index < programmingQuestions.length;
  }

  // ── Render Question ────────────────────────────────────
  function renderQuestion(index) {
    state.currentQuestion = index;
    state.visited.add(index);
    const q = state.allQuestions[index];
    const area = $("#question-area");

    const isMCQ = !isProgrammingQuestion(index);
    const letters = ["A", "B", "C", "D"];

    if (isMCQ) {
      area.innerHTML = `
        <div class="question-container">
          <div class="question-meta">
            <span class="q-number">Q${index + 1}</span>
            <span class="q-category">${q.category}</span>
          </div>
          <div class="question-text">${formatQuestion(q.question)}</div>
          <div class="options-list">
            ${q.options
              .map(
                (opt, oi) => `
              <button class="option-btn ${state.answers[index] === oi ? "selected" : ""}" data-index="${oi}">
                <span class="option-letter">${letters[oi]}</span>
                <span class="option-text">${escapeHtml(opt)}</span>
              </button>`
              )
              .join("")}
          </div>
        </div>`;

      // Option click handlers
      area.querySelectorAll(".option-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.answers[index] = parseInt(btn.dataset.index);
          area.querySelectorAll(".option-btn").forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          updateQuestionGrid();
        });
      });
    } else {
      // Programming question
      const pq = q;
      const savedCode = state.answers[index] || pq.starterCode;
      area.innerHTML = `
        <div class="question-container">
          <div class="question-meta">
            <span class="q-number">Q${index + 1}</span>
            <span class="q-category">${pq.category}</span>
          </div>
          <h3 style="margin-bottom:12px;font-size:1.2rem;">${escapeHtml(pq.title)}</h3>
          <div class="question-text">${formatQuestion(pq.question)}</div>
          <div class="code-editor-wrapper">
            <textarea class="code-editor" id="code-editor-${index}" spellcheck="false">${escapeHtml(savedCode)}</textarea>
          </div>
          <div style="margin-top:12px;">
            <strong style="font-size:0.85rem;color:var(--text-secondary);">Test Cases:</strong>
            <ul style="margin-top:6px;padding-left:20px;color:var(--text-muted);font-size:0.85rem;">
              ${pq.testCases.map((tc) => `<li style="margin-bottom:4px;">${escapeHtml(tc)}</li>`).join("")}
            </ul>
          </div>
        </div>`;

      // Save code on input
      const editor = $(`#code-editor-${index}`);
      editor.addEventListener("input", () => {
        state.answers[index] = editor.value;
        updateQuestionGrid();
      });

      // Tab key support
      editor.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          const start = editor.selectionStart;
          const end = editor.selectionEnd;
          editor.value = editor.value.substring(0, start) + "  " + editor.value.substring(end);
          editor.selectionStart = editor.selectionEnd = start + 2;
          state.answers[index] = editor.value;
        }
      });
    }

    // Update navigation buttons
    $("#prev-btn").disabled = index === 0;
    const isLast = index === state.allQuestions.length - 1;
    const nextBtn = $("#next-btn");
    if (isLast) {
      nextBtn.textContent = "Submit Exam";
      nextBtn.style.background = "linear-gradient(135deg, #ef4444, #dc2626)";
      nextBtn.style.color = "white";
      nextBtn.style.border = "none";
    } else {
      nextBtn.innerHTML = 'Next <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      nextBtn.style.background = "";
      nextBtn.style.color = "";
      nextBtn.style.border = "";
    }

    // Update flag button
    const flagBtn = $("#flag-btn");
    if (state.flagged.has(index)) {
      flagBtn.classList.add("flagged");
      flagBtn.querySelector("span").textContent = "🚩 Unflag";
    } else {
      flagBtn.classList.remove("flagged");
      flagBtn.querySelector("span").textContent = "🚩 Flag for Review";
    }

    updateQuestionGrid();
  }

  function formatQuestion(text) {
    // Convert markdown-style code blocks
    return escapeHtml(text)
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background:#1a1a2e;padding:16px;border-radius:8px;margin:12px 0;font-family:var(--font-mono);font-size:0.85rem;overflow-x:auto;border:1px solid var(--border);color:#e0e0ff;">$2</pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, "<br>");
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ── Navigation ──────────────────────────────────────────
  $("#prev-btn").addEventListener("click", () => {
    if (state.currentQuestion > 0) renderQuestion(state.currentQuestion - 1);
  });

  $("#next-btn").addEventListener("click", () => {
    if (state.currentQuestion < state.allQuestions.length - 1) {
      renderQuestion(state.currentQuestion + 1);
    } else {
      showSubmitModal();
    }
  });

  $("#flag-btn").addEventListener("click", () => {
    const i = state.currentQuestion;
    if (state.flagged.has(i)) state.flagged.delete(i);
    else state.flagged.add(i);
    renderQuestion(i);
  });

  // ── Submit Modal ────────────────────────────────────────
  function showSubmitModal() {
    const answered = Object.keys(state.answers).length;
    const total = state.allQuestions.length;
    const unanswered = total - answered;
    const flaggedCount = state.flagged.size;

    const summary = $("#submit-summary");
    summary.innerHTML = `
      <div class="stat-row"><span class="label">Total Questions</span><span class="value">${total}</span></div>
      <div class="stat-row"><span class="label">Answered</span><span class="value" style="color:var(--success)">${answered}</span></div>
      <div class="stat-row ${unanswered > 0 ? "warning" : ""}"><span class="label">Unanswered</span><span class="value">${unanswered}</span></div>
      <div class="stat-row ${flaggedCount > 0 ? "warning" : ""}"><span class="label">Flagged for Review</span><span class="value">${flaggedCount}</span></div>
      <div class="stat-row"><span class="label">Warnings</span><span class="value" style="color:${state.warnings.length > 0 ? "var(--danger)" : "var(--success)"}">${state.warnings.length}</span></div>
    `;

    $("#submit-modal").style.display = "flex";
  }

  $("#cancel-submit").addEventListener("click", () => {
    $("#submit-modal").style.display = "none";
  });

  $("#confirm-submit").addEventListener("click", () => {
    $("#submit-modal").style.display = "none";
    submitExam();
  });

  // ── Submit Exam ─────────────────────────────────────────
  async function submitExam() {
    if (state.submitted) return;
    state.submitted = true;
    state.examEndTime = new Date();
    clearInterval(state.timerInterval);

    // Stop recording and get blob
    const recordingBlob = await stopRecording();

    // Calculate results — MCQs now start at index = programmingQuestions.length
    let correctMCQ = 0;
    const mcqStartIndex = programmingQuestions.length;
    mcqQuestions.forEach((q, i) => {
      if (state.answers[mcqStartIndex + i] === q.correct) correctMCQ++;
    });

    const totalTime = Math.round((state.examEndTime - state.examStartTime) / 1000);
    const mins = Math.floor(totalTime / 60);
    const secs = totalTime % 60;

    const programmingAnswered = programmingQuestions.filter(
      (_, i) => state.answers[i] !== undefined
    ).length;

    // Generate a unique exam session ID
    const sessionId = `${state.candidate.id}_${Date.now()}`;

    // Collect answer data for admin
    const answerData = {};
    state.allQuestions.forEach((q, i) => {
      if (state.answers[i] !== undefined) {
        if (isProgrammingQuestion(i)) {
          answerData[`Q${i + 1}_coding_${q.title}`] = state.answers[i];
        } else {
          const selected = state.answers[i];
          answerData[`Q${i + 1}_${q.category}`] = {
            selected: selected,
            selectedText: q.options[selected],
            correct: q.correct,
            isCorrect: selected === q.correct,
          };
        }
      }
    });

    // Build exam record
    const examRecord = {
      id: sessionId,
      candidate: { ...state.candidate },
      startTime: state.examStartTime.toISOString(),
      endTime: state.examEndTime.toISOString(),
      duration: `${mins}m ${secs}s`,
      mcqScore: correctMCQ,
      mcqTotal: mcqQuestions.length,
      codingSubmitted: programmingAnswered,
      codingTotal: programmingQuestions.length,
      warnings: state.warnings.map((w) => ({
        time: w.time.toISOString(),
        message: w.message,
      })),
      answers: answerData,
      hasRecording: recordingBlob && recordingBlob.size > 0,
    };

    // Upload to server
    try {
      await uploadToServer(examRecord, recordingBlob);
      console.log("[Proctor] Exam + recording uploaded to server:", sessionId);
    } catch (err) {
      console.warn("[Proctor] Server upload failed:", err);
    }

    // Build results UI
    const stats = $("#results-stats");
    stats.innerHTML = `
      <div class="result-stat"><div class="stat-label">MCQ Score</div><div class="stat-value">${correctMCQ} / ${mcqQuestions.length}</div></div>
      <div class="result-stat"><div class="stat-label">Coding Submitted</div><div class="stat-value">${programmingAnswered} / ${programmingQuestions.length}</div></div>
      <div class="result-stat"><div class="stat-label">Time Taken</div><div class="stat-value">${mins}m ${secs}s</div></div>
      <div class="result-stat"><div class="stat-label">Warnings</div><div class="stat-value" style="color:${state.warnings.length > 0 ? "var(--danger)" : "var(--success)"}">${state.warnings.length}</div></div>
    `;

    // Build proctoring log
    const log = $("#proctoring-log");
    if (state.warnings.length > 0) {
      log.innerHTML = "<h3>Proctoring Summary</h3>" +
        state.warnings
          .map((w) => {
            const t = w.time;
            const ts = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}`;
            return `<div class="log-entry"><span class="log-time">${ts}</span><span class="log-type warning">Warning</span><span>${escapeHtml(w.message)}</span></div>`;
          })
          .join("");
    } else {
      log.innerHTML = '<h3>Proctoring Summary</h3><p style="color:var(--success);font-size:0.9rem;margin-top:8px;">✅ No violations detected during the exam session.</p>';
    }

    // Recording download link on results page
    if (recordingBlob && recordingBlob.size > 0) {
      const recordingInfo = document.createElement("div");
      recordingInfo.className = "recording-saved-notice";
      recordingInfo.innerHTML = `
        <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:16px;">
          📹 Your proctoring session has been recorded and saved for review.
        </p>`;
      log.appendChild(recordingInfo);
    }

    // Stop media
    if (state.mediaStream) {
      state.mediaStream.getTracks().forEach((t) => t.stop());
    }

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    showScreen("results");
  }

  // ── Keyboard Shortcuts ──────────────────────────────────
  document.addEventListener("keydown", (e) => {
    if (!screens.exam.classList.contains("active")) return;
    if (document.activeElement && document.activeElement.classList.contains("code-editor")) return;

    if (e.key === "ArrowLeft" && state.currentQuestion > 0) {
      renderQuestion(state.currentQuestion - 1);
    } else if (e.key === "ArrowRight" && state.currentQuestion < state.allQuestions.length - 1) {
      renderQuestion(state.currentQuestion + 1);
    }
  });
})();
