const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let displayWindow = null;
let scoreboardWindow = null;
let scoreboardChromakeyWindow = null;
let matchData = {
  hostTeam: { name: 'ホームチーム', logo: '', color: '#FF0000' },
  awayTeam: { name: 'アウェイチーム', logo: '', color: '#0000FF' },
  score: { host: 0, away: 0 },
  halfScores: {
    first: { host: 0, away: 0 },
    second: { host: 0, away: 0 }
  },
  stats: {
    host: { 
      tries: 0, conversions: 0, penaltyGoals: 0, dropGoals: 0,
      first: { tries: 0, conversions: 0, penaltyGoals: 0, dropGoals: 0 },
      second: { tries: 0, conversions: 0, penaltyGoals: 0, dropGoals: 0 }
    },
    away: { 
      tries: 0, conversions: 0, penaltyGoals: 0, dropGoals: 0,
      first: { tries: 0, conversions: 0, penaltyGoals: 0, dropGoals: 0 },
      second: { tries: 0, conversions: 0, penaltyGoals: 0, dropGoals: 0 }
    }
  },
  players: {
    host: [],
    away: []
  },
  substitutions: [],
  currentHalf: 'first' // 'first' or 'second'
};

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    x: 0,
    y: 0,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Rugby Stats - 管理画面'
  });

  mainWindow.loadFile('control.html');
  // mainWindow.webContents.openDevTools(); // 開発者ツールを開く（本番では無効化）
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (displayWindow) {
      displayWindow.close();
    }
  });
}

function createDisplayWindow() {
  const displays = screen.getAllDisplays();
  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  }) || displays[0];

  displayWindow = new BrowserWindow({
    x: externalDisplay.bounds.x,
    y: externalDisplay.bounds.y,
    fullscreen: true,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Rugby Stats - 表示画面'
  });

  displayWindow.loadFile('display.html');
  // displayWindow.webContents.openDevTools(); // 開発者ツールを開く（本番では無効化）
  displayWindow.on('closed', () => {
    displayWindow = null;
  });
}

function createScoreboardWindow() {
  const displays = screen.getAllDisplays();
  
  // 3台目のモニターがあればそこに、なければメインディスプレイに配置
  let targetDisplay = displays[0];
  if (displays.length >= 3) {
    targetDisplay = displays[2];
  }

  const displayWidth = targetDisplay.bounds.width;
  const displayHeight = targetDisplay.bounds.height;
  const scoreboardHeight = 150; // スコアボードの高さ

  scoreboardWindow = new BrowserWindow({
    width: displayWidth,
    height: scoreboardHeight,
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y + displayHeight - scoreboardHeight, // 画面最下部に配置
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false, // リサイズ不可
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Rugby Stats - 透過スコアボード'
  });

  scoreboardWindow.loadFile('scoreboard.html');
  scoreboardWindow.webContents.openDevTools(); // 開発者ツールを開く
  scoreboardWindow.on('closed', () => {
    scoreboardWindow = null;
  });
}

function createScoreboardChromakeyWindow() {
  const displays = screen.getAllDisplays();
  
  // 3台目のモニターがあればそこに、なければメインディスプレイに配置
  let targetDisplay = displays[0];
  if (displays.length >= 3) {
    targetDisplay = displays[2];
  }

  const displayWidth = targetDisplay.bounds.width;
  const displayHeight = targetDisplay.bounds.height;
  const scoreboardHeight = 150; // スコアボードの高さ

  scoreboardChromakeyWindow = new BrowserWindow({
    width: displayWidth,
    height: scoreboardHeight,
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y + displayHeight - scoreboardHeight, // 画面最下部に配置
    frame: false,
    transparent: false, // クロマキー版は不透明
    alwaysOnTop: true,
    resizable: false, // リサイズ不可
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Rugby Stats - クロマキースコアボード'
  });

  scoreboardChromakeyWindow.loadFile('scoreboard-chromakey.html');
  scoreboardChromakeyWindow.webContents.openDevTools(); // 開発者ツールを開く
  scoreboardChromakeyWindow.on('closed', () => {
    scoreboardChromakeyWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();
  createDisplayWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// IPC Handlers

// データ取得
ipcMain.handle('get-match-data', () => {
  return matchData;
});

// 前半/後半切り替え
ipcMain.handle('switch-half', (event, half) => {
  matchData.currentHalf = half;
  updateDisplay();
  return matchData;
});

// スコア更新
ipcMain.handle('update-score', (event, team, value) => {
  matchData.score[team] = parseInt(value) || 0;
  updateDisplay();
  return matchData;
});

// 前半/後半スコア更新
ipcMain.handle('update-half-score', (event, half, team, value) => {
  matchData.halfScores[half][team] = parseInt(value) || 0;
  // 合計スコアも更新
  matchData.score[team] = matchData.halfScores.first[team] + matchData.halfScores.second[team];
  updateDisplay();
  return matchData;
});

// 統計更新
ipcMain.handle('update-stats', (event, team, stat, value) => {
  matchData.stats[team][stat] = parseInt(value) || 0;
  updateDisplay();
  return matchData;
});

// 前半/後半統計更新
ipcMain.handle('update-half-stats', (event, half, team, stat, value) => {
  matchData.stats[team][half][stat] = parseInt(value) || 0;
  // 合計も更新
  matchData.stats[team][stat] = matchData.stats[team].first[stat] + matchData.stats[team].second[stat];
  updateDisplay();
  return matchData;
});

// チーム情報更新
ipcMain.handle('update-team', (event, team, field, value) => {
  matchData[team][field] = value;
  updateDisplay();
  return matchData;
});

// ロゴ画像読み込み
ipcMain.handle('load-logo', async (event, team) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  try {
    const filePath = result.filePaths[0];
    
    // 画像ファイルをBase64エンコードして読み込む
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    // ファイル拡張子からMIMEタイプを判定
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') {
      mimeType = 'image/jpeg';
    } else if (ext === '.gif') {
      mimeType = 'image/gif';
    } else if (ext === '.svg') {
      mimeType = 'image/svg+xml';
    }
    
    // Data URI形式に変換
    const dataUri = `data:${mimeType};base64,${base64Image}`;
    
    matchData[team].logo = dataUri;
    console.log(`ロゴ設定完了: ${team} -> Data URI (${base64Image.length} bytes)`);
    updateDisplay();
    return dataUri;
  } catch (error) {
    console.error('ロゴ読み込みエラー:', error);
    return null;
  }
});

// CSV読み込み
ipcMain.handle('load-csv', async (event, team) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'CSV Files', extensions: ['csv'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  try {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const players = [];

    // ヘッダー行をスキップして処理
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length >= 2) {
        players.push({
          number: parts[0],
          name: parts[1],
          position: parts[2] || ''
        });
      }
    }

    matchData.players[team] = players;
    updateDisplay();
    return players;
  } catch (error) {
    console.error('CSV読み込みエラー:', error);
    return null;
  }
});

