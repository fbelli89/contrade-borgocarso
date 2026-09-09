const defaultData = {
  teams: [
    { id: 'nord', name: 'Nord', color: '#277a93', logo: 'assets/loghi/nord.svg' },
    { id: 'sud', name: 'Sud', color: '#a6373e', logo: 'assets/loghi/sud.svg' },
    { id: 'centro-storico', name: 'Centro Storico', color: '#557a48', logo: 'assets/loghi/centro-storico.svg' },
    { id: 'palazzoni', name: 'Palazzoni', color: '#d19434', logo: 'assets/loghi/palazzoni.svg' }
  ],
  matches: [],
  goals: []
};
const isConfigured = window.SUPABASE_URL && window.SUPABASE_PUBLISHABLE_KEY && !window.SUPABASE_URL.includes('INSERISCI');
const supabaseClient = isConfigured && window.supabase ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY) : null;
// JSON clone mantiene la compatibilità anche con browser meno recenti.
let data = JSON.parse(JSON.stringify(defaultData));
let loggedIn = false;
const byId = id => document.getElementById(id);
const team = id => data.teams.find(t => t.id === id);
function standings(){
  const rows = Object.fromEntries(data.teams.map(t => [t.id, {...t, g:0,w:0,d:0,l:0,gf:0,ga:0,p:0}]));
  data.matches.filter(m => m.homeScore !== null).forEach(m => { const h=rows[m.home],a=rows[m.away]; h.g++;a.g++;h.gf+=m.homeScore;h.ga+=m.awayScore;a.gf+=m.awayScore;a.ga+=m.homeScore; if(m.homeScore>m.awayScore){h.w++;h.p+=3;a.l++}else if(m.homeScore<m.awayScore){a.w++;a.p+=3;h.l++}else{h.d++;a.d++;h.p++;a.p++} });
  return Object.values(rows).sort((a,b)=>b.p-a.p || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf || a.name.localeCompare(b.name));
}
function render(selectedMatchId = byId('matchSelect').value){
  const table = standings();
  byId('standingsBody').innerHTML = table.map((t,i)=>`<tr><td class="rank">${i+1}</td><td class="team"><img class="team-logo team-logo-${t.id}" src="${t.logo}" alt="" style="width:54px;height:54px;object-fit:contain;vertical-align:middle;margin-right:12px">${t.name}</td><td>${t.g}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gf-t.ga > 0 ? '+' : ''}${t.gf-t.ga}</td><td class="points">${t.p}</td></tr>`).join('');
  byId('matchesList').innerHTML = data.matches.length ? data.matches.map(m => { const h=team(m.home), a=team(m.away), done=m.homeScore!==null; return `<article class="match"><div class="match-meta"><b>${m.day}</b><span>${m.date}</span></div><div class="match-teams"><span>${h.name}</span><img src="${h.logo}" alt="" style="width:30px;height:30px;object-fit:contain"><span>vs</span><img src="${a.logo}" alt="" style="width:30px;height:30px;object-fit:contain"><span>${a.name}</span></div><div class="match-score">${done ? `${m.homeScore} – ${m.awayScore}` : '<span class="pending">da giocare</span>'}</div></article>` }).join('') : '<article class="match"><div class="match-meta"><b>Calendario</b><span>13 settembre 2026</span></div><div class="match-teams">Il calendario sarà pubblicato dopo il sorteggio.</div><div class="match-score"><span class="pending">in attesa</span></div></article>';
  const complete = data.matches.filter(m=>m.homeScore!==null); byId('matchCount').textContent=complete.length; byId('goalCount').textContent=complete.reduce((s,m)=>s+m.homeScore+m.awayScore,0); byId('leaderName').textContent=complete.length ? table[0].name : '—';
  const scorers=Object.values(data.goals.reduce((all,goal)=>{const id=`${goal.player}-${goal.team}`;all[id]??={...goal,total:0};all[id].total++;return all},{})).sort((a,b)=>b.total-a.total||a.player.localeCompare(b.player));
  byId('scorersList').innerHTML=scorers.length?scorers.map((scorer,index)=>`<article class="scorer"><span class="scorer-rank">${index+1}</span><img src="${team(scorer.team).logo}" alt="" /><strong>${scorer.player}</strong><span>${team(scorer.team).name}</span><b>${scorer.total}<small> gol</small></b></article>`).join(''):'<p class="empty-state">La classifica marcatori sarà aggiornata al termine delle partite.</p>';
  byId('matchSelect').innerHTML = data.matches.map(m=>`<option value="${m.id}">${m.day} · ${team(m.home).name} – ${team(m.away).name}</option>`).join('') || '<option value="">Nessuna partita in calendario</option>';
  if (data.matches.some(match => String(match.id) === String(selectedMatchId))) byId('matchSelect').value = selectedMatchId;
  byId('scorerMatch').innerHTML=data.matches.map(m=>`<option value="${m.id}">${m.day} · ${team(m.home).name} – ${team(m.away).name}</option>`).join('') || '<option value="">Nessuna partita in calendario</option>';
  const teamOptions = data.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join(''); byId('homeTeam').innerHTML=teamOptions; byId('awayTeam').innerHTML=teamOptions;
  syncScoreFields();
  syncScorerTeams();
}
function selectedMatch(){return data.matches.find(match=>match.id===Number(byId('matchSelect').value))}
function syncScoreFields(){const match=selectedMatch();byId('homeScore').value=match?.homeScore ?? '';byId('awayScore').value=match?.awayScore ?? ''}
function syncScorerTeams(){const match=data.matches.find(item=>item.id===Number(byId('scorerMatch').value));byId('scorerTeam').innerHTML=match?`<option value="${match.home}">${team(match.home).name}</option><option value="${match.away}">${team(match.away).name}</option>`:'<option value="">Nessuna contrada</option>'}
function toast(message){const el=byId('toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)}
function openDialog(id){const dialog=byId(id);if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','')}
function closeDialog(id){const dialog=byId(id);if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open')}
async function loadRemoteData(){
  if (!supabaseClient) { render(); toast('Modalità anteprima: collega Supabase per pubblicare i dati.'); return; }
  const [{ data: remoteMatches, error: matchesError },{ data: remoteGoals, error: goalsError }]=await Promise.all([supabaseClient.from('matches').select('*').order('id'),supabaseClient.from('goals').select('*').order('id')]);
  if (matchesError) { console.error(matchesError); render(); toast('Impossibile caricare il torneo. Verifica la configurazione.'); return; }
  data.matches = remoteMatches.map(m => ({ id:m.id, day:m.day, date:m.date, home:m.home, away:m.away, homeScore:m.home_score, awayScore:m.away_score }));
  data.goals=goalsError?[]:remoteGoals;
  render();
}
byId('adminTrigger').onclick=()=> { if (!isConfigured) return toast('Configura Supabase prima di accedere.'); if (!supabaseClient) return toast('La connessione a Supabase è stata bloccata dal browser.'); loggedIn ? openDialog('adminDialog') : openDialog('loginDialog'); };
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeDialog(b.dataset.close));
byId('loginForm').onsubmit=async e=>{e.preventDefault();const { error }=await supabaseClient.auth.signInWithPassword({email:byId('email').value,password:byId('password').value});if(error){byId('loginError').textContent='Credenziali non corrette o utente non autorizzato.';return}loggedIn=true;closeDialog('loginDialog');e.target.reset();openDialog('adminDialog')};
byId('resultForm').onsubmit=async e=>{e.preventDefault();const m=data.matches.find(x=>x.id===Number(byId('matchSelect').value));const update={home_score:Number(byId('homeScore').value),away_score:Number(byId('awayScore').value)};const {error}=await supabaseClient.from('matches').update(update).eq('id',m.id);if(error){toast('Non autorizzato a modificare i risultati.');return}m.homeScore=update.home_score;m.awayScore=update.away_score;render();toast('Risultato salvato: classifica aggiornata.');closeDialog('adminDialog');e.target.reset()};
byId('matchSelect').onchange=syncScoreFields;
byId('scorerMatch').onchange=syncScorerTeams;
byId('scorerForm').onsubmit=async e=>{e.preventDefault();const matchId=Number(byId('scorerMatch').value),teamId=byId('scorerTeam').value,player=byId('scorerName').value.trim();if(!matchId||!teamId||!player)return;const {data:goal,error}=await supabaseClient.from('goals').insert({match_id:matchId,team:teamId,player}).select().single();if(error)return toast('Impossibile aggiungere il marcatore.');data.goals.push(goal);render(matchId);e.target.reset();toast('Marcatore aggiunto alla classifica.');};
byId('deleteMatch').onclick=async()=>{const match=selectedMatch();if(!match)return toast('Seleziona una partita da eliminare.');if(!confirm(`Eliminare definitivamente ${team(match.home).name} – ${team(match.away).name}?`))return;const {error}=await supabaseClient.from('matches').delete().eq('id',match.id);if(error)return toast('Non autorizzato a eliminare la partita.');data.matches=data.matches.filter(item=>item.id!==match.id);render();toast('Partita eliminata dal calendario.');};
byId('calendarForm').onsubmit=async e=>{e.preventDefault();const home=byId('homeTeam').value,away=byId('awayTeam').value;if(home===away)return toast('Scegli due contrade diverse.');if(data.matches.some(m=>(m.home===home&&m.away===away)||(m.home===away&&m.away===home)))return toast('Questa partita è già in calendario.');const match={day:`Partita ${data.matches.length+1}`,date:'Domenica 13 settembre 2026',home,away,home_score:null,away_score:null};const {data: inserted,error}=await supabaseClient.from('matches').insert(match).select().single();if(error)return toast('Impossibile aggiungere la partita.');data.matches.push({id:inserted.id,day:inserted.day,date:inserted.date,home:inserted.home,away:inserted.away,homeScore:null,awayScore:null});render(inserted.id);toast('Partita aggiunta al calendario.');};
byId('logout').onclick=async()=>{await supabaseClient.auth.signOut();loggedIn=false;closeDialog('adminDialog');toast('Accesso amministratore terminato.')};
async function init(){
  if (supabaseClient) { const {data:{session}}=await supabaseClient.auth.getSession(); loggedIn=Boolean(session); supabaseClient.channel('partite-aggiornate').on('postgres_changes',{event:'*',schema:'public',table:'matches'},loadRemoteData).on('postgres_changes',{event:'*',schema:'public',table:'goals'},loadRemoteData).subscribe(); }
  loadRemoteData();
}
init();
