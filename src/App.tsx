import { useState, useEffect } from 'react';

// Définition des types pour TypeScript
interface Child {
  id: string;
  name: string;
  points: number;
}

interface Task {
  id: string;
  title: string;
  points: number;
  icon: string;
}

interface Reward {
  id: string;
  title: string;
  cost: number;
  icon: string;
}

export default function App() {
  // Chargement des données depuis la mémoire du navigateur ou initialisation par défaut
  const [children, setChildren] = useState<Child[]>(() => {
    const saved = localStorage.getItem('childrenData');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Léo', points: 0 },
      { id: '2', name: 'Mia', points: 0 }
    ];
  });

  // Liste des tâches configurables
  const [tasks] = useState<Task[]>([
    { id: '1', title: 'Ranger sa chambre', points: 10, icon: '🧹' },
    { id: '2', title: 'Faire ses devoirs', points: 15, icon: '📚' },
    { id: '3', title: 'Mettre la table', points: 5, icon: '🍽️' },
    { id: '4', title: 'Se brosser les dents', points: 5, icon: '🪥' }
  ]);

  // Liste des récompenses configurables
  const [rewards] = useState<Reward[]>([
    { id: '1', title: '30 min d\'écran', cost: 50, icon: '📺' },
    { id: '2', title: 'Activité en famille', cost: 100, icon: '⚽' },
    { id: '3', title: '2 euros d\'argent de poche', cost: 200, icon: '🪙' }
  ]);

  const [selectedChild, setSelectedChild] = useState<string>(children[0]?.id || '');

  // Sauvegarde automatique à chaque modification des points
  useEffect(() => {
    localStorage.setItem('childrenData', JSON.stringify(children));
  }, [children]);

  const addPoints = (points: number) => {
    setChildren(children.map(child =>
      child.id === selectedChild ? { ...child, points: child.points + points } : child
    ));
  };

  const redeemReward = (cost: number) => {
    const child = children.find(c => c.id === selectedChild);
    if (child && child.points >= cost) {
      if (window.confirm(`Confirmer l'achat de la récompense pour ${cost} points ?`)) {
        setChildren(children.map(c =>
          c.id === selectedChild ? { ...c, points: c.points - cost } : c
        ));
        alert('Récompense accordée ! 🎉');
      }
    } else {
      alert('Pas assez de points ! ❌');
    }
  };

  const currentChild = children.find(c => c.id === selectedChild);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>🏆 Tableau des Récompenses</h1>

      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Sélectionner l'enfant : </label>
        <select
          value={selectedChild}
          onChange={(e) => setSelectedChild(e.target.value)}
          style={{ padding: '10px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          {children.map(child => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
        </select>
      </div>

      {currentChild && (
        <div style={{ background: '#f0f8ff', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: 0, color: '#0066cc' }}>{currentChild.name} a {currentChild.points} points 🌟</h2>
        </div>
      )}

      <h3 style={{ color: '#2e8b57' }}>✅ Actions (Gagner des points)</h3>
      <div style={{ display: 'grid', gap: '10px', marginBottom: '30px' }}>
        {tasks.map(task => (
          <button
            key={task.id}
            onClick={() => addPoints(task.points)}
            style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e6ffe6', border: '1px solid #b3ffb3', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', transition: 'transform 0.1s' }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>{task.icon} {task.title}</span>
            <span style={{ fontWeight: 'bold', color: '#006400', background: '#ccffcc', padding: '4px 8px', borderRadius: '12px' }}>+ {task.points}</span>
          </button>
        ))}
      </div>

      <h3 style={{ color: '#cd5c5c' }}>🎁 Récompenses (Dépenser des points)</h3>
      <div style={{ display: 'grid', gap: '10px' }}>
        {rewards.map(reward => (
          <button
            key={reward.id}
            onClick={() => redeemReward(reward.cost)}
            style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff0f5', border: '1px solid #ffb6c1', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', transition: 'transform 0.1s' }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>{reward.icon} {reward.title}</span>
            <span style={{ fontWeight: 'bold', color: '#8b0000', background: '#ffe4e1', padding: '4px 8px', borderRadius: '12px' }}>- {reward.cost}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
