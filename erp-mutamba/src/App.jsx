import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    onSnapshot,
    doc,
    addDoc,
    deleteDoc,
    serverTimestamp,
    getDoc,
    updateDoc,
    setDoc
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { BeakerIcon, Gem, LayoutDashboard, FilePlus2, Boxes, Package, Factory, ShoppingCart, BarChart3, Users, FlaskConicalOff, ClipboardList, PackageSearch, Globe, BarChartBig, Plus, Trash2, Edit, X, ShieldCheck, Loader2 } from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID
};

// **NOVA LINHA PARA DEBUG**
// Esta linha irá mostrar no console do navegador as chaves que a Vercel está usando.
console.log("Firebase Config Loaded:", firebaseConfig);


// --- INICIALIZAÇÃO DO FIREBASE ---
let app;
if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'southamerica-east1');
const SUPER_ADMIN_EMAIL = "yuri@teste.com";

// --- CONTEXTO DE AUTENTICAÇÃO E PERMISSÕES ---
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
                    if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
                        setUserRole('admin');
                    } else {
                        setUserRole('user');
                    }
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

    const value = { user, userRole, loading };
    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

const useAuth = () => useContext(AuthContext);

// --- COMPONENTES DE UI ---
const Card = ({ children, className = '' }) => <div className={`bg-white rounded-lg shadow-md ${className}`}>{children}</div>;
const CardContent = ({ children, className = '' }) => <div className={`p-4 ${className}`}>{children}</div>;

const Button = ({ children, onClick, className = '', variant = 'default', type = 'button', disabled = false }) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        default: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 focus:ring-gray-400',
        ghost: 'hover:bg-gray-100',
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    };
    return <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} px-4 py-2 ${className}`}>{children}</button>;
};

const Input = ({ label, id, type = 'text', placeholder, value, onChange, className = '' }) => (
    <div>
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${className}`} />
    </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};


// --- TELA DE LOGIN ---
const LoginPage = () => { /* ...código existente sem alterações... */ return <div>...</div> };

// --- PÁGINA DE MATÉRIAS-PRIMAS ---
const MateriasPrimasPage = () => { /* ...código existente sem alterações... */ return <div>Página de Matérias-Primas</div>; };

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
            const usersData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(user => user.email !== SUPER_ADMIN_EMAIL);
            setUsuarios(usersData);
        });
        return () => unsubscribe();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        if (userId === currentUser.uid) {
            alert("Você não pode alterar sua própria permissão.");
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
            const result = await createUserFunction({
                email: newUser.email,
                password: newUser.password,
                nome: newUser.nome,
                role: 'user'
            });
            console.log(result.data.result);
            alert("Usuário criado com sucesso!");
            setIsModalOpen(false);
            setNewUser({ nome: '', email: '', password: '', role: 'user' });
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            setCreationError(error.message || "Ocorreu um erro desconhecido.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
                <Button onClick={() => { setIsModalOpen(true); setCreationError(''); }}><Plus className="w-4 h-4 mr-2" /> Criar Novo Usuário</Button>
            </div>
            <Card>
                <CardContent>
                    <div className="overflow-x-auto">
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
                                        <td className="px-6 py-4 font-medium text-gray-900">{user.nome || 'Não informado'}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</span></td>
                                        <td className="px-6 py-4">
                                            {user.id !== currentUser.uid && (
                                                <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="border border-gray-300 rounded-md p-1 text-xs focus:ring-indigo-500 focus:border-indigo-500">
                                                    <option value="user">Usuário</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Criar Novo Usuário">
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <Input id="nome" label="Nome Completo" value={newUser.nome} onChange={handleInputChange} />
                    <Input id="email" label="Email" type="email" value={newUser.email} onChange={handleInputChange} />
                    <Input id="password" label="Senha" type="password" value={newUser.password} onChange={handleInputChange} />
                    {creationError && <p className="text-sm text-red-600 text-center">{creationError}</p>}
                    <div className="flex justify-end pt-4">
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


// --- LAYOUT PRINCIPAL E NAVEGAÇÃO ---
const AppLayout = () => { /* ...código existente sem alterações... */ return <div>...</div> };

// --- COMPONENTE RAIZ E DE ERRO ---
const EnvVarError = () => <div>Erro de Configuração do Firebase. Verifique seu arquivo .env.local</div>;

export default function App() {
    if (!import.meta.env.VITE_API_KEY) return <EnvVarError />;
    return <AuthProvider><Root /></AuthProvider>;
}

const Root = () => {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-900"><p className="text-white">Carregando...</p></div>;
    return user ? <AppLayout /> : <LoginPage />;
};