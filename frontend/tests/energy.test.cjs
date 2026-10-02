const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const filename = path.resolve(__dirname, '../src/utils/energy.ts')
const mod = new Module(filename)
mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename)
const { estimateEnergy, parseEnergyNumber } = mod.exports
const base = { method: 'harris1984', sex: 'male', weightKg: 80, heightCm: 180, age: 40 }

for (const [method, sex, expected] of [
  ['harris1984', 'male', 1796.862], ['harris1984', 'female', 1571.793],
  ['mifflin1990', 'male', 1730], ['mifflin1990', 'female', 1564],
]) test(`${method} / ${sex}: 80 kg, 180 cm, 40 anos`, () => {
  const result = estimateEnergy({ ...base, method, sex })
  assert.ok(Math.abs(result.restingKcal - expected) < 0.000001)
  assert.equal(result.totalKcal, null)
})
test('GET usa fator explícito e precisão completa, sem alterar entrada', () => {
  const input = { ...base, activityFactor: 1.5 }
  const copy = { ...input }
  assert.ok(Math.abs(estimateEnergy(input).totalKcal - 2695.293) < 0.000001)
  assert.deepEqual(input, copy)
})
test('aceita vírgula e ponto, rejeita vazio e formatos ambíguos', () => {
  assert.equal(parseEnergyNumber(' 79,5 '), 79.5)
  assert.equal(parseEnergyNumber('1.5'), 1.5)
  for (const text of ['', ' ', '1,2,3', '1.000,5', 'Infinity', 'NaN', '12kg', '-2']) assert.ok(Number.isNaN(parseEnergyNumber(text)), text)
})
test('rejeita parâmetro ausente, inválido e idade fora do escopo adulto', () => {
  for (const patch of [
    { sex: '' }, { method: 'unknown' }, { weightKg: 0 }, { weightKg: NaN },
    { heightCm: -1 }, { heightCm: Infinity }, { age: 17 }, { age: 121 }, { age: 40.5 },
    { activityFactor: 0 }, { activityFactor: NaN }, { activityFactor: Infinity },
  ]) assert.throws(() => estimateEnergy({ ...base, ...patch }))
})
test('rejeita resultado negativo ou overflow', () => {
  assert.throws(() => estimateEnergy({ ...base, weightKg: 1, heightCm: 1, age: 120 }))
  assert.throws(() => estimateEnergy({ ...base, weightKg: Number.MAX_VALUE }))
})
