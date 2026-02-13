
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BrainCircuit, 
  Plus, 
  TrendingUp, 
  AlertCircle,
  Trash2,
  CheckCircle2,
  ChevronRight,
  Store,
  Tag
} from 'lucide-react';
import { View, Product, Sale, Debt } from './types';
import { getBusinessInsights } from './services/geminiService';

// --- Reusable Components ---

const StatCard: React.FC<{ title: string; value: string; color: string; icon: React.ReactNode }> = ({ title, value, color, icon }) => (
  <div className={`p-4 rounded-2xl bg-white shadow-sm border border-slate-100 flex flex-col justify-between h-32`}>
    <div className="flex justify-between items-start">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        {icon}
      </div>
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
    </div>
    <div className="mt-2">
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

const Navbar: React.FC<{ currentView: View; setView: (v: View) => void }> = ({ currentView, setView }) => {
  const items = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard size={24} /> },
    { id: 'sales', label: 'Vendas', icon: <ShoppingCart size={24} /> },
    { id: 'inventory', label: 'Estoque', icon: <Package size={24} /> },
    { id: 'debts', label: 'Fiado', icon: <Users size={24} /> },
    { id: 'ai', label: 'Dicas', icon: <BrainCircuit size={24} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center px-2 py-3 safe-bottom z-50">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id as View)}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentView === item.id ? 'text-blue-600' : 'text-slate-400'
          }`}
        >
          <div className={currentView === item.id ? 'transform scale-110' : ''}>
            {item.icon}
          </div>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  // State
  const [view, setView] = useState<View>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [aiTips, setAiTips] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [businessType, setBusinessType] = useState('Minha Loja');

  // New Item States
  const [showAddModal, setShowAddModal] = useState<View | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);

  // Load Data
  useEffect(() => {
    const savedProducts = localStorage.getItem('k_products');
    const savedSales = localStorage.getItem('k_sales');
    const savedDebts = localStorage.getItem('k_debts');
    
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedSales) setSales(JSON.parse(savedSales));
    if (savedDebts) setDebts(JSON.parse(savedDebts));
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem('k_products', JSON.stringify(products));
    localStorage.setItem('k_sales', JSON.stringify(sales));
    localStorage.setItem('k_debts', JSON.stringify(debts));
  }, [products, sales, debts]);

  // Derived Stats
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.startsWith(today));
  const totalTodayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  const totalTodayProfit = todaySales.reduce((acc, s) => acc + s.profit, 0);
  const totalPendingDebt = debts.filter(d => d.status === 'pending').reduce((acc, d) => acc + d.amount, 0);

  // Categories list derived from products
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).filter(Boolean);
  }, [products]);

  // Actions
  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProduct = { ...p, id: Math.random().toString(36).substr(2, 9) };
    setProducts([...products, newProduct]);
    setShowAddModal(null);
    setIsNewCategory(false);
  };

  const deleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product && window.confirm(`Deseja realmente excluir o produto "${product.name}"?`)) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const addSale = (s: Omit<Sale, 'id' | 'date' | 'profit' | 'productName'>) => {
    const product = products.find(p => p.id === s.productId);
    if (!product) return;
    
    const profit = s.total - (product.cost * s.quantity);
    const newSale: Sale = {
      ...s,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      profit,
      productName: product.name
    };

    setSales([newSale, ...sales]);
    
    // Update Stock
    setProducts(products.map(p => 
      p.id === s.productId ? { ...p, stock: p.stock - s.quantity } : p
    ));

    // Handle Debt
    if (s.paymentMethod === 'debt' && s.customerName) {
      const newDebt: Debt = {
        id: Math.random().toString(36).substr(2, 9),
        customerName: s.customerName,
        amount: s.total,
        date: new Date().toISOString(),
        status: 'pending',
        description: `Venda de ${s.quantity}x ${product.name}`
      };
      setDebts([newDebt, ...debts]);
    }
    
    setShowAddModal(null);
  };

  const addDebt = (d: Omit<Debt, 'id' | 'date' | 'status'>) => {
    const newDebt: Debt = {
      ...d,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      status: 'pending'
    };
    setDebts([newDebt, ...debts]);
    setShowAddModal(null);
  };

  const handlePayDebt = (id: string) => {
    setDebts(debts.map(d => d.id === id ? { ...d, status: 'paid' } : d));
  };

  const fetchTips = async () => {
    setLoadingAi(true);
    const tips = await getBusinessInsights({ products, sales, debts, businessType });
    setAiTips(tips);
    setLoadingAi(false);
  };

  // --- Views ---

  const Dashboard = () => (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Olá, {businessType}!</h1>
          <p className="text-sm text-slate-500">Resumo de hoje ({today})</p>
        </div>
        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
          <Store size={24} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard 
          title="Vendas Hoje" 
          value={`Kz ${totalTodayRevenue.toLocaleString()}`} 
          color="bg-green-500" 
          icon={<TrendingUp size={20} />} 
        />
        <StatCard 
          title="Lucro Hoje" 
          value={`Kz ${totalTodayProfit.toLocaleString()}`} 
          color="bg-blue-500" 
          icon={<LayoutDashboard size={20} />} 
        />
        <StatCard 
          title="Dívidas" 
          value={`Kz ${totalPendingDebt.toLocaleString()}`} 
          color="bg-red-500" 
          icon={<AlertCircle size={20} />} 
        />
        <StatCard 
          title="Itens Baixos" 
          value={`${products.filter(p => p.stock < 5).length}`} 
          color="bg-orange-500" 
          icon={<Package size={20} />} 
        />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <ChevronRight size={18} className="text-blue-600" />
          Vendas Recentes
        </h2>
        <div className="space-y-3">
          {sales.slice(0, 5).map(sale => (
            <div key={sale.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-700">{sale.productName}</p>
                <p className="text-xs text-slate-400">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.paymentMethod === 'cash' ? 'Dinheiro' : sale.paymentMethod === 'debt' ? 'Fiado' : 'Transferência'}</p>
              </div>
              <p className="font-bold text-green-600">+Kz {sale.total}</p>
            </div>
          ))}
          {sales.length === 0 && (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
              Nenhuma venda ainda hoje.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const SalesView = () => (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Histórico de Vendas</h1>
        <button 
          onClick={() => setShowAddModal('sales')}
          className="bg-blue-600 text-white p-2 rounded-xl flex items-center gap-1 font-semibold"
        >
          <Plus size={20} /> Nova Venda
        </button>
      </div>

      <div className="space-y-4">
        {sales.map(sale => (
          <div key={sale.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800">{sale.productName}</h3>
                <p className="text-xs text-slate-500">{new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">Kz {sale.total}</p>
                <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Lucro: Kz {sale.profit}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{sale.quantity} unid.</span>
              <span className={`text-[10px] px-2 py-1 rounded-full ${
                sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-600' :
                sale.paymentMethod === 'debt' ? 'bg-red-100 text-red-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {sale.paymentMethod.toUpperCase()}
              </span>
              {sale.customerName && (
                <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-1 rounded-full">👤 {sale.customerName}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const InventoryView = () => (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Estoque</h1>
        <button 
          onClick={() => {
            setIsNewCategory(false);
            setShowAddModal('inventory');
          }}
          className="bg-blue-600 text-white p-2 rounded-xl flex items-center gap-1 font-semibold"
        >
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {product.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{product.name}</h3>
                <p className="text-xs text-slate-500">Custo: Kz {product.cost} • Preço: Kz {product.price}</p>
                <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full mt-1">
                  <Tag size={8} /> {product.category || 'Sem Categoria'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`font-bold ${product.stock < 5 ? 'text-red-500' : 'text-slate-700'}`}>{product.stock} em mãos</p>
                <p className="text-[10px] text-slate-400">Total: Kz {product.stock * product.price}</p>
              </div>
              <button 
                onClick={() => deleteProduct(product.id)}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                title="Excluir Produto"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <Package className="mx-auto text-slate-300 mb-2" size={48} />
            <p className="text-slate-500">Nenhum produto cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );

  const DebtsView = () => (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dívidas (Fiado)</h1>
        <button 
          onClick={() => setShowAddModal('debts')}
          className="bg-red-600 text-white p-2 rounded-xl flex items-center gap-1 font-semibold shadow-md"
        >
          <Plus size={20} /> Novo Fiado
        </button>
      </div>

      <div className="space-y-4">
        {debts.map(debt => (
          <div key={debt.id} className={`p-4 rounded-2xl shadow-sm border flex justify-between items-center ${
            debt.status === 'paid' ? 'bg-slate-50 border-slate-100' : 'bg-white border-red-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${debt.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {debt.status === 'paid' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                <h3 className={`font-bold ${debt.status === 'paid' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{debt.customerName}</h3>
                <p className="text-xs text-slate-500">{debt.description}</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-4">
              <div>
                <p className={`font-bold ${debt.status === 'paid' ? 'text-slate-400' : 'text-red-600'}`}>Kz {debt.amount}</p>
                <p className="text-[10px] text-slate-400">{new Date(debt.date).toLocaleDateString()}</p>
              </div>
              {debt.status === 'pending' && (
                <button 
                  onClick={() => handlePayDebt(debt.id)}
                  className="bg-green-600 text-white p-2 rounded-lg"
                >
                  <CheckCircle2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
        {debts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
             <Users className="mx-auto text-slate-300 mb-2" size={48} />
             <p className="text-slate-500">Ninguém está te devendo!</p>
          </div>
        )}
      </div>
    </div>
  );

  const AiConsultantView = () => (
    <div className="animate-in slide-in-from-bottom duration-500 pb-20">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white mb-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Dicas de Negócio</h1>
          <p className="text-blue-100 opacity-90">Análise inteligente das suas vendas para crescer mais rápido.</p>
          <button 
            onClick={fetchTips}
            disabled={loadingAi}
            className="mt-6 bg-white text-blue-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
          >
            {loadingAi ? 'Analisando...' : 'Pedir Conselho à Gemini'}
            <BrainCircuit size={20} />
          </button>
        </div>
        <BrainCircuit className="absolute -right-10 -bottom-10 opacity-10" size={240} />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[300px]">
        {loadingAi ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 animate-pulse">A Gemini está analisando seus dados...</p>
          </div>
        ) : aiTips ? (
          <div className="prose prose-slate prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium text-lg">
              {aiTips.split('\n').map((line, i) => (
                <p key={i} className="mb-4">{line}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-400 max-w-[200px] mx-auto">Clique no botão acima para ver como melhorar seu negócio hoje.</p>
          </div>
        )}
      </div>
    </div>
  );

  // --- Modals ---

  const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 text-2xl">&times;</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-slate-50 px-4 pt-6 pb-24 relative overflow-x-hidden">
      
      {/* Header for small settings */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic">K</div>
            <span className="font-bold text-slate-800 tracking-tight">KIMBILA</span>
        </div>
        <button className="text-slate-400" onClick={() => {
            const name = prompt("Nome do Negócio:", businessType);
            if(name) setBusinessType(name);
        }}>
            <Store size={20} />
        </button>
      </div>

      {/* Dynamic View */}
      {view === 'dashboard' && <Dashboard />}
      {view === 'sales' && <SalesView />}
      {view === 'inventory' && <InventoryView />}
      {view === 'debts' && <DebtsView />}
      {view === 'ai' && <AiConsultantView />}

      {/* Navigation */}
      <Navbar currentView={view} setView={setView} />

      {/* Add Modals */}
      {showAddModal === 'inventory' && (
        <Modal title="Novo Produto" onClose={() => {
          setShowAddModal(null);
          setIsNewCategory(false);
        }}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const categoryValue = isNewCategory 
              ? fd.get('newCategory') as string 
              : fd.get('category') as string;

            addProduct({
              name: fd.get('name') as string,
              price: Number(fd.get('price')),
              cost: Number(fd.get('cost')),
              stock: Number(fd.get('stock')),
              category: categoryValue || 'Geral'
            });
          }} className="space-y-4">
            <input name="name" placeholder="Nome do Produto" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" />
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase px-1">Categoria</label>
              {!isNewCategory ? (
                <div className="flex gap-2">
                  <select 
                    name="category" 
                    className="flex-1 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    onChange={(e) => {
                      if (e.target.value === "__NEW__") setIsNewCategory(true);
                    }}
                  >
                    <option value="Geral">Escolha uma categoria</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__NEW__" className="text-blue-600 font-bold">+ Criar Nova Categoria</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                   <input 
                    name="newCategory" 
                    placeholder="Nome da Nova Categoria" 
                    autoFocus
                    required 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setIsNewCategory(false)}
                    className="text-xs text-blue-600 font-bold px-1"
                  >
                    Voltar para lista
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input name="cost" type="number" placeholder="Custo (Kz)" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" />
              <input name="price" type="number" placeholder="Venda (Kz)" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <input name="stock" type="number" placeholder="Quantidade inicial" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg">Salvar Produto</button>
          </form>
        </Modal>
      )}

      {showAddModal === 'sales' && (
        <Modal title="Registrar Venda" onClose={() => setShowAddModal(null)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const pid = fd.get('productId') as string;
            const product = products.find(p => p.id === pid);
            if(!product) return;
            const qty = Number(fd.get('quantity'));
            addSale({
              productId: pid,
              quantity: qty,
              total: product.price * qty,
              paymentMethod: fd.get('method') as any,
              customerName: fd.get('customer') as string
            });
          }} className="space-y-4">
            <select name="productId" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500">
              <option value="">Escolha o Produto</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Kz {p.price})</option>
              ))}
            </select>
            <input name="quantity" type="number" defaultValue="1" placeholder="Quantidade" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" />
            <select name="method" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500">
              <option value="cash">Dinheiro</option>
              <option value="debt">Fiado (Dívida)</option>
              <option value="transfer">Transferência</option>
            </select>
            <input name="customer" placeholder="Nome do Cliente (Opcional)" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg">Finalizar Venda</button>
          </form>
        </Modal>
      )}

      {showAddModal === 'debts' && (
        <Modal title="Novo Fiado" onClose={() => setShowAddModal(null)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            addDebt({
              customerName: fd.get('customer') as string,
              amount: Number(fd.get('amount')),
              description: fd.get('desc') as string
            });
          }} className="space-y-4">
            <input name="customer" placeholder="Nome do Cliente" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" />
            <input name="amount" type="number" placeholder="Valor total (Kz)" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" />
            <input name="desc" placeholder="Motivo/Descrição" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg">Registrar Dívida</button>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default App;
