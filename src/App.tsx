import React, { useState, useEffect } from 'react';

interface Child { id: string; name: string; points: number; }
interface Item { id: string; title: string; value: number; icon: string; is_bonus?: boolean; }

// === CONFIGURATION SUPABASE ===
const SUPABASE_URL = 'https://nzoysgkqelpayfxwbmbd.supabase.co/rest/v1';
const SUPABASE_KEY = 'sb_publishable_cS53pYq9msZ6FxVcUIuGdA_B5AEud7n'; // <-- REMETTEZ VOTRE CLÉ ICI !

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const PRESET_ICONS = [
  '🧹', '🧼', '🍽️', '🧺', '🪥', '🚿', 
  '📚', '⏰', '💊', '🎒', '📞', '🥖', 
  '📺', '🎮', '⚽', '🪙', '🍕', '🎁'
];

export default function App() {
  const [children, setChildren] = useState<Child[]>([]);
  const [tasks, setTasks] = useState<Item[]>([]);
  const [rewards, setRewards] = useState<Item[]>([]);
  
  // Modes : 'READONLY' (enfants), 'POINTS' (ajout/retrait points), 'CONFIG' (gestion tâches)
  const [appMode, setAppMode] = useState<'READONLY' | 'POINTS' | 'CONFIG'>('READONLY');

  const [selectedTaskIcon, setSelectedTaskIcon] = useState('🧹');
  const [selectedRewardIcon, setSelectedRewardIcon] = useState('🎁');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resChildren, resTasks, resRewards] = await Promise.all([
          fetch(`${SUPABASE_URL}/children`, { headers }),
          fetch(`${SUPABASE_URL}/tasks`, { headers }),
          fetch(`${SUPABASE_URL}/rewards`, { headers })
        ]);
        if (resChildren.ok) setChildren(await resChildren.json());
        if (resTasks.ok) setTasks(await resTasks.json());
        if (resRewards.ok) setRewards(await resRewards.json());
      } catch (error) {
        console.error("Erreur de connexion", error);
      }
    };
    fetchData();
  }, []);

  const updatePoints = async (childId: string, newPoints: number) => {
    setChildren(children.map(c => c.id === childId ? { ...c, points: newPoints } : c));
    await fetch(`${SUPABASE_URL}/children?id=eq.${childId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ points: newPoints })
    });
  };

  const addPoints = (childId: string, points: number) => {
    if (appMode !== 'POINTS') return;
    const child = children.find(c => c.id === childId);
    if (child) updatePoints(childId, child.points + points);
  };

  const removePoints = (childId: string) => {
    if (appMode !== 'POINTS') return;
    const child = children.find(c => c.id === childId);
    if (child) {
      const penalty = prompt(`Combien de points retirer à ${child.name} pour cette erreur ? (ex: 5)`);
      if (penalty && !isNaN(parseInt(penalty))) {
        updatePoints(childId, child.points - parseInt(penalty));
      }
    }
  };

  const redeemReward = (childId: string, cost: number) => {
    if (appMode !== 'POINTS') return;
    const child = children.find(c => c.id === childId);
    if (child && child.points >= cost) {
      if (window.confirm(`Dépenser ${cost} points pour ${child.name} ?`)) {
        updatePoints(childId, child.points - cost);
      }
    } else {
      alert("Pas assez de points ! ❌");
    }
  };

  // VÉRIFICATION DE SÉCURITÉ MOT DE PASSE PARENT
  const requestParentAccess = (targetMode: 'POINTS' | 'CONFIG') => {
    if (appMode === targetMode) {
      setAppMode('READONLY'); // Verrouiller si on re-clique dessus
    } else {
      const password = prompt("Mot de passe Parent :");
      if (password === "0133") {
        setAppMode(targetMode);
      } else if (password !== null) {
        alert("Mot de passe incorrect ❌");
      }
    }
  };

  const addChild = async () => {
    const name = prompt("Nom de l'enfant :");
    if (!name) return;
    const newItem = { id: Date.now().toString(), name, points: 0 };
    setChildren([...children, newItem]);
    await fetch(`${SUPABASE_URL}/children`, { method: 'POST', headers, body: JSON.stringify(newItem) });
  };

  const addTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const isBonus = formData.get('is_bonus') === 'on';
    const newItem = {
      id: Date.now().toString(),
      icon: selectedTaskIcon,
      title: formData.get('title') as string,
      value: parseInt(formData.get('value') as string),
      is_bonus: isBonus
    };
    setTasks([...tasks, newItem]);
    await fetch(`${SUPABASE_URL}/tasks`, { method: 'POST', headers, body: JSON.stringify(newItem) });
    e.currentTarget.reset();
  };

  const addReward = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItem = {
      id: Date.now().toString(),
      icon: selectedRewardIcon,
      title: formData.get('title') as string,
      value: parseInt(formData.get('value') as string)
    };
    setRewards([...rewards, newItem]);
    await fetch(`${SUPABASE_URL}/rewards`, { method: 'POST', headers, body: JSON.stringify(newItem) });
    e.currentTarget.reset();
  };

  const deleteChild = async (id: string) => {
    setChildren(children.filter(c => c.id !== id));
    await fetch(`${SUPABASE_URL}/children?id=eq.${id}`, { method: 'DELETE', headers });
  };
  const deleteTask = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    await fetch(`${SUPABASE_URL}/tasks?id=eq.${id}`, { method: 'DELETE', headers });
  };
  const deleteReward = async (id: string) => {
    setRewards(rewards.filter(r => r.id !== id));
    await fetch(`${SUPABASE_URL}/rewards?id=eq.${id}`, { method: 'DELETE', headers });
  };

  return (
    <div style={{ padding: '10px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui' }}>
      
      {/* BARRE DE BOUTONS PARENT */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <button 
          onClick={() => requestParentAccess('POINTS')}
          style={{ 
            flex: 1, padding: '10px 5px', fontSize: '13px', fontWeight: 'bold',
            background: appMode === 'POINTS' ? '#2e8b57' : '#e6ffe6', 
            color: appMode === 'POINTS' ? '#fff' : '#2e8b57', 
            border: '1px solid #2e8b57', borderRadius: '8px', cursor: 'pointer' 
          }}
        >
          {appMode === 'POINTS' ? '🔓 Mode Points (Actif)' : '🔒 Mode Parent (Ajout Points)'}
        </button>

        <button 
          onClick={() => requestParentAccess('CONFIG')}
          style={{ 
            flex: 1, padding: '10px 5px', fontSize: '13px', fontWeight: 'bold',
            background: appMode === 'CONFIG' ? '#333' : '#eee', 
            color: appMode === 'CONFIG' ? '#fff' : '#333', 
            border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' 
          }}
        >
          {appMode === 'CONFIG' ? '🔓 Mode Config (Actif)' : '🔒 Mode Parent (Configuration)'}
        </button>
      </div>

      {/* BANDEAU INDICATEUR SI LECTURE SEULE */}
      {appMode === 'READONLY' && (
        <div style={{ textAlign: 'center', background: '#fff3cd', color: '#856404', padding: '6px', borderRadius: '6px', marginBottom: '15px', fontSize: '12px' }}>
          👀 <strong>Mode Enfants (Lecture seule)</strong> — Cliquez sur un bouton Parent ci-dessus pour modifier.
        </div>
      )}

      {/* MODE CONFIGURATION */}
      {appMode === 'CONFIG' ? (
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <h2>Configuration (Protégée par code)</h2>
          
          <div style={{ marginBottom: '30px' }}>
            <h3>👶 Enfants <button onClick={addChild} style={{ padding: '5px' }}>+ Ajouter</button></h3>
            {children.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #ddd' }}>
                <span>{c.name} ({c.points} pts)</span>
                <button onClick={() => deleteChild(c.id)}>❌</button>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3>✅ Tâches & Bonus</h3>
            <div style={{ marginBottom: '8px', fontSize: '13px' }}>
              <strong>1. Choisissez une icône :</strong> {selectedTaskIcon}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                {PRESET_ICONS.map(icon => (
                  <button
                    key={icon} type="button" onClick={() => setSelectedTaskIcon(icon)}
                    style={{
                      padding: '6px', fontSize: '16px', borderRadius: '4px', cursor: 'pointer',
                      border: selectedTaskIcon === icon ? '2px solid #0066cc' : '1px solid #ccc',
                      background: selectedTaskIcon === icon ? '#e6f2ff' : '#fff'
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={addTask} style={{ display: 'flex', gap: '5px', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input name="title" placeholder="Nom de la tâche" required style={{ flex: 1, minWidth: '150px', padding: '6px' }} />
              <input name="value" type="number" placeholder="Points" required style={{ width: '70px', padding: '6px' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', background: '#ffe4b5', padding: '5px 8px', borderRadius: '4px' }}>
                <input type="checkbox" name="is_bonus" /> ⭐ Bonus
              </label>
              <button type="submit" style={{ padding: '6px 12px', background: '#2e8b57', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Ajouter</button>
            </form>

            {tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #ddd', background: t.is_bonus ? '#fffacd' : 'transparent' }}>
                <span>{t.icon} {t.title} (+{t.value}) {t.is_bonus && '⭐'}</span>
                <button onClick={() => deleteTask(t.id)}>❌</button>
              </div>
            ))}
          </div>

          <div>
            <h3>🎁 Récompenses</h3>
            <div style={{ marginBottom: '8px', fontSize: '13px' }}>
              <strong>1. Choisissez une icône :</strong> {selectedRewardIcon}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                {PRESET_ICONS.map(icon => (
                  <button
                    key={icon} type="button" onClick={() => setSelectedRewardIcon(icon)}
                    style={{
                      padding: '6px', fontSize: '16px', borderRadius: '4px', cursor: 'pointer',
                      border: selectedRewardIcon === icon ? '2px solid #cd5c5c' : '1px solid #ccc',
                      background: selectedRewardIcon === icon ? '#ffe6e6' : '#fff'
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={addReward} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <input name="title" placeholder="Nom de la récompense" required style={{ flex: 1, padding: '6px' }} />
              <input name="value" type="number" placeholder="Coût" required style={{ width: '70px', padding: '6px' }} />
              <button type="submit" style={{ padding: '6px 12px', background: '#cd5c5c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Ajouter</button>
            </form>

            {rewards.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #ddd' }}>
                <span>{r.icon} {r.title} (-{r.value})</span>
                <button onClick={() => deleteReward(r.id)}>❌</button>
              </div>
            ))}
          </div>
        </div>
      ) : 
      
      /* ÉCRAN PRINCIPAL DES ENFANTS (Readonly ou Ajout de Points) */
      (
        <div>
          <h1 style={{ textAlign: 'center', margin: '0 0 15px 0' }}>🏆 Tableau des Enfants</h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {children.map(child => (
              <div key={child.id} style={{ background: '#f0f8ff', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                
                {/* En-tête Enfant */}
                <div style={{ textAlign: 'center', marginBottom: '10px', background: '#fff', padding: '8px', borderRadius: '8px' }}>
                  <h2 style={{ margin: '0 0 2px 0', color: '#0066cc', fontSize: '18px' }}>{child.name}</h2>
                  <h3 style={{ margin: 0, fontSize: '22px' }}>{child.points} 🌟</h3>
                  
                  {appMode === 'POINTS' && (
                    <button 
                      onClick={() => removePoints(child.id)}
                      style={{ marginTop: '6px', padding: '4px', background: '#ffcccc', color: '#cc0000', border: '1px solid #ff9999', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', width: '100%' }}
                    >
                      ➖ Retirer des points
                    </button>
                  )}
                </div>

                {/* Tâches quotidiennes */}
                <h4 style={{ color: '#2e8b57', margin: '10px 0 5px 0', fontSize: '13px' }}>✅ Quotidien</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {tasks.filter(t => !t.is_bonus).map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => addPoints(child.id, t.value)} 
                      disabled={appMode === 'READONLY'}
                      style={{ 
                        padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        background: appMode === 'READONLY' ? '#f5f5f5' : '#e6ffe6', 
                        border: appMode === 'READONLY' ? '1px solid #e0e0e0' : '1px solid #b3ffb3', 
                        borderRadius: '6px', fontSize: '12px', 
                        cursor: appMode === 'READONLY' ? 'default' : 'pointer', textAlign: 'left',
                        opacity: appMode === 'READONLY' ? 0.8 : 1
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '4px' }}>{t.icon} {t.title}</span> 
                      <strong style={{ color: appMode === 'READONLY' ? '#666' : '#006400' }}>+{t.value}</strong>
                    </button>
                  ))}
                </div>

                {/* Tâches Bonus */}
                <h4 style={{ color: '#d2691e', margin: '15px 0 5px 0', fontSize: '13px' }}>⭐ Missions Bonus</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {tasks.filter(t => t.is_bonus).map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => addPoints(child.id, t.value)} 
                      disabled={appMode === 'READONLY'}
                      style={{ 
                        padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        background: appMode === 'READONLY' ? '#faf0e6' : '#fffacd', 
                        border: appMode === 'READONLY' ? '1px solid #e0e0e0' : '1px solid #ffd700', 
                        borderRadius: '6px', fontSize: '12px', 
                        cursor: appMode === 'READONLY' ? 'default' : 'pointer', textAlign: 'left',
                        opacity: appMode === 'READONLY' ? 0.8 : 1
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '4px' }}>{t.icon} {t.title}</span> 
                      <strong style={{ color: appMode === 'READONLY' ? '#666' : '#b8860b' }}>+{t.value}</strong>
                    </button>
                  ))}
                </div>

                {/* Récompenses */}
                <h4 style={{ color: '#cd5c5c', margin: '15px 0 5px 0', fontSize: '13px' }}>🎁 Récompenses</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {rewards.map(r => (
                    <button 
                      key={r.id} 
                      onClick={() => redeemReward(child.id, r.value)} 
                      disabled={appMode === 'READONLY'}
                      style={{ 
                        padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        background: appMode === 'READONLY' ? '#f5f5f5' : '#fff0f5', 
                        border: appMode === 'READONLY' ? '1px solid #e0e0e0' : '1px solid #ffb6c1', 
                        borderRadius: '6px', fontSize: '12px', 
                        cursor: appMode === 'READONLY' ? 'default' : 'pointer', textAlign: 'left',
                        opacity: appMode === 'READONLY' ? 0.8 : 1
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '4px' }}>{r.icon} {r.title}</span> 
                      <strong style={{ color: appMode === 'READONLY' ? '#666' : '#8b0000' }}>-{r.value}</strong>
                    </button>
                  ))}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
