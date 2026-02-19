const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let displayWindow = null;
let scoreboardWindow = null;
let scoreboardChromakeyWindow = null;

// ディスプレイ設定を保存
let displaySettings = {
  displayWindowIndex: null,  // スタッツ表示用ディスプレイのインデックス
  scoreboardWindowIndex: null, // スコアボード用ディスプレイのインデックス
  chromakeyColor: '#00FF00' // クロマキー背景色（デフォルト：グリーン）
};

// 設定ファイルのパス
const settingsPath = path.join(app.getPath('userData'), 'display-settings.json');

// 設定を読み込む
function loadDisplaySettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      displaySettings = JSON.parse(data);
      console.log('ディスプレイ設定を読み込みました:', displaySettings);
    }
  } catch (error) {
    console.error('ディスプレイ設定の読み込みに失敗しました:', error);
  }
}

// 設定を保存する
function saveDisplaySettings() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(displaySettings, null, 2));
    console.log('ディスプレイ設定を保存しました:', displaySettings);
  } catch (error) {
    console.error('ディスプレイ設定の保存に失敗しました:', error);
  }
}

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
      tries: 0, conversions: 0, penaltyGoals: 0, dropGoals: 0, penaltyTries: 0,
      first: { tries: 0, conversions: 0, penaltyGoals: 0, dropGoals: 0, penaltyTries: 0 },
      second: { tries: 0, conversions: 0, penaltyGoals: 0, dropGoals: 0, penaltyTries: 0 }
    },
    away: { 
      tries: 0, conversions: 0, penaltyGoals: 0, dropGoals: 0, penaltyTries: 0,
      first: { tries: 0, conversions: 0, penaltyGoals: 0, dropGoals: 0, penaltyTries: 0 },
      second: { tries: 0, conversions: 0, penaltyGoals: 0, dropGoals: 0, penaltyTries: 0 }
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
  
  // 保存された設定があればそれを使用、なければ2枚目のディスプレイ
  let targetDisplay;
  if (displaySettings.displayWindowIndex !== null && displays[displaySettings.displayWindowIndex]) {
    targetDisplay = displays[displaySettings.displayWindowIndex];
    console.log(`スタッツ表示画面: ディスプレイ${displaySettings.displayWindowIndex + 1}を使用`);
  } else {
    // デフォルト: 最初の外部ディスプレイ（2枚目）
    targetDisplay = displays.find((display) => {
      return display.bounds.x !== 0 || display.bounds.y !== 0;
    }) || displays[0];
  }

  displayWindow = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
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
  
  // 保存された設定があればそれを使用、なければ3枚目のディスプレイ
  let targetDisplay;
  if (displaySettings.scoreboardWindowIndex !== null && displays[displaySettings.scoreboardWindowIndex]) {
    targetDisplay = displays[displaySettings.scoreboardWindowIndex];
    console.log(`スコアボード: ディスプレイ${displaySettings.scoreboardWindowIndex + 1}を使用`);
  } else {
    // デフォルト: 3台目のモニターがあればそこに、なければメインディスプレイ
    targetDisplay = displays[0];
    if (displays.length >= 3) {
      targetDisplay = displays[2];
    }
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
  // scoreboardWindow.webContents.openDevTools(); // 開発者ツールを開く（本番では無効化）
  scoreboardWindow.on('closed', () => {
    scoreboardWindow = null;
  });
}

function createScoreboardChromakeyWindow() {
  const displays = screen.getAllDisplays();
  
  // 保存された設定があればそれを使用、なければ3枚目のディスプレイ
  let targetDisplay;
  if (displaySettings.scoreboardWindowIndex !== null && displays[displaySettings.scoreboardWindowIndex]) {
    targetDisplay = displays[displaySettings.scoreboardWindowIndex];
    console.log(`クロマキースコアボード: ディスプレイ${displaySettings.scoreboardWindowIndex + 1}を使用`);
  } else {
    // デフォルト: 3台目のモニターがあればそこに、なければメインディスプレイ
    targetDisplay = displays[0];
    if (displays.length >= 3) {
      targetDisplay = displays[2];
    }
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
  // scoreboardChromakeyWindow.webContents.openDevTools(); // 開発者ツールを開く（本番では無効化）
  
  // ページ読み込み完了後にクロマキー色を設定
  scoreboardChromakeyWindow.webContents.on('did-finish-load', () => {
    const color = displaySettings.chromakeyColor || '#00FF00';
    scoreboardChromakeyWindow.webContents.executeJavaScript(`
      document.body.style.background = '${color}';
    `);
  });
  
  scoreboardChromakeyWindow.on('closed', () => {
    scoreboardChromakeyWindow = null;
  });
}

app.whenReady().then(() => {
  loadDisplaySettings(); // ディスプレイ設定を読み込む
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

// チーム名サイズ更新
ipcMain.handle('update-team-name-size', (event, team, size) => {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.webContents.send('update-team-name-size', team, size);
  }
  if (scoreboardWindow && !scoreboardWindow.isDestroyed()) {
    scoreboardWindow.webContents.send('update-team-name-size', team, size);
  }
  if (scoreboardChromakeyWindow && !scoreboardChromakeyWindow.isDestroyed()) {
    scoreboardChromakeyWindow.webContents.send('update-team-name-size', team, size);
  }
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
    const csvDir = path.dirname(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const players = [];
    
    // team が 'host' or 'away' なので、matchData用に変換
    const teamKey = team === 'host' ? 'hostTeam' : 'awayTeam';
    
    let teamName = matchData[teamKey].name;  // デフォルト値
    let logoDataUri = matchData[teamKey].logo;  // デフォルト値
    let logoUpdated = false;  // ロゴが更新されたかフラグ

    // ヘッダー行をスキップして処理
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      
      if (parts[0] === 'TEAM') {
        // チーム情報行
        teamName = parts[1] || teamName;
        
        // 4列目（ファイルパス）にロゴパスが指定されている
        if (parts[3]) {
          const logoPath = path.join(csvDir, parts[3]);
          
          if (fs.existsSync(logoPath)) {
            try {
              const logoBuffer = fs.readFileSync(logoPath);
              const ext = path.extname(logoPath).toLowerCase();
              let mimeType = 'image/png';
              if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
              else if (ext === '.gif') mimeType = 'image/gif';
              else if (ext === '.svg') mimeType = 'image/svg+xml';
              
              logoDataUri = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
              logoUpdated = true;
              console.log(`✅ ロゴ読み込み成功: ${logoPath}`);
            } catch (error) {
              console.warn(`⚠️ ロゴ読み込みエラー: ${logoPath}`, error);
            }
          } else {
            console.warn(`⚠️ ロゴファイルが見つかりません: ${logoPath}`);
          }
        }
      } else if (parts.length >= 2) {
        // 選手データ行
        players.push({
          number: parts[0],
          name: parts[1],
          position: parts[2] || ''
          // parts[3] は将来の選手写真パス
        });
      }
    }

    // matchDataを更新
    matchData[teamKey].name = teamName;
    matchData[teamKey].logo = logoDataUri;
    matchData.players[team] = players;  // players は 'host' / 'away' キー
    
    updateDisplay();
    
    console.log(`✅ CSV読み込み完了: ${players.length}名, チーム名: ${teamName}, ロゴ更新: ${logoUpdated}`);
    
    return { 
      players, 
      teamName,
      hasLogo: logoUpdated
    };
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

// 選手情報を更新（Issue #5）
ipcMain.handle('update-player', (event, team, playerIndex, updatedPlayer) => {
  try {
    const players = matchData.players[team];
    if (!players || players.length === 0) {
      throw new Error(`${team}チームの選手データが読み込まれていません`);
    }
    
    if (playerIndex < 0 || playerIndex >= players.length) {
      throw new Error(`無効な選手インデックス: ${playerIndex}`);
    }
    
    // 選手情報を更新
    players[playerIndex] = {
      ...players[playerIndex],
      ...updatedPlayer
    };
    
    // 表示画面を更新
    updateDisplay();
    
    console.log(`選手情報を更新しました: ${team} [${playerIndex}]`, updatedPlayer);
    return { success: true, player: players[playerIndex] };
  } catch (error) {
    console.error('選手情報の更新エラー:', error);
    throw error;
  }
});

// 画像ファイル選択（Issue #5）
ipcMain.handle('select-image-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return { filePath: result.filePaths[0] };
  }
  return null;
});

// ディスプレイ情報を取得
ipcMain.handle('get-displays', () => {
  const displays = screen.getAllDisplays();
  return displays.map((display, index) => ({
    id: display.id,
    index: index,
    width: display.bounds.width,
    height: display.bounds.height,
    x: display.bounds.x,
    y: display.bounds.y,
    primary: display.bounds.x === 0 && display.bounds.y === 0
  }));
});

// ウィンドウのディスプレイを設定
ipcMain.handle('set-display-for-window', (event, windowType, displayIndex) => {
  if (windowType === 'display') {
    displaySettings.displayWindowIndex = displayIndex;
  } else if (windowType === 'scoreboard') {
    displaySettings.scoreboardWindowIndex = displayIndex;
  }
  
  saveDisplaySettings();
  
  console.log(`${windowType}のディスプレイを${displayIndex + 1}に設定しました`);
  return { success: true, windowType, displayIndex };
});

// クロマキー色を設定
ipcMain.handle('set-chromakey-color', (event, color) => {
  displaySettings.chromakeyColor = color;
  saveDisplaySettings();
  
  // 既にクロマキースコアボードが開いている場合は即座に反映
  if (scoreboardChromakeyWindow && !scoreboardChromakeyWindow.isDestroyed()) {
    scoreboardChromakeyWindow.webContents.executeJavaScript(`
      document.body.style.background = '${color}';
    `);
  }
  
  console.log(`クロマキー色を${color}に設定しました`);
  return { success: true, color };
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

// ============================================================
// データマッピング & インポート機能（Issue #3, #4対応）
// ============================================================

const XLSX = require('xlsx');
let mapperWindow = null;

// マッパーウィンドウを開く
ipcMain.handle('open-mapper', () => {
  if (mapperWindow && !mapperWindow.isDestroyed()) {
    mapperWindow.focus();
    return;
  }

  mapperWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png')
  });

  mapperWindow.loadFile('mapper.html');
  
  mapperWindow.on('closed', () => {
    mapperWindow = null;
  });
});

// データファイル（CSV/Excel）を読み込む
ipcMain.handle('load-data-file', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Data Files', extensions: ['csv', 'xlsx', 'xls'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  try {
    let data = [];
    let headers = [];

    if (ext === '.csv') {
      // CSV読み込み
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        headers = lines[0].split(',').map(h => h.trim());
        data = lines.slice(1).map(line => 
          line.split(',').map(cell => cell.trim())
        );
      }
    } else {
      // Excel読み込み
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      
      if (jsonData.length > 0) {
        // ヘッダー行を自動検出（"NO"を含む行）
        const headerRowIndex = jsonData.findIndex(row => 
          row.some(cell => String(cell).toUpperCase() === 'NO')
        );
        
        if (headerRowIndex !== -1) {
          headers = jsonData[headerRowIndex];
          data = jsonData;
        } else {
          // 従来形式（1行目がヘッダー）
          headers = jsonData[0];
          data = jsonData.slice(1);
        }
      }
    }

    // ファイル構造を自動検出
    const fileFormat = detectFileFormat(data, headers);
    console.log('📊 検出されたフォーマット:', fileFormat.type);

    return {
      fileName: fileName,
      headers: headers,
      preview: data,
      fullData: data,
      format: fileFormat
    };
  } catch (error) {
    console.error('ファイル読み込みエラー:', error);
    return null;
  }
});

