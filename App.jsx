import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { Search, ShoppingBag, Smartphone, ShieldCheck, LogIn, LogOut, Plus, Pencil, Trash2, Star, X, Upload, ArrowLeft } from 'lucide-react';

const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const WHATSAPP = '5585982212446';
const emptyProduct = { id: null, name: '', description: '', price: '', image_url: '', category_id: '', shopee_url: '', active: true, featured: false };

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [adminOpen, setAdminOpen] = useState(location.pathname === '/admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadCatalog() {
    if (!supabase) return;
    setLoading(true);
    const [p, c] = await Promise.all([
      supabase.from('catalog_products').select('*').order('featured', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('categories').select('id,name,slug,active').eq('active', true).order('name')
    ]);
    if (!p.error) setProducts(p.data || []);
    if (!c.error) setCategories(c.data || []);
    setLoading(false);
  }

  async function loadAdmin() {
    if (!supabase || !session) return;
    const [p, c] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name')
    ]);
    if (p.error) setNotice('Não foi possível carregar os produtos: ' + p.error.message);
    else setProducts(p.data || []);
    if (!c.error) setCategories(c.data || []);
  }

  useEffect(() => { loadCatalog(); }, []);
  useEffect(() => { if (adminOpen && session) loadAdmin(); }, [adminOpen, session]);

  const visibleProducts = useMemo(() => products.filter(p =>
    p.active !== false &&
    (category === 'todos' || p.category_id === category) &&
    `${p.name} ${p.description || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [products, category, search]);

  async function signIn(e) {
    e.preventDefault(); setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError('E-mail ou senha inválidos. Confira seus dados.');
    else { setPassword(''); setNotice('Acesso administrativo realizado.'); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAdminOpen(false); history.pushState({}, '', '/');
    await loadCatalog();
  }

  function openAdmin() {
    setAdminOpen(true); history.pushState({}, '', '/admin');
  }

  function closeAdmin() {
    setAdminOpen(false); history.pushState({}, '', '/');
    loadCatalog();
  }

  function startNew() { setEditing({ ...emptyProduct }); setNotice(''); }
  function startEdit(product) { setEditing({ ...product, price: String(product.price ?? '') }); setNotice(''); }

  async function saveProduct(e) {
    e.preventDefault();
    if (!supabase || !editing) return;
    setSaving(true); setNotice('');
    let imageUrl = editing.image_url || null;
    const file = e.currentTarget.elements.image.files?.[0];
    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('produtos').upload(path, file, { upsert: false });
      if (uploadError) { setNotice('Erro ao enviar imagem: ' + uploadError.message); setSaving(false); return; }
      imageUrl = supabase.storage.from('produtos').getPublicUrl(path).data.publicUrl;
    }
    const payload = {
      name: editing.name.trim(),
      description: editing.description.trim(),
      price: Number(editing.price),
      image_url: imageUrl,
      category_id: editing.category_id || null,
      shopee_url: editing.shopee_url?.trim() || null,
      active: !!editing.active,
      featured: !!editing.featured,
      updated_at: new Date().toISOString()
    };
    const result = editing.id
      ? await supabase.from('products').update(payload).eq('id', editing.id)
      : await supabase.from('products').insert(payload);
    if (result.error) setNotice('Não foi possível salvar: ' + result.error.message);
    else { setNotice('Produto salvo com sucesso.'); setEditing(null); await loadAdmin(); }
    setSaving(false);
  }

  async function deleteProduct(product) {
    if (!confirm(`Excluir "${product.name}"? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    setNotice(error ? 'Erro ao excluir: ' + error.message : 'Produto excluído.');
    if (!error) await loadAdmin();
  }

  function buy(product) {
    const msg = `Olá! Tenho interesse neste produto do catálogo VINICIO FERREIRA:\n\n${product.name}\nPreço: ${money(product.price)}\n\nGostaria de saber mais informações e disponibilidade.`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  }

  if (!supabase) return <main className="setup"><div className="setup-card"><div className="brand-mark">VF</div><h1>Configure seu catálogo</h1><p>Adicione as variáveis do Supabase no arquivo <code>.env</code> para conectar sua loja.</p><p>Consulte o arquivo README incluído no projeto.</p></div></main>;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" onClick={e => { e.preventDefault(); closeAdmin(); }}>
          <span className="brand-mark">VF</span><span><b>VINICIO FERREIRA</b><small>TECNOLOGIA & OFERTAS</small></span>
        </a>
        <button className="admin-link" onClick={openAdmin}><ShieldCheck size={17}/> Área administrativa</button>
      </header>

      {adminOpen ? (
        <main className="admin-wrap">
          <button className="back-link" onClick={closeAdmin}><ArrowLeft size={16}/> Voltar ao catálogo</button>
          {!session ? <form className="login-card" onSubmit={signIn}>
            <div className="login-icon"><ShieldCheck/></div><h1>Painel administrativo</h1><p>Acesse para gerenciar os produtos da loja.</p>
            <label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username"/></label>
            <label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/></label>
            {loginError && <p className="error">{loginError}</p>}
            <button className="primary-btn" type="submit"><LogIn size={17}/> Entrar</button>
          </form> : <section className="admin-panel">
            <div className="admin-heading"><div><span className="eyebrow">GERENCIAMENTO</span><h1>Seus produtos</h1><p>Cadastre e atualize os itens exibidos no catálogo.</p></div><button className="outline-btn" onClick={signOut}><LogOut size={16}/> Sair</button></div>
            {notice && <div className="notice">{notice}</div>}
            {editing ? <form className="product-form" onSubmit={saveProduct}>
              <div className="form-heading"><h2>{editing.id ? 'Editar produto' : 'Novo produto'}</h2><button type="button" className="icon-btn" onClick={() => setEditing(null)}><X/></button></div>
              <label>Nome do produto<input value={editing.name} onChange={e => setEditing({...editing,name:e.target.value})} required/></label>
              <label>Descrição<textarea rows="3" value={editing.description || ''} onChange={e => setEditing({...editing,description:e.target.value})}/></label>
              <div className="form-grid">
                <label>Preço (R$)<input type="number" min="0" step="0.01" value={editing.price} onChange={e => setEditing({...editing,price:e.target.value})} required/></label>
                <label>Categoria<select value={editing.category_id || ''} onChange={e => setEditing({...editing,category_id:e.target.value})}><option value="">Sem categoria</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              </div>
              <label>Imagem do produto<input name="image" type="file" accept="image/*"/><small>Se escolher uma imagem, ela substituirá a imagem atual.</small></label>
              <label>Link do fornecedor (privado)<input type="url" placeholder="https://..." value={editing.shopee_url || ''} onChange={e => setEditing({...editing,shopee_url:e.target.value})}/><small>Esse link fica somente no painel e não aparece para os clientes.</small></label>
              <div className="checks"><label><input type="checkbox" checked={!!editing.active} onChange={e=>setEditing({...editing,active:e.target.checked})}/> Produto ativo</label><label><input type="checkbox" checked={!!editing.featured} onChange={e=>setEditing({...editing,featured:e.target.checked})}/> Destaque</label></div>
              <button className="primary-btn" disabled={saving}>{saving ? 'Salvando...' : 'Salvar produto'}</button>
            </form> : <>
              <button className="primary-btn add-btn" onClick={startNew}><Plus size={18}/> Adicionar produto</button>
              <div className="admin-list">{products.map(p=><article className="admin-product" key={p.id}>
                <div className="admin-thumb">{p.image_url ? <img src={p.image_url} alt=""/> : <Smartphone/>}</div>
                <div className="admin-product-info"><b>{p.name}</b><strong>{money(p.price)}</strong><small>{p.active ? 'Ativo' : 'Inativo'}{p.featured ? ' • Destaque' : ''}</small></div>
                <button className="icon-btn" aria-label="Editar" onClick={()=>startEdit(p)}><Pencil size={17}/></button>
                <button className="icon-btn danger" aria-label="Excluir" onClick={()=>deleteProduct(p)}><Trash2 size={17}/></button>
              </article>)}</div>
            </>}
          </section>}
        </main>
      ) : <>
        <section className="hero">
          <div className="hero-content"><span className="eyebrow">SUA LOJA ONLINE</span><h1>Tecnologia que combina com você.</h1><p>Encontre smartphones, eletrônicos e ofertas selecionadas.</p><a href="#catalogo" className="hero-btn">Explorar catálogo <ShoppingBag size={17}/></a></div>
          <div className="hero-art"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="phone-art"><div className="phone-camera"></div><div className="phone-glow"></div></div><span className="hero-vf">VF</span></div>
        </section>
        <main id="catalogo" className="catalog">
          <div className="section-head"><div><span className="eyebrow">VITRINE</span><h2>Nosso catálogo</h2><p>Escolha seu produto e fale diretamente pelo WhatsApp.</p></div><div className="searchbox"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto..."/></div></div>
          <div className="category-row"><button className={category==='todos'?'selected':''} onClick={()=>setCategory('todos')}>Todos</button>{categories.map(c=><button key={c.id} className={category===c.id?'selected':''} onClick={()=>setCategory(c.id)}>{c.name}</button>)}</div>
          {loading ? <div className="empty">Carregando catálogo...</div> : visibleProducts.length ? <div className="product-grid">{visibleProducts.map(p=><article className="product-card" key={p.id}>
            <div className="product-image">{p.featured && <span className="featured"><Star size={12} fill="currentColor"/> Destaque</span>}{p.image_url ? <img src={p.image_url} alt={p.name}/> : <div className="no-image"><Smartphone size={48}/><span>VINICIO FERREIRA</span></div>}</div>
            <div className="product-details"><span className="product-category">{categories.find(c=>c.id===p.category_id)?.name || 'Produto'}</span><h3>{p.name}</h3>{p.description && <p>{p.description}</p>}<div className="product-bottom"><strong>{money(p.price)}</strong><button onClick={()=>buy(p)}>Comprar pelo WhatsApp</button></div></div>
          </article>)}</div> : <div className="empty"><ShoppingBag size={30}/><b>Nenhum produto encontrado</b><span>Tente outra busca ou categoria.</span></div>}
        </main>
        <footer><div className="footer-brand"><span className="brand-mark">VF</span><b>VINICIO FERREIRA</b></div><span>Atendimento e pedidos pelo WhatsApp</span><small>© {new Date().getFullYear()} VINICIO FERREIRA. Todos os direitos reservados.</small></footer>
      </>}
    </div>
  );
}