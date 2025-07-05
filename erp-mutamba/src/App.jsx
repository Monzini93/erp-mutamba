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
    deleteDoc
} from 'firebase/firestore';
import { Gem, LayoutDashboard, FilePlus2, Boxes, Package, Factory, ShoppingCart, BarChart3, Users, FlaskConicalOff, ClipboardList, PackageSearch, Globe, BarChartBig, Plus, Trash2, Edit } from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
// Este objeto agora lê as variáveis de ambiente do Vite (arquivo .env.local)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID
};


// --- INICIALIZAÇÃO DO FIREBASE ---
// Adicionamos uma verificação para garantir que as chaves existem antes de inicializar
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
        // Apenas observa o estado de autenticação, sem fazer login automático.
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = { user, loading };
    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

const useAuth = () => {
    return useContext(AuthContext);
};

// --- COMPONENTES DE UI (Estilo shadcn/ui) ---
const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        {children}
    </div>
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
        <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} px-4 py-2 ${className}`}>
            {children}
        </button>
    );
};

const Input = ({ type = 'text', placeholder, value, onChange, className = '' }) => (
    <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${className}`}
    />
);


// --- TELA DE LOGIN (ATUALIZADA) ---
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
            if (!email || !password) {
                setError('Por favor, preencha e-mail e senha.');
                setIsLoggingIn(false);
                return;
            }
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Falha ao fazer login. Verifique suas credenciais.');
            console.error("LoginPage: Erro no login -", err.code);
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 font-sans">
            <div className="w-full max-w-sm p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl">
                <div className="text-center">
                    {/* LOGO NA TELA DE LOGIN */}
                    <img src="/logo.png" alt="Logo Mutamba Cosmetics" className="mx-auto h-20 w-auto" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/180x60/111827/FFFFFF?text=Mutamba'; }} />
                    <p className="mt-4 text-center text-sm text-gray-400">
                        Faça login para continuar.
                    </p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        type="email"
                        placeholder="Seu e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Input
                        type="password"
                        placeholder="Sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 rounded" />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                                Lembrar-me
                            </label>
                        </div>
                        <div className="text-sm">
                            <a href="#" className="font-medium text-blue-500 hover:text-blue-400">
                                Esqueceu a senha?
                            </a>
                        </div>
                    </div>

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


// --- PÁGINA DO DASHBOARD ---
const DashboardPage = () => (
    <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Matérias-Primas Baixas</p>
                        <p className="text-3xl font-bold text-red-500">12</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full"><FlaskConicalOff className="w-6 h-6 text-red-500" /></div>
                </div>
            </Card>
            <Card>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Ordens de Produção Ativas</p>
                        <p className="text-3xl font-bold text-blue-500">8</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full"><ClipboardList className="w-6 h-6 text-blue-500" /></div>
                </div>
            </Card>
            <Card>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Embalagens Críticas</p>
                        <p className="text-3xl font-bold text-yellow-500">5</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full"><PackageSearch className="w-6 h-6 text-yellow-500" /></div>
                </div>
            </Card>
            <Card>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Exportações (Mês)</p>
                        <p className="text-3xl font-bold text-green-500">23</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full"><Globe className="w-6 h-6 text-green-500" /></div>
                </div>
            </Card>
        </div>
        <Card className="mt-8">
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-700">Visão Geral da Produção</h3>
            </div>
            <div className="p-4 h-80 flex items-center justify-center bg-gray-50 rounded-b-lg">
                <BarChartBig className="w-24 h-24 text-gray-300" />
                 <p className="text-gray-400 ml-4">Gráfico de produção será exibido aqui.</p>
            </div>
        </Card>
    </div>
);

