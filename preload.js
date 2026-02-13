const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // データ取得
  getMatchData: () => ipcRenderer.invoke('get-match-data'),
  
  // 前半/後半切り替え
  switchHalf: (half) => ipcRenderer.invoke('switch-half', half),
  
  // スコア更新
  updateScore: (team, value) => ipcRenderer.invoke('update-score', team, value),
  
  // 前半/後半スコア更新
  updateHalfScore: (half, team, value) => ipcRenderer.invoke('update-half-score', half, team, value),
  
  // 統計更新
  updateStats: (team, stat, value) => ipcRenderer.invoke('update-stats', team, stat, value),
  
  // 前半/後半統計更新
  updateHalfStats: (half, team, stat, value) => ipcRenderer.invoke('update-half-stats', half, team, stat, value),
  
  // チーム情報更新
  updateTeam: (team, field, value) => ipcRenderer.invoke('update-team', team, field, value),
  
  // チーム名サイズ更新
  updateTeamNameSize: (size) => ipcRenderer.invoke('update-team-name-size', size),
  
  // CSV読み込み
  loadCSV: (team) => ipcRenderer.invoke('load-csv', team),
  
  // ロゴ画像読み込み
  loadLogo: (team) => ipcRenderer.invoke('load-logo', team),
  
  // 選手交代
  substitutePlayer: (team, outNumber, inNumber) => ipcRenderer.invoke('substitute-player', team, outNumber, inNumber),
  
  // 表示画面の開閉
  toggleDisplay: () => ipcRenderer.invoke('toggle-display'),
  
  // スコアボードの開閉
  toggleScoreboard: () => ipcRenderer.invoke('toggle-scoreboard'),
  
  // クロマキースコアボードの開閉
  toggleScoreboardChromakey: () => ipcRenderer.invoke('toggle-scoreboard-chromakey'),
  
  // スコアボードを閉じる
  closeScoreboard: () => ipcRenderer.invoke('close-scoreboard'),
  
  // クロマキースコアボードを閉じる
  closeScoreboardChromakey: () => ipcRenderer.invoke('close-scoreboard-chromakey'),
  
  // 常に最前面表示の切り替え
  setAlwaysOnTop: (windowType, flag) => ipcRenderer.invoke('set-always-on-top', windowType, flag),
  
  // データ更新イベントのリスナー（表示画面用）
  onUpdateData: (callback) => ipcRenderer.on('update-data', (event, data) => callback(data)),
  
  // チーム名サイズ更新イベントのリスナー
  onUpdateTeamNameSize: (callback) => ipcRenderer.on('update-team-name-size', (event, size) => callback(size))
});

