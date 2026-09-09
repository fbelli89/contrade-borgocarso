const defaultData = {
  teams: [
    { id: 'nord', name: 'Nord', color: '#277a93' },
    { id: 'sud', name: 'Sud', color: '#a6373e' },
    { id: 'centro-storico', name: 'Centro Storico', color: '#557a48' },
    { id: 'palazzoni', name: 'Palazzoni', color: '#d19434' }
  ],
  matches: []
};
const isConfigured = window.SUPABASE_URL && window.SUPABASE_PUBLISHABLE_KEY && !window.SUPABASE_URL.includes('INSERISCI');
const supabase = isConfigured ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY) : null;
let data = structuredClone(defaultData);
let loggedIn = false;
const byId = id => document.getElementById(id);
const team = id => data.teams.find(t => t.id === id);
function standings(){
  const rows = Object.fromEntries(data.teams.map(t => [t.id, {...t, g:0,w:0,d:0,l:0,gf:0,ga:0,p:0}]));
  data.matches.filter(m => m.homeScore !== null).forEach(m => { const h=rows[m.home],a=rows[m.away]; h.g++;a.g++;h.gf+=m.homeScore;h.ga+=m.awayScore;a.gf+=m.awayScore;a.ga+=m.homeScore; if(m.homeScore>m.awayScore){h.w++;h.p+=3;a.l++}else if(m.homeScore<m.awayScore){a.w++;a.p+=3;h.l++}else{h.d++;a.d++;h.p++;a.p++} });
  return Object.values(rows).sort((a,b)=>b.p-a.p || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf || a.name.localeCompare(b.name));
}
function render(){
  const table = standings();
  byId('standingsBody').innerHTML = table.map((t,i)=>`<tr><td class="rank">${i+1}</td><td class="team"><span class="team-swatch" style="--team:${t.color}"></span>${t.name}</td><td>${t.g}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gf-t.ga > 0 ? '+' : ''}${t.gf-t.ga}</td><td class="points">${t.p}</td></tr>`).join('');
  byId('matchesList').innerHTML = data.matches.length ? data.matches.map(m => { const h=team(m.home), a=team(m.away), done=m.homeScore!==null; return `<article class="match"><div class="match-meta"><b>${m.day}</b><span>${m.date}</span></div><div class="match-teams"><span>${h.name}</span><span style="color:${h.color}">●</span><span style="color:${a.color}">●</span><span>${a.name}</span></div><div class="match-score">${done ? `${m.homeScore} – ${m.awayScore}` : '<span class="pending">da giocare</span>'}</div></article>` }).join('') : '<article class="match"><div class="match-meta"><b>Calendario</b><span>13 settembre 2026</span></div><div class="match-teams">Il calendario sarà pubblicato dopo il sorteggio.</div><div class="match-score"><span class="pending">in attesa</span></div></article>';
  const complete = data.matches.filter(m=>m.homeScore!==null); byId('matchCount').textContent=complete.length; byId('goalCount').textContent=complete.reduce((s,m)=>s+m.homeScore+m.awayScore,0); byId('leaderName').textContent=complete.length ? table[0].name : '—';
  byId('matchSelect').innerHTML = data.matches.map(m=>`<option value="${m.id}">${m.day} · ${team(m.home).name} – ${team(m.away).name}</option>`).join('') || '<option value="">Nessuna partita in calendario</option>';
  const teamOptions = data.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join(''); byId('homeTeam').innerHTML=teamOptions; byId('awayTeam').innerHTML=teamOptions;
}
function toast(message){const el=byId('toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)}
async function loadRemoteData(){
  if (!supabase) { render(); toast('Modalità anteprima: collega Supabase per pubblicare i dati.'); return; }
  const { data: remoteMatches, error } = await supabase.from('matches').select('*').order('id');
  if (error) { console.error(error); render(); toast('Impossibile caricare il torneo. Verifica la configurazione.'); return; }
  data.matches = remoteMatches.map(m => ({ id:m.id, day:m.day, date:m.date, home:m.home, away:m.away, homeScore:m.home_score, awayScore:m.away_score }));
  render();
}
byId('adminTrigger').onclick=()=> { if (!isConfigured) return toast('Configura Supabase prima di accedere.'); loggedIn ? byId('adminDialog').showModal() : byId('loginDialog').showModal(); };
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>byId(b.dataset.close).close());
byId('loginForm').onsubmit=async e=>{e.preventDefault();const { error }=await supabase.auth.signInWithPassword({email:byId('email').value,password:byId('password').value});if(error){byId('loginError').textContent='Credenziali non corrette o utente non autorizzato.';return}loggedIn=true;byId('loginDialog').close();e.target.reset();byId('adminDialog').showModal()};
byId('resultForm').onsubmit=async e=>{e.preventDefault();const m=data.matches.find(x=>x.id===Number(byId('matchSelect').value));const update={home_score:Number(byId('homeScore').value),away_score:Number(byId('awayScore').value)};const {error}=await supabase.from('matches').update(update).eq('id',m.id);if(error){toast('Non autorizzato a modificare i risultati.');return}m.homeScore=update.home_score;m.awayScore=update.away_score;render();toast('Risultato salvato: classifica aggiornata.');byId('adminDialog').close();e.target.reset()};
byId('calendarForm').onsubmit=async e=>{e.preventDefault();const home=byId('homeTeam').value,away=byId('awayTeam').value;if(home===away)return toast('Scegli due contrade diverse.');if(data.matches.some(m=>(m.home===home&&m.away===away)||(m.home===away&&m.away===home)))return toast('Questa partita è già in calendario.');const match={day:`Partita ${data.matches.length+1}`,date:'Domenica 13 settembre 2026',home,away,home_score:null,away_score:null};const {data: inserted,error}=await supabase.from('matches').insert(match).select().single();if(error)return toast('Impossibile aggiungere la partita.');data.matches.push({id:inserted.id,day:inserted.day,date:inserted.date,home:inserted.home,away:inserted.away,homeScore:null,awayScore:null});render();toast('Partita aggiunta al calendario.');};
byId('logout').onclick=async()=>{await supabase.auth.signOut();loggedIn=false;byId('adminDialog').close();toast('Accesso amministratore terminato.')};
async function init(){
  if (supabase) { const {data:{session}}=await supabase.auth.getSession(); loggedIn=Boolean(session); supabase.channel('partite-aggiornate').on('postgres_changes',{event:'*',schema:'public',table:'matches'},loadRemoteData).subscribe(); }
  loadRemoteData();
}
init();
