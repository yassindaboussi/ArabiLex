// Data storage for JSON files
const dataSources = {
    startsWith: {},
    startsWithOld: {},
    startsWithSome: {},
    endsWith: {},
    endsWithOld: {},
    endsWithSome: {}
};

let allWords = [];
let isLoading = false;
let searchStartTime = 0;

// Arabic letter mapping with enhanced organization
const letters = [
    "alf", "hlf", "aaa", "eee", "hmz", "baa", "taa", "tah", "tha", 
    "jim", "7aa", "kha", "dal", "thl", "raa", "zen", "sin", "shn", 
    "sad", "dad", "6aa", "zaa", "3in", "ghn", "faa", "gaf", "kaf", 
    "lam", "mim", "non", "haa", "waw", "waa", "yaa", "yea", "aae"
];

const arabicLetterMap = {
    "alf": "ا", "hlf": "أ", "aaa": "آ", "eee": "إ", "hmz": "ء", "baa": "ب", 
    "taa": "ت", "tah": "ث", "tha": "ث", "jim": "ج", "7aa": "ح", "kha": "خ", 
    "dal": "د", "thl": "ذ", "raa": "ر", "zen": "ز", "sin": "س", "shn": "ش",
    "sad": "ص", "dad": "ض", "6aa": "ط", "zaa": "ظ", "3in": "ع", "ghn": "غ", 
    "faa": "ف", "gaf": "ق", "kaf": "ك", "lam": "ل", "mim": "م", "non": "ن", 
    "haa": "ه", "waw": "و", "waa": "ؤ", "yaa": "ي", "yea": "ى", "aae": "ئ"
};

// Letter names for display with enhanced accessibility
const letterNames = {
    "alf": "ألف", "hlf": "ألف", "aaa": "ألف", "eee": "ألف", "hmz": "همزة", 
    "baa": "باء", "taa": "تاء", "tah": "ثاء", "tha": "ثاء", "jim": "جيم", 
    "7aa": "حاء", "kha": "خاء", "dal": "دال", "thl": "ذال", "raa": "راء", 
    "zen": "زاي", "sin": "سين", "shn": "شين", "sad": "صاد", "dad": "ضاد", 
    "6aa": "طاء", "zaa": "ظاء", "3in": "عين", "ghn": "غين", "faa": "فاء", 
    "gaf": "قاف", "kaf": "كاف", "lam": "لام", "mim": "ميم", "non": "نون", 
    "haa": "هاء", "waw": "واو", "waa": "واو", "yaa": "ياء", "yea": "ياء", "aae": "ياء"
};

// Enhanced tab management class
class TabManager {
    constructor() {
        this.activeTab = 'startsWith';
        this.tabs = new Map();
        this.init();
    }

    init() {
        const tabElements = document.querySelectorAll('.tab-nav-item');
        tabElements.forEach(tab => {
            const tabId = tab.dataset.tab;
            this.tabs.set(tabId, {
                element: tab,
                content: document.getElementById(tabId)
            });
            
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(tabId);
            });
        });

        // Enhanced keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && !e.shiftKey && !e.altKey) {
                const tabKeys = ['1', '2', '3', '4', '5'];
                const keyIndex = tabKeys.indexOf(e.key);
                if (keyIndex !== -1) {
                    e.preventDefault();
                    const tabIds = ['startsWith', 'endsWith', 'contains', 'anyOrder', 'startEnd'];
                    if (tabIds[keyIndex]) {
                        this.switchTab(tabIds[keyIndex]);
                    }
                }
            }
        });

        // Add ripple effect to tabs
        tabElements.forEach(tab => {
            tab.addEventListener('click', this.createRippleEffect);
        });
    }

    createRippleEffect(e) {
        const ripple = document.createElement('span');
        const rect = e.currentTarget.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        e.currentTarget.style.position = 'relative';
        e.currentTarget.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    switchTab(tabId) {
        if (this.activeTab === tabId) return;

        // Animate out current tab
        const currentTab = this.tabs.get(this.activeTab);
        if (currentTab) {
            currentTab.element.classList.remove('active');
            if (currentTab.content) {
                currentTab.content.style.opacity = '0';
                currentTab.content.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    currentTab.content.classList.remove('active');
                }, 150);
            }
        }

        // Animate in new tab
        setTimeout(() => {
            const newTab = this.tabs.get(tabId);
            if (newTab) {
                newTab.element.classList.add('active');
                if (newTab.content) {
                    newTab.content.classList.add('active');
                    setTimeout(() => {
                        newTab.content.style.opacity = '1';
                        newTab.content.style.transform = 'translateY(0)';
                    }, 50);
                }
                this.activeTab = tabId;
                this.clearResults();
            }
        }, 150);
    }

    clearResults() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
    }
}

