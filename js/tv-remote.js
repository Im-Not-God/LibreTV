// js/tv-remote.js
/**
 * TV遥控器支持模块
 * 提供完整的遥控器导航和控制功能
 */

class TVRemoteController {
    constructor() {
        this.isEnabled = this.detectTVEnvironment();
        this.focusHistory = [];
        this.currentFocusIndex = -1;
        this.modalStack = [];
        this.init();
    }

    // 检测是否为TV环境
    detectTVEnvironment() {
        const userAgent = navigator.userAgent.toLowerCase();
        const tvKeywords = ['smart-tv', 'smarttv', 'tv', 'webos', 'tizen', 'roku'];
        return tvKeywords.some(keyword => userAgent.includes(keyword)) || 
               window.screen.width >= 1920 || 
               'spatialNavigationSearch' in window ||
               window.location.search.includes('tv=1'); // 手动启用TV模式
    }

    init() {
        if (!this.isEnabled) return;

        this.setupSpatialNavigation();
        this.setupKeyboardHandlers();
        this.setupFocusManagement();
        this.setupModalHandlers();
        this.addTVModeIndicator();
        console.log('TV Remote Controller initialized');
    }

    // 设置空间导航
    setupSpatialNavigation() {
        if ('spatialNavigationSearch' in window) {
            window.spatialNavigationSearch.enable();
        }
    }

