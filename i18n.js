class I18n {
    constructor() {
        this.translations = {};
        this.currentLang = localStorage.getItem('preferred-language') || 'pt-BR';
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            await this.loadTranslations(this.currentLang);
            await this.waitForDOM();
            this.applyTranslations();
            this.setupLanguageSelector();
            this.isInitialized = true;
            
            console.log('I18n initialized successfully');
        } catch (error) {
            console.error('Failed to initialize I18n:', error);
            this.retryInitialization();
        }
    }

    async waitForDOM(maxRetries = 10, interval = 100) {
        for (let i = 0; i < maxRetries; i++) {
            const langSelector = document.querySelector('.lang-selector');
            if (langSelector) return true;
            
            if (i === maxRetries - 1) {
                throw new Error('Language selector not found in DOM');
            }
            
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`../locales/${lang}.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.translations = await response.json();
        } catch (error) {
            console.warn(`Failed to load ${lang} translations:`, error);
            
            const fallbackLangs = ['pt-BR', 'en', 'es'];
            for (const fallbackLang of fallbackLangs) {
                try {
                    console.log(`Trying fallback: ${fallbackLang}`);
                    const fallbackResponse = await fetch(`../locales/${fallbackLang}.json`);
                    if (fallbackResponse.ok) {
                        this.translations = await fallbackResponse.json();
                        this.currentLang = fallbackLang;
                        localStorage.setItem('preferred-language', fallbackLang);
                        console.log(`Fallback to ${fallbackLang} successful`);
                        return;
                    }
                } catch (fallbackError) {
                    console.warn(`Fallback ${fallbackLang} also failed:`, fallbackError);
                }
            }
            
            throw new Error('All translation fallbacks failed');
        }
    }

    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        if (elements.length === 0) {
            console.warn('No translatable elements found');
            return;
        }

        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            
            if (translation) {
                this.applyTranslationToElement(element, translation);
            } else {
                console.warn(`Translation not found for key: ${key}`);
            }
        });

        document.documentElement.lang = this.currentLang;
        this.updateLanguageDisplay();
    }

    applyTranslationToElement(element, translation) {
        const tagName = element.tagName.toLowerCase();
        
        switch (tagName) {
            case 'input':
            case 'textarea':
                if (element.type !== 'submit' && element.type !== 'button') {
                    element.placeholder = translation;
                } else {
                    element.value = translation;
                }
                break;
            case 'meta':
                element.content = translation;
                break;
            case 'title':
                element.textContent = translation;
                break;
            case 'img':
                element.alt = translation;
                break;
            default:
                element.textContent = translation;
        }
    }

    getTranslation(key) {
        try {
            return key.split('.').reduce((obj, i) => obj?.[i], this.translations);
        } catch (error) {
            console.error(`Error getting translation for key ${key}:`, error);
            return null;
        }
    }

    setupLanguageSelector() {
        const langSelector = document.querySelector('.lang-selector');
        
        if (!langSelector) {
            console.error('Language selector not found');
            return;
        }

        this.bindLanguageSelectorEvents(langSelector);
        console.log('Language selector events bound');
    }

    bindLanguageSelectorEvents(langSelector) {
        const langTrigger = langSelector.querySelector('.lang-trigger');
        const langOptions = langSelector.querySelectorAll('.lang-option');

        if (!langTrigger) {
            console.error('Language trigger not found');
            return;
        }

        langTrigger.replaceWith(langTrigger.cloneNode(true));
        langOptions.forEach(option => option.replaceWith(option.cloneNode(true)));

        const newLangTrigger = langSelector.querySelector('.lang-trigger');
        const newLangOptions = langSelector.querySelectorAll('.lang-option');

        newLangTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = langSelector.classList.contains('open');
            langSelector.classList.toggle('open');
            newLangTrigger.setAttribute('aria-expanded', String(!isOpen));
        });

        newLangOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = option.getAttribute('data-value');
                this.changeLanguage(lang);
                langSelector.classList.remove('open');
                newLangTrigger.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', () => {
            langSelector.classList.remove('open');
            newLangTrigger.setAttribute('aria-expanded', 'false');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && langSelector.classList.contains('open')) {
                langSelector.classList.remove('open');
                newLangTrigger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    updateLanguageDisplay() {
        const langTrigger = document.querySelector('.lang-trigger');
        const langOptions = document.querySelectorAll('.lang-option');
        const currentLang = this.currentLang;

        if (!langTrigger) return;

        const currentOption = document.querySelector(`.lang-option[data-value="${currentLang}"]`);
        if (currentOption) {
            const flagSrc = currentOption.querySelector('.lang-flag')?.src;
            const langText = currentOption.querySelector('.lang-text')?.textContent;
            
            if (flagSrc) {
                langTrigger.querySelector('.lang-flag').src = flagSrc;
            }
            
            if (langText) {
                langTrigger.querySelector('.lang-text').textContent = 
                    currentLang === 'pt-BR' ? 'PT' : 
                    currentLang === 'en' ? 'EN' : 'ES';
            }
        }

        langOptions.forEach(option => {
            const isSelected = option.getAttribute('data-value') === currentLang;
            option.setAttribute('aria-selected', isSelected);
            const textElement = option.querySelector('.lang-text');
            if (textElement) {
                textElement.style.fontWeight = isSelected ? '600' : '400';
            }
        });
    }

    async changeLanguage(lang) {
        if (lang === this.currentLang) return;
        
        try {
            this.currentLang = lang;
            localStorage.setItem('preferred-language', lang);
            await this.loadTranslations(lang);
            this.applyTranslations();
            
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: lang }
            }));
            
            console.log(`Language changed to: ${lang}`);
        } catch (error) {
            console.error('Failed to change language:', error);
        }
    }

    getCurrentLanguage() {
        return this.currentLang;
    }

    retryInitialization() {
        console.log('Retrying I18n initialization in 2 seconds...');
        setTimeout(() => {
            this.init();
        }, 2000);
    }

    reinitialize() {
        this.isInitialized = false;
        this.init();
    }
}

function initializeI18n() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.i18n = new I18n();
        });
    } else {
        window.i18n = new I18n();
    }
}

initializeI18n();