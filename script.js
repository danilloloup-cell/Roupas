

/* =========================
   ETERNA MODA — script principal
   - produtos mock (edite aqui)
   - render home featured e página produtos (produtos.html pode reaproveitar)
   - filtros, busca, ordenação
   - carrinho persistente (localStorage)
   - modal de produto (quick view)
   - newsletter e formulários simulados
   ========================= */

/* -------------------------
   CONFIG / DADOS INICIAIS
   ------------------------- */
/* Edite aqui para adicionar/remover produtos ou trocar imagens */
const PRODUCTS = [
  { id: 1, title: 'Camisa Social Preta', price: 189.90, imgs: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800'], sizes: ['P','M','G'], style: 'social', featured: true },
  { id: 2, title: 'Jaqueta Urban Vermelha', price: 329.00, imgs: ['https://images.unsplash.com/photo-1520975911925-0b0fe6f337a6?q=80&w=800'], sizes: ['M','G','GG'], style: 'casual', featured: true },
  { id: 3, title: 'Calça Slim', price: 159.50, imgs: ['https://images.unsplash.com/photo-1514996937319-344454492b37?q=80&w=800'], sizes: ['P','M','G'], style: 'casual' },
  { id: 4, title: 'Vestido Satin', price: 279.99, imgs: ['https://images.unsplash.com/photo-1520975911930-0d0fe6f337a6?q=80&w=800'], sizes: ['P','M'], style: 'premium', featured: true },
  { id: 5, title: 'Camiseta Básica Preta', price: 79.90, imgs: ['https://images.unsplash.com/photo-1520975911928-0a0fe6f337a6?q=80&w=800'], sizes: ['P','M','G','GG'], style: 'casual' }
];

/* utilidades simples */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const formatBRL = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

/* Estado do carrinho (array de {id, qty, selectedSize}) - persistido */
let state = { cart: JSON.parse(localStorage.getItem('em_cart_v2') || '[]') };

/* -------------------------
   Funções de carrinho
   ------------------------- */
function persistCart(){ localStorage.setItem('em_cart_v2', JSON.stringify(state.cart)); updateCartUI(); }

function findProduct(id){ return PRODUCTS.find(p => p.id === id); }

/* adicionar ao carrinho; size opcional */
function addToCart(id, qty = 1, size = '') {
  const existing = state.cart.find(i => i.id === id && i.selectedSize === size);
  if(existing) existing.qty = Number(existing.qty) + Number(qty);
  else state.cart.push({ id, qty: Number(qty), selectedSize: size });
  persistCart();
  toast('Item adicionado ao carrinho');
}

/* remover por índice */
function removeCartIndex(idx){
  state.cart.splice(idx,1);
  persistCart();
}

/* alterar quantidade */
function changeQtyIndex(idx, delta){
  state.cart[idx].qty = Number(state.cart[idx].qty) + delta;
  if(state.cart[idx].qty <= 0) removeCartIndex(idx);
  else persistCart();
}

/* total contador e valor */
function cartCount(){
  return state.cart.reduce((s,i)=> s + (Number(i.qty)||0), 0);
}
function cartValue(){
  return state.cart.reduce((sum,i) => {
    const p = findProduct(i.id); if(!p) return sum;
    return sum + p.price * (Number(i.qty)||0);
  }, 0);

}

/* -------------------------
   Render UI
   ------------------------- */
function renderFeatured(){
  const container = $('#featuredGrid'); if(!container) return;
  container.innerHTML = '';
  const items = PRODUCTS.filter(p => p.featured).slice(0,4);
  items.forEach(p => {
    const el = document.createElement('article'); el.className = 'card';
    el.innerHTML = `
      <div class="media"><img loading="lazy" src="${p.imgs[0]}" alt="${p.title}"></div>
      <h3>${p.title}</h3>
      <div class="meta"><span class="small">${p.style}</span><strong class="price">${formatBRL(p.price)}</strong></div>
      <div style="display:flex;gap:8px;margin-top:auto">
        <button class="btn-cta" data-add="${p.id}">Adicionar</button>
        <button class="btn-ghost" data-view="${p.id}">Ver</button>
      </div>
    `;
    container.appendChild(el);
  });

  // handlers
  container.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', e => addToCart(Number(e.currentTarget.dataset.add))));
  container.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', e => openProductModal(Number(e.currentTarget.dataset.view))));
}

/* atualizar UI do carrinho (drawer e badges) */
function updateCartUI(){
  const badgeEls = $$('#cartBadge');
  badgeEls.forEach(b => b && (b.textContent = cartCount()));
  // drawer
  const body = $('#cartBody');
  if(body){
    body.innerHTML = '';
    state.cart.forEach((it, idx) => {
      const p = findProduct(it.id);
      if(!p) return;
      const node = document.createElement('div'); node.className = 'cart-item';
      node.innerHTML = `
        <img src="${p.imgs[0]}" alt="${p.title}">
        <div style="flex:1">
          <div style="font-weight:800">${p.title}</div>
          <div class="small">${it.selectedSize ? 'Tamanho ' + it.selectedSize : ''}</div>
          <div class="small">${formatBRL(p.price)} x ${it.qty}</div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn-ghost" data-idx="${idx}" data-act="dec">-</button>
            <button class="btn-ghost" data-idx="${idx}" data-act="inc">+</button>
            <button class="btn-ghost" data-idx="${idx}" data-act="del">Remover</button>
          </div>
        </div>
      `;
      body.appendChild(node);
    });

    // attach events
    body.querySelectorAll('button[data-act]').forEach(btn => btn.addEventListener('click', e => {
      const idx = Number(e.currentTarget.dataset.idx);
      const act = e.currentTarget.dataset.act;
      if(act === 'dec') changeQtyIndex(idx, -1);
      if(act === 'inc') changeQtyIndex(idx, +1);
      if(act === 'del') removeCartIndex(idx);
    }));
  }

  const totalEls = $$('#cartTotal');
  totalEls.forEach(el => el && (el.textContent = formatBRL(cartValue())));
}

/* -------------------------
   MODAL (quick view)
   ------------------------- */
function openProductModal(id){
  const p = findProduct(id);
  if(!p) return;
  const modal = $('#productModal'); const inner = $('#modalInner');
  if(!modal || !inner){ alert(p.title + '\\n' + formatBRL(p.price)); return; }
  inner.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
      <div><img src="${p.imgs[0]}" alt="${p.title}" style="width:100%;border-radius:8px"></div>
      <div>
        <h2>${p.title}</h2>
        <p class="small">Estilo: ${p.style}</p>
        <div style="margin-top:10px"><strong class="price">${formatBRL(p.price)}</strong></div>
        <label style="display:block;margin-top:12px"><small>Tamanho</small>
          <select id="modalSize" style="width:100%;padding:10px;border-radius:8px;margin-top:6px">
            ${p.sizes.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </label>
        <div style="display:flex;gap:8px;margin-top:16px">
          <button id="modalAdd" class="btn-cta">Adicionar</button>
          <button id="modalCloseBtn" class="btn-ghost">Fechar</button>
        </div>
      </div>
    </div>
  `;
  modal.setAttribute('aria-hidden','false'); modal.style.display = 'flex';

  $('#modalAdd')?.addEventListener('click', () => {
    const sz = $('#modalSize').value;
    addToCart(p.id, 1, sz);
    closeModal();
  });
  $('#modalCloseBtn')?.addEventListener('click', closeModal);
  $('#modalClose')?.addEventListener('click', closeModal);
}
function closeModal(){ const modal = $('#productModal'); if(modal){ modal.setAttribute('aria-hidden','true'); modal.style.display='none'; $('#modalInner').innerHTML = ''; }}

/* -------------------------
   TOAST (simples)
   ------------------------- */
function toast(text){
  const t = document.createElement('div'); t.textContent = text;
  t.style = 'position:fixed;left:50%;transform:translateX(-50%);bottom:28px;background:#111;padding:10px 14px;border-radius:8px;color:#fff;z-index:300';
  document.body.appendChild(t); setTimeout(()=> t.remove(),1600);
}

/* -------------------------
   INICIALIZAÇÃO e HANDLERS GLOBAIS
   ------------------------- */
function setup(){
  // atualiza ano
  $$('#year').forEach(e => e && (e.textContent = new Date().getFullYear()));

  // render featured
  renderFeatured();

  // newsletter
  $('#newsletterForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#newsletterEmail').value.trim();
    if(!email){ toast('Insira um e-mail válido'); return; }
    $('#newsletterEmail').value = '';
    toast('Obrigado! Código de desconto enviado (simulado).');
  });

  // open/close cart
  $('#openCart')?.addEventListener('click', () => $('#cartDrawer').classList.toggle('open'));
  $('#closeCart')?.addEventListener('click', () => $('#cartDrawer').classList.remove('open'));

  // search toggle
  $('#searchBtn')?.addEventListener('click', () => {
    const sb = $('#searchBar');
    if(sb.hasAttribute('hidden')) sb.removeAttribute('hidden'); else sb.setAttribute('hidden','');
  });
  $('#searchClear')?.addEventListener('click', () => { $('#globalSearch').value = ''; });

  // global search -> salvar query e navegar para produtos.html (se existir)
  $('#globalSearch')?.addEventListener('keydown', e => {
    if(e.key === 'Enter'){
      const q = e.currentTarget.value.trim();
      if(!q) return;
      localStorage.setItem('em_last_q', q);
      window.location.href = 'produtos.html'; // página produtos precisa ler localStorage e aplicar filtro
    }
  });

  // checkout (simulado)
  $('#checkoutBtn')?.addEventListener('click', async () => {
    if(state.cart.length === 0){ toast('Carrinho vazio'); return; }
    const btn = $('#checkoutBtn'); btn.disabled = true; btn.textContent = 'Processando...';
    await new Promise(r => setTimeout(r, 1000));
    state.cart = []; persistCart();
    btn.disabled = false; btn.textContent = 'Finalizar';
    toast('Compra simulada concluída — carrinho limpo');
  });

  // fecha drawer ao clicar fora
  document.addEventListener('click', (e) => {
    const drawer = document.querySelector('.cart-drawer.open');
    if(drawer && !drawer.contains(e.target) && !e.target.closest('#openCart')) drawer.classList.remove('open');
  });

  // inicial update cart UI
  updateCartUI();
}

/* START */
document.addEventListener('DOMContentLoaded', setup);
