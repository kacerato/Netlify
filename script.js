const clientId = "v2h2uedgpuw2fz35wtn942e9vsf2c9";
const accessToken = "st6jpeqk6jidreb6cnlw08zn5fwjbk";
const username = "brkk";
const baseUrl = "vercel-topaz-sigma-27.vercel.app"; // Substitua pela URL do seu backend no Vercel

const twitchUserApi = `https://api.twitch.tv/helix/users?login=${username}`;
const twitchStreamApi = `https://api.twitch.tv/helix/streams?user_login=${username}`;
let twitchVideosApi;
let twitchClipsApi;

async function getUserId() {
  try {
    const response = await fetch(twitchUserApi, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (data && data.data && data.data.length > 0) {
      return data.data[0].id;
    } else {
      console.error("Usuário não encontrado.");
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar ID do usuário:", error);
    return null;
  }
}

async function getLastStreamDate(userId) {
  try {
    twitchVideosApi = `https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive`;
    const response = await fetch(twitchVideosApi, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (data && data.data && data.data.length > 0) {
      return new Date(data.data[0].created_at);
    } else {
      console.error("Nenhum vídeo de transmissão encontrado.");
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar última data de transmissão:", error);
    return null;
  }
}

function calculateDaysDifference(lastStreamDate) {
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate - lastStreamDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function getClips(userId) {
  try {
    const now = new Date();
    const last24Hours = new Date(now.setHours(now.getHours() - 24)).toISOString();
    twitchClipsApi = `https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=10&started_at=${last24Hours}`;

    const response = await fetch(twitchClipsApi, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Erro ao buscar clipes:", error);
    return [];
  }
}

async function renderClips() {
  const userId = await getUserId();
  if (!userId) return;

  const clips = await getClips(userId);
  const clipsContainer = document.getElementById("clips-container");
  clipsContainer.innerHTML = "";

  const mainPlayer = document.getElementById("main-playerclips");
  mainPlayer.innerHTML = "";
  const mainPlayerIframe = document.createElement("iframe");
  mainPlayerIframe.setAttribute("frameborder", "0");
  mainPlayerIframe.setAttribute("allowfullscreen", "");
  mainPlayerIframe.setAttribute("width", "100%");
  mainPlayerIframe.setAttribute("height", "300px");

  if (clips.length === 0) {
    clipsContainer.textContent = "Nenhum clipe encontrado.";
    return;
  }

  mainPlayerIframe.src = `${clips[0].embed_url}&parent=localhost&parent=brkk.netlify.app`;
  mainPlayer.appendChild(mainPlayerIframe);

  clips.forEach((clip, index) => {
    const clipElement = document.createElement("div");
    clipElement.classList.add("clip");

    clipElement.innerHTML = `
      <div class="clip-preview">
        <img src="${clip.thumbnail_url}" alt="${clip.title}" class="clip-thumbnail" />
        <div class="clip-title">${clip.title}</div>
        <button class="select-clip-btn" data-clip-url="${clip.embed_url}">Assistir</button>
      </div>
    `;

    const selectButton = clipElement.querySelector(".select-clip-btn");
    selectButton.addEventListener("click", () => {
      mainPlayerIframe.src = `${selectButton.dataset.clipUrl}&parent=localhost&parent=brkk.netlify.app`;
    });

    clipsContainer.appendChild(clipElement);
  });
}

async function getVods(userId) {
  try {
    const vodsApi = `https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive&first=3`;
    const response = await fetch(vodsApi, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    return data.data.map(vod => ({
      ...vod,
      download_url: `https://api.twitch.tv/helix/videos?id=${vod.id}`
    })) || [];
  } catch (error) {
    console.error("Erro ao buscar VODs:", error);
    return [];
  }
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function parseTime(timeString) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

async function renderVods() {
  const userId = await getUserId();
  if (!userId) return;

  const vods = await getVods(userId);
  const vodsContainer = document.getElementById("vods-container");
  vodsContainer.innerHTML = "";

  const mainPlayer = document.getElementById("main-player");
  mainPlayer.innerHTML = "";
  const mainPlayerIframe = document.createElement("iframe");
  mainPlayerIframe.setAttribute("frameborder", "0");
  mainPlayerIframe.setAttribute("allowfullscreen", "");
  mainPlayerIframe.style.width = "100%";
  mainPlayerIframe.style.height = "450px"; 

  if (vods.length === 0) {
    vodsContainer.textContent = "Nenhuma live encontrada.";
    return;
  }

  mainPlayerIframe.src = `https://player.twitch.tv/?video=${vods[0].id}&parent=localhost&parent=brkk.netlify.app`;
  mainPlayer.appendChild(mainPlayerIframe);

  vods.forEach((vod) => {
    const vodElement = document.createElement("div");
    vodElement.classList.add("vod");

    vodElement.innerHTML = `
      <div class="vod-preview">
        <img src="${vod.thumbnail_url.replace('%{width}', '320').replace('%{height}', '180')}" alt="${vod.title}" class="vod-thumbnail" />
        <div class="vod-title">${vod.title}</div>
        <div class="vod-duration">Duração: ${formatTime(vod.duration)}</div>
        <button class="select-vod-btn" data-vod-id="${vod.id}">Assistir</button>
        <button class="select-vod-download-btn" data-vod-id="${vod.id}" data-vod-url="${vod.url}" data-vod-duration="${vod.duration}">Selecionar para Download</button>
      </div>
    `;

    const selectButton = vodElement.querySelector(".select-vod-btn");
    selectButton.addEventListener("click", () => {
      mainPlayerIframe.src = `https://player.twitch.tv/?video=${selectButton.dataset.vodId}&parent=localhost&parent=brkk.netlify.app`;
      document.querySelectorAll('.vod').forEach(v => v.classList.remove('active'));
      vodElement.classList.add('active');
    });

    const selectDownloadButton = vodElement.querySelector(".select-vod-download-btn");
    selectDownloadButton.addEventListener("click", () => {
      document.querySelectorAll('.vod').forEach(v => v.classList.remove('active'));
      vodElement.classList.add('active');
      document.getElementById('selected-vod-id').value = vod.id;
      document.getElementById('selected-vod-url').value = vod.url;
      
      const durationInSeconds = parseInt(selectDownloadButton.dataset.vodDuration);
      document.getElementById('vod-total-duration').textContent = formatTime(durationInSeconds);
      
      const startTimeInput = document.getElementById('start-time');
      const endTimeInput = document.getElementById('end-time');
      startTimeInput.max = formatTime(durationInSeconds - 1);
      endTimeInput.max = formatTime(durationInSeconds);
      
      startTimeInput.value = '00:00:00';
      endTimeInput.value = formatTime(Math.min(durationInSeconds, 120)); // Default to 2 minutes or full duration if shorter
    });

    vodsContainer.appendChild(vodElement);
  });
  adjustPlayerSize();
}

function adjustPlayerSize() {
  const mainPlayer = document.getElementById("main-player");
  const iframe = mainPlayer.querySelector("iframe");
  if (iframe) {
    const width = mainPlayer.offsetWidth;
    const height = Math.min(450, width * 9 / 16); 
    iframe.style.height = `${height}px`;
  }
}

function updateProgressBar(vodId) {
  const progressBar = document.getElementById('download-progress');
  const progressBarFill = progressBar.querySelector('.progress-bar-fill');

  function checkProgress() {
    fetch(`${baseUrl}/api/downloadprogress/${vodId}`)
      .then(response => response.json())
      .then(data => {
        if (data.progress) {
          const percent = (data.progress.current / data.progress.duration) * 100;
          progressBarFill.style.width = `${percent}%`;
          if (percent < 100) {
            setTimeout(checkProgress, 1000);
          } else {
            progressBar.style.display = 'none';
          }
        } else {
          // If no progress data, check again after a short delay
          setTimeout(checkProgress, 1000);
        }
      })
      .catch(error => {
        console.error('Error fetching progress:', error);
        setTimeout(checkProgress, 1000);
      });
  }

  progressBar.style.display = 'block';
  checkProgress();
}

async function downloadVod(vodId, startSeconds, endSeconds) {
  try {
    console.log('Iniciando download do VOD:', vodId, 'de', formatTime(startSeconds), 'a', formatTime(endSeconds));
    const vodUrl = `https://www.twitch.tv/videos/${vodId}`;
    
    let statusElement = document.getElementById('download-status');
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.id = 'download-status';
      document.body.appendChild(statusElement);
    }
    statusElement.textContent = 'Iniciando download...';
    statusElement.style.display = 'block';

    let progressBar = document.getElementById('download-progress');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'download-progress';
      progressBar.className = 'progress-bar';
      progressBar.innerHTML = '<div class="progress-bar-fill"></div>';
      document.body.appendChild(progressBar);
    }
    progressBar.style.display = 'block';

    updateProgressBar(vodId);

    console.log('Enviando solicitação para o servidor...');
    const response = await fetch(`${baseUrl}/api/downloadvod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vodId,
        vodUrl,
        start: startSeconds,
        end: endSeconds
      })
    });

    console.log('Resposta recebida do servidor. Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro recebido do servidor:', errorText);
      throw new Error(`Falha ao baixar o VOD: ${errorText}`);
    }

    statusElement.textContent = 'Download iniciado. Verifique a barra de downloads do seu navegador.';

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `brkk_vod_${vodId}_${startSeconds}_${endSeconds}.mp4`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Download iniciado no navegador');
    setTimeout(() => {
      statusElement.style.display = 'none';
      progressBar.style.display = 'none';
    }, 5000);

  } catch (error) {
    console.error('Erro detalhado ao baixar VOD:', error);
    alert(`Erro ao baixar VOD: ${error.message}`);
    const statusElement = document.getElementById('download-status');
    if (statusElement) {
      statusElement.textContent = `Erro: ${error.message}`;
      statusElement.style.color = 'red';
      statusElement.style.display = 'block';
    }
  }
}

function showAchievement(days, message, starClass) {
  const achievementsContainer = document.getElementById('achievements-container');
  const achievementText = achievementsContainer.querySelector('.achievement-text');
  const achievementIcon = achievementsContainer.querySelector('.achievement-icon');
  const brkkHead = achievementsContainer.querySelector('.brkk-head');

  achievementText.textContent = `${days}  ${message}`;
  achievementIcon.classList.remove('star-3-days', 'star-5-days', 'star-10-days', 'star-15-days');
  achievementIcon.classList.add(starClass);

  if (days === 3) {
    brkkHead.classList.remove('hidden');
  } else {
    brkkHead.classList.add('hidden');
  }

  achievementsContainer.classList.remove('hidden');
}

function checkAchievements(daysOffline) {
  let achievementMessage = "";
  let achievementDays = 0;
  let starClass = "";

  if (daysOffline >= 15) {
    achievementMessage = "dias sem live, é oficial tucano foi encontrado sem vida após um jogo do Vasco";
    achievementDays = 15;
    starClass = "star-15-days";
  } else if (daysOffline >= 10) {
    achievementMessage = "dias sem live, pensando em tirar meu sub dessa live de merda";
    achievementDays = 10;
    starClass = "star-10-days";
  } else if (daysOffline >= 5) {
    achievementMessage = "dias sem live, qual será a desculpa de hoje?";
    achievementDays = 5;
    starClass = "star-5-days";
  } else if (daysOffline >= 3) {
    achievementMessage = "Dias sem live, pelo visto comeram a fibra óptica de Sorocaba";
    achievementDays = 3;
    starClass = "star-3-days";
  }

  const achievementsContainer = document.getElementById('achievements-container');

  if (achievementMessage && daysOffline === achievementDays) {
    showAchievement(achievementDays, achievementMessage, starClass);
    achievementsContainer.classList.remove('hidden');
  } else {
    achievementsContainer.classList.add('hidden');
  }
}

async function updateStatus() {
  try {
    const userId = await getUserId();

    if (userId) {
      const streamResponse = await fetch(twitchStreamApi, {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const streamData = await streamResponse.json();
      const liveStatus = document.getElementById("live-status");
      const statusMessage = document.getElementById("status-message");
      const twitchEmbed = document.querySelector(".twitch-embed");

      const animatedArrow = document.querySelector(".animated-arrow");
      const daysCounter = document.querySelector(".days-counter");

      const chatContainer = document.getElementById("chat-container");
      const viewersCounter = document.querySelector("#viewers-counter");
      const viewersCount = document.getElementById("viewers-count");

      if (streamData && streamData.data && streamData.data.length > 0) {
        liveStatus.classList.remove("hidden");
        statusMessage.textContent = "BRKK perdeu todo o dinheiro no urubu do Pix e resolveu abrir live!";
        statusMessage.classList.add("status-highlight");
        daysCounter.style.display = "none";
        twitchEmbed.classList.remove("hidden");
        animatedArrow.classList.remove("hidden");
        chatContainer.classList.remove("hidden");

        const viewers = streamData.data[0].viewer_count;
        viewersCount.textContent = viewers;
        viewersCounter.classList.remove("hidden");
        document.getElementById('achievements-container').classList.add('hidden');
      } else {
        liveStatus.classList.add("hidden");
        twitchEmbed.classList.add("hidden");
        animatedArrow.classList.add("hidden");
        chatContainer.classList.add("hidden");
        const lastStreamDate = await getLastStreamDate(userId);
        if (lastStreamDate) {
          const daysOffline = calculateDaysDifference(lastStreamDate);
          statusMessage.textContent = "O tucano está folgando com dinheiro do seu sub a exatos:";
          daysCounter.style.display = "flex";
          document.getElementById("days-offline").textContent = daysOffline;
          viewersCounter.classList.add("hidden");

          checkAchievements(daysOffline);
        }
        statusMessage.classList.remove("status-highlight");
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar o status:", error);
  }
}

function setupTabs() {
  const statusTab = document.getElementById("status-tab");
  const clipsTab = document.getElementById("clips-tab");
  const vodsTab = document.getElementById("vods-tab");
  const statusSection = document.getElementById("status-section");
  const clipsSection = document.getElementById("clips-section");
  const vodsSection = document.getElementById("vods-section");

  let clipsLoaded = false;
  let vodsLoaded = false;

  statusTab.addEventListener("click", () => {
    statusTab.classList.add("active");
    clipsTab.classList.remove("active");
    vodsTab.classList.remove("active");
    statusSection.classList.remove("hidden");
    clipsSection.classList.add("hidden");
    vodsSection.classList.add("hidden");
  });

  clipsTab.addEventListener("click", () => {
    clipsTab.classList.add("active");
    statusTab.classList.remove("active");
    vodsTab.classList.remove("active");
    clipsSection.classList.remove("hidden");
    statusSection.classList.add("hidden");
    vodsSection.classList.add("hidden");

    if (!clipsLoaded) {
      renderClips();
      clipsLoaded = true;
    }
  });

  vodsTab.addEventListener("click", () => {
    vodsTab.classList.add("active");
    statusTab.classList.remove("active");
    clipsTab.classList.remove("active");
    vodsSection.classList.remove("hidden");
    statusSection.classList.add("hidden");
    clipsSection.classList.add("hidden");

    if (!vodsLoaded) {
      renderVods();
      vodsLoaded = true;
    }
  });
}

setupTabs();
updateStatus();

document.getElementById('download-vod').addEventListener('click', () => {
  const vodId = document.getElementById('selected-vod-id').value;

  if (!vodId) {
    alert('Por favor, selecione um VOD para baixar.');
    return;
  }

  const startTime = document.getElementById('start-time').value;
  const endTime = document.getElementById('end-time').value;

  if (!startTime || !endTime || startTime >= endTime) {
    alert('Por favor, selecione um intervalo de tempo válido.');
    return;
  }

  const startSeconds = parseTime(startTime);
  const endSeconds = parseTime(endTime);

  console.log('Iniciando processo de download para VOD:', vodId);
  downloadVod(vodId, startSeconds, endSeconds);
});

document.querySelectorAll('.select-vod-btn').forEach(button => {
  button.addEventListener('click', function() {
    document.querySelectorAll('.vod').forEach(vod => vod.classList.remove('active'));
    this.closest('.vod').classList.add('active');
  });
});

window.addEventListener("resize", adjustPlayerSize);

