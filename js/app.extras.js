// Shared notification helper
function showNotification(message, type = 'info') {
  if (window.ErrorHandler && typeof ErrorHandler.showNotification === 'function') {
    ErrorHandler.showNotification(message, type);
    return;
  }
  alert(message);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---- Assignment Calendar ----
(function setupCalendar() {
  const calendarUI = document.getElementById('calendar-ui');
  const detailsDiv = document.getElementById('calendar-details');
  if (!calendarUI || !detailsDiv) {
    return;
  }

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();

  function getAllEvents() {
    const events = [];

    const projects = storage.get('student-helper-projects') || [];
    projects.forEach((project) => {
      if (project && project.due) {
        events.push({
          type: 'Project',
          name: project.name || 'Untitled Project',
          date: project.due,
          priority: project.priority || 'medium'
        });
      }
    });

    const classes = storage.get('student-helper-classes') || [];
    classes.forEach((course) => {
      (course.assignments || []).forEach((assignment) => {
        if (assignment && assignment.dueDate) {
          events.push({
            type: 'Assignment',
            name: assignment.name || 'Untitled Assignment',
            date: assignment.dueDate,
            className: course.name || 'Class'
          });
        }
      });
    });

    return events;
  }

  function renderCalendar(year = currentYear, month = currentMonth) {
    currentYear = year;
    currentMonth = month;

    const events = getAllEvents();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const today = new Date();

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;gap:0.5rem;">
        <button id="cal-prev" class="btn btn-small btn-secondary">&lt;</button>
        <strong>${first.toLocaleString('default', { month: 'long' })} ${year}</strong>
        <button id="cal-next" class="btn btn-small btn-secondary">&gt;</button>
      </div>
    `;

    html += '<table><thead><tr>';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((day) => {
      html += `<th style="text-align:center;">${day}</th>`;
    });
    html += '</tr></thead><tbody><tr>';

    for (let i = 0; i < first.getDay(); i += 1) {
      html += '<td></td>';
    }

    for (let day = 1; day <= last.getDate(); day += 1) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter((event) => event.date === dateStr);
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day;

      const cellStyle = [
        'cursor:pointer;text-align:center;vertical-align:top;',
        dayEvents.length ? 'background:var(--primary-lighter);' : '',
        isToday ? 'outline:2px solid var(--primary);outline-offset:-2px;' : ''
      ].join('');

      html += `<td data-date="${dateStr}" style="${cellStyle}">`;
      html += `<div>${day}</div>`;
      if (dayEvents.length) {
        html += `<div style="font-size:0.75rem;color:var(--primary);margin-top:0.2rem;">${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}</div>`;
      }
      html += '</td>';

      if ((first.getDay() + day) % 7 === 0 && day !== last.getDate()) {
        html += '</tr><tr>';
      }
    }

    html += '</tr></tbody></table>';
    calendarUI.innerHTML = html;
    detailsDiv.innerHTML = '';

    const prevBtn = calendarUI.querySelector('#cal-prev');
    const nextBtn = calendarUI.querySelector('#cal-next');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (month === 0) {
          renderCalendar(year - 1, 11);
        } else {
          renderCalendar(year, month - 1);
        }
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (month === 11) {
          renderCalendar(year + 1, 0);
        } else {
          renderCalendar(year, month + 1);
        }
      };
    }

    calendarUI.querySelectorAll('td[data-date]').forEach((cell) => {
      cell.onclick = () => {
        const date = cell.getAttribute('data-date');
        const dayEvents = events.filter((event) => event.date === date);
        if (!dayEvents.length) {
          detailsDiv.innerHTML = `<strong>${date}</strong><div class="text-muted">No events.</div>`;
          return;
        }

        detailsDiv.innerHTML = `
          <strong>${date}</strong>
          <ul style="margin:0.5rem 0 0 1rem;">
            ${dayEvents
              .map((event) => {
                const suffix = event.className ? ` (${escapeHtml(event.className)})` : '';
                return `<li>[${escapeHtml(event.type)}] ${escapeHtml(event.name)}${suffix}</li>`;
              })
              .join('')}
          </ul>
        `;
      };
    });
  }

  window.refreshCalendar = function refreshCalendar() {
    renderCalendar(currentYear, currentMonth);
  };

  window.addEventListener('stats-updated', () => window.refreshCalendar());
  window.addEventListener('projects-updated', () => window.refreshCalendar());
  renderCalendar(currentYear, currentMonth);
})();

// ---- Music Player ----
(function setupMusic() {
  document.addEventListener('DOMContentLoaded', () => {
    const streamSelect = document.getElementById('streamSelect');
    const playBtn = document.getElementById('playStreamBtn');
    const stopBtn = document.getElementById('stopStreamBtn');
    const audio = document.getElementById('audioPlayer');
    const spotifyInput = document.getElementById('spotifyUri');
    const spotifyLoad = document.getElementById('spotifyLoadBtn');
    const spotifyEmbed = document.getElementById('spotifyEmbed');
    const playlistSelect = document.getElementById('music-playlist');

    if (!audio) {
      return;
    }

    function stopAudio() {
      audio.pause();
      audio.src = '';
      audio.style.display = 'none';
      if (spotifyEmbed) {
        spotifyEmbed.innerHTML = '';
      }
    }

    if (playBtn && streamSelect) {
      playBtn.addEventListener('click', () => {
        const url = streamSelect.value;
        if (!url) {
          showNotification('Select a stream to play', 'warning');
          return;
        }

        stopAudio();
        audio.src = url;
        audio.style.display = 'block';
        audio.play().catch(() => {});
        showNotification('Playing stream', 'success');
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', stopAudio);
    }

    if (spotifyLoad && spotifyInput && spotifyEmbed) {
      spotifyLoad.addEventListener('click', () => {
        const uri = spotifyInput.value.trim();
        if (!uri) {
          showNotification('Enter a Spotify URI or URL', 'warning');
          return;
        }

        let embedUrl = uri;
        if (uri.includes('open.spotify.com')) {
          embedUrl = uri.replace('open.spotify.com/', 'open.spotify.com/embed/');
        } else if (uri.startsWith('spotify:')) {
          const parts = uri.split(':');
          if (parts.length >= 3) {
            embedUrl = `https://open.spotify.com/embed/${parts[1]}/${parts[2]}`;
          }
        }

        stopAudio();
        spotifyEmbed.innerHTML = `<iframe src="${embedUrl}" width="100%" height="80" frameborder="0" allow="encrypted-media"></iframe>`;
        showNotification('Spotify embed loaded', 'success');
      });
    }

    if (playlistSelect && streamSelect) {
      playlistSelect.addEventListener('change', () => {
        const map = {
          lofi: 'https://icecast.somafm.com/lofi-hiphop',
          classical: 'https://icecast.somafm.com/lounge',
          ambient: 'https://icecast.somafm.com/groovesalad',
          nature: ''
        };
        const selected = playlistSelect.value;
        const stream = map[selected];
        if (!stream) {
          showNotification('No direct stream for this playlist', 'info');
          return;
        }
        streamSelect.value = stream;
        if (playBtn) {
          playBtn.click();
        }
      });
    }
  });
})();

