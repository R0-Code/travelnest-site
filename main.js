/**
 * TRAVELNEST - Main Application Logic
 * Focus: DOM Manipulation, LocalStorage, PWA Integration, and Accessibility.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // GLOBAL FUNCTIONALITY (Shared across all pages)
    // ==========================================

    // 1. Responsive Navigation: Hamburger Menu Logic
    const burger = document.querySelector('.hamburger');
    const links = document.querySelector('.nav-links');
    if (burger) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('open');
            links.classList.toggle('open');
        });
        links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            burger.classList.remove('open');
            links.classList.remove('open');
        }));
    }

    // 2. Active State: Highlighting the current page in the navbar
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
        if (a.getAttribute('href') === path) a.classList.add('active');
    });

    // 3. Scroll Reveal: Intersection Observer for smooth animations
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target); // Only animate once
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // 4. Newsletter: LocalStorage integration for email subscription
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input').value.trim();
            
            
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }

            const subscribers = JSON.parse(localStorage.getItem('tn_subs') || '[]');
            if (!subscribers.includes(email)) subscribers.push(email);
            localStorage.setItem('tn_subs', JSON.stringify(subscribers));
            
            newsletterForm.innerHTML = '<p style="color:#fff; padding:.8rem">✓ Thank you for joining our journey!</p>';
        });
    }

    // 5. PWA: Service Worker Registration for offline capabilities
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log("SW registration failed:", err));
    }
});

// ==========================================
// PAGE: HOME (Hero Carousel & Destination of the Day)
// ==========================================
function initHome() {
    const stage = document.getElementById('hero-stage');
    const dots = document.getElementById('hero-dots');
    if (!stage) return;

    
    HERO_SLIDES.forEach((slide, i) => {
        const div = document.createElement('div');
        div.className = 'hero-slide' + (i === 0 ? ' active' : '');
        div.style.backgroundImage = `url('${slide.img}')`;
        stage.appendChild(div);

        const btn = document.createElement('button');
        btn.setAttribute('aria-label', `Slide ${i + 1}`);
        if (i === 0) btn.classList.add('active');
        btn.addEventListener('click', () => showSlide(i));
        dots.appendChild(btn);
    });

    const quoteEl = document.getElementById('hero-quote');
    const authorEl = document.getElementById('hero-author');
    let currentIdx = 0;

    function showSlide(i) {
        currentIdx = i;
        stage.querySelectorAll('.hero-slide').forEach((el, k) => el.classList.toggle('active', k === i));
        dots.querySelectorAll('button').forEach((el, k) => el.classList.toggle('active', k === i));
        quoteEl.textContent = `"${HERO_SLIDES[i].quote}"`;
        authorEl.textContent = `— ${HERO_SLIDES[i].author}`;
    }

    showSlide(0);
    setInterval(() => showSlide((currentIdx + 1) % HERO_SLIDES.length), 5500);

    
    const dayKey = Math.floor(Date.now() / 86400000);
    const todayDest = DESTINATIONS[dayKey % DESTINATIONS.length];
    const dotdContainer = document.getElementById('dotd');
    if (dotdContainer) {
        dotdContainer.innerHTML = `
            <div class="dotd-img" style="background-image:url('${todayDest.image}')"></div>
            <div class="dotd-body">
                <span class="eyebrow">Destination of the Day</span>
                <h3>${todayDest.name}</h3>
                <div class="dotd-meta">${todayDest.country} · ${todayDest.continent}</div>
                <p>${todayDest.description}</p>
                <div style="margin-top:1.5rem"><a href="destinations.html" class="btn">Explore More</a></div>
            </div>`;
    }
}

// ==========================================
// PAGE: DESTINATIONS (Filter, Search & Modal)
// ==========================================
function initDestinations() {
    const grid = document.getElementById('cards');
    if (!grid) return;

    const searchInput = document.getElementById('search');
    const continentSelect = document.getElementById('continent');

    
    [...new Set(DESTINATIONS.map(d => d.continent))].forEach(cont => {
        const opt = document.createElement('option');
        opt.value = cont; opt.textContent = cont;
        continentSelect.appendChild(opt);
    });

    function renderCards() {
        const query = searchInput.value.toLowerCase().trim();
        const selectedCont = continentSelect.value;
        grid.innerHTML = '';

        const filtered = DESTINATIONS.filter(d => 
            (!query || d.name.toLowerCase().includes(query) || d.country.toLowerCase().includes(query)) && 
            (!selectedCont || d.continent === selectedCont)
        );

        if (!filtered.length) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#888; padding:2rem">No destinations found. Try a different search!</p>';
            return;
        }

        filtered.forEach(d => {
            const card = document.createElement('div');
            card.className = 'card reveal visible';
            
            card.innerHTML = `
                <div class="card-img" style="background-image:url('${d.image}')">
                    <span class="card-badge">${d.continent}</span>
                </div>
                <div class="card-body">
                    <h3>${d.name}</h3>
                    <div class="card-country">${d.country}</div>
                    <p>${d.description.slice(0, 90)}…</p>
                </div>`;
            card.addEventListener('click', () => openModal(d));
            grid.appendChild(card);
        });
    }

    searchInput.addEventListener('input', renderCards);
    continentSelect.addEventListener('change', renderCards);
    renderCards();

  
    const modal = document.getElementById('modal');
    const mBody = document.getElementById('modal-body');

    function openModal(d) {
        mBody.innerHTML = `
            <div class="modal-img" style="background-image:url('${d.image}')">
                <button class="modal-close" aria-label="Close">×</button>
            </div>
            <div class="modal-content">
                <h2>${d.name}</h2>
                <div class="card-country">${d.country} · ${d.continent}</div>
                <p style="margin:1rem 0">${d.description}</p>
                <h4 style="font-size:1.1rem">Top Attractions</h4>
                <ul>${d.attractions.map(a => `<li>${a}</li>`).join('')}</ul>
                <h4 style="font-size:1.1rem; margin-top:1rem">Travel Cost Comparison</h4>
                <table>
                    <thead><tr><th>Category</th><th>Estimated Cost</th></tr></thead>
                    <tbody>${d.costs.map(c => `<tr><td>${c.cat}</td><td>${c.price}</td></tr>`).join('')}</tbody>
                </table>
            </div>`;
        modal.classList.add('open');
        mBody.querySelector('.modal-close').addEventListener('click', closeModal);
    }

    function closeModal() { modal.classList.remove('open'); }
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

// ==========================================
// PAGE: BUDGET PLANNER (Calculator & LocalStorage)
// ==========================================
function initPlanner() {
    const form = document.getElementById('planner-form');
    if (!form) return;

    const destSelect = document.getElementById('p-dest');
    DESTINATIONS.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.name; opt.textContent = `${d.name} (${d.country})`;
        destSelect.appendChild(opt);
    });

    const resultArea = document.getElementById('p-result');

    form.addEventListener('submit', e => {
        e.preventDefault();
        const dest = destSelect.value;
        const days = parseInt(document.getElementById('p-days').value);
        const daily = parseInt(document.getElementById('p-daily').value);

        if (!dest || days < 1 || daily < 10) {
            alert('Please enter valid trip details.');
            return;
        }

        const total = days * daily;
        let status = 'Low', tag = 'tag-low', pct = 33, color = '#27ae60';

        if (daily >= 150 && daily < 400) { status = 'Moderate'; tag = 'tag-mod'; pct = 66; color = '#E67E22'; }
        else if (daily >= 400) { status = 'Luxury'; tag = 'tag-lux'; pct = 100; color = '#c0392b'; }

        resultArea.classList.add('show');
        resultArea.innerHTML = `
            <span class="eyebrow">Your Trip Estimate</span>
            <h3>${dest} · ${days} days</h3>
            <div class="counter" id="cnt">$0</div>
            <div class="bar"><div class="bar-fill" id="bf" style="background:${color}"></div></div>
            <span class="status-tag ${tag}">${status} Budget</span>
            <div style="margin-top:1.5rem"><button class="btn" id="save-btn">Save This Budget</button></div>`;

        
        const counterEl = document.getElementById('cnt');
        let currentVal = 0;
        const increment = total / 40;
        const timer = setInterval(() => {
            currentVal += increment;
            if (currentVal >= total) {
                currentVal = total;
                clearInterval(timer);
            }
            counterEl.textContent = '$' + Math.round(currentVal).toLocaleString();
        }, 25);

        setTimeout(() => document.getElementById('bf').style.width = pct + '%', 100);

        document.getElementById('save-btn').addEventListener('click', () => {
            const saved = JSON.parse(localStorage.getItem('tn_budgets') || '[]');
            saved.push({ dest, days, daily, total, status, t: Date.now() });
            localStorage.setItem('tn_budgets', JSON.stringify(saved));
            renderSavedBudgets();
        });
    });

    function renderSavedBudgets() {
        const list = document.getElementById('saved-budgets');
        const saved = JSON.parse(localStorage.getItem('tn_budgets') || '[]');
        if (!saved.length) {
            list.innerHTML = '<p style="color:#888; text-align:center">No saved budgets found.</p>';
            return;
        }
        list.innerHTML = saved.map((s, i) => `
            <div class="saved-item">
                <div><strong>${s.dest}</strong> · ${s.days}d · $${s.total} <em>(${s.status})</em></div>
                <button data-i="${i}" aria-label="Delete">✕</button>
            </div>`).join('');

        list.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
            const arr = JSON.parse(localStorage.getItem('tn_budgets') || '[]');
            arr.splice(+b.dataset.i, 1);
            localStorage.setItem('tn_budgets', JSON.stringify(arr));
            renderSavedBudgets();
        }));
    }
    renderSavedBudgets();
}

// ==========================================
// PAGE: RANDOM GENERATOR (Dynamic Filtering)
// ==========================================
function initRandom() {
    const btn = document.getElementById('surprise-btn');
    if (!btn) return;
    const output = document.getElementById('surprise-out');

    function pickRandom() {
        const type = document.getElementById('r-type').value;
        const budget = document.getElementById('r-budget').value;

        const pool = DESTINATIONS.filter(d => 
            (!type || d.type === type) && (!budget || d.budget === budget)
        );

        if (!pool.length) {
            output.innerHTML = '<p style="text-align:center; color:#888">No matches found. Try different filters!</p>';
            return;
        }

        const d = pool[Math.floor(Math.random() * pool.length)];
        output.classList.remove('pop'); 
        void output.offsetWidth; // Trigger reflow for animation
        output.classList.add('pop');

        output.innerHTML = `
            <div class="surprise">
                <span class="eyebrow" style="color:#ffd9b3">Your Surprise Destination</span>
                <h3>${d.name}</h3>
                <p>${d.country} · ${d.type} · ${d.budget} Budget</p>
                <p style="max-width:520px; margin:0 auto 1.5rem">${d.description}</p>
                <button class="btn" id="wishlist-btn">♡ Add to Wishlist</button>
            </div>`;

        document.getElementById('wishlist-btn').addEventListener('click', () => {
            const w = JSON.parse(localStorage.getItem('tn_wishlist') || '[]');
            if (!w.find(x => x.id === d.id)) w.push({ id: d.id, name: d.name, country: d.country });
            localStorage.setItem('tn_wishlist', JSON.stringify(w));
            renderWishlist();
        });
    }

    btn.addEventListener('click', pickRandom);

    function renderWishlist() {
        const list = document.getElementById('wishlist');
        const w = JSON.parse(localStorage.getItem('tn_wishlist') || '[]');
        if (!w.length) {
            list.innerHTML = '<p style="color:#888; text-align:center">Your wishlist is currently empty.</p>';
            return;
        }
        list.innerHTML = w.map((x, i) => `
            <div class="saved-item">
                <div><strong>${x.name}</strong> · ${x.country}</div>
                <button data-i="${i}">✕</button>
            </div>`).join('');

        list.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
            const arr = JSON.parse(localStorage.getItem('tn_wishlist') || '[]');
            arr.splice(+b.dataset.i, 1);
            localStorage.setItem('tn_wishlist', JSON.stringify(arr));
            renderWishlist();
        }));
    }
    renderWishlist();
    pickRandom();
}

// ==========================================
// PAGE: MOOD (Ambient Audio & Tracking)
// ==========================================
function initMood() {
    const grid = document.getElementById('mood-grid');
    if (!grid) return;

    let currentAudio = null;

    function stopAllAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        document.querySelectorAll('.mood-card').forEach(c => c.classList.remove('active'));
    }

    function playAudio(type, card) {
        if (card.classList.contains('active')) {
            stopAllAudio();
            return;
        }

        stopAllAudio();
        card.classList.add('active');

        // Load local audio files from /audio folder
        currentAudio = new Audio(`audio/${type}.mp3`);
        currentAudio.loop = true;
        currentAudio.play().catch(e => {
            alert("Please click anywhere on the page first to enable audio playback.");
        });
    }

    grid.querySelectorAll('.mood-card').forEach(card => {
        card.querySelector('button').addEventListener('click', e => {
            e.stopPropagation();
            const type = card.dataset.mood;
            playAudio(type, card);
        });
    });

  
    const cl = document.getElementById('checklist');
    const state = JSON.parse(localStorage.getItem('tn_status') || '{}');
    cl.innerHTML = DESTINATIONS.map(d => `
        <div class="check-item">
            <label>${d.name} <span style="color:#888; font-weight:400">· ${d.country}</span></label>
            <select data-id="${d.id}">
                <option value="">— Status —</option>
                <option value="planned" ${state[d.id] === 'planned' ? 'selected' : ''}>Planned</option>
                <option value="visited" ${state[d.id] === 'visited' ? 'selected' : ''}>Visited</option>
            </select>
        </div>`).join('');

    cl.querySelectorAll('select').forEach(s => s.addEventListener('change', () => {
        const st = JSON.parse(localStorage.getItem('tn_status') || '{}');
        if (s.value) st[s.dataset.id] = s.value; else delete st[s.dataset.id];
        localStorage.setItem('tn_status', JSON.stringify(st));
    }));
}

// ==========================================
// PAGE: FEEDBACK (Validated Form & Accordion)
// ==========================================
function initFeedback() {
    const form = document.getElementById('feedback-form');
    if (!form) return;

    const successMsg = document.getElementById('fb-success');

    form.addEventListener('submit', e => {
        e.preventDefault();
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const message = form.message.value.trim();
        let isValid = true;

        const eName = document.getElementById('e-name');
        const eEmail = document.getElementById('e-email');
        const eMsg = document.getElementById('e-msg');

        eName.classList.remove('show'); eEmail.classList.remove('show'); eMsg.classList.remove('show');

        if (name.length < 2) { eName.textContent = 'Please enter your full name'; eName.classList.add('show'); isValid = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { eEmail.textContent = 'Please enter a valid email address'; eEmail.classList.add('show'); isValid = false; }
        if (message.length < 10) { eMsg.textContent = 'Message must be at least 10 characters'; eMsg.classList.add('show'); isValid = false; }

        if (!isValid) return;

        
        const feedbackData = JSON.parse(localStorage.getItem('tn_feedback') || '[]');
        feedbackData.push({ name, email, message, t: Date.now() });
        localStorage.setItem('tn_feedback', JSON.stringify(feedbackData));

        form.reset();
        successMsg.textContent = `✓ Thank you, ${name}! Your feedback has been stored locally.`;
        successMsg.classList.add('show');
        setTimeout(() => successMsg.classList.remove('show'), 5000);
    });

    
    document.querySelectorAll('.faq-item').forEach(item => {
        item.querySelector('.faq-q').addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });
}