const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // データ取得
  getMatchData: () => ipcRenderer.invoke('get-match-data'),
  
  // スコア更新
  updateScore: (team, value) => ipcRenderer.invoke('update-score', team, value),
  
  // 統計更新
  updateStats: (team, stat, value) => ipcRenderer.invoke('update-stats', team, stat, value),
  
  // チーム情報更新
  updateTeam: (team, field, value) => ipcRenderer.invoke('update-team', team, field, value),
  
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
  
  // スコアボードを閉じる
  closeScoreboard: () => ipcRenderer.invoke('close-scoreboard'),
  
  // 常に最前面表示の切り替え
  setAlwaysOnTop: (windowType, flag) => ipcRenderer.invoke('set-always-on-top', windowType, flag),
  
  // データ更新イベントのリスナー（表示画面用）
  onUpdateData: (callback) => ipcRenderer.on('update-data', (event, data) => callback(data))
});