// ファイル構造の自動検出
function detectFileFormat(data, headers) {
  // 両チーム形式の検出条件:
  // 1. "NO"列が複数ある（列AとF）
  // 2. 左側と右側の間に空白列がある
  // 3. データが左右対称的に配置されている
  
  const headerRow = data.find(row => 
    row.some(cell => String(cell).toUpperCase() === 'NO')
  );
  
  if (!headerRow) {
    return { type: 'single', mode: 'manual' };
  }

  // "NO"の位置を全て検索
  const noPositions = [];
  headerRow.forEach((cell, index) => {
    if (String(cell).toUpperCase() === 'NO') {
      noPositions.push(index);
    }
  });

  // 2つ以上の"NO"がある → 両チーム形式の可能性
  if (noPositions.length >= 2) {
    const leftNoIndex = noPositions[0];
    const rightNoIndex = noPositions[1];
    
    // 左側データの終わりと右側データの始まりの間に空白列があるか確認
    // 左側: NO(0), Pos(1), Name(2), Romaji(3), 空白(4)
    // 右側: NO(5), Pos(6), Name(7), Romaji(8)
    let hasEmptyColumn = false;
    for (let i = leftNoIndex + 1; i < rightNoIndex; i++) {
      if (headerRow[i] === '' || !headerRow[i]) {
        hasEmptyColumn = true;
        console.log(`✅ 空白列を検出: index ${i}`);
        break;
      }
    }
    
    // または、2つのNOの間隔が5以上ある場合も両チーム形式と判定
    const distance = rightNoIndex - leftNoIndex;
    if (hasEmptyColumn || distance >= 5) {
      console.log('✅ 両チーム一括形式を検出しました');
      console.log(`  左側NO: ${leftNoIndex}, 右側NO: ${rightNoIndex}, 間隔: ${distance}`);
      return {
        type: 'dual',
        mode: 'auto',
        leftColumns: { start: leftNoIndex, end: leftNoIndex + 3 },  // NO, Pos, Name, Romaji
        rightColumns: { start: rightNoIndex, end: rightNoIndex + 3 },
        emptyColumn: leftNoIndex + 4
      };
    }
  }

  // シングルチーム形式
  console.log('⚠️ シングルチーム形式と判定しました');
  return { type: 'single', mode: 'manual' };
}

