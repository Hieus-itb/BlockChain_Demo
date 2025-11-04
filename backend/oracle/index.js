require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');

const app = express();
app.use(bodyParser.json());

const RPC_URL = process.env.RPC_URL; // local hardhat or Sepolia RPC
const PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY; // key của oracle account
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
// If you haven't provided ABI here, the server can run in stub mode for testing.
let CONTRACT_ABI = [];
try {
  // try to load ABI from compiled artifact if available
  // path: ../contracts/artifacts/contracts/ShippingInsurance.sol/ShippingInsurance.json
  // this will work if you ran a local hardhat compile
  // eslint-disable-next-line global-require
  const artifact = require('../../contracts/artifacts/contracts/ShippingInsurance.sol/ShippingInsurance.json');
  CONTRACT_ABI = artifact.abi || [];
} catch (e) {
  // artifact not found or invalid; we'll allow stub mode below
}

let provider, wallet, contract;
let stubMode = false;

if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS || !Array.isArray(CONTRACT_ABI) || CONTRACT_ABI.length === 0) {
  console.warn('Oracle running in STUB mode: missing RPC_URL or ORACLE_PRIVATE_KEY or CONTRACT_ADDRESS or ABI');
  stubMode = true;
} else {
  try {
    provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
  } catch (err) {
    console.error('Failed to initialize ethers contract; falling back to STUB mode', err.message || err);
    stubMode = true;
  }
}

app.post('/report', async (req, res) => {
  const { policyId, evidence } = req.body;
  if (stubMode) {
    console.log('[STUB] Received report', { policyId, evidence });
    // simulate async delay
    setTimeout(() => {
      res.json({ ok: true, simulated: true, policyId, evidence });
    }, 300);
    return;
  }

  try {
    const tx = await contract.reportDamage(policyId, evidence);
    await tx.wait();
    res.json({ ok: true, txHash: tx.hash });
  } catch (err) {
    console.error('reportDamage error:', err);
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Oracle listening on port ${PORT} (stubMode=${stubMode})`));