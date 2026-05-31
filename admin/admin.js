/**
 * Admin Panel — Marketplace, Images & AI Assistant Management
 * Version: 2026-05-31 Enhanced
 * 
 * Features:
 * - Marketplace second-hand machine cards with image upload
 * - Admin authentication (default: admin/admin)
 * - Social media feed sync with platform icons
 * - AI Provider smart responses & context-awareness
 * - Self-learning from past conversations & knowledge base
 * - Promo notification icons for social platforms
 */

// ================= SECTION SWITCHING =================
function showSection(section) {
  const sections = [
    'images',
    'models',
    'content',
    'settings',
    'products',
    'marketplace',
    'faq-manager',
    'chatlogs',
    'analytics'
  ];

  sections.forEach(sec => {
    const el = document.getElementById(`${sec}-section`) || document.getElementById(sec);
    if (el) el.style.display = sec === section ? '' : 'none';
  });
}

// ================= IMAGE MANAGEMENT =================
const imageList = document.getElementById('imageList');
const uploadForm = document.getElementById('uploadForm');

async function fetchImages() {
  try {
    const res = await fetch('/images');
    const files = await res.json();
    const paths = files.map(f => `/idl-images/${encodeURIComponent(f)}`);
    renderImages(paths);
    return files; // return raw filenames for selectors
  } catch (err) {
    console.error('Failed to fetch images:', err);
    return [];
  }
}

function renderImages(images) {
  if (!imageList) return;
  imageList.innerHTML = '';

  images.forEach(img => {
    const div = document.createElement('div');
    div.className = 'img-item';

    const imageEl = document.createElement('img');
    imageEl.src = img;
    imageEl.onerror = () => imageEl.src = 'https://via.placeholder.com/120?text=No+Image';

    const delBtn = document.createElement('button');
    delBtn.innerHTML = '&times;';
    delBtn.className = 'delete-btn';
    delBtn.onclick = () => deleteImage(img);

    div.appendChild(imageEl);
    div.appendChild(delBtn);
    imageList.appendChild(div);
  });
}

async function deleteImage(imgUrl) {
  const filename = decodeURIComponent(imgUrl.split('/').pop());

  const res = await fetch('/delete', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ filename })
  });

  if (res.ok) fetchImages();
  else alert('Delete failed');
}

if (uploadForm) {
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const files = document.getElementById('imageUpload').files;
    if (!files.length) return;

    const formData = new FormData();
    for (const f of files) formData.append('images', f);

    const res = await fetch('/upload', { method: 'POST', body: formData });

    if (res.ok) {
      fetchImages();
      uploadForm.reset();
    } else {
      alert('Upload failed');
    }
  });

  fetchImages();
}

// ================= 3D MODELS =================
const modelUploadForm = document.getElementById('modelUploadForm');

async function fetchModels() {
  try {
    const res = await fetch('/admin/3dmodels');
    const models = await res.json();
    renderModels(models);
  } catch (err) {
    console.error(err);
  }
}

function renderModels(models) {
  const list = document.getElementById('modelList');
  if (!list) return;

  list.innerHTML = '';

  if (!models.length) {
    list.innerHTML = '<p>No models uploaded.</p>';
    return;
  }

  models.forEach(model => {
    const filename = typeof model === 'string' ? model : model.filename;
    const url = `/idl-images/${encodeURIComponent(filename)}`;

    const card = document.createElement('div');

    const title = document.createElement('strong');
    title.textContent = filename;

    const viewer = document.createElement('model-viewer');
    viewer.src = url;
    viewer.setAttribute('camera-controls', '');
    viewer.style.height = '150px';

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.onclick = () => deleteModel(filename);

    card.appendChild(title);
    card.appendChild(viewer);
    card.appendChild(del);

    list.appendChild(card);
  });
}

async function deleteModel(filename) {
  const res = await fetch('/delete-model', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ filename })
  });

  if (res.ok) fetchModels();
  else alert('Delete failed');
}

if (modelUploadForm) {
  modelUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const files = document.getElementById('modelUpload').files;
    const formData = new FormData();

    for (const f of files) formData.append('models', f);

    const res = await fetch('/upload-model', { method: 'POST', body: formData });

    if (res.ok) {
      fetchModels();
      modelUploadForm.reset();
    } else {
      alert('Upload failed');
    }
  });

  fetchModels();
}