// Enhanced data management class
class DataManager {
    constructor() {
        this.loadPromise = null;
        this.isDataLoaded = false;
    }

    async loadJsonFiles() {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this._performLoad();
        return this.loadPromise;
    }

    async _performLoad() {
        try {
            const files = [
                { url: 'Datasets/startWithWords.json', key: 'startsWith' },
                { url: 'Datasets/startWithWordsOLD.json', key: 'startsWithOld' },
                { url: 'Datasets/startWithWordsSome.json', key: 'startsWithSome' },
                { url: 'Datasets/endsWithWords.json', key: 'endsWith' },
                { url: 'Datasets/endsWithWordsOLD.json', key: 'endsWithOld' },
                { url: 'Datasets/endsWithWordsSome.json', key: 'endsWithSome' }
            ];

            const loadPromises = files.map(async (file) => {
                try {
                    const response = await fetch(file.url);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    dataSources[file.key] = data;
                    console.log(`✅ Successfully loaded ${file.key}: ${Object.keys(data).length} categories`);
                    return { success: true, key: file.key };
                } catch (error) {
                    console.warn(`⚠️ Failed to load ${file.url}:`, error.message);
                    dataSources[file.key] = {};
                    return { success: false, key: file.key, error: error.message };
                }
            });

            const results = await Promise.all(loadPromises);
            const successfulLoads = results.filter(r => r.success).length;
            const totalFiles = files.length;

            allWords = this.getAllWords();
            this.updateWordCount();
            
            console.log(`🎉 Data loading complete! Loaded ${successfulLoads}/${totalFiles} files. Total words: ${allWords.length.toLocaleString()}`);
            
            this.isDataLoaded = true;
            this.showNotification(`تم تحميل ${successfulLoads} من ${totalFiles} ملفات البيانات بنجاح`, 'success');
            
            return true;
            
        } catch (error) {
            console.error('❌ Critical error loading data:', error);
            this.showErrorMessage('حدث خطأ في تحميل البيانات. يرجى إعادة تحميل الصفحة.');
            return false;
        }
    }

