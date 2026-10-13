import { useState, useEffect } from 'react';

interface Child { id: string; name: string; points: number; }
interface Item { id: string; title: string; value: number; icon: string; }

// === CONFIGURATION SUPABASE ===
const SUPABASE_URL = 'https://nzoysgkqelpayfxwbmbd.supabase.co/rest/v1';
const SUPABASE_KEY = 'sb_publishable_cS53pYq9msZ6FxVcUIuGdA_B5AEud7n'; // <-- COLLEX VOTRE CLÉ ICI

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
  
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [isAdminMode, setIsAdminMode] = useState(false);

  // 1. CHARGEMENT DES DONNÉES DEPUIS SUPABASE AU DÉMARRAGE
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resChildren = await fetch(`${SUPABASE_URL}/children`, { headers });
        const resTasks = await fetch(`${SUPABASE_URL}/tasks`, { headers });
        const resRewards = await fetch(`${SUPABASE_URL}/rewards`, { headers });
        
        if (resChildren.ok) {
          const data = await resChildren.json();
          setChildren(data);
          if (data.length > 0) setSelectedChild(data[0].id);
        }
        if (resTasks.ok) setTasks(await resTasks.json());
        if (resRewards.ok) setRewards(await resRewards.json());
      } catch (error) {
        console.error("Erreur de connexion à la base de données", error);
      }
    };
    fetchData();
  }, []);

  // 2. MISE À JOUR DES POINTS DANS LA BASE DE DONNÉES
  const updatePoints = async (childId: string, newPoints: number) => {
    // Mise à jour immédiate sur l'écran
    setChildren(children.map(c => c.id === childId ? { ...c, points: newPoints } : c));
    
    // Envoi à Supabase
    await fetch(`${SUPABASE_URL}/children?id=eq.${childId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ points: newPoints })
    });
  };

  const addPoints = (points: number) => {
    const child = children.find(c => c.id === selectedChild);
    if (child) updatePoints(child.id, child.points + points);
  };

  const redeemReward = (cost: number) => {
    const child = children.find(c => c.id === selectedChild);
    if (child && child.points >= cost) {
      if (window.confirm(`Dépenser ${cost} points ?`)) {
        updatePoints(child.id, child.points - cost);
      }
    } else {
      alert('Pas assez de points !');
    }
  };

  // 3. FONCTIONS DE CONFIGURATION (MODE PARENT)
  const addChild = async () => {
    const name = prompt('Nom de l\'enfant :');
    if (!name) return;
    const newItem = { id: Date.now().toString(), name, points: 0 };
    setChildren([...children, newItem]);
    await fetch(`${SUPABASE_URL}/children`, { method: 'POST', headers, body: JSON.stringify(newItem) });
  };

  const addTask = async () => {
    const title = prompt('Nom de la tâche (ex: Devoirs) :');
    const value = parseInt(prompt('Points gagnés :') || '0');
    const icon = prompt('Emoji (ex: 📚) :') || '⭐';
    if (title && value) {
      const newItem = { id: Date.now().toString(), title, value, icon };
      setTasks([...tasks, newItem]);
      await fetch(`${SUPABASE_URL}/tasks`, { method: 'POST', headers, body: JSON.stringify(newItem) });
    }
  };

  const addReward = async () => {
    const title = prompt('Nom de la récompense :');
    const value = parseInt(prompt('Coût en points :') || '0');
    const icon = prompt('Emoji (ex: 🎁) :') || '🎁';
    if (title && value) {
      const newItem = { id: Date.now().toString(), title, value, icon };
      setRewards([...rewards, newItem]);
      await fetch(`${SUPABASE_URL}/rewards`, { method: 'POST', headers, body: JSON.stringify(newItem) });
    }
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

  const currentChild = children.find(c => c.id === selectedChild);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
      
      <button 
        onClick={() => setIsAdminMode(!isAdminMode)}
        style={{ width: '100%', padding: '10px', background: isAdminMode ? '#333' : '#eee', color: isAdminMode ? '#fff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px' }}
      >
        {isAdminMode ? '🔓 Quitter le mode Parent' : '🔒 Mode Parent (Configuration)'}
      </button>

      {isAdminMode ? (
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <h2>Configuration (Synchronisé)</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h3>👶 Enfants <button onClick={addChild} style={{ padding: '5px' }}>+ Ajouter</button></h3>
            {children.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>{c.name} ({c.points} pts)</span>
                <button onClick={() => deleteChild(c.id)}>❌</button>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>✅ Tâches <button onClick={addTask} style={{ padding: '5px' }}>+ Ajouter</button></h3>
            {tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>{t.icon} {t.title} (+{t.value} pts)</span>
                <button onClick={() => deleteTask(t.id)}>❌</button>
              </div>
            ))}
          </div>

          <div>
            <h3>🎁 Récompenses <button onClick={addReward} style={{ padding: '5px' }}>+ Ajouter</button></h3>
            {rewards.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>{r.icon} {r.title} (-{r.value} pts)</span>
                <button onClick={() => deleteReward(r.id)}>❌</button>
              </div>
            ))}
          </div>
        </div>
      ) : 
      (
        <>
          <h1 style={{ textAlign: 'center' }}>🏆 Mes Points</h1>

          {children.length > 0 && (
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              style={{ width: '100%', padding: '10px', fontSize: '18px', marginBottom: '20px' }}
            >
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          {currentChild && (
            <div style={{ background: '#e6f7ff', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>{currentChild.name} a {currentChild.points} points 🌟</h2>
            </div>
          )}

          <h3 style={{ color: '#2e8b57' }}>Gagner des points</h3>
          <div style={{ display: 'grid', gap: '10px', marginBottom: '30px' }}>
            {tasks.map(t => (
              <button key={t.id} onClick={() => addPoints(t.value)} style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', background: '#e6ffe6', border: '1px solid #b3ffb3', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
                <span>{t.icon} {t.title}</span> <strong>+{t.value}</strong>
              </button>
            ))}
          </div>

          <h3 style={{ color: '#cd5c5c' }}>Dépenser des points</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {rewards.map(r => (
              <button key={r.id} onClick={() => redeemReward(r.value)} style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', background: '#fff0f5', border: '1px solid #ffb6c1', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
                <span>{r.icon} {r.title}</span> <strong>-{r.value}</strong>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
