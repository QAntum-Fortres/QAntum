import { SoulTranspiler } from './soul_compiler/Transpiler';
import * as path from 'path';

// Resolve paths relative to this script
const soulFile = path.resolve(__dirname, 'soul/ArbitrageSpirit.soul');
const outputModule = path.resolve(__dirname, 'modules/ArbitrageSpirit');

console.log('🌌 [INIT] Awakening QANTUM PRIME...');

// 1. Компилиране на Душата
const rustSource = SoulTranspiler.transpile(soulFile);
SoulTranspiler.compileToBinary(rustSource, outputModule);

console.log('✨ [SYSTEM] Soul breathing initiated. Waiting for binary manifestation...');