    getAllWords() {
        const wordSet = new Set();
        
        Object.values(dataSources).forEach(source => {
            if (typeof source === 'object' && source !== null) {
                Object.values(source).forEach(letterData => {
                    if (typeof letterData === 'object' && letterData !== null) {
                        Object.values(letterData).forEach(words => {
                            if (Array.isArray(words)) {
                                words.forEach(word => {
                                    if (typeof word === 'string' && word.trim()) {
                                        wordSet.add(word.trim());
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
        
        return Array.from(wordSet).sort((a, b) => a.localeCompare(b, 'ar'));
    }

    updateWordCount() {
        const countElement = document.getElementById('totalWordsCount');
        if (countElement && allWords.length > 0) {
            // Animate the number counting up
            this.animateCounter(countElement, 0, allWords.length, 1500);
        }
    }

    animateCounter(element, start, end, duration) {
        const startTime = performance.now();
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (end - start) * this.easeOutQuart(progress));
            element.textContent = current.toLocaleString('ar');
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        requestAnimationFrame(update);
    }

    easeOutQuart(t) {
        return 1 - (--t) * t * t * t;
    }

    showNotification(message, type = 'info', duration = 5000) {
        const toast = document.getElementById('notificationToast');
        const icon = toast.querySelector('.toast-icon i');
        const title = toast.querySelector('.toast-title');
        const messageEl = toast.querySelector('.toast-message');
        
        // Set content
        messageEl.textContent = message;
        
        // Set icon and styling based on type
        const typeConfig = {
            success: { icon: 'fas fa-check-circle', title: 'نجح!', color: '#22c55e' },
            error: { icon: 'fas fa-exclamation-circle', title: 'خطأ!', color: '#ef4444' },
            warning: { icon: 'fas fa-exclamation-triangle', title: 'تحذير!', color: '#f59e0b' },
            info: { icon: 'fas fa-info-circle', title: 'معلومات', color: '#3b82f6' }
        };
        
        const config = typeConfig[type] || typeConfig.info;
        icon.className = config.icon;
        title.textContent = config.title;
        toast.querySelector('.toast-icon').style.background = config.color;
        
        // Show toast
        toast.classList.add('show');
        
        // Auto hide
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
        
        // Close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.onclick = () => toast.classList.remove('show');
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error', 10000);
        
        // Also create a more prominent error display if needed
        const existingError = document.querySelector('.critical-error');
        if (!existingError) {
            const container = document.querySelector('.main-container');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'critical-error';
            errorDiv.innerHTML = `
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>خطأ في النظام</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="retry-button">
                        <i class="fas fa-redo"></i>
                        إعادة المحاولة
                    </button>
                </div>
            `;
            container.prepend(errorDiv);
        }
    }
}

// Enhanced letter button manager
class LetterButtonManager {
    constructor() {
        this.observers = new Map();
        this.init();
    }

    init() {
        this.createLetterButtons();
        this.setupKeyboardShortcuts();
        this.setupIntersectionObservers();
    }

    createLetterButtons() {
        const grids = [
            { id: 'startLetterGrid', type: 'starts' },
            { id: 'endLetterGrid', type: 'ends' },
            { id: 'containsLetterGrid', type: 'contains' },
            { id: 'containsAnyOrderGrid', type: 'containsAnyOrder' }
        ];

        grids.forEach(({ id, type }) => {
            const grid = document.getElementById(id);
            if (!grid) return;

            grid.innerHTML = '';
            
            letters.forEach((letter, index) => {
                const btn = this.createLetterButton(letter, index, type);
                grid.appendChild(btn);
                
                // Stagger animation for visual appeal
                btn.style.opacity = '0';
                btn.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    btn.style.transition = 'all 0.3s ease-out';
                    btn.style.opacity = '1';
                    btn.style.transform = 'translateY(0)';
                }, index * 20);
            });
        });
    }

    createLetterButton(letter, index, type) {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.setAttribute('data-letter', letter);
        btn.setAttribute('data-type', type);
        btn.setAttribute('title', `البحث عن كلمات ${this.getTypeLabel(type)} "${arabicLetterMap[letter]}" (${letterNames[letter]})`);
        btn.setAttribute('aria-label', `البحث عن كلمات ${this.getTypeLabel(type)} ${letterNames[letter]}`);
        
        btn.innerHTML = `
            <div class="letter">${arabicLetterMap[letter]}</div>
            <div class="name">${letterNames[letter]}</div>
        `;
        
        // Enhanced event handlers
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLetterClick(letter, type, btn);
        });

        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleLetterClick(letter, type, btn);
            }
        });

        // Enhanced hover effects with debouncing
        let hoverTimeout;
        btn.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                this.showLetterPreview(letter, type, btn);
            }, 300);
        });

        btn.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout);
            this.hideLetterPreview();
        });

        return btn;
    }

    getTypeLabel(type) {
        const labels = {
            'starts': 'تبدأ بحرف',
            'ends': 'تنتهي بحرف', 
            'contains': 'تحتوي على حرف',
            'containsAnyOrder': 'تحتوي على حرف'
        };
        return labels[type] || 'تحتوي على';
    }

    handleLetterClick(letter, type, button) {
        if (isLoading) return;

        // Enhanced visual feedback
        button.style.transform = 'scale(0.95)';
        button.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
        
        setTimeout(() => {
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 200);

        // Add success particle effect
        this.createSuccessParticles(button);

        // Perform search with slight delay for visual feedback
        setTimeout(() => {
            searchManager.searchByLetter(letter, type);
        }, 100);
    }

    createSuccessParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: #3b82f6;
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: ${centerX}px;
                top: ${centerY}px;
            `;
            
            document.body.appendChild(particle);
            
            const angle = (i / 6) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${x}px, ${y}px) scale(0)`, opacity: 0 }
            ], {
                duration: 600,
                easing: 'ease-out'
            }).onfinish = () => particle.remove();
        }
    }

    showLetterPreview(letter, type, button) {
        // Could implement tooltip preview functionality here
        const arabicLetter = arabicLetterMap[letter];
        console.log(`Preview for ${arabicLetter} (${type})`);
    }

    hideLetterPreview() {
        // Hide any preview tooltips
    }

    setupIntersectionObservers() {
        const observerOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe all letter grids
        document.querySelectorAll('.letters-grid').forEach(grid => {
            observer.observe(grid);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + number for quick letter access
            if (e.altKey && !e.ctrlKey && !e.shiftKey) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= letters.length) {
                    e.preventDefault();
                    const letter = letters[num - 1];
                    const activeTab = document.querySelector('.tab-pane.active');
                    if (activeTab) {
                        const type = this.getTypeFromTabId(activeTab.id);
                        this.handleLetterClick(letter, type, null);
                    }
                }
            }
        });
    }

    getTypeFromTabId(tabId) {
        const mapping = {
            'startsWith': 'starts',
            'endsWith': 'ends',
            'contains': 'contains',
            'anyOrder': 'containsAnyOrder'
        };
        return mapping[tabId] || 'contains';
    }
}

