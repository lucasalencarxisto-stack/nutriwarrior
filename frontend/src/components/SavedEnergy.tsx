import { useEffect, useRef, useState } from "react"
import { dateLabel, getCareHistory, saveCare, today, type CareRecord } from "../services/care"
import { energyMethods, type EnergyInput } from "../utils/energy"

export function SavedEnergy({clienteId, energy}: {clienteId:number; energy?:EnergyInput}) {
  const [history,setHistory]=useState<CareRecord[]>([])
  const [consultation,setConsultation]=useState("")
  const [error,setError]=useState("")
  const [busy,setBusy]=useState(false)
  const [savedSignature,setSavedSignature]=useState("")
  const signature=JSON.stringify({energy,consultation})
  const saved=savedSignature===signature
  const [loading,setLoading]=useState(true)
  const [revision,setRevision]=useState(0)
  const requestId=useRef<string | null>(null)
  const saving=useRef(false)
  useEffect(()=>{requestId.current=null},[signature])
  useEffect(()=>{let alive=true;setLoading(true);getCareHistory(clienteId).then(rows=>{if(alive)setHistory(rows)}).catch(e=>{if(alive)setError(e.message)}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[clienteId,revision])
  async function save(){
    if(!energy||saving.current||saved)return
    saving.current=true;setBusy(true);setError("");requestId.current??=crypto.randomUUID()
    try{const row=await saveCare(clienteId,{requestId:requestId.current,kind:"ENERGY",date:today(),title:energyMethods[energy.method].name,notes:"",anamnesis:"",energy,...(consultation?{consultationId:Number(consultation)}:{})});setHistory(rows=>[row,...rows.filter(item=>item.id!==row.id)]);setSavedSignature(signature)}
    catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar.")}
    finally{saving.current=false;setBusy(false)}
  }
  return <div className="mt-6 border-t border-neutral-100 pt-5">
    {energy&&<div className="rounded-2xl bg-neutral-50 p-4">
      <label className="block text-sm">Vincular a uma consulta (opcional)<select className="mt-2 w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm" value={consultation} disabled={busy||saved} onChange={e=>setConsultation(e.target.value)}><option value="">Avaliação avulsa</option>{history.filter(row=>row.kind==="CONSULTATION").map(row=><option key={row.id} value={row.id}>{dateLabel(row.date)} · {row.title}</option>)}</select></label>
      <button type="button" disabled={busy||saved} onClick={save} className="mt-3 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?"Salvando…":saved?"Avaliação salva":"Salvar avaliação no histórico"}</button>
      {saved&&<p role="status" className="mt-2 text-xs text-teal-700">Dados e resultado conferido pelo servidor foram registrados. A meta alimentar não foi alterada.</p>}
    </div>}
    {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error} <button type="button" className="underline" onClick={()=>{setError("");setRevision(x=>x+1)}}>Recarregar</button></p>}
    <h4 className="mt-5 text-sm font-semibold">Avaliações energéticas salvas</h4>
    <button type="button" disabled={busy||loading} className="mt-2 text-xs font-semibold text-teal-700 disabled:opacity-50" onClick={()=>{setError("");setRevision(x=>x+1)}}>Atualizar consultas e avaliações</button>
    {loading&&<p role="status" className="mt-2 text-sm text-neutral-500">Carregando histórico…</p>}
    {loading||error?null:history.filter(row=>row.kind==="ENERGY").length===0?<p className="mt-2 text-sm text-neutral-500">Nenhuma avaliação salva.</p>:history.filter(row=>row.kind==="ENERGY").map(row=><details key={row.id} className="mt-3 rounded-xl border border-neutral-200 p-4 text-sm"><summary className="cursor-pointer font-medium">{dateLabel(row.date)} · {row.title} · {Math.round(row.payload.restingKcal??0).toLocaleString("pt-BR")} kcal/dia</summary><p className="mt-2">{row.payload.input?.weightKg} kg · {row.payload.input?.heightCm} cm · {row.payload.input?.age} anos · {row.payload.input?.sex==="male"?"Masculino":"Feminino"}</p>{row.payload.totalKcal!=null&&<p>Gasto total: {Math.round(row.payload.totalKcal).toLocaleString("pt-BR")} kcal/dia · fator {row.payload.input?.activityFactor}</p>}<p className="mt-2 text-xs text-neutral-500">Registrado por {row.author} em {new Date(row.createdAt).toLocaleString("pt-BR")}</p></details>)}
  </div>
}
