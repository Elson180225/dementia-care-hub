import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedOrigin } from '../server/origin.js';

test('origin allowlist accepts configured local servers and rejects unrelated origins', () => {
 const env={PUBLIC_ORIGIN:'http://localhost:5173',ADDITIONAL_PUBLIC_ORIGINS:'http://localhost:5174, http://127.0.0.1:5174'};
 for(const origin of ['http://localhost:5173','http://localhost:5174','http://127.0.0.1:5174']) assert.equal(isAllowedOrigin(origin,env),true);
 for(const origin of ['http://localhost:5175','https://evil.example','http://localhost:5174.evil.example','null']) assert.equal(isAllowedOrigin(origin,env),false);
 assert.equal(isAllowedOrigin(undefined,env),true);
});