// Enhanced search manager
class SearchManager {
    constructor() {
        this.lastSearchTime = 0;
        this.searchDelay = 300;
        this.currentSearch = null;
        this.searchHistory = [];
    }

    async searchByLetter(letter, type) {
        if (!allWords.length) {
            await dataManager.loadJsonFiles();
        }

        searchStartTime = performance.now();
        showLoading();
        
        try {
            const results = await this.performLetterSearch(letter, type);
            const arabicLetter = arabicLetterMap[letter];
            const title = this.getSearchTitle(type, arabicLetter);
            
            // Add to search history
            this.addToSearchHistory({ type: 'letter', letter: arabicLetter, searchType: type, results: results.length });
            
            await this.displayResults(results, title);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showSearchError('حدث خطأ أثناء البحث عن الحرف');
        } finally {
            hideLoading();
        }
    }

    async performLetterSearch(letter, type) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let results = [];
                const arabicLetter = arabicLetterMap[letter];
                
                switch (type) {
                    case 'starts':
                        results = this.getStartsWithResults(letter);
                        break;
                    case 'ends':
                        results = this.getEndsWithResults(letter);
                        break;
                    case 'contains':
                    case 'containsAnyOrder':
                        results = allWords.filter(word => word.includes(arabicLetter));
                        break;
                }
                
