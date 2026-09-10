# Torneo delle Contrade · Borgo Carso

Sito statico pubblicabile gratuitamente con **GitHub Pages**. I risultati sono condivisi e aggiornati in tempo reale tramite **Supabase**; solo gli utenti autorizzati possono modificarli.

## Prima pubblicazione (circa 15 minuti)

1. Crea un account su [Supabase](https://supabase.com), poi **New project** (piano Free).
2. Nel progetto: **SQL Editor** → **New query** → incolla ed esegui tutto [supabase/schema.sql](supabase/schema.sql).
3. In **Authentication → Users**, crea l’utente e-mail/password dell’amministratore. Quindi esegui, nell’SQL Editor, l’ultima query commentata in `schema.sql`, sostituendo l’e-mail con quella appena creata. Questo passaggio abilita effettivamente le modifiche per quell’utente.
4. In **Project Settings → API**, copia `Project URL` e la **publishable key**. Incollale in [config.js](config.js). Questa chiave è progettata per essere pubblica: la protezione dei dati è data dalle regole RLS nel database, non dalla chiave.
5. Crea su GitHub un nuovo repository vuoto (per esempio `torneo-contrade`) e carica tutti i file di questa cartella, compreso `.github/workflows/deploy-pages.yml`.
6. Sul repository GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Fai un push sul ramo `main` oppure avvia il workflow dalla scheda **Actions**.
7. Quando l’azione termina, GitHub mostra il link pubblico, tipicamente `https://TUO-UTENTE.github.io/torneo-contrade/`.

## Uso quotidiano

Prima del sorteggio il calendario è volutamente vuoto. Dopo l’estrazione, apri **Area amministratore**, accedi con e-mail/password e aggiungi le partite nell’ordine estratto: il sito le pubblica subito, tutte datate **13 settembre 2026**. Poi registra i risultati; la classifica di ogni visitatore si aggiorna automaticamente.

Al termine della finale, salva il risultato e nella sezione **Proclama la contrada vincitrice** seleziona una delle due finaliste: sul sito apparirà il banner del campione con la coppa. Se il database era già stato creato prima di questa funzione, esegui una volta [supabase/migration-tournament-winner.sql](supabase/migration-tournament-winner.sql) nel SQL Editor di Supabase.

## Personalizzazione

Le quattro contrade e i colori iniziali sono definiti in `app.js`. Per modificare il calendario, aggiorna le righe nella tabella `matches` dal **Table Editor** di Supabase.

## Note di sicurezza

Non inserire mai in `config.js` una `service_role` key. La publishable/anon key è l’unica chiave che può stare nel sito pubblico. Le policy in `schema.sql` consentono a tutti di leggere i risultati e soltanto agli utenti presenti in `admin_users` di aggiornarli.
