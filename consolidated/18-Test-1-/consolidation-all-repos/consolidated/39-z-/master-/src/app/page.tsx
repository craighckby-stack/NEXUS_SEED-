'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Shield, 
  Key, 
  Activity, 
  Database, 
  Eye,
  AlertTriangle,
  CheckCircle,
  Binary,
  Settings,
  Cpu,
  Zap,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface BinaryUnit {
  id: string;
  type: 'PROCESSOR' | 'ANALYZER' | 'VALIDATOR' | 'OPTIMIZER';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  config: Record<string, any>;
  metrics: {
    cycles: number;
    errors: number;
    efficiency: number;
  };
}

interface LogicGate {
  id: string;
  type: 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR';
  inputs: boolean[];
  output: boolean;
  config: {
    delay: number;
    priority: number;
  };
}

interface EncryptedPacket {
  data: string;      // Base64 encrypted binary
  iv: string;        // Initialization vector
  tag: string;       // Authentication tag
  keyId: string;    // Encryption key identifier
  timestamp: number; // Encryption timestamp
}

interface EncryptionKey {
  id: string;
  publicKey: string;    // Base64 encoded
  algorithm: 'AES-256-GCM';
  created: number;
  expires: number;
  usage: 'ENCRYPT' | 'DECRYPT';
}