                // Remove duplicates and filter empty results
                const uniqueResults = [...new Set(results)].filter(word => word && word.trim());
                resolve(uniqueResults);
            }, 50);
        });
    }

    getStartsWithResults(letter) {
        const results = [];
        
        if (dataSources.startsWith[letter]) {
            Object.values(dataSources.startsWith[letter]).forEach(words => {
                if (Array.isArray(words)) results.push(...words);
            });
        }
        
        if (dataSources.startsWithOld[letter]) {
            Object.values(dataSources.startsWithOld[letter]).forEach(words => {
                if (Array.isArray(words)) results.push(...words);
            });
        }
        
        if (dataSources.startsWithSome[letter]) {
            Object.values(dataSources.startsWithSome[letter]).forEach(words => {
                if (Array.isArray(words)) results.push(...words);
            });
        }
        
        return results;
    }

    getEndsWithResults(letter) {
        const results = [];
        
        if (dataSources.endsWith[letter]) {
            Object.values(dataSources.endsWith[letter]).forEach(words => {
                if (Array.isArray(words)) results.push(...words);
            });
        }
        
        if (dataSources.endsWithOld[letter]) {
            Object.values(dataSources.endsWithOld[letter]).forEach(words => {
                if (Array.isArray(words)) results.push(...words);
            });
        }
        
        if (dataSources.endsWithSome[letter]) {
            Object.values(dataSources.endsWithSome[letter]).forEach(words => {
                if (Array.isArray(words)) results.push(...words);
            });
        }
        
        return results;
    }

    getSearchTitle(type, arabicLetter) {
        const titles = {
            'starts': `كلمات تبدأ بحرف "${arabicLetter}"`,
            'ends': `كلمات تنتهي بحرف "${arabicLetter}"`,
            'contains': `كلمات تحتوي على حرف "${arabicLetter}"`,
            'containsAnyOrder': `كلمات تحتوي على حرف "${arabicLetter}"`
        };
        return titles[type] || `نتائج البحث عن "${arabicLetter}"`;
    }

    // Enhanced text-based searches
    async searchStartsWith() {
        const input = document.getElementById('startSearchInput')?.value.trim();
        if (!input) {
            this.showInputError('startSearchInput', 'يرجى إدخال نص للبحث');
            return;
        }
        
        await this.performTextSearch(input, 'startsWith', `كلمات تبدأ بـ "${input}"`);
    }

    async searchEndsWith() {
        const input = document.getElementById('endSearchInput')?.value.trim();
        if (!input) {
            this.showInputError('endSearchInput', 'يرجى إدخال نص للبحث');
            return;
        }
        
        await this.performTextSearch(input, 'endsWith', `كلمات تنتهي بـ "${input}"`);
    }

    async searchContains() {
        const input = document.getElementById('containsSearchInput')?.value.trim();
        if (!input) {
            this.showInputError('containsSearchInput', 'يرجى إدخال نص للبحث');
            return;
        }
        
        await this.performTextSearch(input, 'contains', `كلمات تحتوي على "${input}"`);
    }

    async searchContainsAnyOrder() {
        const input = document.getElementById('containsAnyOrderInput')?.value.trim();
        if (!input) {
            this.showInputError('containsAnyOrderInput', 'يرجى إدخال نص للبحث');
            return;
        }
        
        await this.performTextSearch(input, 'containsAnyOrder', `كلمات تحتوي على أحرف "${input}" بأي ترتيب`);
    }

    async searchStartsAndEndsWith() {
        const startInput = document.getElementById('startEndStartInput')?.value.trim();
        const endInput = document.getElementById('startEndEndInput')?.value.trim();
        
        if (!startInput || !endInput) {
            if (!startInput) this.showInputError('startEndStartInput', 'يرجى إدخال البداية');
            if (!endInput) this.showInputError('startEndEndInput', 'يرجى إدخال النهاية');
            return;
        }
        
        searchStartTime = performance.now();
        showLoading();
        
        try {
            const results = await this.performDualTextSearch(startInput, endInput);
            const title = `كلمات تبدأ بـ "${startInput}" وتنتهي بـ "${endInput}"`;
            
            this.addToSearchHistory({ 
                type: 'dual', 
                start: startInput, 
                end: endInput, 
                results: results.length 
            });
            
            await this.displayResults(results, title);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showSearchError('حدث خطأ أثناء البحث');
        } finally {
            hideLoading();
        }
    }

    async performTextSearch(input, type, title) {
        if (!allWords.length) {
            await dataManager.loadJsonFiles();
        }

        searchStartTime = performance.now();
        showLoading();
        
        try {
            const results = await this.executeTextSearch(input, type);
            
            this.addToSearchHistory({ 
                type: 'text', 
                query: input, 
                searchType: type, 
                results: results.length 
            });
            
            await this.displayResults(results, title);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showSearchError('حدث خطأ أثناء البحث');
        } finally {
            hideLoading();
        }
    }

    async executeTextSearch(input, type) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let results;
                
                switch (type) {
                    case 'startsWith':
                        results = allWords.filter(word => word.startsWith(input));
                        break;
                    case 'endsWith':
                        results = allWords.filter(word => word.endsWith(input));
                        break;
                    case 'contains':
                        results = allWords.filter(word => word.includes(input));
                        break;
                    case 'containsAnyOrder':
                        results = this.filterWordsByCharacters(input);
                        break;
                    default:
                        results = [];
                }
                
                resolve(results);
            }, 50);
        });
    }

    async performDualTextSearch(startInput, endInput) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const results = allWords.filter(word => 
                    word.startsWith(startInput) && word.endsWith(endInput)
                );
                resolve(results);
            }, 50);
        });
    }

    filterWordsByCharacters(input) {
        const inputChars = [...input];
        const inputFreq = this.getCharFrequency(inputChars);
        
        return allWords.filter(word => {
            return Object.entries(inputFreq).every(([char, count]) => {
                const wordCharCount = this.countCharInWord(word, char);
                return wordCharCount >= count;
            });
        });
    }

    getCharFrequency(chars) {
        const freq = {};
        chars.forEach(char => {
            freq[char] = (freq[char] || 0) + 1;
        });
        return freq;
    }

    countCharInWord(word, char) {
        return [...word].filter(c => c === char).length;
    }

    addToSearchHistory(searchData) {
        const historyItem = {
            ...searchData,
            timestamp: new Date(),
            id: Date.now()
        };
        
        this.searchHistory.unshift(historyItem);
        if (this.searchHistory.length > 50) {
            this.searchHistory = this.searchHistory.slice(0, 50);
        }
        
        console.log('Search added to history:', historyItem);
    }

    showInputError(inputId, message) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        input.style.borderColor = 'var(--error)';
        input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        
        // Show error message
        dataManager.showNotification(message, 'error', 3000);
        
        // Auto clear after delay
        setTimeout(() => {
            this.clearInputError(inputId);
        }, 5000);
    }

    clearInputError(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }
    }

    showSearchError(message = 'حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.') {
        dataManager.showNotification(message, 'error', 5000);
    }

    async displayResults(results, title) {
        const resultsSection = document.getElementById('resultsSection');
        const resultsTitle = document.getElementById('resultsTitle');
        const resultsCount = document.getElementById('resultsCount');
        const resultsContent = document.getElementById('resultsContent');
        const searchTime = document.getElementById('searchTime');
        
        if (!resultsSection || !resultsTitle || !resultsCount || !resultsContent) {
            console.error('Results elements not found');
            return;
        }

        // Calculate search time
        const searchDuration = ((performance.now() - searchStartTime) / 1000).toFixed(2);
        
        resultsTitle.textContent = title;
        resultsCount.textContent = `${results.length} كلمة`;
        if (searchTime) {
            searchTime.textContent = `تم البحث في ${searchDuration} ثانية`;
        }
        
        // Remove duplicates and sort
        const uniqueResults = [...new Set(results)]
            .filter(word => word && word.trim())
            .sort((a, b) => a.localeCompare(b, 'ar'));
        
        if (uniqueResults.length === 0) {
            resultsContent.innerHTML = this.getNoResultsHTML();
        } else {
            resultsContent.innerHTML = this.formatResults(uniqueResults);
            // Show success notification
            dataManager.showNotification(`تم العثور على ${uniqueResults.length} كلمة`, 'success', 3000);
        }
        
        // Smooth reveal animation
        resultsSection.style.display = 'block';
        resultsSection.style.opacity = '0';
        resultsSection.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            resultsSection.style.transition = 'all 0.5s ease-out';
            resultsSection.style.opacity = '1';
            resultsSection.style.transform = 'translateY(0)';
        }, 100);
        
        // Smooth scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 600);
    }

    formatResults(results) {
        // Enhanced grouping with statistics
        const groupedResults = this.groupResultsByLength(results);
        const sortedLengths = Object.keys(groupedResults).sort((a, b) => parseInt(a) - parseInt(b));
        
        return sortedLengths.map(length => {
            const wordsOfLength = groupedResults[length];
            const lengthLabel = this.getLengthLabel(parseInt(length));
            
            return `
                <div class="length-group" style="animation: slideInUp 0.5s ease-out">
                    <div class="length-header">
                        <h3 class="length-title">${lengthLabel}</h3>
                        <span class="word-count-badge">${wordsOfLength.length} كلمة</span>
                    </div>
                    <div class="words-list" dir="rtl">${this.formatWordsList(wordsOfLength)}</div>
                </div>
            `;
        }).join('');
    }

    groupResultsByLength(results) {
        const grouped = {};
        results.forEach(word => {
            const length = word.length;
            if (!grouped[length]) {
                grouped[length] = [];
            }
            grouped[length].push(word);
        });
        return grouped;
    }

    getLengthLabel(length) {
        if (length === 1) return 'كلمات من حرف واحد';
        if (length === 2) return 'كلمات من حرفين';
        if (length <= 10) return `كلمات من ${length} أحرف`;
        return `كلمات طويلة (${length} حرف)`;
    }

    formatWordsList(words) {
        // Add word highlighting and better formatting
        return words.map(word => `<span class="word-item">${word}</span>`).join('، ');
    }

    getNoResultsHTML() {
        return `
            <div class="no-results">
                <i class="fas fa-search-minus"></i>
                <h3>لم يتم العثور على نتائج</h3>
                <p>جرب البحث بكلمات أو أحرف مختلفة</p>
                <div style="margin-top: 1rem;">
                    <button onclick="searchManager.showSearchTips()" class="search-btn secondary">
                        <i class="fas fa-lightbulb"></i>
                        نصائح للبحث
                    </button>
                </div>
            </div>
        `;
    }

    showSearchTips() {
        const tips = `
            <strong>نصائح للبحث الفعال:</strong><br><br>
            • استخدم أحرف قليلة في البداية<br>
            • تأكد من الإملاء الصحيح<br>
            • جرب البحث بطرق مختلفة<br>
            • استخدم البحث الذكي للأحرف المتنوعة
        `;
        dataManager.showNotification(tips, 'info', 10000);
    }
}