// ---- AI Chat (model API + local fallback) ----
(function setupAiChat() {
  const addChatMessage = (message, isUser, allowHtml = false) => {
    const messagesContainer = document.getElementById('chatMessages');
    const chatContainer = document.getElementById('chatContainer');
    if (!messagesContainer || !chatContainer) {
      return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = [
      'padding:0.75rem;',
      'border-radius:8px;',
      'max-width:85%;',
      'word-wrap:break-word;',
      isUser
        ? 'background:var(--primary);color:#fff;margin-left:auto;'
        : 'background:var(--bg-primary);color:var(--text-primary);'
    ].join('');
    if (allowHtml && !isUser) {
      if (window.DOMPurify) {
        messageDiv.innerHTML = DOMPurify.sanitize(String(message || ''));
      } else {
        messageDiv.textContent = String(message || '').replace(/<[^>]+>/g, '');
      }
    } else {
      messageDiv.textContent = message;
    }
    messagesContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  const buildReadingLinksHtml = (question) => {
    const q = encodeURIComponent((question || '').trim());
    return `
      <div style="margin-top:0.6rem;font-size:0.9rem;">
        <strong>Related reading:</strong>
        <ul style="margin:0.45rem 0 0 1.1rem;">
          <li><a href="https://scholar.google.com/scholar?q=${q}" target="_blank" rel="noopener">Google Scholar</a></li>
          <li><a href="https://www.khanacademy.org/search?page_search_query=${q}" target="_blank" rel="noopener">Khan Academy</a></li>
          <li><a href="https://openstax.org/subjects" target="_blank" rel="noopener">OpenStax Textbooks</a></li>
          <li><a href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">YouTube Learning Results</a></li>
        </ul>
      </div>
    `;
  };

  const generateLocalResponse = (question) => {
    const q = String(question || '').toLowerCase();
    if (q.includes('study plan')) {
      return 'Plan: pick 3 goals, do 45-minute focus blocks, then 10-minute recall without notes after each block.';
    }
    if (q.includes('explain')) {
      return 'I can break this into definition, why it matters, worked example, and a short self-check.';
    }
    if (q.includes('memorize') || q.includes('remember')) {
      return 'Use active recall + spaced repetition: review now, then at 1 day, 3 days, and 7 days.';
    }
    return 'Share your class/topic and I will help organize concepts, what to read first, and practice steps.';
  };

  function getNoteContext() {
    try {
      if (typeof editorModule === 'undefined' || !editorModule || typeof editorModule.getContent !== 'function') {
        return '';
      }
      const html = editorModule.getContent() || '';
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const text = (temp.textContent || temp.innerText || '').trim();
      return text.slice(0, 1600);
    } catch (_) {
      return '';
    }
  }

  async function generateModelResponse(question) {
    const proxyBase = (window.API_PROXY_URL || '').trim().replace(/\/+$/, '');
    if (proxyBase) {
      const response = await fetch(`${proxyBase}/ai_chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          model: (window.AI_MODEL || 'gemini-1.5-flash').trim(),
          context: getNoteContext(),
          include_resources: true
        })
      });
      if (!response.ok) {
        throw new Error(`AI proxy error (${response.status})`);
      }
      const payload = await response.json();
      return {
        answer: String(payload.answer || '').trim(),
        concepts: Array.isArray(payload.concepts) ? payload.concepts : [],
        steps: Array.isArray(payload.steps) ? payload.steps : [],
        materials: Array.isArray(payload.materials) ? payload.materials : [],
        policyNote: String(payload.policy_note || '').trim()
      };
    }

    const apiKey = (window.AI_API_KEY || '').trim();
    const base = (window.AI_API_BASE_URL || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
    const model = (window.AI_MODEL || 'gpt-4o-mini').trim();
    if (!apiKey) {
      return null;
    }

    const response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a concise study helper. Explain clearly, cite uncertainty, and avoid writing full assignment submissions.'
          },
          { role: 'user', content: question }
        ],
        temperature: 0.4
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error (${response.status})`);
    }

    const payload = await response.json();
    const answer = payload
      && payload.choices
      && payload.choices[0]
      && payload.choices[0].message
      ? payload.choices[0].message.content
      : '';
    return {
      answer: String(answer || '').trim(),
      concepts: [],
      steps: [],
      materials: [],
      policyNote: 'Use this help to write your own final submission.'
    };
  }

  function renderAssistantPayload(payload, question) {
    const answer = escapeHtml(payload && payload.answer ? payload.answer : generateLocalResponse(question));
    const concepts = Array.isArray(payload && payload.concepts) ? payload.concepts : [];
    const steps = Array.isArray(payload && payload.steps) ? payload.steps : [];
    const materials = Array.isArray(payload && payload.materials) ? payload.materials : [];
    const policyNote = escapeHtml(payload && payload.policyNote ? payload.policyNote : 'Use AI as a tutor, not a submission writer.');

    const conceptsHtml = concepts.length
      ? `<div style="margin-top:0.65rem;"><strong>Key Concepts</strong><ul style="margin:0.3rem 0 0 1.1rem;">${concepts.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul></div>`
      : '';

    const stepsHtml = steps.length
      ? `<div style="margin-top:0.65rem;"><strong>Study Steps</strong><ol style="margin:0.3rem 0 0 1.1rem;">${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol></div>`
      : '';

    const materialsHtml = materials.length
      ? `<div style="margin-top:0.65rem;"><strong>Books / Materials</strong><ul style="margin:0.3rem 0 0 1.1rem;">${materials.map((m) => {
        const title = escapeHtml(m && m.title ? m.title : 'Suggested reading');
        const why = escapeHtml(m && m.why ? m.why : '');
        const sections = escapeHtml(m && m.sections ? m.sections : '');
        const link = m && m.link ? String(m.link).trim() : '';
        const linkHtml = link ? ` <a href="${escapeHtml(link)}" target="_blank" rel="noopener">Open</a>` : '';
        return `<li><strong>${title}</strong>${linkHtml}${why ? `<div style="font-size:0.88rem;">Why: ${why}</div>` : ''}${sections ? `<div style="font-size:0.88rem;">Read: ${sections}</div>` : ''}</li>`;
      }).join('')}</ul></div>`
      : '';

    return `
      <div>${answer}</div>
      ${conceptsHtml}
      ${stepsHtml}
      ${materialsHtml}
      ${buildReadingLinksHtml(question)}
      <div style="margin-top:0.6rem;font-size:0.82rem;color:var(--text-secondary);">${policyNote}</div>
    `;
  }

  const askAIHandler = async () => {
    const input = document.getElementById('aiQuestion');
    if (!input) {
      return;
    }
    const question = input.value.trim();
    if (!question) {
      showNotification('Type a question first', 'warning');
      return;
    }

    addChatMessage(question, true);
    input.value = '';

    addChatMessage('Thinking...', false);

    try {
      const apiPayload = await generateModelResponse(question);
      const hasApiAnswer = Boolean(apiPayload && apiPayload.answer);
      const chatMessages = document.getElementById('chatMessages');
      if (chatMessages && chatMessages.lastElementChild) {
        chatMessages.lastElementChild.remove();
      }
      addChatMessage(renderAssistantPayload(apiPayload, question), false, true);
      if (!hasApiAnswer) {
        showNotification('AI key not configured. Used local fallback response.', 'info');
      }
    } catch (error) {
      const chatMessages = document.getElementById('chatMessages');
      if (chatMessages && chatMessages.lastElementChild) {
        chatMessages.lastElementChild.remove();
      }
      addChatMessage(renderAssistantPayload({
        answer: generateLocalResponse(question),
        concepts: [],
        steps: [],
        materials: [],
        policyNote: 'Local fallback response in use.'
      }, question), false, true);
      const proxyBase = (window.API_PROXY_URL || '').trim();
      if (proxyBase) {
        showNotification('Local AI proxy unavailable. Start python local_api_proxy.py. Using fallback.', 'warning');
      } else {
        showNotification('AI request failed, using fallback: ' + error.message, 'warning');
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const askBtn = document.getElementById('askAiBtn');
    const input = document.getElementById('aiQuestion');
    if (askBtn) {
      askBtn.addEventListener('click', askAIHandler);
    }
    if (input) {
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          askAIHandler();
        }
      });
    }
  });
})();

