const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  const vars = [];
  function parse(file) {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    for (let line of content.split('\n')) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const name = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      vars.push({ name, value });
    }
  }
  
  parse('.env');
  parse('.env.local');
  
  for (const v of vars) {
    console.log(`Adding ${v.name}...`);
    fs.writeFileSync('temp-env-val.txt', v.value);
    try {
      execSync(`cmd /c "type temp-env-val.txt | npx vercel env add ${v.name} production --yes --force"`, { stdio: 'inherit' });
    } catch (e) {
      console.log(`Failed adding ${v.name}`);
    }
  }
  
  if (fs.existsSync('temp-env-val.txt')) fs.unlinkSync('temp-env-val.txt');
  console.log("ALL ENV VARS ADDED SUCCESSFULLY");
}

main();