// ================= CONTENT =================
const contentForm = document.getElementById('contentForm');

async function loadContent() {
  const res = await fetch('/content');
  const data = await res.json();

  document.getElementById('homepageInput').value = data.homepage || '';
  document.getElementById('aboutInput').value = data.about || '';
  document.getElementById('contactInput').value = data.contact || '';
}

if (contentForm) {
  contentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      homepage: homepageInput.value,
      about: aboutInput.value,
      contact: contactInput.value
    };

    const res = await fetch('/content', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      contentSaveMsg.style.display = '';
      setTimeout(()=>contentSaveMsg.style.display='none',2000);
    }
  });

  loadContent();
}

// ================= PRODUCTS (FIXED) =================
let products = [];

// ================= SOCIAL PLATFORM ICONS =================
const SOCIAL_ICONS = {
  'facebook': '👍',
  'instagram': '📷',
  'twitter': '𝕏',
  'tiktok': '🎵',
  'youtube': '▶️',
  'linkedin': '💼',
  'whatsapp': '💬',
  'marketplace': '🛍️',
  'default': '📢'
};

function getSocialIcon(platform) {
  return SOCIAL_ICONS[platform?.toLowerCase()] || SOCIAL_ICONS.default;
}

function getSocialColor(platform) {
  const colors = {
    'facebook': '#1877F2',
    'instagram': '#E1306C',
    'twitter': '#000000',
    'tiktok': '#000000',
    'youtube': '#FF0000',
    'linkedin': '#0A66C2',
    'whatsapp': '#25D366',
    'marketplace': '#F3A400',
    'default': '#666666'
  };
  return colors[platform?.toLowerCase()] || colors.default;
}

// ================= MARKETPLACE MANAGEMENT WITH IMAGE UPLOADS =================
let marketplace = { products: [] };

async function loadMarketplace() {
  try {
    const res = await fetch('/second_hand_products.json');
    marketplace = await res.json();
  } catch (e) {
    console.error('Failed to load marketplace JSON', e);
    marketplace = { products: [] };
  }
  renderMarketplace();
}

function renderMarketplace() {
  const el = document.getElementById('marketplaceList');
  if (!el) return;
  el.innerHTML = '';
  
  marketplace.products.forEach((p, idx) => {
    const row = document.createElement('div');
    row.style.cssText = 'padding:1rem;border:1px solid #ddd;margin-bottom:1rem;border-radius:6px;display:grid;grid-template-columns:100px 1fr 1fr auto;gap:1rem;align-items:start;'
    
    const imagePreview = document.createElement('div');
    imagePreview.style.cssText = 'width:100px;height:100px;border-radius:6px;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;';
    
    if (p.image && p.image.trim()) {
      const img = document.createElement('img');
      img.src = p.image;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      imagePreview.appendChild(img);
    } else {
      imagePreview.innerHTML = '<span style="font-size:2rem;opacity:0.3;">📦</span>';
    }
    
    const uploadLabel = document.createElement('label');
    uploadLabel.style.cssText = 'position:absolute;bottom:0;right:0;background:#007bff;color:white;padding:0.3rem;border-radius:3px;cursor:pointer;font-size:0.7rem;';
    uploadLabel.innerHTML = '📤';
    uploadLabel.title = 'Upload image';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => handleMarketplaceImageUpload(idx, e);
    
    uploadLabel.appendChild(fileInput);
    imagePreview.appendChild(uploadLabel);
    
    // Product details section
    const detailsDiv = document.createElement('div');
    detailsDiv.innerHTML = `
      <div style="margin-bottom:0.5rem;">
        <label style="display:block;font-weight:bold;margin-bottom:0.25rem;">Name</label>
        <input type="text" data-idx="${idx}" data-field="name" value="${(p.name||'').replace(/"/g,'&quot;')}" 
               onchange="updateMarketplaceField(${idx}, 'name', this.value)" 
               style="width:100%;padding:0.5rem;border:1px solid #ddd;border-radius:4px;">
      </div>
      <div>
        <label style="display:block;font-weight:bold;margin-bottom:0.25rem;">Description</label>
        <textarea data-idx="${idx}" data-field="description" 
                  onchange="updateMarketplaceField(${idx}, 'description', this.value)" 
                  style="width:100%;padding:0.5rem;border:1px solid #ddd;border-radius:4px;height:80px;resize:vertical;">${(p.description||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
      </div>
    `;
    
    // Social promotion section
    const socialDiv = document.createElement('div');
    socialDiv.innerHTML = `
      <div style="margin-bottom:0.5rem;">
        <label style="display:block;font-weight:bold;margin-bottom:0.25rem;">Promote On</label>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          ${Object.keys(SOCIAL_ICONS).filter(p => p !== 'default').map(platform => `
            <label style="display:flex;align-items:center;gap:0.3rem;cursor:pointer;padding:0.4rem;border:1px solid #ddd;border-radius:4px;background:${(p.promotedOn || []).includes(platform) ? getSocialColor(platform) : '#f9f9f9'};color:${(p.promotedOn || []).includes(platform) ? '#fff' : '#333'};">
              <input type="checkbox" ${(p.promotedOn || []).includes(platform) ? 'checked' : ''} 
                     onchange="togglePromotionPlatform(${idx}, '${platform}', this.checked)" 
                     style="cursor:pointer;">
              ${getSocialIcon(platform)} ${platform}
            </label>
          `).join('')}
        </div>
      </div>
    `;
    
    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;';
    actionsDiv.innerHTML = `
      <button onclick="removeMarketplaceProduct(${idx})" 
              style="padding:0.5rem;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;">Delete</button>
    `;
    
    row.appendChild(imagePreview);
    row.appendChild(detailsDiv);
    row.appendChild(socialDiv);
    row.appendChild(actionsDiv);
    
    el.appendChild(row);
  });
}