// ---- Mind Map + Sticky Notes (persisted) ----
(function setupMindMapAndNotes() {
  const nodesKey = 'student-helper-mindmap-nodes';
  const notesKey = 'student-helper-sticky-notes';

  function createEditableItem(text, options) {
    const item = document.createElement('div');
    item.style.cssText = [
      'min-width:140px;',
      'min-height:70px;',
      'max-width:240px;',
      'padding:0.65rem;',
      'border-radius:8px;',
      `background:${options.background};`,
      `color:${options.color};`,
      'position:relative;',
      'box-shadow:0 2px 8px rgba(0,0,0,0.08);'
    ].join('');

    const content = document.createElement('div');
    content.className = 'mind-item-content';
    content.contentEditable = 'true';
    content.style.cssText = 'padding-right:1.5rem;outline:none;word-break:break-word;';
    content.textContent = text || options.placeholder;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'x';
    deleteBtn.style.cssText = [
      'position:absolute;',
      'top:6px;',
      'right:6px;',
      'border:none;',
      'border-radius:50%;',
      'width:22px;',
      'height:22px;',
      'cursor:pointer;',
      'background:var(--primary);',
      'color:#fff;'
    ].join('');

    item.appendChild(content);
    item.appendChild(deleteBtn);
    return { item, content, deleteBtn };
  }

  function saveItems(container, key) {
    if (!container) {
      return;
    }
    const values = Array.from(container.querySelectorAll('.mind-item-content'))
      .map((element) => element.textContent.trim())
      .filter(Boolean);
    storage.set(key, values);
  }

  function restoreItems(container, key, options) {
    if (!container) {
      return;
    }
    const saved = storage.get(key) || [];
    saved.forEach((text) => {
      const { item, content, deleteBtn } = createEditableItem(text, options);
      content.addEventListener('input', () => saveItems(container, key));
      deleteBtn.addEventListener('click', () => {
        item.remove();
        saveItems(container, key);
      });
      container.appendChild(item);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const addNodeBtn = document.getElementById('addMindNodeBtn');
    const addNoteBtn = document.getElementById('addStickyNoteBtn');
    const nodesContainer = document.getElementById('mindMapNodes');
    const notesContainer = document.getElementById('stickyNotes');

    if (!nodesContainer || !notesContainer) {
      return;
    }

    const nodeStyle = { background: '#f3f0ff', color: '#1f2937', placeholder: 'New idea' };
    const noteStyle = { background: '#fff3b0', color: '#1f2937', placeholder: 'New note' };

    restoreItems(nodesContainer, nodesKey, nodeStyle);
    restoreItems(notesContainer, notesKey, noteStyle);

    if (addNodeBtn) {
      addNodeBtn.addEventListener('click', () => {
        const { item, content, deleteBtn } = createEditableItem('', nodeStyle);
        content.addEventListener('input', () => saveItems(nodesContainer, nodesKey));
        deleteBtn.addEventListener('click', () => {
          item.remove();
          saveItems(nodesContainer, nodesKey);
        });
        nodesContainer.appendChild(item);
        content.focus();
        saveItems(nodesContainer, nodesKey);
      });
    }

    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => {
        const { item, content, deleteBtn } = createEditableItem('', noteStyle);
        content.addEventListener('input', () => saveItems(notesContainer, notesKey));
        deleteBtn.addEventListener('click', () => {
          item.remove();
          saveItems(notesContainer, notesKey);
        });
        notesContainer.appendChild(item);
        content.focus();
        saveItems(notesContainer, notesKey);
      });
    }
  });
})();

