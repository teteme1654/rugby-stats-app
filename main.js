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
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      if (jsonData.length > 0) {
        headers = jsonData[0];
        data = jsonData.slice(1);
      }
    }

    return {
      fileName: fileName,
      headers: headers,
      preview: data,
      fullData: data
    };
  } catch (error) {
    console.error('ファイル読み込みエラー:', error);
    return null;
  }
});

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
    const convertedData = await convertData(config);
    
    // 変換されたデータをCSV形式で一時保存
    const outputPath = path.join(__dirname, 'temp_import.csv');
    const csvContent = generateCSV(convertedData);
    fs.writeFileSync(outputPath, csvContent, 'utf-8');
    
    // 既存のCSV読み込み機能を使用してインポート
    // （ここでは簡易的に処理を記述）
    console.log('✅ インポート成功:', convertedData.length, '件');
    
    return {
      success: true,
      count: convertedData.length,
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