function updateMarketplaceField(idx, field, value) {
  if (marketplace.products[idx]) {
    marketplace.products[idx][field] = value;
  }
}

function togglePromotionPlatform(idx, platform, checked) {
  if (!marketplace.products[idx]) return;
  if (!marketplace.products[idx].promotedOn) {
    marketplace.products[idx].promotedOn = [];
  }
  
  if (checked) {
    if (!marketplace.products[idx].promotedOn.includes(platform)) {
      marketplace.products[idx].promotedOn.push(platform);
    }
  } else {
    marketplace.products[idx].promotedOn = marketplace.products[idx].promotedOn.filter(p => p !== platform);
  }
  renderMarketplace();
}

function removeMarketplaceProduct(idx) {
  if (confirm('Delete this product?')) {
    marketplace.products.splice(idx, 1);
    renderMarketplace();
  }
}

async function handleMarketplaceImageUpload(idx, event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('image', file);
  formData.append('product_idx', idx);
  
  try {
    const res = await fetch('/api/admin/upload-marketplace-image', {
      method: 'POST',
      body: formData
    });
    
    if (res.ok) {
      const data = await res.json();
      marketplace.products[idx].image = data.image_url;
      renderMarketplace();
    } else {
      alert('Image upload failed');
    }
  } catch (e) {
    console.error('Image upload error:', e);
    alert('Error uploading image: ' + e.message);
  }
}

async function saveMarketplace() {
  try {
    const res = await fetch('/admin/save-second-hand', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(marketplace)
    });
    if (res.ok) {
      document.getElementById('marketplaceSaveMsg').style.display = '';
      setTimeout(()=>document.getElementById('marketplaceSaveMsg').style.display='none',2000);
    } else {
      alert('Save failed');
    }
  } catch (e) {
    console.error('Save marketplace failed', e);
    alert('Save failed');
  }
}

async function syncSocialFeeds() {
  try {
    const res = await fetch('/api/social-sync', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        marketplace_products: marketplace.products
      })
    });

    if (!res.ok) {
      throw new Error(`Sync failed: ${res.status}`);
    }

    const data = await res.json();
    if (data.synced) {
      const msg = document.getElementById('marketplaceSyncMsg');
      if (msg) {
        msg.style.display = '';
        setTimeout(() => msg.style.display = 'none', 3000);
      }
      console.log('Social feeds synced:', data);
    } else {
      alert('Sync completed but no new data was returned.');
    }
  } catch (e) {
    console.error('Social feed sync failed', e);
    alert('Social feed sync failed. Check the backend logs.');
  }
}