    // 添加TV模式指示器
    addTVModeIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'tv-mode-indicator';
        indicator.className = 'fixed top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full z-50';
        indicator.textContent = 'TV模式';
        document.body.appendChild(indicator);
    }

    // 设置键盘事件处理
    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e), true);
        document.addEventListener('keyup', (e) => this.handleKeyUp(e), true);
    }

    // 主要键盘事件处理
    handleKeyDown(e) {
        const focused = document.activeElement;
        
        // 阻止默认的空间导航行为，使用自定义逻辑
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
        }

        console.log(`Key pressed: ${e.key}, focused element: ${focused ? focused.tagName : 'none'}`);
        
        switch(e.key) {
            case 'Enter':
                this.handleEnterKey(e, focused);
                break;
            case 'Escape':
            case 'Backspace':
                this.handleBackKey(e);
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'ArrowUp':
            case 'ArrowDown':
                this.handleArrowKeys(e);
                break;
            case ' ':
                this.handleSpaceKey(e, focused);
                break;
            case 'Home':
                this.handleHomeKey(e);
                break;
            case 'End':
                this.handleEndKey(e);
                break;
            default:
                this.handleOtherKeys(e, focused);
        }
    }

    // 处理Enter键
    handleEnterKey(e, focused) {
        if (!focused) return;
        
        if (focused.tagName === 'BUTTON' || focused.onclick) {
            focused.click();
        } else if (focused.tagName === 'INPUT') {
            if (focused.type === 'checkbox') {
                focused.checked = !focused.checked;
                focused.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (focused.id === 'searchInput') {
                this.triggerSearch();
            }
        } else if (focused.tagName === 'A') {
            focused.click();
        } else if (focused.classList.contains('card-hover')) {
            focused.click();
        }
    }

    // 处理返回键
    handleBackKey(e) {
        const openModal = this.getTopModal();
        if (openModal) {
            this.closeModal(openModal);
        } else if (window.location.pathname !== '/') {
            // 如果不在首页，返回首页
            window.location.href = '/';
        }
    }

    // 处理方向键
    handleArrowKeys(e) {
        this.customArrowNavigation(e);
    }

    // 处理空格键
    handleSpaceKey(e, focused) {
        if (focused && focused.id === 'searchInput') {
            // 在搜索框中允许空格
            e.preventDefault = false;
            return;
        }
        
        // 其他情况下空格作为确认键
        this.handleEnterKey(e, focused);
    }

    // 处理Home键
    handleHomeKey(e) {
        const firstFocusable = this.getFirstFocusableElement();
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    // 处理End键
    handleEndKey(e) {
        const lastFocusable = this.getLastFocusableElement();
        if (lastFocusable) {
            lastFocusable.focus();
        }
    }

    // 处理其他键
    handleOtherKeys(e, focused) {
        // 数字键快速导航
        if (e.key >= '0' && e.key <= '9') {
            this.handleNumberKey(parseInt(e.key));
        }
        
        // 字母键快速搜索
        if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
            this.handleLetterKey(e.key);
        }
    }

    // 获取当前最顶层的模态框
    getTopModal() {
        const modals = [
            'modal',
            'passwordModal', 
            'disclaimerModal',
            'historyPanel',
            'settingsPanel'
        ];

        for (const modalId of modals) {
            const modal = document.getElementById(modalId);
            if (modal && this.isModalOpen(modal)) {
                return modal;
            }
        }
        return null;
    }

    // 检查模态框是否打开
    isModalOpen(modal) {
        if (!modal) return false;
        
        const style = window.getComputedStyle(modal);
        return !modal.classList.contains('hidden') && 
               style.display !== 'none' &&
               !modal.classList.contains('-translate-x-full') &&
               !modal.classList.contains('translate-x-full');
    }

    // 关闭模态框
    closeModal(modal) {
        const modalId = modal.id;
        
        switch(modalId) {
            case 'modal':
                window.closeModal && window.closeModal();
                break;
            case 'passwordModal':
                window.hidePasswordModal && window.hidePasswordModal();
                break;
            case 'historyPanel':
                window.toggleHistory && window.toggleHistory();
                break;
            case 'settingsPanel':
                window.toggleSettings && window.toggleSettings();
                break;
            case 'disclaimerModal':
                modal.style.display = 'none';
                break;
        }
    }

    // 设置焦点管理
    setupFocusManagement() {
        // 观察DOM变化，自动为新元素添加焦点支持
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        this.makeFocusable(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 初始化现有元素
        this.makeFocusable(document.body);
    }

    // 使元素可聚焦
    makeFocusable(container) {
        const selectors = [
            'button:not([disabled]):not([tabindex="-1"])',
            'a[href]:not([tabindex="-1"])',
            '[onclick]:not([tabindex="-1"])',
            'input[type="checkbox"]:not([disabled]):not([tabindex="-1"])',
            'input[type="text"]:not([disabled]):not([tabindex="-1"])',
            'input[type="password"]:not([disabled]):not([tabindex="-1"])',
            '.card-hover:not([tabindex="-1"])',
            '.search-tag:not([tabindex="-1"])',
            '.focusable:not([tabindex="-1"])'
        ];

        selectors.forEach(selector => {
            const elements = container.querySelectorAll(selector);
            elements.forEach((el) => {
                if (!el.classList.contains('focusable')) {
                    el.classList.add('focusable');
                }
                
                if (!el.hasAttribute('tabindex') || el.getAttribute('tabindex') === '-1') {
                    el.setAttribute('tabindex', '0');
                }
            });
        });
    }

    // 设置模态框处理
    setupModalHandlers() {
        // 监听模态框的打开和关闭
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
                    const target = mutation.target;
                    if (target.id && ['modal', 'passwordModal', 'historyPanel', 'settingsPanel', 'disclaimerModal'].includes(target.id)) {
                        this.handleModalToggle(target);
                    }
                }
            });
        });

        // 观察所有可能的模态框
        const modals = document.querySelectorAll('#historyPanel, #settingsPanel, #modal, #passwordModal, #disclaimerModal');
        modals.forEach(modal => {
            if (modal) {
                observer.observe(modal, { attributes: true });
            }
        });
    }

    // 处理模态框切换
    handleModalToggle(modal) {
        const isOpen = this.isModalOpen(modal);
        
        if (isOpen) {
            // 模态框打开时，焦点到第一个可聚焦元素
            setTimeout(() => {
                this.makeFocusable(modal);
                const firstFocusable = modal.querySelector('.focusable:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            }, 100);
        }
    }

    // 自定义方向键导航
    customArrowNavigation(e) {
        const currentModal = this.getTopModal();
        const container = currentModal || document.body;
        const focusableElements = Array.from(container.querySelectorAll('.focusable:not([tabindex="-1"])'))
            .filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0; // 只考虑可见元素
            });
        
        const currentIndex = focusableElements.indexOf(document.activeElement);
        
        if (currentIndex === -1) {
            // 如果没有元素被聚焦，聚焦第一个
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
            return;
        }

        let nextIndex = currentIndex;
        const currentElement = focusableElements[currentIndex];
        const currentRect = currentElement.getBoundingClientRect();

        switch(e.key) {
            case 'ArrowRight':
                nextIndex = this.findNextElementInDirection(focusableElements, currentIndex, 'right');
                break;
            case 'ArrowLeft':
                nextIndex = this.findNextElementInDirection(focusableElements, currentIndex, 'left');
                break;
            case 'ArrowDown':
                nextIndex = this.findNextElementInDirection(focusableElements, currentIndex, 'down');
                break;
            case 'ArrowUp':
                nextIndex = this.findNextElementInDirection(focusableElements, currentIndex, 'up');
                break;
        }

        if (nextIndex !== currentIndex && nextIndex !== -1) {
            focusableElements[nextIndex].focus();
            this.scrollIntoViewIfNeeded(focusableElements[nextIndex]);
        }
    }

    // 查找指定方向上最近的元素
    findNextElementInDirection(elements, currentIndex, direction) {
        const current = elements[currentIndex];
        const currentRect = current.getBoundingClientRect();
        const currentCenter = {
            x: currentRect.left + currentRect.width / 2,
            y: currentRect.top + currentRect.height / 2
        };

        let bestElement = null;
        let bestDistance = Infinity;
        let bestIndex = -1;

        elements.forEach((element, index) => {
            if (index === currentIndex) return;

            const rect = element.getBoundingClientRect();
            const center = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };

            let isValidDirection = false;
            let distance = 0;

            switch(direction) {
                case 'right':
                    isValidDirection = center.x > currentCenter.x;
                    distance = Math.abs(center.x - currentCenter.x) + Math.abs(center.y - currentCenter.y) * 0.5;
                    break;
                case 'left':
                    isValidDirection = center.x < currentCenter.x;
                    distance = Math.abs(center.x - currentCenter.x) + Math.abs(center.y - currentCenter.y) * 0.5;
                    break;
                case 'down':
                    isValidDirection = center.y > currentCenter.y;
                    distance = Math.abs(center.y - currentCenter.y) + Math.abs(center.x - currentCenter.x) * 0.5;
                    break;
                case 'up':
                    isValidDirection = center.y < currentCenter.y;
                    distance = Math.abs(center.y - currentCenter.y) + Math.abs(center.x - currentCenter.x) * 0.5;
                    break;
            }

            if (isValidDirection && distance < bestDistance) {
                bestDistance = distance;
                bestElement = element;
                bestIndex = index;
            }
        });

        return bestIndex !== -1 ? bestIndex : currentIndex;
    }

    // 滚动到可见区域
    scrollIntoViewIfNeeded(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;

        if (rect.top < 0 || rect.bottom > windowHeight || rect.left < 0 || rect.right > windowWidth) {
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
            });
        }
    }

    // 获取第一个可聚焦元素
    getFirstFocusableElement() {
        const currentModal = this.getTopModal();
        const container = currentModal || document.body;
        return container.querySelector('.focusable:not([tabindex="-1"])');
    }

    // 获取最后一个可聚焦元素
    getLastFocusableElement() {
        const currentModal = this.getTopModal();
        const container = currentModal || document.body;
        const elements = container.querySelectorAll('.focusable:not([tabindex="-1"])');
        return elements[elements.length - 1];
    }

    // 触发搜索
    triggerSearch() {
        if (window.search) {
            window.search();
        }
    }

    // 数字键快速导航
    handleNumberKey(number) {
        const searchResults = document.querySelectorAll('#results .card-hover, .douban-card');
        if (searchResults.length > 0 && number > 0 && number <= searchResults.length) {
            searchResults[number - 1].focus();
            this.scrollIntoViewIfNeeded(searchResults[number - 1]);
        }
    }

    // 字母键快速搜索
    handleLetterKey(letter) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && !document.activeElement.matches('input, textarea')) {
            searchInput.focus();
        }
    }

    // 键盘抬起事件处理
    handleKeyUp(e) {
        // 可以在这里处理一些需要在按键释放时执行的逻辑
    }

    // 公共方法：更新元素焦点状态
    updateElementsFocus() {
        this.makeFocusable(document.body);
    }

    // 公共方法：设置初始焦点
    setInitialFocus() {
        setTimeout(() => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            } else {
                const firstFocusable = this.getFirstFocusableElement();
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            }
        }, 100);
    }

    // 公共方法：手动启用TV模式
    enableTVMode() {
        this.isEnabled = true;
        this.init();
    }

    // 公共方法：禁用TV模式
    disableTVMode() {
        this.isEnabled = false;
        const indicator = document.getElementById('tv-mode-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// 初始化TV遥控器控制器
let tvRemote = null;

document.addEventListener('DOMContentLoaded', function() {
    tvRemote = new TVRemoteController();
    
    // 设置初始焦点
    tvRemote.setInitialFocus();
    
    // 暴露到全局以供其他模块使用
    window.tvRemote = tvRemote;
    
    // 添加手动切换TV模式的功能（用于调试）
    window.toggleTVMode = function() {
        if (tvRemote.isEnabled) {
            tvRemote.disableTVMode();
            console.log('TV模式已禁用');
        } else {
            tvRemote.enableTVMode();
            console.log('TV模式已启用');
        }
    };
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TVRemoteController;
}