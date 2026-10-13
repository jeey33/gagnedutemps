import React, { useState, useEffect } from 'react';

interface Child { id: string; name: string; points: number; }
interface Item { id: string; title: string; value: number; icon: string; }

// === CONFIGURATION SUPABASE ===
const SUPABASE_URL = 'https://nzoysgkqelpayfxwbmbd.supabase.co/rest/v1';
const SUPABASE_KEY = 'sb_publishable_cS53pYq9msZ6FxVcUIuGdA_B5AEud7n'; // <-- REMETTEZ VOTRE CLÉ ICI !

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

  // 1. CHARGEMENT DES DONNÉES
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

  // 2. MODIFICATION DES POINTS
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
      const penalty = prompt(`Combien de points voulez-vous retirer à ${child.name} pour cette erreur ? (ex: 5)`);
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

  // 3. SÉCURITÉ PARENT
  const toggleAdminMode = () => {
    if (!isAdminMode) {
      const password = prompt("Mot de passe Parent :");
      if (password === "0133") setIsAdminMode(true);
      else alert("Mot de passe incorrect ❌");
    } else {
      setIsAdminMode(false);
    }
  };

  // 4. MODE PARENT : AJOUTS FACILES AVEC FORMULAIRES
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
    const newItem = {
      id: Date.now().toString(),
      icon: formData.get('icon') as string,
      title: formData.get('title') as string,
      value: parseInt(formData.get('value') as string)
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
          
          {/* GESTION DES ENFANTS */}
          <div style={{ marginBottom: '30px' }}>
            <h3>👶 Enfants <button onClick={addChild} style={{ padding: '5px' }}>+ Ajouter</button></h3>
            {children.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #ddd' }}>
                <span>{c.name} ({c.points} pts)</span>
                <button onClick={() => deleteChild(c.id)}>❌</button>
              </div>
            ))}
          </div>

          {/* GESTION DES TÂCHES */}
          <div style={{ marginBottom: '30px' }}>
            <h3>✅ Tâches (Actions positives)</h3>
            <form onSubmit={addTask} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <input name="icon" placeholder="Emoji 🧹" required style={{ width: '60px', padding: '5px' }} />
              <input name="title" placeholder="Nom de la tâche" required style={{ flex: 1, padding: '5px' }} />
              <input name="value" type="number" placeholder="Points" required style={{ width: '70px', padding: '5px' }} />
              <button type="submit" style={{ padding: '5px 10px', background: '#2e8b57', color: 'white', border: 'none', borderRadius: '4px' }}>Ajouter</button>
            </form>
            {tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #ddd' }}>
                <span>{t.icon} {t.title} (+{t.value})</span>
                <button onClick={() => deleteTask(t.id)}>❌</button>
              </div>
            ))}
          </div>

          {/* GESTION DES RÉCOMPENSES */}
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
      
      /* === ÉCRAN SCINDÉ EN 2 COLONNES POUR LES ENFANTS === */
      (
        <div>
          <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>🏆 Les Scores</h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {children.map(child => (
              <div key={child.id} style={{ background: '#f0f8ff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                
                {/* En-tête de l'enfant */}
                <div style={{ textAlign: 'center', marginBottom: '15px', background: '#fff', padding: '10px', borderRadius: '8px' }}>
                  <h2 style={{ margin: '0 0 5px 0', color: '#0066cc' }}>{child.name}</h2>
                  <h3 style={{ margin: 0, fontSize: '24px' }}>{child.points} 🌟</h3>
                  <button 
                    onClick={() => removePoints(child.id)}
                    style={{ marginTop: '10px', padding: '5px 10px', background: '#ffcccc', color: '#cc0000', border: '1px solid #ff9999', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ➖ Erreur (Retirer des points)
                  </button>
                </div>

                {/* Actions pour gagner des points */}
                <h4 style={{ color: '#2e8b57', margin: '15px 0 5px 0' }}>✅ Tâches</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tasks.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => addPoints(child.id, t.value)} 
                      style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', background: '#e6ffe6', border: '1px solid #b3ffb3', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                    >
                      <span title={t.title}>{t.icon}</span> <strong>+{t.value}</strong>
                    </button>
                  ))}
                </div>

                {/* Actions pour dépenser des points */}
                <h4 style={{ color: '#cd5c5c', margin: '20px 0 5px 0' }}>🎁 Récompenses</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rewards.map(r => (
                    <button 
                      key={r.id} 
                      onClick={() => redeemReward(child.id, r.value)} 
                      style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', background: '#fff0f5', border: '1px solid #ffb6c1', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
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
