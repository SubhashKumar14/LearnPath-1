// Integration test: starts server (if not running) and exercises core endpoints
const fetch = require('node-fetch');
const { spawn } = require('child_process');
const net = require('net');

const API = 'http://localhost:3000/api';
let serverProcess = null;

async function waitForPort(port, timeoutMs=10000){
  const start = Date.now();
  return new Promise((resolve,reject)=>{
    const check=()=>{
      const socket = net.connect(port,'127.0.0.1');
      socket.once('connect',()=>{ socket.destroy(); resolve(); });
      socket.once('error',()=>{ socket.destroy(); if(Date.now()-start>timeoutMs) return reject(new Error('Timeout waiting for server')); setTimeout(check,300); });
    };check();
  });
}

async function ensureServer(){
  return new Promise(async (resolve,reject)=>{
    // quick probe
    const probe = net.connect(3000,'127.0.0.1');
    probe.once('connect',()=>{ probe.destroy(); resolve(false); });
    probe.once('error',()=>{
      // start server
      serverProcess = spawn(process.platform==='win32'? 'node.exe':'node',['server.js'],{stdio:'inherit'});
      waitForPort(3000).then(()=>resolve(true)).catch(reject);
    });
  });
}

function randomEmail(){ return `test_${Date.now()}_${Math.floor(Math.random()*1000)}@example.com`; }

async function main(){
  const started = await ensureServer();
  console.log(started? '🚀 Started server for tests':'✅ Reusing existing server');

  // health
  const health = await fetch(`${API.replace('/api','')}/api/health`).then(r=>r.json()).catch(e=>({error:e.message}));
  console.log('Health:', health);

  // roadmaps
  const roadmaps = await fetch(`${API}/roadmaps`).then(r=>r.json());
  console.log(`Roadmaps: ${roadmaps.length}`);
  const firstRoadmapId = roadmaps[0]?.id;

  // register user
  const email = randomEmail();
  const regRes = await fetch(`${API}/register`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:'Auto Test', email, password:'testpass123'})});
  console.log('Register status', regRes.status);

  // login admin
  const adminLogin = await fetch(`${API}/login`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:'admin@learnpath.com', password:'password123'})}).then(r=>r.json());
  if(!adminLogin.token){ console.error('Admin login failed'); process.exitCode=1; return; }
  console.log('Admin login ok');

  // login new user
  const userLoginRes = await fetch(`${API}/login`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password:'testpass123'})});
  const userLogin = await userLoginRes.json();
  console.log('User login status', userLoginRes.status);
  const token = userLogin.token;

  if(firstRoadmapId && token){
    // start roadmap
    const startRes = await fetch(`${API}/roadmaps/${firstRoadmapId}/start`, {method:'POST', headers:{'Authorization':`Bearer ${token}`}});
    console.log('Start roadmap status', startRes.status);
    // fetch roadmap detail
    const detail = await fetch(`${API}/roadmaps/${firstRoadmapId}`).then(r=>r.json());
    const firstTask = detail.modules?.[0]?.tasks?.[0];
    if(firstTask){
      const progRes = await fetch(`${API}/progress/task`, {method:'POST', headers:{'Authorization':`Bearer ${token}`, 'Content-Type':'application/json'}, body: JSON.stringify({taskId:firstTask.id, completed:true})});
      console.log('Mark task complete status', progRes.status);
    }
    // stats
    const stats = await fetch(`${API}/user/stats`, {headers:{'Authorization':`Bearer ${token}`}}).then(r=>r.json());
    console.log('User stats tasksCompleted=', stats.tasksCompleted);
  }

  // cleanup
  if(serverProcess){ serverProcess.kill(); }
  console.log('✅ Integration test finished');
}

main().catch(e=>{ console.error('Test run failed', e); if(serverProcess) serverProcess.kill(); process.exitCode=1; });
