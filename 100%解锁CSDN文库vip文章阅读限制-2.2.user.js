// ==UserScript==
// @name         100%解锁CSDN文库vip文章阅读限制 (修正版)
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  CSDN文库阅读全文，去除VIP文章遮罩，尝试强制展开正文
// @author       Mrlimuyu (modified)
// @match        *://*.csdn.net/*
// @grant        none
// @license      yagiza
// ==/UserScript==

(function() {
    'use strict';

    // 尝试多种可能的选择器来定位正文容器
    const getArticleContainer = () => {
        return document.querySelector('#article_content')
            || document.querySelector('.article_content')
            || document.querySelector('.article-content')
            || document.querySelector('[class*="article_content"]');
    };

    // 核心展开逻辑：清除限制并重置样式
    const expandArticle = () => {
        const container = getArticleContainer();
        if (!container) return false;

        // 1. 移除可能存在的遮罩层（保留你原有的选择器，并补充一些常见的）
        document.querySelectorAll(
            '.hide-article-box, .login-mark, .mask, .vip-caise, .open, .vip, [class*="hide-article"]'
        ).forEach(el => el.remove());

        // 2. 强制重置容器及其父级的高度/溢出限制
        const resetStyles = (el) => {
            if (!el) return;
            el.style.maxHeight = 'none';
            el.style.height = 'auto';
            el.style.overflow = 'visible';
        };

        resetStyles(container);
        // 向上检查几层父级，因为限制可能加在外层包装上
        let parent = container.parentElement;
        for (let i = 0; i < 3 && parent; i++) {
            resetStyles(parent);
            parent = parent.parentElement;
        }

        return true;
    };

    // 作为补充：尝试点击页面上的“展开阅读全文”按钮（如果存在）
    const clickExpandButton = () => {
        const btns = document.querySelectorAll(
            '.read-more-btn, .show-more, [class*="read-more"], [class*="unfold"], .btn-read-more'
        );
        btns.forEach(btn => {
            if (btn && btn.offsetParent !== null && /展开|全文|阅读/.test(btn.innerText)) {
                btn.click();
            }
        });
    };

    // 启用复制功能（保留你原有的逻辑）
    const enableCopy = () => {
        document.body.oncopy = null;
        document.oncopy = null;
        document.querySelectorAll('*').forEach(el => {
            el.style.userSelect = 'auto';
            el.style.webkitUserSelect = 'auto';
            el.style.msUserSelect = 'auto';
            el.style.mozUserSelect = 'auto';
        });
    };

    // 组合操作：展开 + 启用复制
    const tryFix = () => {
        const expanded = expandArticle();
        clickExpandButton();
        enableCopy();
        return expanded;
    };

    // 使用 MutationObserver 持续监视，应对动态加载的内容
    const observer = new MutationObserver(() => {
        tryFix();
    });

    // 页面加载和 DOMContentLoaded 时都尝试执行
    window.addEventListener('load', tryFix);
    document.addEventListener('DOMContentLoaded', tryFix);

    // 开始监视
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // 设置一个短轮询作为保险，在页面加载后几秒内持续尝试（应对延迟加载）
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
        attempts++;
        const ok = tryFix();
        if (ok || attempts >= maxAttempts) {
            clearInterval(interval);
        }
    }, 800);

})();