// ---- Study Videos ----
(function setupStudyVideos() {
  const searchInput = document.getElementById('video-search-input');
  const searchBtn = document.getElementById('video-search-btn');
  const resultsDiv = document.getElementById('video-results');
  const playerDiv = document.getElementById('video-player');
  if (!searchInput || !searchBtn || !resultsDiv || !playerDiv) {
    return;
  }

  function ensureApiKey() {
    if (window.API_KEYS_UNLOCKED !== true) {
      return '';
    }
    return window.YOUTUBE_API_KEY;
  }

  searchBtn.onclick = async () => {
    const query = searchInput.value.trim();
    if (!query) {
      showNotification('Enter a search term for videos', 'warning');
      return;
    }

    const proxyBase = (window.API_PROXY_URL || '').trim().replace(/\/+$/, '');
    const apiKey = ensureApiKey();
    const useProxy = Boolean(proxyBase);
    if (!useProxy && (!apiKey || apiKey === 'YOUR_API_KEY')) {
      resultsDiv.innerHTML = '<p style="color:var(--error);">Set YouTube API key or Local API Proxy URL in Settings.</p>';
      showNotification('Video search is missing API configuration', 'error');
      return;
    }

    resultsDiv.innerHTML = '<div class="spinner"></div>';
    playerDiv.innerHTML = '';

    try {
      const response = useProxy
        ? await fetch(`${proxyBase}/youtube_search?q=${encodeURIComponent(query)}`)
        : await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(query)}&key=${apiKey}`);
      if (!response.ok) {
        throw new Error(`API error (${response.status})`);
      }
      const data = await response.json();
      const items = data.items || [];
      if (!items.length) {
        resultsDiv.innerHTML = '<p>No videos found.</p>';
        return;
      }

      resultsDiv.innerHTML = items
        .map(
          (item) => `
            <div class="video-result" data-video-id="${item.id.videoId}" style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.9rem;cursor:pointer;">
              <img src="${item.snippet.thumbnails.medium.url}" width="120" height="90" style="border-radius:8px;">
              <div style="min-width:0;">
                <div style="font-weight:600;word-break:break-word;">${item.snippet.title}</div>
                <div class="text-muted" style="font-size:0.88rem;">${item.snippet.channelTitle}</div>
              </div>
            </div>
          `
        )
        .join('');

      resultsDiv.querySelectorAll('[data-video-id]').forEach((item) => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-video-id');
          playerDiv.innerHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen style="max-width:100%;border-radius:12px;"></iframe>`;
        });
      });
    } catch (error) {
      resultsDiv.innerHTML = '<p style="color:var(--error);">Error loading videos.</p>';
      showNotification('Video search failed: ' + error.message, 'error');
    }
  };
})();

// ---- Focus Timer ----
(function setupFocusTimer() {
  const display = document.getElementById('focus-timer-display');
  const startBtn = document.getElementById('focus-timer-start');
  const pauseBtn = document.getElementById('focus-timer-pause');
  const resetBtn = document.getElementById('focus-timer-reset');
  const status = document.getElementById('focus-timer-status');
  const focusInput = document.getElementById('focus-min');
  const breakInput = document.getElementById('break-min');
  if (!display || !startBtn || !pauseBtn || !resetBtn || !status || !focusInput || !breakInput) {
    return;
  }

  const sessionsKey = 'student-helper-focus-sessions';
  const durationKey = 'student-helper-focus-durations';

  const storedDurations = storage.get(durationKey) || {};
  const durations = {
    focus: Number(storedDurations.focus) || Number(focusInput.value) || 25,
    break: Number(storedDurations.break) || Number(breakInput.value) || 5
  };

  focusInput.value = String(durations.focus);
  breakInput.value = String(durations.break);

  let sessions = Number(storage.get(sessionsKey) || 0);
  let timer = null;
  let running = false;
  let onBreak = false;
  let timeLeft = durations.focus * 60;

  function persistDurations() {
    storage.set(durationKey, durations);
  }

  function parseInputValue(inputEl, min, max, fallback) {
    const parsed = Number(inputEl.value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  function applyDurationsFromInput() {
    durations.focus = parseInputValue(focusInput, 1, 90, 25);
    durations.break = parseInputValue(breakInput, 1, 45, 5);
    focusInput.value = String(durations.focus);
    breakInput.value = String(durations.break);
    persistDurations();
  }

  function playSound() {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const now = context.currentTime;
      [880, 660, 880].forEach((freq, idx) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(context.destination);
        const startAt = now + (idx * 0.28);
        const endAt = startAt + 0.2;
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.15, startAt + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
        osc.start(startAt);
        osc.stop(endAt + 0.02);
      });
      setTimeout(() => context.close(), 1100);
    } catch (_) {}
  }

  function pulseDisplayAlert() {
    display.classList.remove('focus-alert');
    void display.offsetWidth;
    display.classList.add('focus-alert');
    setTimeout(() => display.classList.remove('focus-alert'), 5200);
  }

  function updateDisplay() {
    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const secs = String(timeLeft % 60).padStart(2, '0');
    display.textContent = `${mins}:${secs}`;
    status.innerHTML = `${onBreak ? 'Break' : 'Focus'}${running ? ' - Running' : ''} <span style="color:var(--primary);font-weight:600;">| Sessions: ${sessions}</span>`;
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    running = false;
    updateDisplay();
  }

  function startTimer() {
    if (running) {
      return;
    }

    applyDurationsFromInput();
    running = true;
    updateDisplay();

    timer = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft -= 1;
        updateDisplay();
        return;
      }

      stopTimer();
      playSound();
      pulseDisplayAlert();

      if (!onBreak) {
        sessions += 1;
        storage.set(sessionsKey, sessions);
        if (typeof editorModule !== 'undefined' && editorModule && typeof editorModule.saveContent === 'function') {
          editorModule.saveContent(true);
        }
        onBreak = true;
        timeLeft = durations.break * 60;
        showNotification('Focus session complete. Notes autosaved. Time to take a break.', 'success');
      } else {
        onBreak = false;
        timeLeft = durations.focus * 60;
        showNotification('Break finished. Ready for the next focus round.', 'info');
      }
      updateDisplay();
    }, 1000);
  }

  function resetTimer() {
    stopTimer();
    applyDurationsFromInput();
    onBreak = false;
    timeLeft = durations.focus * 60;
    updateDisplay();
  }

  startBtn.onclick = startTimer;
  pauseBtn.onclick = stopTimer;
  resetBtn.onclick = resetTimer;

  [focusInput, breakInput].forEach((inputEl) => {
    inputEl.addEventListener('change', () => {
      if (!running) {
        resetTimer();
      } else {
        applyDurationsFromInput();
      }
    });
  });

  updateDisplay();
})();