export default function BinaryAI() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [systemStatus, setSystemStatus] = useState<'LOCKED' | 'UNLOCKED' | 'ERROR'>('LOCKED');
  const [systemClock, setSystemClock] = useState(0);
  const [binaryUnits, setBinaryUnits] = useState<BinaryUnit[]>([]);
  const [logicGates, setLogicGates] = useState<LogicGate[]>([]);
  const [encryptedPackets, setEncryptedPackets] = useState<EncryptedPacket[]>([]);
  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKey[]>([]);
  const [logs, setLogs] = useState<string[]>(['Binary AI System initialized', 'Encryption layer active', 'Awaiting authentication...']);
  const [binaryInput, setBinaryInput] = useState('');
  const [encryptionMode, setEncryptionMode] = useState<'ENCRYPT' | 'DECRYPT'>('ENCRYPT');

  // Load system status on mount
  useEffect(() => {
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/binary?action=status');
      const data = await response.json();
      
      if (data.status === 'ACTIVE') {
        setSystemStatus('UNLOCKED');
        setSystemClock(data.system.clock);
        setBinaryUnits(data.units);
        setLogicGates(data.gates);
        
        // Load encryption keys
        const keysResponse = await fetch('/api/binary?action=keys');
        const keysData = await keysResponse.json();
        setEncryptionKeys(keysData.keys || []);
        
        // Load encrypted packets
        const packetsResponse = await fetch('/api/binary?action=packets');
        const packetsData = await packetsResponse.json();
        setEncryptedPackets(packetsData.packets || []);
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
      setSystemStatus('ERROR');
      addLog('System status load failed');
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const authenticate = async () => {
    if (!encryptionKey.trim()) {
      addLog('Authentication failed: No encryption key provided');
      return;
    }

    addLog(`Authenticating with key: ${encryptionKey.substring(0, 8)}...`);
    
    try {
      const response = await fetch('/api/binary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'authenticate',
          data: {
            key: encryptionKey,
            timestamp: Date.now()
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsUnlocked(true);
        setSystemStatus('UNLOCKED');
        addLog('Authentication successful - System unlocked');
        await loadSystemStatus();
      } else {
        addLog(`Authentication failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      addLog('Authentication error occurred');
    }
  };

  const processBinaryInput = async () => {
    if (!binaryInput.trim()) return;

    addLog(`Processing binary input: "${binaryInput}"`);
    
    try {
      const response = await fetch('/api/binary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: encryptionMode === 'ENCRYPT' ? 'encrypt' : 'decrypt',
          data: {
            binary: binaryInput,
            mode: encryptionMode,
            keyId: encryptionKeys[0]?.id || 'DEFAULT'
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (encryptionMode === 'ENCRYPT') {
          addLog(`Binary encrypted: ${data.encryptedPacket.data.substring(0, 20)}...`);
        } else {
          addLog(`Binary decrypted: ${data.decryptedData}`);
        }
        await loadSystemStatus();
      } else {
        addLog(`Processing failed: ${data.error}`);
      }
      
      setBinaryInput('');
    } catch (error) {
      console.error('Processing error:', error);
      addLog('Processing error occurred');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNLOCKED': return 'text-green-400';
      case 'LOCKED': return 'text-yellow-400';
      case 'ERROR': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getUnitTypeColor = (type: string) => {
    switch (type) {
      case 'PROCESSOR': return 'bg-blue-500';
      case 'ANALYZER': return 'bg-purple-500';
      case 'VALIDATOR': return 'bg-orange-500';
      case 'OPTIMIZER': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getGateTypeColor = (type: string) => {
    switch (type) {
      case 'AND': return 'border-blue-500';
      case 'OR': return 'border-green-500';
      case 'NOT': return 'border-red-500';
      case 'XOR': return 'border-purple-500';
      case 'NAND': return 'border-orange-500';
      case 'NOR': return 'border-yellow-500';
      default: return 'border-gray-500';
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-black text-yellow-400 p-4 font-mono text-sm flex items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          <div className="border border-yellow-500 rounded p-6 bg-black/50 text-center">
            <Lock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-yellow-400 mb-2">BINARY AI SYSTEM</h1>
            <p className="text-xs text-yellow-600 mb-4">Secure Encryption Interface</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Encryption Key</label>
                <input
                  type="password"
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  placeholder="Enter encryption key to unlock system"
                  className="w-full px-4 py-3 bg-black border border-yellow-500 rounded text-yellow-400 font-mono text-sm focus:outline-none focus:border-yellow-400"
                />
              </div>
              <button
                onClick={authenticate}
                className="w-full px-4 py-3 bg-yellow-900 border border-yellow-500 text-yellow-400 rounded hover:bg-yellow-800 flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                UNLOCK SYSTEM
              </button>
            </div>
            <div className="mt-6 text-center">
              <div className="text-xs text-yellow-600 mb-2">System Status: {systemStatus}</div>
              <div className="text-xs text-yellow-700">
                Military-grade encryption active<br/>
                All binary data encrypted<br/>
                Authentication required
              </div>
            </div>
          </div>
          
          {/* System Logs */}
          <div className="border border-yellow-500 rounded p-4 bg-black/50">
            <h3 className="font-bold text-yellow-400 mb-3">SYSTEM LOGS</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto text-xs font-mono">
              {logs.slice(-10).map((log, index) => (
                <div key={index} className="text-yellow-400">{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 font-mono text-sm">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border border-green-500 rounded p-4 bg-black/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8 text-green-400" />
              <div>
                <h1 className="text-2xl font-bold text-green-400">BINARY AI SYSTEM</h1>
                <p className="text-xs text-green-600">Secure Encryption Interface</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEncryptionMode(encryptionMode === 'ENCRYPT' ? 'DECRYPT' : 'ENCRYPT')}
                className={`px-4 py-2 rounded border flex items-center gap-2 ${
                  encryptionMode === 'ENCRYPT' ? 'bg-blue-900 border-blue-500 text-blue-400' : 'bg-green-900 border-green-500 text-green-400'
                }`}
              >
                <Shield className="w-4 h-4" />
                {encryptionMode === 'ENCRYPT' ? 'ENCRYPT' : 'DECRYPT'}
              </button>
              <button
                onClick={() => setIsUnlocked(!isUnlocked)}
                className="px-4 py-2 rounded border border-yellow-500 text-yellow-400 hover:bg-yellow-900 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {isUnlocked ? 'LOCK' : 'UNLOCK'}
              </button>
            </div>
          </div>
        </div>

        {/* Encryption Status */}
        <div className="border border-green-500 rounded p-4 bg-black/50">
          <h3 className="font-bold text-green-400 mb-3">ENCRYPTION STATUS</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-gray-400">System Status</div>
              <div className={`font-bold ${getStatusColor(systemStatus)}`}>
                {systemStatus}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Clock</div>
              <div className="font-bold">{systemClock}</div>
            </div>
            <div>
              <div className="text-gray-400">Active Keys</div>
              <div className="font-bold">{encryptionKeys.length}</div>
            </div>
            <div>
              <div className="text-gray-400">Encrypted Packets</div>
              <div className="font-bold">{encryptedPackets.length}</div>
            </div>
            <div>
              <div className="text-gray-400">Mode</div>
              <div className="font-bold">{encryptionMode}</div>
            </div>
          </div>
        </div>

        {/* Binary Units */}
        <div className="border border-green-500 rounded p-4 bg-black/50">
          <h3 className="font-bold text-green-400 mb-3">BINARY UNITS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {binaryUnits.map(unit => (
              <div 
                key={unit.id}
                className={`border rounded p-3 ${
                  unit.status === 'ACTIVE' ? 'border-green-500 bg-green-900/20' : 
                  unit.status === 'ERROR' ? 'border-red-500 bg-red-900/20' : 
                  'border-gray-500 bg-gray-900/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4" />
                  <span className="font-bold text-xs">{unit.type}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div>ID: {unit.id}</div>
                  <div>Status: <span className={getStatusColor(unit.status)}>{unit.status}</span></div>
                  <div>Cycles: {unit.metrics.cycles}</div>
                  <div>Errors: {unit.metrics.errors}</div>
                  <div>Efficiency: {(unit.metrics.efficiency * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Binary Input */}
        <div className="border border-green-500 rounded p-4 bg-black/50">
          <h3 className="font-bold text-green-400 mb-3">BINARY {encryptionMode}</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={binaryInput}
              onChange={(e) => setBinaryInput(e.target.value.replace(/[^01]/g, ''))}
              placeholder="Enter binary (10101011)"
              className="flex-1 px-3 py-2 bg-black border border-green-500 rounded text-green-400 font-mono text-sm focus:outline-none focus:border-green-400"
            />
            <button
              onClick={processBinaryInput}
              className="px-4 py-2 bg-green-900 border border-green-500 text-green-400 rounded hover:bg-green-800 flex items-center gap-2"
            >
              {encryptionMode === 'ENCRYPT' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              {encryptionMode}
            </button>
          </div>
        </div>

        {/* Encrypted Packets */}
        <div className="border border-green-500 rounded p-4 bg-black/50">
          <h3 className="font-bold text-green-400 mb-3">ENCRYPTED PACKETS</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {encryptedPackets.slice(-10).map(packet => (
              <div key={packet.id} className="border border-green-500/30 rounded p-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">{packet.keyId}</span>
                  <span>{new Date(packet.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-green-400">
                  {packet.data.substring(0, 32)}...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Logs */}
        <div className="border border-green-500 rounded p-4 bg-black/50">
          <h3 className="font-bold text-green-400 mb-3">SYSTEM LOGS</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto text-xs font-mono">
            {logs.slice(-20).map((log, index) => (
              <div key={index} className="text-green-400">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}