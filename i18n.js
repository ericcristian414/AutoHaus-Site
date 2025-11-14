class I18n {
    constructor() {
        this.translations = {};
        this.currentLang = localStorage.getItem('preferred-language') || 'pt-BR';
        this.init();
    }

    async init() {
        await this.loadTranslations(this.currentLang);
        this.applyTranslations();
        this.setupLanguageSelector();
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`../locales/${lang}.json`);
            if (!response.ok) throw new Error('Translation file not found');
            this.translations = await response.json();
        } catch (error) {
            console.error('Error loading translations:', error);
            try {
                const fallbackResponse = await fetch('../locales/pt-BR.json');
                this.translations = await fallbackResponse.json();
            } catch (fallbackError) {
                console.error('Fallback translation also failed:', fallbackError);
            }
        }
    }

    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            
            if (translation) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else if (element.tagName === 'META') {
                    element.content = translation;
                } else if (element.tagName === 'TITLE') {
                    element.textContent = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        document.documentElement.lang = this.currentLang;
        
        this.updateLanguageDisplay();
    }

    getTranslation(key) {
        return key.split('.').reduce((obj, i) => obj?.[i], this.translations);
    }

    setupLanguageSelector() {
        const langSelector = document.querySelector('.lang-selector');
        const langTrigger = document.querySelector('.lang-trigger');
        const langOptions = document.querySelectorAll('.lang-option');

        if (langTrigger) {
            langTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                langSelector.classList.toggle('open');
                langTrigger.setAttribute('aria-expanded', 
                    langSelector.classList.contains('open'));
            });

            langOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const lang = option.getAttribute('data-value');
                    this.changeLanguage(lang);
                    langSelector.classList.remove('open');
                    langTrigger.setAttribute('aria-expanded', 'false');
                });
            });

            document.addEventListener('click', (e) => {
                if (!langSelector.contains(e.target)) {
                    langSelector.classList.remove('open');
                    langTrigger.setAttribute('aria-expanded', 'false');
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && langSelector.classList.contains('open')) {
                    langSelector.classList.remove('open');
                    langTrigger.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    updateLanguageDisplay() {
        const langTrigger = document.querySelector('.lang-trigger');
        const langOptions = document.querySelectorAll('.lang-option');
        const currentLang = this.currentLang;

        if (langTrigger) {
            const currentOption = document.querySelector(`.lang-option[data-value="${currentLang}"]`);
            if (currentOption) {
                const flagSrc = currentOption.querySelector('.lang-flag').src;
                const langText = currentOption.querySelector('.lang-text').textContent;
                
                langTrigger.querySelector('.lang-flag').src = flagSrc;
                langTrigger.querySelector('.lang-text').textContent = 
                    currentLang === 'pt-BR' ? 'PT' : 
                    currentLang === 'en' ? 'EN' : 'ES';
            }

            langOptions.forEach(option => {
                const isSelected = option.getAttribute('data-value') === currentLang;
                option.setAttribute('aria-selected', isSelected);
                option.querySelector('.lang-text').style.fontWeight = isSelected ? '600' : '400';
            });
        }
    }

    async changeLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('preferred-language', lang);
        await this.loadTranslations(lang);
        this.applyTranslations();
        
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang }
        }));
    }

    getCurrentLanguage() {
        return this.currentLang;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18n();
});