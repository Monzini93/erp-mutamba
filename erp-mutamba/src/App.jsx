import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  BeakerIcon,
  LayoutDashboard,
  Boxes,
  Factory,
  FilePlus2,
  BarChart3,
  Users,
  Plus,
  ShieldCheck,
  X,
  Loader2,
} from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

let app;
if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
} else {
  console.error('Variáveis de ambiente do Firebase não carregadas.');
}

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'southamerica-east1');
const SUPER_ADMIN_EMAIL = 'yuri@teste.com';

// --- CONTEXTO DE AUTENTICAÇÃO ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.email === SUPER_ADMIN_EMAIL) {
          setUserRole('admin');
        } else {
          const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          setUserRole(userDocSnap.exists() && userDocSnap.data().role === 'admin' ? 'admin' : 'user');
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- COMPONENTES DE UI ---
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md ${className}`}>{children}</div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, className = '', variant = 'default', type = 'button', disabled = false }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    default: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 focus:ring-gray-400',
    ghost: 'hover:bg-gray-100',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} px-4 py-2 ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, id, type = 'text', placeholder, value, onChange, className = '' }) => (
  <div>
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
    />
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- TELA DE LOGIN ---
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError('Falha ao fazer login. Verifique suas credenciais.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="w-full max-w-sm p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Logo Mutamba Cosmetics"
            className="mx-auto h-20 w-auto"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/180x60/111827/FFFFFF?text=Mutamba';
            }}
          />
          <p className="mt-4 text-sm text-gray-400">Faça login para continuar.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <Input id="email" type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-700 border-gray-600 text-white" />
          <Input id="password" type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-700 border-gray-600 text-white" />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div>
            <Button type="submit" variant="primary" className="w-full py-2.5" disabled={isLoggingIn}>
              {isLoggingIn ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- PÁGINA DE USUÁRIOS ---
const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ nome: '', email: '', password: '', role: 'user' });
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'usuarios'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(user => user.email !== SUPER_ADMIN_EMAIL);
      setUsuarios(usersData);
    });
    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser.uid) {
      alert('Você não pode alterar sua própria permissão.');
      return;
    }
    const userDocRef = doc(db, 'usuarios', userId);
    await updateDoc(userDocRef, { role: newRole });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewUser(prev => ({ ...prev, [id]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setCreationError('');
    try {
      const createUserFunction = httpsCallable(functions, 'createUser');
      await createUserFunction({ email: newUser.email, password: newUser.password, nome: newUser.nome, role: 'user' });
      alert('Usuário criado com sucesso!');
      setIsModalOpen(false);
      setNewUser({ nome: '', email: '', password: '', role: 'user' });
    } catch (error) {
      setCreationError(error.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Criar Novo Usuário
        </Button>
      </div>
      <Card>
        <CardContent>
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Permissão</th>
                <th className="px-6 py-3">Alterar Permissão</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(user => (
                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{user.nome || 'Não informado'}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.id !== currentUser.uid && (
                      <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="border rounded-md p-1 text-xs">
                        <option value="user">Usuário</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Criar Novo Usuário">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input id="nome" label="Nome" value={newUser.nome} onChange={handleInputChange} />
          <Input id="email" label="Email" type="email" value={newUser.email} onChange={handleInputChange} />
          <Input id="password" label="Senha" type="password" value={newUser.password} onChange={handleInputChange} />
          {creationError && <p className="text-red-600">{creationError}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreating ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- LAYOUT PRINCIPAL ---
const AppLayout = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { user, userRole } = useAuth();

  const handleLogout = async () => await signOut(auth);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'materias_primas', label: 'Matérias-Primas', icon: BeakerIcon, adminOnly: false },
    { id: 'usuarios', label: 'Usuários', icon: Users, adminOnly: true },
  ];

  const renderPage = () => {
    if (currentPage === 'usuarios') return <UsuariosPage />;
    return <div>Página {currentPage} em construção.</div>;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-gray-300 flex flex-col">
        <div className="flex items-center justify-center h-20 border-b border-gray-700">
          <img src="/logo.png" alt="Logo" className="h-full" />
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.filter(item => !item.adminOnly || userRole === 'admin').map(item => (
            <a key={item.id} href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(item.id); }} className={`flex items-center px-4 py-2.5 rounded-md ${currentPage === item.id ? 'bg-gray-900 text-white' : 'hover:bg-gray-700'}`}>
              <item.icon className="w-5 h-5 mr-3" /> {item.label}
            </a>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <Button onClick={handleLogout} variant="destructive" className="w-full">Sair</Button>
        </div>
      </aside>
      <main className="flex-1 p-6">{renderPage()}</main>
    </div>
  );
};

// --- ERRO DE VARIÁVEIS ---
const EnvVarError = () => (
  <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
    <p>Variáveis do Firebase não configuradas.</p>
  </div>
);

// --- APP PRINCIPAL ---
export default function App() {
  if (!firebaseConfig.apiKey) return <EnvVarError />;
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

const Root = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Carregando...</div>;
  return user ? <AppLayout /> : <LoginPage />;
};