// ポジション名正規化（"PR／プロップ" → "PR"）
function normalizePosition(posText) {
  if (!posText) return '';
  
  const text = String(posText).trim();
  
  // "PR／プロップ" 形式
  const match = text.match(/^([A-Z0-9]+)／/);
  if (match) {
    return match[1];
  }
  
  // "PR" のみ、または "プロップ" のみ
  if (/^[A-Z0-9]+$/.test(text)) {
    return text;
  }
  
  return text.split('／')[0] || text;
}

// フォルダ選択ダイアログ
ipcMain.handle('select-folder', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

// データ変換とインポート実行
ipcMain.handle('execute-import', async (event, config) => {
  try {
    const { data, mapping, pathGeneration, format } = config;
    
    // 両チーム一括形式の場合
    if (format && format.type === 'dual') {
      return await importDualTeamData(config);
    }
    
    // シングルチーム形式（従来）
    const convertedData = await convertData(config);
    
    // チーム選択がない場合はエラー
    if (!config.targetTeam) {
      return {
        success: false,
        error: 'インポート先のチーム（ホーム/アウェイ）を選択してください'
      };
    }
    
    // matchDataに格納
    const teamKey = config.targetTeam; // 'host' or 'away'
    matchData.players[teamKey] = convertedData.map(player => ({
      number: player.JerseyNo || player.背番号,
      name: player.PlayerName || player.名前,
      position: normalizePosition(player.Position || player.ポジション || '')
    }));
    
    // チーム名も更新
    if (convertedData.length > 0 && convertedData[0].TeamName) {
      const teamKeyForName = teamKey === 'host' ? 'hostTeam' : 'awayTeam';
      matchData[teamKeyForName].name = convertedData[0].TeamName;
    }
    
    updateDisplay();
    
    console.log(`✅ ${teamKey}チームにインポート成功:`, convertedData.length, '件');
    
    return {
      success: true,
      count: convertedData.length,
      team: teamKey,
      data: convertedData
    };
  } catch (error) {
    console.error('インポートエラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// 両チーム一括インポート処理
async function importDualTeamData(config) {
  const { data, format } = config;
  const fullData = data.fullData;
  
  // ヘッダー行を探す
  const headerRowIndex = fullData.findIndex(row => 
    row.some(cell => String(cell).toUpperCase() === 'NO')
  );
  
  if (headerRowIndex === -1) {
    throw new Error('ヘッダー行が見つかりません');
  }
  
  const leftCols = format.leftColumns;
  const rightCols = format.rightColumns;
  
  // ホームチーム（左側）のデータ抽出
  const hostPlayers = [];
  for (let i = headerRowIndex + 1; i < fullData.length; i++) {
    const row = fullData[i];
    const no = row[leftCols.start];
    
    // 空行、"リザーブメンバー"行、ヘッダーなどをスキップ
    if (!no || no === '' || String(no).includes('リザーブ') || String(no).includes('NO')) {
      continue;
    }
    
    // 数値または数値文字列かチェック
    if (isNaN(Number(no))) {
      continue;
    }
    
    hostPlayers.push({
      number: String(no),
      position: normalizePosition(row[leftCols.start + 1] || ''),
      name: (row[leftCols.start + 2] || '').trim()
    });
  }
  
  // アウェイチーム（右側）のデータ抽出
  const awayPlayers = [];
  for (let i = headerRowIndex + 1; i < fullData.length; i++) {
    const row = fullData[i];
    const no = row[rightCols.start];
    
    if (!no || no === '' || String(no).includes('リザーブ') || String(no).includes('NO')) {
      continue;
    }
    
    if (isNaN(Number(no))) {
      continue;
    }
    
    awayPlayers.push({
      number: String(no),
      position: normalizePosition(row[rightCols.start + 1] || ''),
      name: (row[rightCols.start + 2] || '').trim()
    });
  }
  
  // チーム名を抽出（行7付近から）
  let hostTeamName = 'ホームチーム';
  let awayTeamName = 'アウェイチーム';
  
  for (let i = 0; i < Math.min(headerRowIndex, fullData.length); i++) {
    const row = fullData[i];
    
    // 左側（ホーム）
    const leftText = String(row[leftCols.start] || '');
    // 右側（アウェイ）
    const rightText = String(row[rightCols.start] || '');
    
    // "メンバー"を含む行からチーム名を抽出
    if (leftText.includes('メンバー')) {
      hostTeamName = leftText.replace(/メンバー.*$/, '').replace(/[　\s※]+$/, '').trim();
    }
    if (rightText.includes('メンバー') || rightText.includes('ワイルド') || rightText.includes('チーム')) {
      awayTeamName = rightText.replace(/メンバー.*$/, '').replace(/[　\s※]+$/, '').trim();
      // "※"以降を削除
      awayTeamName = awayTeamName.split('※')[0].trim();
    }
  }
  
  // matchDataに格納
  matchData.players.host = hostPlayers;
  matchData.players.away = awayPlayers;
  matchData.hostTeam.name = hostTeamName;
  matchData.awayTeam.name = awayTeamName;
  
  updateDisplay();
  
  console.log(`✅ 両チーム一括インポート成功`);
  console.log(`   ホーム: ${hostTeamName} (${hostPlayers.length}名)`);
  console.log(`   アウェイ: ${awayTeamName} (${awayPlayers.length}名)`);
  
  return {
    success: true,
    mode: 'dual',
    hostCount: hostPlayers.length,
    awayCount: awayPlayers.length,
    hostTeamName: hostTeamName,
    awayTeamName: awayTeamName
  };
}

// データ変換プレビュー
ipcMain.handle('preview-conversion', async (event, config) => {
  try {
    const convertedData = await convertData(config);
    
    return {
      success: true,
      preview: convertedData.slice(0, 5) // 先頭5件のみ
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// データ変換ロジック
async function convertData(config) {
  const { data, mapping, pathGeneration } = config;
  const fullData = data.fullData;
  const headers = data.headers;
  
  const converted = [];

  for (let rowIndex = 0; rowIndex < fullData.length; rowIndex++) {
    const row = fullData[rowIndex];
    const newRow = {};

    // Step 1: カラムマッピング適用
    for (let [sourceCol, targetCol] of Object.entries(mapping)) {
      const sourceIndex = headers.indexOf(sourceCol);
      if (sourceIndex !== -1 && row[sourceIndex] !== undefined) {
        newRow[targetCol] = row[sourceIndex];
      }
    }

    // Step 2: 画像パス自動生成（Issue #4）
    if (pathGeneration) {
      // 選手写真パス生成
      if (pathGeneration.player) {
        const { basePath, pattern, targetColumn, checkExists } = pathGeneration.player;
        const filePath = generateFilePath(basePath, pattern, newRow);
        
        if (checkExists) {
          const fullPath = path.join(__dirname, filePath);
          if (fs.existsSync(fullPath)) {
            newRow[targetColumn] = filePath;
          } else {
            console.warn(`⚠️ ファイルが見つかりません: ${filePath}`);
            newRow[targetColumn] = './assets/noimage.jpg'; // デフォルト画像
          }
        } else {
          newRow[targetColumn] = filePath;
        }
      }

      // チームロゴパス生成
      if (pathGeneration.team) {
        const { basePath, pattern, targetColumn, checkExists } = pathGeneration.team;
        const filePath = generateFilePath(basePath, pattern, newRow);
        
        if (checkExists) {
          const fullPath = path.join(__dirname, filePath);
          if (fs.existsSync(fullPath)) {
            newRow[targetColumn] = filePath;
          } else {
            console.warn(`⚠️ ロゴファイルが見つかりません: ${filePath}`);
            newRow[targetColumn] = '';
          }
        } else {
          newRow[targetColumn] = filePath;
        }
      }
    }

    converted.push(newRow);
  }

  return converted;
}

// ファイルパス生成（パターン置換）
function generateFilePath(basePath, pattern, data) {
  let filePath = pattern;
  
  // {ColumnName} パターンを実際の値で置換
  const matches = pattern.match(/\{([^}]+)\}/g);
  if (matches) {
    matches.forEach(match => {
      const columnName = match.replace(/[{}]/g, '');
      if (data[columnName]) {
        filePath = filePath.replace(match, data[columnName]);
      }
    });
  }
  
  return basePath + filePath;
}

// CSV生成
function generateCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => row[h] || '').join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

// プリセット保存
ipcMain.handle('save-preset', async (event, presetName, preset) => {
  try {
    const presetsDir = path.join(__dirname, 'presets');
    if (!fs.existsSync(presetsDir)) {
      fs.mkdirSync(presetsDir);
    }
    
    const presetPath = path.join(presetsDir, `${presetName}.json`);
    fs.writeFileSync(presetPath, JSON.stringify(preset, null, 2), 'utf-8');
    
    console.log(`✅ プリセット保存: ${presetName}`);
    return { success: true };
  } catch (error) {
    console.error('プリセット保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// プリセット読み込み
ipcMain.handle('load-preset', async (event, presetName) => {
  try {
    const presetPath = path.join(__dirname, 'presets', `${presetName}.json`);
    if (!fs.existsSync(presetPath)) {
      return null;
    }
    
    const content = fs.readFileSync(presetPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('プリセット読み込みエラー:', error);
    return null;
  }
});

// プリセット一覧取得
ipcMain.handle('get-preset-list', async (event) => {
  try {
    const presetsDir = path.join(__dirname, 'presets');
    if (!fs.existsSync(presetsDir)) {
      return [];
    }
    
    const files = fs.readdirSync(presetsDir);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch (error) {
    console.error('プリセット一覧取得エラー:', error);
    return [];
  }
});