// ---- Projects ----
(function setupProjects() {
  const nameInput = document.getElementById('project-name');
  const dueInput = document.getElementById('project-due-date');
  const priorityInput = document.getElementById('project-priority');
  const addBtn = document.getElementById('add-project-btn');
  const listDiv = document.getElementById('projects-list');
  if (!nameInput || !dueInput || !addBtn || !listDiv) {
    return;
  }

  const storageKey = 'student-helper-projects';
  let projects = [];

  function save() {
    storage.set(storageKey, projects);
    window.dispatchEvent(new CustomEvent('projects-updated'));
  }

  function load() {
    const saved = storage.get(storageKey);
    projects = Array.isArray(saved) ? saved : [];
  }

  function priorityColor(priority) {
    if (priority === 'high') return '#dc2626';
    if (priority === 'low') return '#2563eb';
    return '#b45309';
  }

  function sortProjects(items) {
    return [...items].sort((a, b) => {
      if (a.complete !== b.complete) {
        return a.complete ? 1 : -1;
      }
      if (!a.due && b.due) return 1;
      if (a.due && !b.due) return -1;
      if (a.due && b.due) return a.due.localeCompare(b.due);
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  function render() {
    if (!projects.length) {
      listDiv.innerHTML = '<p class="text-muted">No projects yet.</p>';
      return;
    }

    const sorted = sortProjects(projects);
    listDiv.innerHTML = sorted
      .map((project) => {
        const priority = project.priority || 'medium';
        return `
          <div class="card" style="padding:1rem;margin-bottom:0.75rem;${project.complete ? 'opacity:0.65;' : ''}">
            <div style="display:flex;justify-content:space-between;gap:0.75rem;align-items:flex-start;flex-wrap:wrap;">
              <div>
                <strong style="${project.complete ? 'text-decoration:line-through;' : ''}">${escapeHtml(project.name)}</strong>
                <div class="text-muted" style="margin-top:0.25rem;">
                  Due: ${escapeHtml(project.due || 'No due date')}
                </div>
                <div style="font-size:0.82rem;margin-top:0.35rem;color:${priorityColor(priority)};">
                  Priority: ${escapeHtml(priority)}
                </div>
              </div>
              <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                <button class="btn btn-secondary btn-small" data-action="toggle" data-id="${project.id}">
                  ${project.complete ? 'Mark Active' : 'Mark Complete'}
                </button>
                <button class="btn btn-secondary btn-small" data-action="edit" data-id="${project.id}">Edit</button>
                <button class="btn btn-secondary btn-small" data-action="remove" data-id="${project.id}">Remove</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    listDiv.querySelectorAll('button[data-action]').forEach((button) => {
      button.onclick = () => {
        const id = Number(button.getAttribute('data-id'));
        const action = button.getAttribute('data-action');
        const index = projects.findIndex((project) => project.id === id);
        if (index < 0) {
          return;
        }

        if (action === 'remove') {
          projects.splice(index, 1);
          save();
          render();
          showNotification('Project removed', 'info');
          return;
        }

        if (action === 'toggle') {
          projects[index].complete = !projects[index].complete;
          save();
          render();
          return;
        }

        if (action === 'edit') {
          const updatedNameInput = prompt('Project name:', projects[index].name || '');
          const updatedDueInput = prompt('Due date (YYYY-MM-DD):', projects[index].due || '');
          const updatedPriorityInput = prompt('Priority (low, medium, high):', projects[index].priority || 'medium');

          const updatedName = updatedNameInput === null ? projects[index].name || '' : updatedNameInput;
          const updatedDue = updatedDueInput === null ? projects[index].due || '' : updatedDueInput;
          const updatedPriority = updatedPriorityInput === null ? projects[index].priority || 'medium' : updatedPriorityInput;

          projects[index].name = Validators.sanitizeInput(updatedName.trim() || projects[index].name);
          projects[index].due = String(updatedDue || '').trim();
          projects[index].priority = ['low', 'medium', 'high'].includes(updatedPriority.trim().toLowerCase())
            ? updatedPriority.trim().toLowerCase()
            : 'medium';
          save();
          render();
          showNotification('Project updated', 'success');
        }
      };
    });
  }

  window.refreshProjects = render;

  addBtn.onclick = () => {
    const name = nameInput.value.trim();
    const due = dueInput.value;
    const priority = priorityInput ? priorityInput.value : 'medium';

    if (!name) {
      showNotification('Project name is required', 'error');
      return;
    }

    projects.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: Validators.sanitizeInput(name),
      due,
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      complete: false,
      createdAt: new Date().toISOString()
    });
    save();
    render();

    nameInput.value = '';
    dueInput.value = '';
    if (priorityInput) priorityInput.value = 'medium';
    showNotification('Project added', 'success');
  };

  load();
  render();
})();

// ---- Calculator (Desmos) ----
(function setupCalculator() {
  const graphCalc = document.getElementById('graphCalc');
  const result = document.getElementById('calcResult');
  if (!graphCalc || !result) {
    return;
  }

  try {
    if (!window.Desmos || typeof window.Desmos.GraphingCalculator !== 'function') {
      result.innerHTML = 'Graphing calculator is offline in this build. Use <a href="https://www.desmos.com/calculator" target="_blank" rel="noopener">Desmos Web Calculator</a> in a new tab.';
      return;
    }
    const calculator = window.Desmos.GraphingCalculator(graphCalc, {
      expressions: true,
      settingsMenu: true,
      zoomButtons: true
    });
    calculator.setExpression({ id: 'example1', latex: 'y=x^2' });
    calculator.setExpression({ id: 'example2', latex: 'y=2x+1' });
    result.textContent = 'Graphing calculator ready. Add expressions in the left panel.';
  } catch (error) {
    result.textContent = 'Graphing calculator unavailable right now.';
  }
})();

// ---- Citation Generator ----
(function setupCitationGenerator() {
  const input = document.getElementById('citeInput');
  const styleSelect = document.getElementById('citeStyle');
  const button = document.getElementById('generate-citation-btn');
  const result = document.getElementById('citationResult');
  if (!input || !styleSelect || !button || !result) {
    return;
  }

  function generateCitation() {
    const raw = input.value.trim();
    if (!raw) {
      showNotification('Enter source details first', 'warning');
      return;
    }

    const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
    if (parts.length < 3) {
      result.textContent = 'Please use: Author, Title, Year, Publisher';
      return;
    }

    const author = parts[0];
    const title = parts[1];
    const year = parts[2];
    const publisher = parts[3] || 'Publisher';

    let citation = '';
    if (styleSelect.value === 'mla') {
      citation = `${author}. "${title}." ${publisher}, ${year}.`;
    } else {
      citation = `${author}. (${year}). ${title}. ${publisher}.`;
    }

    result.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginTop = '0';

    const label = document.createElement('div');
    label.style.cssText = 'font-size:0.85rem;color:var(--text-tertiary);margin-bottom:0.5rem;';
    label.textContent = `${styleSelect.value.toUpperCase()} Citation`;

    const code = document.createElement('code');
    code.style.cssText = 'display:block;white-space:normal;';
    code.textContent = citation;

    card.appendChild(label);
    card.appendChild(code);
    result.appendChild(card);
  }

  button.addEventListener('click', generateCitation);
})();

// ---- Thesaurus ----
(function setupThesaurus() {
  const input = document.getElementById('wordInput');
  const button = document.getElementById('find-synonyms-btn');
  const result = document.getElementById('thesaurusResult');
  if (!input || !button || !result) {
    return;
  }

  async function lookupSynonyms() {
    const word = input.value.trim();
    if (!word) {
      showNotification('Enter a word first', 'warning');
      return;
    }

    result.innerHTML = '<div class="spinner"></div>';
    try {
      const response = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=20`);
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const words = await response.json();
      if (!Array.isArray(words) || !words.length) {
        result.innerHTML = '<p class="text-muted">No synonyms found.</p>';
        return;
      }

      result.innerHTML = `
        <div class="card" style="margin-top:0;">
          <div style="font-size:0.9rem;margin-bottom:0.6rem;">Synonyms for <strong>${escapeHtml(word)}</strong>:</div>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
            ${words.map((item) => `<code>${escapeHtml(item.word)}</code>`).join('')}
          </div>
        </div>
      `;
    } catch (error) {
      result.innerHTML = '<p style="color:var(--error);">Unable to fetch synonyms right now.</p>';
      showNotification('Thesaurus lookup failed: ' + error.message, 'error');
    }
  }

  button.addEventListener('click', lookupSynonyms);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      lookupSynonyms();
    }
  });
})();

