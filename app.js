// ===== QUIZ APP =====
let quizQuestions = [];
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let retryCount = 0;
let pendingRetry = null; // soal yg salah, langsung diulang di next
let answeredWrong = []; // record soal yg salah untuk review
let selectedMode = 'all';
let isRetry = false;
let displayNum = 0; // nomor tampilan soal

function selectMode(mode) {
  selectedMode = mode;
  document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startQuiz() {
  const doShuffle = document.getElementById('shuffleToggle').checked;
  let questions = [...QUIZ_DATA];
  if (doShuffle) questions = shuffle(questions);

  const count = selectedMode === 'all' ? questions.length : parseInt(selectedMode);
  quizQuestions = questions.slice(0, count);
  
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  retryCount = 0;
  pendingRetry = null;
  answeredWrong = [];
  isRetry = false;
  displayNum = 0;

  showScreen('quizScreen');
  renderQuestion();
}

function restartQuiz() {
  showScreen('startScreen');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function renderQuestion() {
  let q;
  
  // Jika ada soal yang harus diulang, tampilkan dulu
  if (pendingRetry) {
    q = pendingRetry;
    pendingRetry = null;
    isRetry = true;
    retryCount++;
  } else if (currentIndex < quizQuestions.length) {
    q = quizQuestions[currentIndex];
    isRetry = false;
  } else {
    showResults();
    return;
  }

  displayNum++;
  const total = quizQuestions.length;

  // Update header
  document.getElementById('questionCounter').textContent = `${displayNum} / ~${total}`;
  document.getElementById('scoreDisplay').textContent = `✅ ${correctCount}  ❌ ${wrongCount}`;
  
  const progress = Math.min((currentIndex / total) * 100, 100);
  document.getElementById('progressFill').style.width = progress + '%';

  // Retry badge
  const badge = document.getElementById('retryBadge');
  badge.style.display = isRetry ? 'block' : 'none';

  // Question
  document.getElementById('questionText').textContent = `${q.id}. ${q.q}`;

  // Choices
  const container = document.getElementById('choicesContainer');
  container.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  q.choices.forEach((choice, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<span class="choice-label">${labels[i]}</span><span class="choice-text">${choice}</span>`;
    btn.onclick = () => handleAnswer(btn, i, q);
    container.appendChild(btn);
  });

  // Hide feedback & next
  const fb = document.getElementById('feedbackArea');
  fb.style.display = 'none';
  fb.className = 'feedback-area';
  document.getElementById('nextBtn').style.display = 'none';

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleAnswer(btn, selectedIdx, question) {
  const isCorrect = selectedIdx === question.correct;
  const allBtns = document.querySelectorAll('.choice-btn');

  // Disable all
  allBtns.forEach(b => b.classList.add('disabled'));

  // Mark selected
  if (isCorrect) {
    btn.classList.add('correct');
    correctCount++;
  } else {
    btn.classList.add('wrong');
    wrongCount++;
    // Highlight correct
    allBtns[question.correct].classList.add('correct');
    
    // Langsung set sebagai pending retry (hanya jika bukan sudah retry)
    if (!isRetry) {
      pendingRetry = question;
    }
    
    // Record for review
    answeredWrong.push({
      q: question.q,
      id: question.id,
      selected: question.choices[selectedIdx],
      correct: question.choices[question.correct]
    });
  }

  // Feedback
  const fb = document.getElementById('feedbackArea');
  fb.style.display = 'block';
  if (isCorrect) {
    fb.className = 'feedback-area correct-fb';
    document.getElementById('feedbackContent').innerHTML = '✅ <strong>Benar!</strong> Jawaban kamu tepat.';
  } else {
    fb.className = 'feedback-area wrong-fb';
    const msg = isRetry 
      ? `❌ <strong>Masih salah.</strong> Jawaban yang benar: <strong>${question.choices[question.correct]}</strong>`
      : `❌ <strong>Salah!</strong> Jawaban yang benar: <strong>${question.choices[question.correct]}</strong><br>🔄 Soal ini akan langsung diulang.`;
    document.getElementById('feedbackContent').innerHTML = msg;
  }

  // Show next button
  document.getElementById('nextBtn').style.display = 'block';

  // Vibrate on wrong (mobile)
  if (!isCorrect && navigator.vibrate) navigator.vibrate(100);
}

function nextQuestion() {
  // Hanya naikkan index jika bukan retry DAN tidak ada pending retry
  // (jika ada pending retry, kita tampilkan dulu sebelum lanjut ke soal baru)
  if (!isRetry && !pendingRetry) {
    currentIndex++;
  } else if (!isRetry && pendingRetry) {
    // Jangan naikkan index, karena soal yang sama akan diulang dulu
    // Setelah retry selesai, baru lanjut ke soal berikutnya
  } else if (isRetry) {
    // Retry selesai, lanjut ke soal berikutnya
    currentIndex++;
  }
  
  if (currentIndex >= quizQuestions.length && !pendingRetry) {
    showResults();
  } else {
    renderQuestion();
  }
}

function showResults() {
  showScreen('resultScreen');
  const total = quizQuestions.length;
  const pct = Math.round((correctCount / (correctCount + wrongCount)) * 100);
  
  let emoji, title;
  if (pct >= 90) { emoji = '🏆'; title = 'Luar Biasa!'; }
  else if (pct >= 75) { emoji = '🎉'; title = 'Hebat!'; }
  else if (pct >= 60) { emoji = '👍'; title = 'Cukup Baik!'; }
  else if (pct >= 40) { emoji = '💪'; title = 'Terus Belajar!'; }
  else { emoji = '📚'; title = 'Ayo Belajar Lagi!'; }
  
  document.getElementById('resultEmoji').textContent = emoji;
  document.getElementById('resultTitle').textContent = title;
  document.getElementById('resultScore').textContent = pct + '%';
  document.getElementById('statCorrect').textContent = correctCount;
  document.getElementById('statWrong').textContent = wrongCount;
  document.getElementById('statRetry').textContent = retryCount;

  // Wrong list
  const list = document.getElementById('wrongList');
  list.innerHTML = '';
  // Deduplicate by question id
  const seen = new Set();
  answeredWrong.forEach(w => {
    if (seen.has(w.id)) return;
    seen.add(w.id);
    const div = document.createElement('div');
    div.className = 'wrong-item';
    div.innerHTML = `
      <div class="wq">${w.id}. ${w.q}</div>
      <div class="wa">❌ Jawaban kamu: ${w.selected}</div>
      <div class="wc">✅ Jawaban benar: ${w.correct}</div>
    `;
    list.appendChild(div);
  });
}

function reviewWrong() {
  const list = document.getElementById('wrongList');
  list.scrollIntoView({ behavior: 'smooth' });
}
