let isMining = false;
let nonce = 0;
let totalHashes = 0;
let lastUpdateTime = Date.now();
let hashesThisSecond = 0;

const mockBlockData = 'AffiliateEvent-MockBlock-';

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function startMining() {
  isMining = true;
  mineLoop();
}

function stopMining() {
  isMining = false;
}

async function mineLoop() {
  while (isMining) {
    const dataToHash = mockBlockData + nonce;
    await sha256(dataToHash);
    nonce++;
    totalHashes++;
    hashesThisSecond++;

    const now = Date.now();
    if (now - lastUpdateTime >= 1000) {
      const hashesPerSecond = hashesThisSecond;
      const batchCount = Math.floor(totalHashes / 1000);

      self.postMessage({
        type: 'update',
        hashesPerSecond,
        batchCount,
        totalHashes,
      });

      hashesThisSecond = 0;
      lastUpdateTime = now;
    }

    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

self.onmessage = (e) => {
  if (e.data.type === 'start') {
    startMining();
  } else if (e.data.type === 'stop') {
    stopMining();
  }
};
