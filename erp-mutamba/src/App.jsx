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
import { BeakerIcon, Gem, LayoutDashboard, FilePlus2, Boxes, Package, Factory, ShoppingCart, BarChart3, Users, FlaskConicalOff, ClipboardList, PackageSearch, Globe, BarChartBig, Plus, Trash2, Edit, X, ShieldCheck } from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID
};

// --- INICIALIZAÇÃO DO FIREBASE ---
let app;
if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const db = getFirestore(app);
const SUPER_ADMIN_EMAIL = "yuri@teste.com";

// --- CONTEXTO DE AUTENTICAÇÃO E PERMISSÕES ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'admin' ou 'user'
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
        } catch (err) {
            setError('Falha ao fazer login. Verifique suas credenciais.');
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 font-sans">
            <div className="w-full max-w-sm p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl">
                <div className="text-center">
                    <img src="/logo.png" alt="Logo Mutamba Cosmetics" className="mx-auto h-20 w-auto" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/180x60/111827/FFFFFF?text=Mutamba'; }} />
                    <p className="mt-4 text-center text-sm text-gray-400">Faça login para continuar.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <Input id="email" type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" />
                    <Input id="password" type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 rounded" />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">Lembrar-me</label>
                        </div>
                        <div className="text-sm"><a href="#" className="font-medium text-blue-500 hover:text-blue-400">Esqueceu a senha?</a></div>
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <div><Button type="submit" variant="primary" className="w-full py-2.5" disabled={isLoggingIn}>{isLoggingIn ? 'Entrando...' : 'Entrar'}</Button></div>
                </form>
            </div>
        </div>
    );
};

// --- PÁGINA DE MATÉRIAS-PRIMAS ---
const MateriasPrimasPage = () => { /* ...código existente sem alterações... */ return <div>Página de Matérias-Primas</div>; };

// --- PÁGINA DE USUÁRIOS ---
const UsuariosPage = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ nome: '', email: '', password: '', role: 'user' });
    const { user: currentUser } = useAuth();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'usuarios'), (snapshot) => {
            const usersData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(user => user.email !== SUPER_ADMIN_EMAIL); // Filtra o super admin
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
        // Esta é uma função simplificada. Para produção, use o Firebase Admin SDK no backend para criar usuários.
        alert("Funcionalidade de criação de usuário requer configuração de backend (Admin SDK) para ser segura. Este é um protótipo.");
        // Lógica de protótipo:
        // 1. Chamar uma Cloud Function que usa o Admin SDK para criar o usuário no Authentication.
        // 2. A Cloud Function retornaria o UID do novo usuário.
        // 3. Criar o documento na coleção 'usuarios' com o UID retornado e os dados do formulário.
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
                <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Criar Novo Usuário</Button>
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
                    <div className="flex justify-end pt-4"><Button type="submit">Criar Usuário</Button></div>
                </form>
            </Modal>
        </div>
    );
};


// --- LAYOUT PRINCIPAL E NAVEGAÇÃO ---
const AppLayout = () => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const { user, userRole } = useAuth();
    
    const handleLogout = async () => await signOut(auth);

    const renderPage = () => {
        switch (currentPage) {
            case 'materias_primas': return <MateriasPrimasPage />;
            case 'usuarios': return <UsuariosPage />;
            default: return <div>Página de <span className="font-semibold">{currentPage}</span> em construção.</div>;
        }
    };
    
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
        { id: 'materias_primas', label: 'Matérias-Primas', icon: BeakerIcon, adminOnly: false },
        { id: 'estoque', label: 'Estoque', icon: Boxes, adminOnly: false },
        { id: 'producao', label: 'Produção', icon: Factory, adminOnly: false },
        { id: 'cadastros', label: 'Cadastros Gerais', icon: FilePlus2, adminOnly: true },
        { id: 'relatorios', label: 'Relatórios', icon: BarChart3, adminOnly: true },
        { id: 'usuarios', label: 'Usuários', icon: Users, adminOnly: true },
    ];

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <aside className="flex flex-col w-64 bg-gray-800 text-gray-300">
                <div className="flex items-center justify-center h-20 p-4 border-b border-gray-700">
                    <img src="/logo.png" alt="Logo Mutamba" className="h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/150x50/1F2937/FFFFFF?text=Mutamba'; }} />
                </div>
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navItems.filter(item => !item.adminOnly || userRole === 'admin').map(item => (
                        <a key={item.id} href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(item.id); }}
                           className={`flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${currentPage === item.id ? 'bg-gray-900 text-white' : 'hover:bg-gray-700 hover:text-white'}`}>
                            <item.icon className="w-5 h-5 mr-3" /> {item.label}
                        </a>
                    ))}
                </nav>
                 <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center">
                        <img className="w-10 h-10 rounded-full" src={`https://placehold.co/100x100/6366f1/white?text=${user?.email?.[0]?.toUpperCase() || 'A'}`} alt="Avatar" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">{user?.email || 'Usuário'}</p>
                            {userRole === 'admin' && <span className="text-xs font-medium text-yellow-400 flex items-center"><ShieldCheck size={12} className="mr-1"/> Administrador</span>}
                        </div>
                    </div>
                    <Button onClick={handleLogout} variant="destructive" className="w-full mt-4 text-xs">Sair</Button>
                </div>
            </aside>
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{renderPage()}</main>
        </div>
    );
};

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