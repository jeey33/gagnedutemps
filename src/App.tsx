import React, { useState, useEffect } from 'react';

interface Child { id: string; name: string; points: number; }
interface Item { id: string; title: string; value: number; icon: string; is_bonus?: boolean; }

// === CONFIGURATION SUPABASE ===
const SUPABASE_URL = 'https://nzoysgkqelpayfxwbmbd.supabase.co/rest/v1';
const SUPABASE_KEY = 'VOTRE_CLE_SECRETE_ICI'; // <-- REMETTEZ VOTRE CLÉ ICI !

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

export default function App() {
  const [children, setChildren] = useState<Child[]>([]);
  const [tasks, setTasks] = useState<Item[]>([]);
  const [rewards, setRewards] = useState<Item[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);

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
    const child = children.find(c => c.id === childId);
    if (child) updatePoints(childId, child.points + points);
  };

  const removePoints = (childId: string) => {
    const child = children.find(c => c.id === childId);
    if (child) {
      const penalty = prompt(`Combien de points retirer à ${child.name} pour cette erreur ? (ex: 5)`);
      if (penalty && !isNaN(parseInt(penalty))) {
        updatePoints(childId, child.points - parseInt(penalty));
      }
    }
  };

  const redeemReward = (childId: string, cost: number) => {
    const child = children.find(c => c.id === childId);
    if (child && child.points >= cost) {
      if (window.confirm(`Dépenser ${cost} points pour ${child.name} ?`)) {
        updatePoints(childId, child.points - cost);
      }
    } else {
      alert("Pas assez de points ! ❌");
    }
  };

  const toggleAdminMode = () => {
    if (!isAdminMode) {
      const password = prompt("Mot de passe Parent :");
      if (password === "0133") setIsAdminMode(true);
      else alert("Mot de passe incorrect ❌");
    } else {
      setIsAdminMode(false);
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
      icon: formData.get('icon') as string,
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
      icon: formData.get('icon') as string,
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
    <div style={{ padding: '15px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      
      <button 
        onClick={toggleAdminMode}
        style={{ width: '100%', padding: '10px', background: isAdminMode ? '#333' : '#eee', color: isAdminMode ? '#fff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px' }}
      >
        {isAdminMode ? '🔓 Quitter le mode Parent' : '🔒 Mode Parent (Configuration)'}
      </button>

      {isAdminMode ? (
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <h2>Configuration (Protégée)</h2>
          
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
            <form onSubmit={addTask} style={{ display: 'flex', gap: '5px', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input name="icon" placeholder="Emoji 🧹" required style={{ width: '60px', padding: '5px' }} />
              <input name="title" placeholder="Nom de la tâche" required style={{ flex: 1, minWidth: '150px', padding: '5px' }} />
              <input name="value" type="number" placeholder="Points" required style={{ width: '70px', padding: '5px' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', background: '#ffe4b5', padding: '4px 8px', borderRadius: '4px' }}>
                <input type="checkbox" name="is_bonus" /> ⭐ Bonus
              </label>
              <button type="submit" style={{ padding: '5px 10px', background: '#2e8b57', color: 'white', border: 'none', borderRadius: '4px' }}>Ajouter</button>
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
            <form onSubmit={addReward} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <input name="icon" placeholder="Emoji 📺" required style={{ width: '60px', padding: '5px' }} />
              <input name="title" placeholder="Nom de la récompense" required style={{ flex: 1, padding: '5px' }} />
              <input name="value" type="number" placeholder="Coût" required style={{ width: '70px', padding: '5px' }} />
              <button type="submit" style={{ padding: '5px 10px', background: '#cd5c5c', color: 'white', border: 'none', borderRadius: '4px' }}>Ajouter</button>
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
      
      (
        <div>
          <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>🏆 Les Scores</h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {children.map(child => (
              <div key={child.id} style={{ background: '#f0f8ff', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '15px', background: '#fff', padding: '10px', borderRadius: '8px' }}>
                  <h2 style={{ margin: '0 0 5px 0', color: '#0066cc' }}>{child.name}</h2>
                  <h3 style={{ margin: 0, fontSize: '24px' }}>{child.points} 🌟</h3>
                  <button 
                    onClick={() => removePoints(child.id)}
                    style={{ marginTop: '10px', padding: '5px', background: '#ffcccc', color: '#cc0000', border: '1px solid #ff9999', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', width: '100%' }}
                  >
                    ➖ Retirer des points
                  </button>
                </div>

                <h4 style={{ color: '#2e8b57', margin: '15px 0 5px 0', fontSize: '14px' }}>✅ Quotidien</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {tasks.filter(t => !t.is_bonus).map(t => (
                    <button 
                      key={t.id} onClick={() => addPoints(child.id, t.value)} 
                      style={{ padding: '6px', display: 'flex', justifyContent: 'space-between', background: '#e6ffe6', border: '1px solid #b3ffb3', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                    >
                      <span title={t.title}>{t.icon}</span> <strong>+{t.value}</strong>
                    </button>
                  ))}
                </div>

                <h4 style={{ color: '#d2691e', margin: '15px 0 5px 0', fontSize: '14px' }}>⭐ Tâches Bonus</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {tasks.filter(t => t.is_bonus).map(t => (
                    <button 
                      key={t.id} onClick={() => addPoints(child.id, t.value)} 
                      style={{ padding: '6px', display: 'flex', justifyContent: 'space-between', background: '#fffacd', border: '1px solid #ffd700', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                    >
                      <span title={t.title}>{t.icon}</span> <strong style={{ color: '#b8860b' }}>+{t.value}</strong>
                    </button>
                  ))}
                </div>

                <h4 style={{ color: '#cd5c5c', margin: '20px 0 5px 0', fontSize: '14px' }}>🎁 Récompenses</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {rewards.map(r => (
                    <button 
                      key={r.id} onClick={() => redeemReward(child.id, r.value)} 
                      style={{ padding: '6px', display: 'flex', justifyContent: 'space-between', background: '#fff0f5', border: '1px solid #ffb6c1', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                    >
                      <span title={r.title}>{r.icon}</span> <strong>-{r.value}</strong>
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