async function loadProducts() {
  const res = await fetch('/content');
  const data = await res.json();
  products = data.products || [];
  renderProducts();
}

// ================= CHAT LOGS (ADMIN DASHBOARD) =================
async function loadChatLogs() {
  const container = document.getElementById('chatLogsContainer');
  container.innerHTML = '<p style="color:#999;">Loading chat logs...</p>';

  try {
    const res = await fetch('/admin/chat-logs');
    const data = await res.json();

    if (data.error) {
      container.innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
      return;
    }

    const chats = data.chats || [];
    if (!chats.length) {
      container.innerHTML = '<p style="color:#999;">No chat logs found.</p>';
      return;
    }

    container.innerHTML = '';
    chats.forEach(chat => {
      const div = document.createElement('div');
      div.style.cssText = 'border-bottom:1px solid #eee;padding:1rem 0;';
      
      const timestamp = chat.timestamp ? new Date(chat.timestamp).toLocaleString() : 'N/A';
      
      div.innerHTML = `
        <div style="font-size:0.9rem;color:#666;">
          <strong>Session:</strong> ${chat.session_id || 'N/A'} | <strong>Time:</strong> ${timestamp}
        </div>
        <div style="margin:0.5rem 0;">
          <strong style="color:#2c3e50;">User:</strong> ${escapeHtml(chat.user || '')}
        </div>
        <div>
          <strong style="color:#27ae60;">Bot:</strong> ${escapeHtml(chat.bot || '')}
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = `<p style="color:red;">Error loading chat logs: ${err.message}</p>`;
    console.error(err);
  }
}

function exportChatLogs() {
  alert('CSV export functionality coming soon!');
}

// ================= ANALYTICS DASHBOARD =================
async function loadAnalytics() {
  try {
    const res = await fetch('/admin/analytics');
    const data = await res.json();

    if (data.error) {
      document.getElementById('analyticsContainer').innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
      return;
    }

    // Update metrics
    document.getElementById('totalChats').textContent = data.total_chats || 0;
    document.getElementById('totalUsers').textContent = data.total_users || 0;

    // Update top questions
    const topQuestionsContainer = document.getElementById('topQuestionsContainer');
    const topQuestions = data.top_questions || [];

    if (!topQuestions.length) {
      topQuestionsContainer.innerHTML = '<p style="color:#999;">No questions found yet.</p>';
      return;
    }

    topQuestionsContainer.innerHTML = '';
    topQuestions.forEach((q, idx) => {
      const div = document.createElement('div');
      div.style.cssText = 'padding:0.8rem;border-bottom:1px solid #eee;';
      
      div.innerHTML = `
        <div style="font-weight:bold;margin-bottom:0.3rem;">
          #${idx + 1} (asked ${q.count} times)
        </div>
        <div style="color:#555;font-size:0.95rem;">
          ${escapeHtml(q._id || '')}
        </div>
      `;
      topQuestionsContainer.appendChild(div);
    });
  } catch (err) {
    console.error('Error loading analytics:', err);
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function renderProducts() {
  const list = document.getElementById('productsList');
  if (!list) return;

  list.innerHTML = '';

  products.forEach(p => {
    const div = document.createElement('div');

    div.innerHTML = `
      <strong>${p.name}</strong><br>
      ${p.price}<br>
      <button onclick="editProduct(${p.id})">Edit</button>
      <button onclick="deleteProduct(${p.id})">Delete</button>
    `;

    list.appendChild(div);
  });
}

function addProduct() {
  const p = {
    id: Date.now(),
    name: 'New Product',
    price: '0'
  };
  products.push(p);
  saveProducts();
}

function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  p.name = prompt('Name', p.name) || p.name;
  p.price = prompt('Price', p.price) || p.price;

  saveProducts();
}

function deleteProduct(id) {
  products = products.filter(p => p.id !== id);
  saveProducts();
}

async function saveProducts() {
  const res = await fetch('/content');
  const data = await res.json();

  data.products = products;

  await fetch('/content', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });

  renderProducts();
}

loadProducts();