// Enhanced utility functions
function showLoading() {
    isLoading = true;
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
        loadingIndicator.style.opacity = '0';
        setTimeout(() => {
            loadingIndicator.style.opacity = '1';
        }, 50);
        document.body.style.overflow = 'hidden';
    }
}

function hideLoading() {
    isLoading = false;
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.opacity = '0';
        setTimeout(() => {
            loadingIndicator.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
}

function clearResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.opacity = '0';
        resultsSection.style.transform = 'translateY(-30px)';
        setTimeout(() => {
            resultsSection.style.display = 'none';
            resultsSection.style.transform = '';
        }, 300);
    }
}

// Enhanced input handlers
function setupInputHandlers() {
    const inputs = [
        'startSearchInput',
        'endSearchInput', 
        'containsSearchInput',
        'containsAnyOrderInput',
        'startEndStartInput',
        'startEndEndInput'
    ];

    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (!input) return;

        // Enhanced input validation and formatting
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            
            // Clear any previous errors
            searchManager.clearInputError(inputId);
            
            // Optional: Filter non-Arabic characters
            const arabicOnly = value.replace(/[^\u0600-\u06FF\s]/g, '');
            if (arabicOnly !== value) {
                e.target.value = arabicOnly;
                dataManager.showNotification('تم حذف الأحرف غير العربية', 'info', 2000);
            }
        });

        // Enhanced Enter key support
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const searchFunction = getSearchFunctionForInput(inputId);
                if (searchFunction) {
                    searchFunction();
                }
            }
        });

        // Enhanced paste handling
        input.addEventListener('paste', (e) => {
            setTimeout(() => {
                const value = e.target.value;
                const arabicOnly = value.replace(/[^\u0600-\u06FF\s]/g, '');
                if (arabicOnly !== value) {
                    e.target.value = arabicOnly;
                    dataManager.showNotification('تم تنظيف النص المُلصق', 'info', 2000);
                }
            }, 10);
        });

        // Add focus/blur effects
        input.addEventListener('focus', (e) => {
            e.target.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', (e) => {
            e.target.parentElement.classList.remove('focused');
        });
    });
}