// --- PÁGINA DE CADASTROS ---
const CadastrosPage = () => {
    const [produtos, setProdutos] = useState([]);
    const { user } = useAuth();
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    useEffect(() => {
        if (!user) return;
        const userId = user.uid;
        const collectionPath = `artifacts/${appId}/users/${userId}/produtos`;
        const q = collection(db, collectionPath);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const produtosData = [];
            querySnapshot.forEach((doc) => {
                produtosData.push({ id: doc.id, ...doc.data() });
            });
            setProdutos(produtosData);
        });
        return () => unsubscribe();
    }, [user, appId]);

    const handleAddProduto = async () => {
        if (!user) return;
        const userId = user.uid;
        const collectionPath = `artifacts/${appId}/users/${userId}/produtos`;
        const nome = prompt("Nome do novo produto:", "Novo Shampoo 500ml");
        if (nome) {
            await addDoc(collection(db, collectionPath), {
                codigo: `PA-${Math.floor(1000 + Math.random() * 9000)}`,
                nome: nome,
                unidade: 'Unidade',
                formula: `FORM-${Math.floor(10 + Math.random() * 90)}`
            });
        }
    };
    
    const handleDeleteProduto = async (id) => {
        if (!user || !id) return;
        // Substituindo window.confirm por uma verificação simples para o ambiente de protótipo.
        const confirmed = true; // Em um app real, use um modal de confirmação.
        if (confirmed) {
            const userId = user.uid;
            const docPath = `artifacts/${appId}/users/${userId}/produtos/${id}`;
            await deleteDoc(doc(db, docPath));
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Cadastro de Produtos</h1>
            <Card className="mt-6">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-700">Produtos Acabados</h3>
                    <Button onClick={handleAddProduto}>
                        <Plus className="w-4 h-4 mr-2" /> Novo Produto
                    </Button>
                </div>
                <div className="p-4 overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Código</th>
                                <th className="px-6 py-3">Nome do Produto</th>
                                <th className="px-6 py-3">Unidade</th>
                                <th className="px-6 py-3">Fórmula</th>
                                <th className="px-6 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {produtos.map(p => (
                                <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{p.codigo}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{p.nome}</td>
                                    <td className="px-6 py-4">{p.unidade}</td>
                                    <td className="px-6 py-4">{p.formula}</td>
                                    <td className="px-6 py-4 flex justify-end space-x-2">
                                        <Button variant="ghost" className="p-2 h-auto"><Edit className="w-4 h-4 text-gray-600"/></Button>
                                        <Button variant="ghost" className="p-2 h-auto" onClick={() => handleDeleteProduto(p.id)}><Trash2 className="w-4 h-4 text-red-600"/></Button>
                                    </td>
                                </tr>
                            ))}
                             {produtos.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-gray-500">Nenhum produto cadastrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// --- LAYOUT PRINCIPAL ---
const AppLayout = () => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const { user } = useAuth();
    
    const handleLogout = async () => {
        await signOut(auth);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <DashboardPage />;
            case 'cadastros': return <CadastrosPage />;
            // Adicione outros casos para outras páginas aqui
            default: return <div className="text-gray-600">Página de <span className="font-semibold">{currentPage}</span> em construção.</div>;
        }
    };
    
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'cadastros', label: 'Cadastros', icon: FilePlus2 },
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
                    {/* LOGO NA BARRA LATERAL */}
                    <img src="/logo.png" alt="Logo Mutamba" className="h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/150x50/1F2937/FFFFFF?text=Mutamba'; }} />
                </div>
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navItems.map(item => (
                        <a
                            key={item.id}
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(item.id); }}
                            className={`flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${currentPage === item.id ? 'bg-gray-900 text-white' : 'hover:bg-gray-700 hover:text-white'}`}
                        >
                            <item.icon className="w-5 h-5 mr-3" /> {item.label}
                        </a>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center">
                        <img className="w-10 h-10 rounded-full" src={`https://placehold.co/100x100/6366f1/white?text=${user?.email?.[0]?.toUpperCase() || 'A'}`} alt="Avatar" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">{user?.email || 'Usuário Anônimo'}</p>
                            <a href="#" onClick={handleLogout} className="text-xs text-indigo-400 hover:underline">Sair</a>
                        </div>
                    </div>
                </div>
            </aside>
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                {renderPage()}
            </main>
        </div>
    );
};

// --- COMPONENTE DE ERRO PARA VARIÁVEIS DE AMBIENTE ---
const EnvVarError = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#111827'
    }}>
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#f87171', backgroundColor: '#1f2937', border: '1px solid #ef4444', margin: '2rem', borderRadius: '8px', maxWidth: '600px' }}>
            <h1 style={{color: '#ef4444', fontSize: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem'}}>Erro de Configuração do Firebase</h1>
            <p style={{marginTop: '1rem', color: '#d1d5db'}}>As variáveis de ambiente do Firebase não foram carregadas.</p>
            <ul style={{listStyleType: 'disc', color: '#d1d5db', marginLeft: '2rem', marginTop: '0.5rem', lineHeight: '1.6'}}>
                <li>Verifique se você criou um arquivo chamado <strong><code>.env.local</code></strong> na pasta raiz do seu projeto (<code>erp-mutamba</code>).</li>
                <li>Certifique-se de que o arquivo contém suas chaves do Firebase, começando com <code>VITE_</code> (ex: <code>VITE_API_KEY=...</code>).</li>
                <li>Após criar ou alterar o arquivo <code>.env.local</code>, você <strong>precisa parar (Ctrl+C) e reiniciar o servidor</strong> com <code>npm run dev</code>.</li>
            </ul>
        </div>
    </div>
);

// --- COMPONENTE RAIZ ---
export default function App() {
    // Verifica se as chaves do Firebase foram carregadas. Se não, mostra uma tela de erro clara.
    if (!import.meta.env.VITE_API_KEY) {
        return <EnvVarError />;
    }

    return (
        <AuthProvider>
            <Root />
        </AuthProvider>
    );
}

const Root = () => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <p className="text-white">Carregando...</p>
            </div>
        );
    }

    // Agora, o sistema mostra a LoginPage se não houver usuário logado.
    return user ? <AppLayout /> : <LoginPage />;
};