// ---- Fact Check ----
(function setupFactCheck() {
  const input = document.getElementById('factInput');
  const button = document.getElementById('fact-check-btn');
  const result = document.getElementById('factCheckResult');
  if (!input || !button || !result) {
    return;
  }

  function renderFactCheckLinks() {
    const claim = input.value.trim();
    if (!claim) {
      showNotification('Enter a claim to check', 'warning');
      return;
    }

    const encoded = encodeURIComponent(claim);
    result.innerHTML = `
      <div class="card" style="margin-top:0;">
        <div style="margin-bottom:0.75rem;">
          Results for: <strong>${escapeHtml(claim)}</strong>
        </div>
        <ul>
          <li><a href="https://toolbox.google.com/factcheck/explorer/search/${encoded}" target="_blank" rel="noopener">Google Fact Check Explorer</a></li>
          <li><a href="https://www.snopes.com/search/?q=${encoded}" target="_blank" rel="noopener">Snopes</a></li>
          <li><a href="https://www.politifact.com/search/?q=${encoded}" target="_blank" rel="noopener">PolitiFact</a></li>
          <li><a href="https://www.reuters.com/fact-check/search/${encoded}" target="_blank" rel="noopener">Reuters Fact Check</a></li>
        </ul>
        <p class="text-muted">Cross-check at least two independent sources before concluding.</p>
      </div>
    `;
  }

  button.addEventListener('click', renderFactCheckLinks);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      renderFactCheckLinks();
    }
  });
})();

