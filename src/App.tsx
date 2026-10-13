import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Plus, Star, Gift, CheckCircle, Trash2, Edit2, Play, Coins, Monitor } from 'lucide-react';

// Initialize Firebase using the provided environment variables
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [chores, setChores] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddChore, setShowAddChore] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  
  // Forms state
  const [newChildName, setNewChildName] = useState('');
  const [newChore, setNewChore] = useState({ title: '', points: 10, icon: '🧹' });
  const [newReward, setNewReward] = useState({ title: '', cost: 50, type: 'screen', icon: '📱' });

  // Action states
  const [selectedChore, setSelectedChore] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);

  useEffect(() => {
    const authenticate = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Authentication failed:", error);
      }
    };
    
    authenticate();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const childrenRef = collection(db, 'artifacts', appId, 'public', 'data', 'children');
    const choresRef = collection(db, 'artifacts', appId, 'public', 'data', 'chores');
    const rewardsRef = collection(db, 'artifacts', appId, 'public', 'data', 'rewards');

    const unsubChildren = onSnapshot(childrenRef, (snapshot) => {
      setChildren(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching children:", error));

    const unsubChores = onSnapshot(choresRef, (snapshot) => {
      setChores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching chores:", error));

    const unsubRewards = onSnapshot(rewardsRef, (snapshot) => {
      setRewards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => console.error("Error fetching rewards:", error));

    return () => {
      unsubChildren();
      unsubChores();
      unsubRewards();
    };
  }, [user]);

  const handleAddChild = async (e) => {
    e.preventDefault();
    if (!newChildName.trim() || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'children'), {
        name: newChildName,
        points: 0,
        createdAt: new Date().toISOString()
      });
      setNewChildName('');
      setShowAddChild(false);
    } catch (error) {
      console.error("Error adding child:", error);
    }
  };

  const handleAddChore = async (e) => {
    e.preventDefault();
    if (!newChore.title.trim() || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chores'), {
        title: newChore.title,
        points: Number(newChore.points),
        icon: newChore.icon,
        createdAt: new Date().toISOString()
      });
      setNewChore({ title: '', points: 10, icon: '🧹' });
      setShowAddChore(false);
    } catch (error) {
      console.error("Error adding chore:", error);
    }
  };

  const handleAddReward = async (e) => {
    e.preventDefault();
    if (!newReward.title.trim() || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rewards'), {
        title: newReward.title,
        cost: Number(newReward.cost),
        type: newReward.type,
        icon: newReward.icon,
        createdAt: new Date().toISOString()
      });
      setNewReward({ title: '', cost: 50, type: 'screen', icon: '📱' });
      setShowAddReward(false);
    } catch (error) {
      console.error("Error adding reward:", error);
    }
  };

  const handleCompleteChore = async (childId, childPoints, chorePoints) => {
    if (!user) return;
    try {
      const childRef = doc(db, 'artifacts', appId, 'public', 'data', 'children', childId);
      await updateDoc(childRef, {
        points: childPoints + chorePoints
      });
      setSelectedChore(null);
    } catch (error) {
      console.error("Error completing chore:", error);
    }
  };

  const handleRedeemReward = async (childId, childPoints, rewardCost) => {
    if (!user || childPoints < rewardCost) return;
    try {
      const childRef = doc(db, 'artifacts', appId, 'public', 'data', 'children', childId);
      await updateDoc(childRef, {
        points: childPoints - rewardCost
      });
      setSelectedReward(null);
    } catch (error) {
      console.error("Error redeeming reward:", error);
    }
  };

  const deleteDocument = async (collectionName, id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id));
    } catch (error) {
      console.error(`Error deleting ${collectionName}:`, error);
    }
  };

  const seedDefaults = async () => {
    if (!user) return;
    const defaultChores = [
      { title: 'Ranger sa chambre', points: 10, icon: '🛏️' },
      { title: 'Mettre la table', points: 5, icon: '🍽️' },
      { title: 'Faire ses devoirs', points: 15, icon: '📚' }
    ];
    const defaultRewards = [
      { title: '30 min de console', cost: 30, type: 'screen', icon: '🎮' },
      { title: '1€ d\'argent de poche', cost: 50, type: 'money', icon: '🪙' },
      { title: 'Sortie au parc', cost: 20, type: 'activity', icon: '🌳' }
    ];

    try {
      if (chores.length === 0) {
        for (const c of defaultChores) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chores'), c);
      }
      if (rewards.length === 0) {
        for (const r of defaultRewards) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rewards'), r);
      }
    } catch(err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-blue-50 text-blue-500 font-bold text-xl">Chargement de l'aventure...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 font-sans pb-20">
      
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Star size={24} weight="fill" />
            </div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
              Points Famille
            </h1>
          </div>
          {(chores.length === 0 && rewards.length === 0) && (
            <button onClick={seedDefaults} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold hover:bg-purple-200">
              Charger Exemples
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        
        {}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              👨‍👩‍👧‍👦 Les Enfants
            </h2>
            <button 
              onClick={() => setShowAddChild(true)}
              className="flex items-center gap-1 text-sm bg-white hover:bg-gray-50 text-purple-600 px-4 py-2 rounded-xl shadow-sm border border-purple-100 font-semibold transition-all"
            >
              <Plus size={16} /> Ajouter
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.length === 0 && (
               <div className="col-span-full text-center py-8 text-gray-500 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
                 Commencez par ajouter un enfant !
               </div>
            )}
            {children.map(child => (
              <div key={child.id} className="bg-white rounded-3xl p-6 shadow-xl shadow-purple-900/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => deleteDocument('children', child.id)} className="text-red-400 hover:text-red-600">
                     <Trash2 size={18} />
                   </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-inner">
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{child.name}</h3>
                    <div className="flex items-center gap-1 text-orange-500 font-black text-lg bg-orange-50 px-3 py-1 rounded-full mt-1 inline-flex">
                      <Star size={18} className="fill-orange-500" /> {child.points} pts
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              ✅ Tâches & Missions
            </h2>
            <button 
              onClick={() => setShowAddChore(true)}
              className="flex items-center gap-1 text-sm bg-white hover:bg-gray-50 text-blue-600 px-4 py-2 rounded-xl shadow-sm border border-blue-100 font-semibold transition-all"
            >
              <Plus size={16} /> Nouvelle
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {chores.map(chore => (
              <div key={chore.id} className="bg-white rounded-2xl p-4 shadow-sm border border-blue-50 flex flex-col items-center text-center group relative hover:shadow-md transition-shadow">
                <button 
                  onClick={() => deleteDocument('chores', chore.id)} 
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
                <div className="text-4xl mb-3">{chore.icon}</div>
                <h4 className="font-semibold text-gray-700 leading-tight mb-2">{chore.title}</h4>
                <div className="text-blue-600 font-bold text-sm bg-blue-50 px-2 py-1 rounded-lg mb-3">+{chore.points} pts</div>
                <button 
                  onClick={() => setSelectedChore(chore)}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold flex justify-center items-center gap-2 transition-colors"
                >
                  <CheckCircle size={16} /> Fait !
                </button>
              </div>
            ))}
          </div>
        </section>

        {}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              🎁 Boutique des Récompenses
            </h2>
            <button 
              onClick={() => setShowAddReward(true)}
              className="flex items-center gap-1 text-sm bg-white hover:bg-gray-50 text-pink-600 px-4 py-2 rounded-xl shadow-sm border border-pink-100 font-semibold transition-all"
            >
              <Plus size={16} /> Ajouter
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rewards.map(reward => (
              <div key={reward.id} className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50 flex flex-col items-center text-center group relative hover:shadow-md transition-shadow">
                <button 
                  onClick={() => deleteDocument('rewards', reward.id)} 
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
                <div className="text-4xl mb-3">{reward.icon}</div>
                <h4 className="font-semibold text-gray-700 leading-tight mb-2">{reward.title}</h4>
                <div className="text-pink-600 font-bold text-sm bg-pink-50 px-2 py-1 rounded-lg mb-3">-{reward.cost} pts</div>
                <button 
                  onClick={() => setSelectedReward(reward)}
                  className="w-full py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold flex justify-center items-center gap-2 transition-colors"
                >
                  <Gift size={16} /> Obtenir
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {}
      {/* Add Child Modal */}
      {showAddChild && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Ajouter un enfant</h3>
            <form onSubmit={handleAddChild}>
              <input 
                type="text" 
                placeholder="Prénom" 
                value={newChildName}
                onChange={e => setNewChildName(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-purple-400 focus:outline-none mb-4 text-lg font-semibold"
                autoFocus
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddChild(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Chore Modal */}
      {showAddChore && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Nouvelle Mission</h3>
            <form onSubmit={handleAddChore} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-500 ml-2">Titre de la tâche</label>
                <input type="text" placeholder="Ex: Sortir le chien" value={newChore.title} onChange={e => setNewChore({...newChore, title: e.target.value})} className="w-full p-3 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-blue-400 focus:outline-none font-semibold mt-1" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-bold text-gray-500 ml-2">Points</label>
                  <input type="number" min="1" value={newChore.points} onChange={e => setNewChore({...newChore, points: e.target.value})} className="w-full p-3 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-blue-400 focus:outline-none font-semibold mt-1" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-bold text-gray-500 ml-2">Emoji</label>
                  <input type="text" value={newChore.icon} onChange={e => setNewChore({...newChore, icon: e.target.value})} className="w-full p-3 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-blue-400 focus:outline-none font-semibold mt-1 text-center" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddChore(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Reward Modal */}
      {showAddReward && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Nouvelle Récompense</h3>
            <form onSubmit={handleAddReward} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-500 ml-2">Description</label>
                <input type="text" placeholder="Ex: 30 min de jeu" value={newReward.title} onChange={e => setNewReward({...newReward, title: e.target.value})} className="w-full p-3 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-pink-400 focus:outline-none font-semibold mt-1" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-bold text-gray-500 ml-2">Coût (points)</label>
                  <input type="number" min="1" value={newReward.cost} onChange={e => setNewReward({...newReward, cost: e.target.value})} className="w-full p-3 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-pink-400 focus:outline-none font-semibold mt-1" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-bold text-gray-500 ml-2">Emoji</label>
                  <input type="text" value={newReward.icon} onChange={e => setNewReward({...newReward, icon: e.target.value})} className="w-full p-3 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-pink-400 focus:outline-none font-semibold mt-1 text-center" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddReward(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-2xl">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Select Child for Chore Modal */}
      {selectedChore && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="text-5xl mb-4">{selectedChore.icon}</div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Qui a accompli :<br/><span className="text-blue-600">{selectedChore.title}</span> ?</h3>
            <p className="text-gray-500 font-semibold mb-6">+{selectedChore.points} points à distribuer</p>
            
            <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
              {children.map(child => (
                <button 
                  key={child.id}
                  onClick={() => handleCompleteChore(child.id, child.points, selectedChore.points)}
                  className="w-full p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-100 hover:border-blue-300 rounded-2xl flex items-center justify-between transition-colors"
                >
                  <span className="font-bold text-lg text-gray-800">{child.name}</span>
                  <span className="text-blue-600 font-bold bg-blue-100 px-3 py-1 rounded-full text-sm">Attribuer</span>
                </button>
              ))}
              {children.length === 0 && <p className="text-sm text-red-500 font-bold">Veuillez d'abord ajouter un enfant !</p>}
            </div>
            <button onClick={() => setSelectedChore(null)} className="w-full py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl">Annuler</button>
          </div>
        </div>
      )}

      {/* Select Child for Reward Modal */}
      {selectedReward && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="text-5xl mb-4">{selectedReward.icon}</div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Qui demande :<br/><span className="text-pink-600">{selectedReward.title}</span> ?</h3>
            <p className="text-gray-500 font-semibold mb-6">Coût : {selectedReward.cost} points</p>
            
            <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
              {children.map(child => {
                const canAfford = child.points >= selectedReward.cost;
                return (
                  <button 
                    key={child.id}
                    disabled={!canAfford}
                    onClick={() => handleRedeemReward(child.id, child.points, selectedReward.cost)}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-colors border-2 ${canAfford ? 'bg-gray-50 hover:bg-pink-50 border-gray-100 hover:border-pink-300' : 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'}`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-lg text-gray-800">{child.name}</span>
                      <span className="text-xs font-bold text-gray-500">Solde: {child.points} pts</span>
                    </div>
                    {canAfford ? (
                       <span className="text-pink-600 font-bold bg-pink-100 px-3 py-1 rounded-full text-sm">Acheter</span>
                    ) : (
                       <span className="text-gray-400 font-bold text-sm flex items-center gap-1">Pas assez</span>
                    )}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setSelectedReward(null)} className="w-full py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}