// 選手交代
ipcMain.handle('substitute-player', (event, team, outNumber, inNumber) => {
  try {
    const sub = {
      team,
      out: outNumber,
      in: inNumber,
      time: new Date().toISOString()
    };
    matchData.substitutions.push(sub);
    
    // 実際の選手データを更新
    const players = matchData.players[team];
    if (!players || players.length === 0) {
      throw new Error(`${team}チームの選手データが読み込まれていません`);
    }
    
    const outPlayerIndex = players.findIndex(p => p.number === outNumber);
    const inPlayerIndex = players.findIndex(p => p.number === inNumber);
    
    if (outPlayerIndex === -1) {
      throw new Error(`背番号${outNumber}の選手が見つかりません`);
    }
    if (inPlayerIndex === -1) {
      throw new Error(`背番号${inNumber}の選手が見つかりません`);
    }
    
    const outPlayer = players[outPlayerIndex];
    const inPlayer = players[inPlayerIndex];
    
    // OUT選手とIN選手を入れ替える
    // OUT選手の位置に：IN選手の背番号 + OUT選手のポジション + IN選手の名前
    players[outPlayerIndex] = { 
      number: inNumber,              // IN選手の背番号そのまま
      position: outPlayer.position,  // OUT選手のポジション維持
      name: inPlayer.name            // IN選手の名前
    };
    
    // IN選手の位置に：OUT選手の背番号 + IN選手のポジション + OUT選手の名前
    players[inPlayerIndex] = {
      number: outNumber,             // OUT選手の背番号
      position: inPlayer.position,   // IN選手のポジション維持
      name: outPlayer.name           // OUT選手の名前
    };
    
    updateDisplay();
    return { success: true, substitutions: matchData.substitutions };
  } catch (error) {
    console.error('選手交代エラー:', error);
    throw error;
  }
});

// 表示画面を更新
function updateDisplay() {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.webContents.send('update-data', matchData);
  }
  if (scoreboardWindow && !scoreboardWindow.isDestroyed()) {
    scoreboardWindow.webContents.send('update-data', matchData);
  }
  if (scoreboardChromakeyWindow && !scoreboardChromakeyWindow.isDestroyed()) {
    scoreboardChromakeyWindow.webContents.send('update-data', matchData);
  }
}

// 表示画面の開閉
ipcMain.handle('toggle-display', () => {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.close();
    displayWindow = null;
  } else {
    createDisplayWindow();
  }
});

// スコアボードの開閉
ipcMain.handle('toggle-scoreboard', () => {
  if (scoreboardWindow && !scoreboardWindow.isDestroyed()) {
    scoreboardWindow.close();
    scoreboardWindow = null;
  } else {
    createScoreboardWindow();
  }
});

// クロマキースコアボードの開閉
ipcMain.handle('toggle-scoreboard-chromakey', () => {
  if (scoreboardChromakeyWindow && !scoreboardChromakeyWindow.isDestroyed()) {
    scoreboardChromakeyWindow.close();
    scoreboardChromakeyWindow = null;
  } else {
    createScoreboardChromakeyWindow();
  }
});

// スコアボードを閉じる
ipcMain.handle('close-scoreboard', () => {
  if (scoreboardWindow && !scoreboardWindow.isDestroyed()) {
    scoreboardWindow.close();
    scoreboardWindow = null;
  }
});

// クロマキースコアボードを閉じる
ipcMain.handle('close-scoreboard-chromakey', () => {
  if (scoreboardChromakeyWindow && !scoreboardChromakeyWindow.isDestroyed()) {
    scoreboardChromakeyWindow.close();
    scoreboardChromakeyWindow = null;
  }
});

// 常に最前面表示の切り替え
ipcMain.handle('set-always-on-top', (event, windowType, flag) => {
  if (windowType === 'scoreboard' && scoreboardWindow && !scoreboardWindow.isDestroyed()) {
    scoreboardWindow.setAlwaysOnTop(flag);
  }
  if (windowType === 'scoreboard-chromakey' && scoreboardChromakeyWindow && !scoreboardChromakeyWindow.isDestroyed()) {
    scoreboardChromakeyWindow.setAlwaysOnTop(flag);
  }
});