// ---- Editor Voice + Read Aloud + Originality Helper ----
(function setupEditorAssistTools() {
  const voiceBtn = document.getElementById('start-voice-btn');
  const readBtn = document.getElementById('read-aloud-btn');
  const plagiarismBtn = document.getElementById('plagiarism-check-btn');
  const useNoteBtn = document.getElementById('use-note-for-plagiarism-btn');
  const advancedPlagiarismBtn = document.getElementById('advanced-plagiarism-btn');
  const checkPlagiarismApiBtn = document.getElementById('check-plagiarism-api-btn');
  const plagiarismApiStatus = document.getElementById('plagiarism-api-status');
  const plagiarismInput = document.getElementById('plagiarismText');
  const plagiarismResult = document.getElementById('plagiarism-result');
  const aiLikelihoodInput = document.getElementById('ai-likelihood-text');
  const aiLikelihoodUseNoteBtn = document.getElementById('ai-likelihood-use-note-btn');
  const aiLikelihoodCheckBtn = document.getElementById('ai-likelihood-check-btn');
  const aiLikelihoodResult = document.getElementById('ai-likelihood-result');

  if (!voiceBtn && !readBtn && !plagiarismBtn && !useNoteBtn && !advancedPlagiarismBtn && !aiLikelihoodUseNoteBtn && !aiLikelihoodCheckBtn) {
    return;
  }

  const defaultApiBase = 'http://127.0.0.1:8765';
  let apiHealthy = false;

  function getPlagiarismApiBase() {
    const configured = (window.PLAGIARISM_API_URL || '').trim();
    return configured || defaultApiBase;
  }

  function setApiHealthUi(healthy, message) {
    apiHealthy = Boolean(healthy);
    if (advancedPlagiarismBtn) {
      advancedPlagiarismBtn.disabled = !apiHealthy;
    }
    if (plagiarismApiStatus) {
      plagiarismApiStatus.textContent = message;
      plagiarismApiStatus.style.color = healthy ? 'var(--success)' : 'var(--text-secondary)';
    }
  }

  setApiHealthUi(false, 'Advanced API status: not checked. Click Check API when local service is running.');

  async function checkAdvancedApiHealth() {
    const base = getPlagiarismApiBase();
    const healthUrl = `${base.replace(/\/+$/, '')}/health`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
      setApiHealthUi(false, `Advanced API status: checking ${healthUrl} ...`);
      const response = await fetch(healthUrl, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      const engines = Array.isArray(payload.available_engines) ? payload.available_engines.length : 0;
      setApiHealthUi(true, `Advanced API status: online (${engines} engines) at ${base}`);
    } catch (_) {
      setApiHealthUi(false, `Advanced API status: offline at ${base}. Basic checks still available.`);
    } finally {
      clearTimeout(timeout);
    }
  }

  function getEditorText() {
    if (typeof editorModule === 'undefined' || !editorModule || typeof editorModule.getContent !== 'function') {
      return '';
    }
    const html = editorModule.getContent() || '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return (temp.textContent || temp.innerText || '').trim();
  }

  function appendTranscriptToEditor(transcript) {
    if (!transcript) {
      return;
    }
    if (typeof editorModule === 'undefined' || !editorModule || !editorModule.editor) {
      showNotification('Editor is not ready yet. Open Notes and try again.', 'warning');
      return;
    }

    const encoded = escapeHtml(transcript);
    const current = editorModule.getContent() || '';
    const separator = current.trim() ? ' ' : '';
    editorModule.setContent(`${current}${separator}<p>${encoded}</p>`);
    if (typeof editorModule.saveContent === 'function') {
      editorModule.saveContent(true);
    }
    showNotification('Voice input added to notes', 'success');
  }

  function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotification('Speech recognition is not supported in this browser.', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    voiceBtn.disabled = true;
    voiceBtn.textContent = 'Listening...';

    recognition.onresult = (event) => {
      const transcript = event.results && event.results[0] && event.results[0][0]
        ? event.results[0][0].transcript
        : '';
      appendTranscriptToEditor((transcript || '').trim());
    };

    recognition.onerror = () => {
      showNotification('Voice input failed. Try again in a quieter environment.', 'error');
    };

    recognition.onend = () => {
      voiceBtn.disabled = false;
      voiceBtn.textContent = 'Voice Input';
    };

    recognition.start();
  }

  function readAloud() {
    if (!window.speechSynthesis) {
      showNotification('Text-to-speech is not supported in this browser.', 'error');
      return;
    }

    const text = getEditorText();
    if (!text) {
      showNotification('No note text found to read aloud.', 'warning');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 8000));
    utterance.lang = 'en-US';
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
    showNotification('Reading note aloud', 'info');
  }

  function runOriginalityCheck() {
    if (!plagiarismInput || !plagiarismResult) {
      return;
    }

    const sourceText = plagiarismInput.value.trim() || getEditorText();
    if (!sourceText) {
      showNotification('Add text to run the originality helper.', 'warning');
      return;
    }

    const cleaned = sourceText.replace(/\s+/g, ' ').trim();
    const words = cleaned ? cleaned.split(' ') : [];
    const uniqueWords = new Set(words.map((word) => word.toLowerCase()));
    const uniqueRatio = words.length ? uniqueWords.size / words.length : 0;

    const sentences = sourceText
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    const lowered = sentences.map((sentence) => sentence.toLowerCase());
    const sentenceCounts = {};
    lowered.forEach((sentence) => {
      sentenceCounts[sentence] = (sentenceCounts[sentence] || 0) + 1;
    });
    const repeatedSentenceCount = Object.values(sentenceCounts).filter((count) => count > 1).length;

    const quoteMatches = sourceText.match(/"[^"]+"|'[^']+'/g) || [];
    const quotedChars = quoteMatches.reduce((sum, quote) => sum + quote.length, 0);
    const quoteRatio = sourceText.length ? quotedChars / sourceText.length : 0;

    const flags = [];
    if (words.length < 30) {
      flags.push('Very short sample: add more text for a meaningful check.');
    }
    if (uniqueRatio < 0.35) {
      flags.push('Low vocabulary variety: revise phrasing and explain ideas in your own words.');
    }
    if (repeatedSentenceCount > 0) {
      flags.push('Repeated sentence patterns found: reduce duplication and paraphrase.');
    }
    if (quoteRatio > 0.3) {
      flags.push('Large quoted portion detected: ensure proper citations and original analysis.');
    }

    const scoreBase = 100;
    const scorePenalty = Math.min(80, Math.round((1 - uniqueRatio) * 35) + repeatedSentenceCount * 10 + Math.round(quoteRatio * 60));
    const originalityScore = Math.max(20, scoreBase - scorePenalty);

    plagiarismResult.innerHTML = `
      <div class="card" style="margin-top:0;">
        <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:center;">
          <strong>Local originality helper score</strong>
          <span style="font-size:1.1rem;color:var(--primary);font-weight:700;">${originalityScore}/100</span>
        </div>
        <div class="mt-1-5">
          <div>Word count: <strong>${words.length}</strong></div>
          <div>Unique word ratio: <strong>${(uniqueRatio * 100).toFixed(1)}%</strong></div>
          <div>Repeated sentence patterns: <strong>${repeatedSentenceCount}</strong></div>
          <div>Quoted content ratio: <strong>${(quoteRatio * 100).toFixed(1)}%</strong></div>
        </div>
        <div class="mt-1-5">
          ${flags.length
            ? `<ul>${flags.map((flag) => `<li>${escapeHtml(flag)}</li>`).join('')}</ul>`
            : '<p class="text-muted">No major local warning signals detected. Still verify with external plagiarism tools.</p>'}
        </div>
      </div>
    `;
  }

  async function runAdvancedPlagiarismCheck() {
    if (!plagiarismResult) {
      return;
    }

    if (!apiHealthy) {
      await checkAdvancedApiHealth();
      if (!apiHealthy) {
        showNotification('Advanced API is offline. Use basic Run Check or start local service.', 'warning');
        return;
      }
    }

    const sourceText = (plagiarismInput ? plagiarismInput.value.trim() : '') || getEditorText();
    if (!sourceText) {
      showNotification('Add text or use current note before running advanced check.', 'warning');
      return;
    }

    if (advancedPlagiarismBtn) {
      advancedPlagiarismBtn.disabled = true;
      advancedPlagiarismBtn.textContent = 'Running...';
    }

    try {
      const base = getPlagiarismApiBase().replace(/\/+$/, '');
      const response = await fetch(`${base}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          references: [],
          engines: ['tfidf_plugin', 'difflib_plugin', 'simhash_plugin', 'rapidfuzz_plugin', 'ngram_plugin', 'sbert_plugin']
        })
      });

      if (!response.ok) {
        throw new Error(`Advanced checker returned ${response.status}`);
      }

      const data = await response.json();
      const toolScores = data.tool_scores || {};
      const entries = Object.entries(toolScores);
      const maxScore = Number(data.max_score || 0);
      const avgScore = Number(data.average_score || 0);
      const details = Array.isArray(data.details) ? data.details : [];
      const errors = details
        .filter((d) => d && d.error)
        .map((d) => `${d.tool_name || 'engine'}: ${d.error}`);

      plagiarismResult.innerHTML = `
        <div class="card" style="margin-top:0;">
          <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:center;">
            <strong>Advanced Local Plagiarism Check (QuxAT)</strong>
            <span style="font-size:1.1rem;color:var(--primary);font-weight:700;">Max ${maxScore.toFixed(1)}%</span>
          </div>
          <div class="mt-1-5">
            <div>Average score: <strong>${avgScore.toFixed(1)}%</strong></div>
          </div>
          <div class="mt-1-5">
            ${entries.length
              ? `<ul>${entries.map(([name, score]) => `<li>${escapeHtml(name)}: <strong>${Number(score).toFixed(1)}%</strong></li>`).join('')}</ul>`
              : '<p class="text-muted">No engine scores returned.</p>'}
          </div>
          <div class="mt-1-5">
            ${errors.length
              ? `<p class="text-muted">Engine warnings:</p><ul>${errors.map((msg) => `<li>${escapeHtml(msg)}</li>`).join('')}</ul>`
              : '<p class="text-muted">All configured engines responded.</p>'}
          </div>
        </div>
      `;
      showNotification('Advanced local plagiarism check complete', 'success');
    } catch (error) {
      plagiarismResult.innerHTML = `
        <div class="card" style="margin-top:0;">
          <strong>Advanced check unavailable</strong>
          <p class="text-muted mt-0-5">Could not connect to local service at <code>${escapeHtml(getPlagiarismApiBase())}</code>.</p>
          <p class="text-muted">Start it with: <code>python quxatplagicheck_api.py</code></p>
          <p class="text-muted">Then click <em>Advanced Local Check (QuxAT)</em> again.</p>
        </div>
      `;
      showNotification('Advanced checker not reachable. Start local API first.', 'error');
      setApiHealthUi(false, `Advanced API status: offline at ${getPlagiarismApiBase()}. Basic checks still available.`);
    } finally {
      if (advancedPlagiarismBtn) {
        advancedPlagiarismBtn.disabled = !apiHealthy;
        advancedPlagiarismBtn.textContent = 'Advanced Local Check (QuxAT)';
      }
    }
  }

  if (voiceBtn) {
    voiceBtn.addEventListener('click', startVoiceInput);
  }
  if (readBtn) {
    readBtn.addEventListener('click', readAloud);
  }
  if (plagiarismBtn) {
    plagiarismBtn.addEventListener('click', runOriginalityCheck);
  }
  if (advancedPlagiarismBtn) {
    advancedPlagiarismBtn.addEventListener('click', runAdvancedPlagiarismCheck);
  }
  if (checkPlagiarismApiBtn) {
    checkPlagiarismApiBtn.addEventListener('click', checkAdvancedApiHealth);
  }
  if (useNoteBtn && plagiarismInput) {
    useNoteBtn.addEventListener('click', () => {
      const noteText = getEditorText();
      if (!noteText) {
        showNotification('No note content found. Add some notes first.', 'warning');
        return;
      }
      plagiarismInput.value = noteText;
      showNotification('Current note copied into originality checker', 'info');
    });
  }

  function analyzeAiLikelihood() {
    if (!aiLikelihoodResult) {
      return;
    }

    const sourceText = (aiLikelihoodInput ? aiLikelihoodInput.value.trim() : '') || getEditorText();
    if (!sourceText) {
      showNotification('Add text or use current note before analyzing.', 'warning');
      return;
    }

    const cleaned = sourceText.replace(/\s+/g, ' ').trim();
    const words = cleaned ? cleaned.split(' ') : [];
    const sentences = sourceText
      .split(/[.!?]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    const sentenceLengths = sentences.map((sentence) => {
      const parts = sentence.split(/\s+/).filter(Boolean);
      return parts.length;
    });

    const avgSentenceLen = sentenceLengths.length
      ? sentenceLengths.reduce((sum, value) => sum + value, 0) / sentenceLengths.length
      : 0;
    const variance = sentenceLengths.length
      ? sentenceLengths.reduce((sum, value) => sum + ((value - avgSentenceLen) ** 2), 0) / sentenceLengths.length
      : 0;
    const stdDev = Math.sqrt(variance);

    const transitionPhrases = [
      'in conclusion',
      'overall',
      'furthermore',
      'moreover',
      'in addition',
      'as a result',
      'on the other hand',
      'it is important to note'
    ];
    const lower = sourceText.toLowerCase();
    const transitionHits = transitionPhrases.reduce(
      (count, phrase) => count + (lower.includes(phrase) ? 1 : 0),
      0
    );

    const repeatedSegments = {};
    const segments = lower.split(/[.,!?;:\n]+/).map((s) => s.trim()).filter((s) => s.length >= 20);
    segments.forEach((seg) => {
      repeatedSegments[seg] = (repeatedSegments[seg] || 0) + 1;
    });
    const repeatedCount = Object.values(repeatedSegments).filter((n) => n > 1).length;

    // Heuristic: lower burstiness + more templated transitions + repeats => higher AI-likelihood.
    let aiLikelihood = 40;
    if (stdDev < 4) aiLikelihood += 18;
    if (avgSentenceLen > 18) aiLikelihood += 10;
    if (transitionHits >= 2) aiLikelihood += 12;
    if (repeatedCount > 0) aiLikelihood += Math.min(20, repeatedCount * 8);
    if (words.length < 80) aiLikelihood -= 8;
    aiLikelihood = Math.max(5, Math.min(95, Math.round(aiLikelihood)));

    let band = 'Low';
    if (aiLikelihood >= 70) band = 'High';
    else if (aiLikelihood >= 45) band = 'Medium';

    const suggestions = [];
    if (stdDev < 4) suggestions.push('Vary sentence length and rhythm.');
    if (transitionHits >= 2) suggestions.push('Reduce formulaic transition phrases.');
    if (repeatedCount > 0) suggestions.push('Rewrite repeated segments in your own wording.');
    if (!suggestions.length) suggestions.push('Style looks varied; still verify with external tools if needed.');

    aiLikelihoodResult.innerHTML = `
      <div class="card" style="margin-top:0;">
        <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:center;">
          <strong>AI-likelihood estimate (local heuristic)</strong>
          <span style="font-size:1.1rem;color:var(--primary);font-weight:700;">${aiLikelihood}% (${band})</span>
        </div>
        <div class="mt-1-5">
          <div>Word count: <strong>${words.length}</strong></div>
          <div>Average sentence length: <strong>${avgSentenceLen.toFixed(1)}</strong></div>
          <div>Sentence variation (std dev): <strong>${stdDev.toFixed(2)}</strong></div>
          <div>Template transition hits: <strong>${transitionHits}</strong></div>
          <div>Repeated long segments: <strong>${repeatedCount}</strong></div>
        </div>
        <div class="mt-1-5">
          <ul>${suggestions.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
          <p class="text-muted">This is not definitive. Use formal detectors and human review for high-stakes decisions.</p>
        </div>
      </div>
    `;
  }

  if (aiLikelihoodUseNoteBtn && aiLikelihoodInput) {
    aiLikelihoodUseNoteBtn.addEventListener('click', () => {
      const noteText = getEditorText();
      if (!noteText) {
        showNotification('No note content found. Add some notes first.', 'warning');
        return;
      }
      aiLikelihoodInput.value = noteText;
      showNotification('Current note copied into AI-likelihood analyzer', 'info');
    });
  }

  if (aiLikelihoodCheckBtn) {
    aiLikelihoodCheckBtn.addEventListener('click', analyzeAiLikelihood);
  }

  window.addEventListener('settings-updated', checkAdvancedApiHealth);
})();
