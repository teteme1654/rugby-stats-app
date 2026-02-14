const fs = require('fs');
const path = require('path');

// CSVファイルを読み込んでパース
const filePath = './sample_team_with_logo.csv';
const csvDir = path.dirname(filePath);
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n').filter(line => line.trim());

console.log('=== CSV解析テスト ===');
console.log(`総行数: ${lines.length}`);
console.log(`ヘッダー: ${lines[0]}`);
console.log('');

const players = [];
let teamName = 'デフォルトチーム名';
let logoPath = null;

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',').map(p => p.trim());
  console.log(`[${i}行目] parts.length=${parts.length}, parts[0]="${parts[0]}"`);
  
  if (parts[0] === 'TEAM') {
    console.log(`  → TEAM行検出！`);
    console.log(`     チーム名: "${parts[1]}"`);
    console.log(`     ポジション(空): "${parts[2]}"`);
    console.log(`     ロゴパス: "${parts[3]}"`);
    teamName = parts[1] || teamName;
    logoPath = parts[3] || null;
  } else if (parts.length >= 2) {
    const player = {
      number: parts[0],
      name: parts[1],
      position: parts[2] || ''
    };
    players.push(player);
    if (i <= 3 || i === lines.length - 2) {
      console.log(`  → 選手: ${player.number} ${player.name} ${player.position}`);
    }
  }
}

console.log('');
console.log('=== 結果 ===');
console.log(`チーム名: ${teamName}`);
console.log(`ロゴパス: ${logoPath}`);
console.log(`選手数: ${players.length}名`);
console.log(`最初の選手: ${players[0].number} ${players[0].name}`);
console.log(`最後の選手: ${players[players.length-1].number} ${players[players.length-1].name}`);
