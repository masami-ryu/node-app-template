import { spawn } from 'node:child_process';
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distServer = resolve(__dirname, '../dist/server.js');

function runOnce(payload: { id: number; method: string }): Promise<any> {
  return new Promise((resolvePromise, reject) => {
    const targetId = payload.id;
    const p = spawn('node', [distServer]);
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => (stdout += d.toString()));
    p.stderr.on('data', (d) => (stderr += d.toString()));
    p.on('error', reject);
    p.on('close', (code) => {
      if (code !== 0 && !stdout) {
        return reject(new Error(`exit ${code}: ${stderr}`));
      }
      const lines = stdout.split(/\n+/).map(l => l.trim()).filter(Boolean);
      const objs: any[] = [];
      for (const line of lines) {
        try { objs.push(JSON.parse(line)); } catch { /* ignore */ }
      }
      const target = objs.find(o => o && o.id === targetId);
      if (!target) {
        return reject(new Error(`Response for id=${targetId} not found. Raw: ${stdout}`));
      }
      resolvePromise(target);
    });
    // initialize first
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }) + '\n');
    // second request (target)
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: targetId, method: payload.method }) + '\n');
    // shutdown / exit
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'shutdown' }) + '\n');
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 100, method: 'exit' }) + '\n');
    p.stdin.end();
  });
}

describe('mcp-server basic', () => {
  it('responds to ping after initialize', async () => {
    const res = await runOnce({ id: 2, method: 'ping' });
    expect(res.result).toBeDefined();
    expect(res.result.pong).toBe(true);
  });

  it('returns method not found for unknown method', async () => {
    const res = await runOnce({ id: 3, method: 'no_such_method' });
    expect(res.error).toBeDefined();
    expect(res.error.code).toBe(-32601);
  });

  it('lists tools', async () => {
    // custom runner to send listTools after initialize
    const p = spawn('node', [distServer]);
    const outputs: any[] = [];
    p.stdout.on('data', d => {
      const lines = d.toString().split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
      for (const line of lines) { try { outputs.push(JSON.parse(line)); } catch { /* ignore */ } }
    });
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }) + '\n');
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'listTools' }) + '\n');
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'shutdown' }) + '\n');
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 100, method: 'exit' }) + '\n');
    p.stdin.end();
    await new Promise(resolve => p.on('close', resolve));
    const listRes = outputs.find(o => o.id === 2);
    expect(listRes).toBeDefined();
    expect(Array.isArray(listRes.result.tools)).toBe(true);
    const names = listRes.result.tools.map((t: any) => t.name);
    expect(names).toContain('echo');
  });

  it('calls echo tool', async () => {
    const p = spawn('node', [distServer]);
    const outputs: any[] = [];
    p.stdout.on('data', d => {
      const lines = d.toString().split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
      for (const line of lines) { try { outputs.push(JSON.parse(line)); } catch { /* ignore */ } }
    });
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }) + '\n');
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'callTool', params: { name: 'echo', arguments: { text: 'hello' } } }) + '\n');
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'shutdown' }) + '\n');
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 100, method: 'exit' }) + '\n');
    p.stdin.end();
    await new Promise(resolve => p.on('close', resolve));
    const callRes = outputs.find(o => o.id === 2);
    expect(callRes).toBeDefined();
    expect(callRes.result.name).toBe('echo');
    expect(callRes.result.output.text).toBe('hello');
  });

  it('returns error for unknown tool', async () => {
    const p = spawn('node', [distServer]);
    const outputs: any[] = [];
    p.stdout.on('data', d => {
      const lines = d.toString().split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
      for (const line of lines) { try { outputs.push(JSON.parse(line)); } catch { /* ignore */ } }
    });
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }) + '\n');
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'callTool', params: { name: 'nope' } }) + '\n');
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'shutdown' }) + '\n');
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 100, method: 'exit' }) + '\n');
    p.stdin.end();
    await new Promise(resolve => p.on('close', resolve));
    const errRes = outputs.find(o => o.id === 2);
    expect(errRes).toBeDefined();
    expect(errRes.error).toBeDefined();
    expect(errRes.error.code).toBe(-32011); // UNKNOWN_TOOL
  });

  it('rejects callTool before initialize', async () => {
    const p = spawn('node', [distServer]);
    const outputs: any[] = [];
    p.stdout.on('data', d => {
      const lines = d.toString().split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
      for (const line of lines) { try { outputs.push(JSON.parse(line)); } catch { /* ignore */ } }
    });
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'callTool', params: { name: 'echo', arguments: { text: 'x' } } }) + '\n');
    // exit quickly
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'exit' }) + '\n');
    p.stdin.end();
    await new Promise(resolve => p.on('close', resolve));
    const res = outputs.find(o => o.id === 5);
    expect(res).toBeDefined();
    expect(res.error).toBeDefined();
    expect(res.error.code).toBe(-32010); // NOT_INITIALIZED
  });
});