function getSearchFunctionForInput(inputId) {
    const functionMap = {
        'startSearchInput': () => searchManager.searchStartsWith(),
        'endSearchInput': () => searchManager.searchEndsWith(),
        'containsSearchInput': () => searchManager.searchContains(),
        'containsAnyOrderInput': () => searchManager.searchContainsAnyOrder(),
        'startEndStartInput': () => searchManager.searchStartsAndEndsWith(),
        'startEndEndInput': () => searchManager.searchStartsAndEndsWith()
    };
    return functionMap[inputId];
}

// Global function wrappers for backwards compatibility
function searchStartsWith() {
    searchManager.searchStartsWith();
}

function searchEndsWith() {
    searchManager.searchEndsWith();
}

function searchContains() {
    searchManager.searchContains();
}

function searchContainsAnyOrder() {
    searchManager.searchContainsAnyOrder();
}

function searchStartsAndEndsWith() {
    searchManager.searchStartsAndEndsWith();
}

// Initialize all managers
const tabManager = new TabManager();
const dataManager = new DataManager();
const letterButtonManager = new LetterButtonManager();
const searchManager = new SearchManager();

// Enhanced initialization with better error handling
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Enhanced Arabic Word Search Engine...');
    
    try {
        // Setup input handlers
        setupInputHandlers();
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes ripple {
                from { transform: scale(0); opacity: 1; }
                to { transform: scale(4); opacity: 0; }
            }
            .word-item {
                display: inline;
                padding: 2px 4px;
                margin: 0 2px;
                background: rgba(59, 130, 246, 0.1);
                border-radius: 4px;
                transition: background 0.2s;
            }
            .word-item:hover {
                background: rgba(59, 130, 246, 0.2);
            }
            .input-wrapper.focused .input-icon {
                color: var(--primary-500);
                transform: translateY(-50%) scale(1.1);
            }
            .critical-error {
                background: #fee2e2;
                border: 1px solid #fecaca;
                border-radius: 12px;
                padding: 2rem;
                text-align: center;
                margin: 2rem 0;
            }
            .critical-error .error-content {
                color: #b91c1c;
            }
            .critical-error h3 {
                font-size: 1.25rem;
                margin: 1rem 0;
            }
            .retry-button {
                background: #dc2626;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 1rem;
                transition: background 0.2s;
            }
            .retry-button:hover {
                background: #b91c1c;
            }
        `;
        document.head.appendChild(style);
        
        // Load data in background
        dataManager.loadJsonFiles()
            .then(success => {
                if (success) {
                    console.log('✅ Application initialization complete!');
                } else {
                    console.error('❌ Application failed to initialize properly');
                }
            })
            .catch(error => {
                console.error('❌ Critical initialization error:', error);
                dataManager.showNotification('فشل في تهيئة التطبيق. قد تكون بعض الوظائف غير متاحة.', 'error');
            });

        // Add service worker for offline support (optional)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registered successfully');
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }

        // Add performance monitoring
        if (window.performance && window.performance.mark) {
            window.performance.mark('app-init-complete');
        }

        // Add global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            dataManager.showNotification('حدث خطأ غير متوقع', 'error');
        });

        // Add unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            dataManager.showNotification('حدث خطأ في معالجة البيانات', 'error');
        });
        
    } catch (error) {
        console.error('❌ Fatal initialization error:', error);
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 2rem;">
                <div>
                    <h1 style="color: #dc2626; margin-bottom: 1rem;">خطأ في التطبيق</h1>
                    <p style="color: #6b7280; margin-bottom: 2rem;">حدث خطأ أثناء تحميل التطبيق</p>
                    <button onclick="location.reload()" style="background: #dc2626; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer;">
                        إعادة التحميل
                    </button>
                </div>
            </div>
        `;
    }
});