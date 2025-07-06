import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    onSnapshot,
    doc,
    addDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { BeakerIcon, Gem, LayoutDashboard, FilePlus2, Boxes, Package, Factory, ShoppingCart, BarChart3, Users, FlaskConicalOff, ClipboardList, PackageSearch, Globe, BarChartBig, Plus, Trash2, Edit, X } from 'lucide-react';

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

// --- CONTEXTO DE AUTENTICAÇÃO ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const value = { user, loading };
    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

const useAuth = () => useContext(AuthContext);

// --- COMPONENTES DE UI ---
const Card = ({ children, className = '' }) => <div className={`bg-white rounded-lg shadow-md ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }) => <div className={`p-4 border-b ${className}`}>{children}</div>;
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
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${className}`} />
    </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
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
                    {/* Campos de Input e Botão */}
                </form>
            </div>
        </div>
    );
};

// --- PÁGINA DE MATÉRIAS-PRIMAS ---
const MateriasPrimasPage = () => {
    const [materiasPrimas, setMateriasPrimas] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMateriaPrima, setNewMateriaPrima] = useState({
        codigo: '', nome: '', descricao: '', unidadeMedida: 'KG', estoqueAtual: 0, estoqueMinimo: 0,
    });
    const { user } = useAuth();

    // Buscar dados do Firestore
    useEffect(() => {
        if (!user) return;
        const collectionPath = `empresas/${user.uid}/materias_primas`;
        const unsubscribe = onSnapshot(collection(db, collectionPath), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMateriasPrimas(data);
        });
        return () => unsubscribe();
    }, [user]);

    const handleInputChange = (e) => {
        const { id, value, type } = e.target;
        setNewMateriaPrima(prev => ({
            ...prev,
            [id]: type === 'number' ? parseFloat(value) : value,
        }));
    };

    const handleAddMateriaPrima = async (e) => {
        e.preventDefault();
        if (!user || !newMateriaPrima.nome || !newMateriaPrima.codigo) {
            alert("Código e Nome são obrigatórios.");
            return;
        }
        const collectionPath = `empresas/${user.uid}/materias_primas`;
        await addDoc(collection(db, collectionPath), {
            ...newMateriaPrima,
            dataCriacao: serverTimestamp(),
        });
        setNewMateriaPrima({ codigo: '', nome: '', descricao: '', unidadeMedida: 'KG', estoqueAtual: 0, estoqueMinimo: 0 });
        setIsModalOpen(false);
    };

    const handleDelete = async (id) => {
        if (!user || !window.confirm("Tem certeza que deseja excluir este item?")) return;
        const docPath = `empresas/${user.uid}/materias_primas/${id}`;
        await deleteDoc(doc(db, docPath));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Matérias-Primas</h1>
                <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Adicionar Matéria-Prima</Button>
            </div>

            <Card>
                <CardContent>
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Código</th>
                                <th className="px-6 py-3">Nome</th>
                                <th className="px-6 py-3">Estoque Atual</th>
                                <th className="px-6 py-3">Un.</th>
                                <th className="px-6 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materiasPrimas.map(item => (
                                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.codigo}</td>
                                    <td className="px-6 py-4">{item.nome}</td>
                                    <td className="px-6 py-4">{item.estoqueAtual}</td>
                                    <td className="px-6 py-4">{item.unidadeMedida}</td>
                                    <td className="px-6 py-4 flex justify-end space-x-2">
                                        <Button variant="ghost" className="p-2 h-auto"><Edit size={16} /></Button>
                                        <Button variant="ghost" className="p-2 h-auto" onClick={() => handleDelete(item.id)}><Trash2 size={16} className="text-red-600" /></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Nova Matéria-Prima">
                <form onSubmit={handleAddMateriaPrima} className="space-y-4">
                    <Input id="codigo" label="Código" value={newMateriaPrima.codigo} onChange={handleInputChange} placeholder="Ex: MP-001" />
                    <Input id="nome" label="Nome" value={newMateriaPrima.nome} onChange={handleInputChange} placeholder="Ex: Lauril Éter" />
                    <Input id="descricao" label="Descrição" value={newMateriaPrima.descricao} onChange={handleInputChange} placeholder="Descrição do insumo" />
                    <Input id="unidadeMedida" label="Unidade de Medida" value={newMateriaPrima.unidadeMedida} onChange={handleInputChange} placeholder="Ex: KG, L, Un" />
                    <Input id="estoqueAtual" label="Estoque Inicial" type="number" value={newMateriaPrima.estoqueAtual} onChange={handleInputChange} />
                    <Input id="estoqueMinimo" label="Estoque Mínimo" type="number" value={newMateriaPrima.estoqueMinimo} onChange={handleInputChange} />
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Salvar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

// --- LAYOUT PRINCIPAL E NAVEGAÇÃO ---
const AppLayout = () => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const { user } = useAuth();
    
    const handleLogout = async () => await signOut(auth);

    const renderPage = () => {
        switch (currentPage) {
            case 'materias_primas': return <MateriasPrimasPage />;
            // Adicione outros casos aqui
            default: return <div>Dashboard e outras páginas em construção.</div>;
        }
    };
    
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'cadastros', label: 'Cadastros', icon: FilePlus2 },
        { id: 'materias_primas', label: 'Matérias-Primas', icon: BeakerIcon },
        { id: 'estoque', label: 'Estoque', icon: Boxes },
        { id: 'embalagens', label: 'Embalagens Cliente', icon: Package },
        { id: 'producao', label: 'Produção', icon: Factory },
        { id: 'compras', label: 'Compras e Custos', icon: ShoppingCart },
        { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
        { id: 'usuarios', label: 'Usuários', icon: Users },
    ];

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <aside className="flex flex-col w-64 bg-gray-800 text-gray-300">
                <div className="flex items-center justify-center h-20 p-4 border-b border-gray-700">
                    <img src="/logo.png" alt="Logo Mutamba" className="h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/150x50/1F2937/FFFFFF?text=Mutamba'; }} />
                </div>
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navItems.map(item => (
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
                            <a href="#" onClick={handleLogout} className="text-xs text-indigo-400 hover:underline">Sair</a>
                        </div>
                    </div>
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
