import { useState, useEffect } from 'react';

interface Child {
  id: string;
  name: string;
  points: number;
}

interface Item {
  id: string;
  title: string;
  value: number; // points ou cost
  icon: string;
}

export default function App() {
  // 1. CHARGEMENT DES DONNÉES SAUVEGARDÉES
  const [children, setChildren] = useState<Child[]>(() => {
    const saved = localStorage.getItem('appChildren');
    return saved ? JSON.parse(saved) : [{ id: '1', name: 'Léo', points: 0 }];
  });

  const [tasks, setTasks] = useState<Item[]>(() => {
    const saved = localStorage.getItem('appTasks');
    return saved ? JSON.parse(saved) : [{ id: '1', title: 'Ranger sa chambre', value: 10, icon: '🧹' }];
  });

  const [rewards, setRewards] = useState<Item[]>(() => {
    const saved = localStorage.getItem('appRewards');
    return saved ? JSON.parse(saved) : [{ id: '1', title: '30 min d\'écran', value: 50, icon: '📺' }];
  });

  const [selectedChild, setSelectedChild] = useState<string>(children[0]?.id || '');
  const [isAdminMode, setIsAdminMode] = useState(false);

  // 2. SAUVEGARDE AUTOMATIQUE À CHAQUE MODIFICATION
  useEffect(() => localStorage.setItem('appChildren', JSON.stringify(children)), [children]);
  useEffect(() => localStorage.setItem('appTasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('appRewards', JSON.stringify(rewards)), [rewards]);

  // 3. FONCTIONS POUR LES POINTS
  const addPoints = (points: number) => {
    setChildren(children.map(c => c.id === selectedChild ? { ...c, points: c.points + points } : c));
  };

  const redeemReward = (cost: number) => {
    const child = children.find(c => c.id === selectedChild);
    if (child && child.points >= cost) {
      if (window.confirm(`Dépenser ${cost} points ?`)) {
        setChildren(children.map(c => c.id === selectedChild ? { ...c, points: c.points - cost } : c));
      }
    } else {
      alert('Pas assez de points !');
    }
  };

  // 4. FONCTIONS DE CONFIGURATION (MODE PARENT)
  const addChild = () => {
    const name = prompt('Nom de l\'enfant :');
    if (name) setChildren([...children, { id: Date.now().toString(), name, points: 0 }]);
  };

  const addTask = () => {
    const title = prompt('Nom de la tâche (ex: Devoirs) :');
    const value = parseInt(prompt('Points gagnés :') || '0');
    const icon = prompt('Emoji (ex: 📚) :') || '⭐';
    if (title && value) setTasks([...tasks, { id: Date.now().toString(), title, value, icon }]);
  };

  const addReward = () => {
    const title = prompt('Nom de la récompense :');
    const value = parseInt(prompt('Coût en points :') || '0');
    const icon = prompt('Emoji (ex: 🎁) :') || '🎁';
    if (title && value) setRewards([...rewards, { id: Date.now().toString(), title, value, icon }]);
  };

  const deleteChild = (id: string) => setChildren(children.filter(c => c.id !== id));
  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));
  const deleteReward = (id: string) => setRewards(rewards.filter(r => r.id !== id));

  const currentChild = children.find(c => c.id === selectedChild);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
      
      {/* BOUTON MODE PARENT / ENFANT */}
      <button 
        onClick={() => setIsAdminMode(!isAdminMode)}
        style={{ width: '100%', padding: '10px', background: isAdminMode ? '#333' : '#eee', color: isAdminMode ? '#fff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px' }}
      >
        {isAdminMode ? '🔓 Quitter le mode Parent' : '🔒 Mode Parent (Configuration)'}
      </button>

      {/* ----------- MODE PARENT ----------- */}
      {isAdminMode ? (
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <h2>Configuration</h2>
          
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
      
      /* ----------- MODE ENFANT (UTILISATION) ----------- */
      (
        <>
          <h1 style={{ textAlign: 'center' }}>🏆 Mes Points</h1>

          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '18px', marginBottom: '20px' }}
          >
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

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
