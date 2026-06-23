    
        (function () {
            'use strict';

            // --- DOM Cache Registry ---
            const DOM = {
                html: document.documentElement,
                body: document.body,
                container: document.getElementById('chat-container'),
                messagesArea: document.getElementById('messages-area'),
                messageInput: document.getElementById('message-input'),
                chatForm: document.getElementById('chat-form'),
                sendButton: document.getElementById('send-button'),
                chatStatus: document.getElementById('chat-status'),
                statusDot: document.getElementById('status-dot'),
                userAvatar: document.getElementById('user-avatar'),
                avatarFallback: document.getElementById('avatar-fallback'),
                popupModal: document.getElementById('popup-modal'),
                modalContent: document.getElementById('modal-content'),
                infoBtn: document.getElementById('info-btn'),
                modalCloseIcon: document.getElementById('modal-close-icon'),
                modalDismissBtn: document.getElementById('modal-dismiss-btn'),
                darkModeToggle: document.getElementById('dark-mode-toggle'),
                connectionBanner: document.getElementById('connection-banner'),
                sndOut: document.getElementById('sound-outgoing'),
                sndIn: document.getElementById('sound-incoming')
            };

            // --- State Architecture Engine Variables ---
            let isUserNearBottom = true;
            let lastRenderedDateString = null;
            let modalPreviousFocusedElement = null;
            let runningTypingBubbleNode = null;
            const SCROLL_THRESHOLD_PX = 45;
            const INITIAL_INPUT_HEIGHT_PX = 36;
            const MAX_LINES_BOUNDS_LIMIT = 6;
            let cachedLineHeight = 20; // Default baseline computation snapshot updated run-time

            // --- Utilities & Sanitization Infrastructure ---
            const Utils = {
                generateId: () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

                escapeHTML: (str) => {
                    if (typeof str !== 'string') return '';
                    const div = document.createElement('div');
                    div.textContent = str;
                    return div.innerHTML;
                },

                parseMarkdownLines: (escapedStr) => {
                    return escapedStr.replace(/\n/g, '<br>');
                },

                debounce: (fn, delay) => {
                    let timeoutId;
                    return (...args) => {
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(() => fn.apply(null, args), delay);
                    };
                },

                playSound: (audioNode) => {
                    if (!audioNode) return;
                    audioNode.currentTime = 0;
                    audioNode.play().catch(() => { /* Browser autoplay policies safely standard suppressed */ });
                }
            };

            // --- Mobile Keyboard Resizing Viewport Handling Engine ---
            function synchronizeViewportLayout() {
                if (!window.visualViewport) return;

                const winWidth = window.innerWidth;
                const viewportHeight = window.visualViewport.height;
                const totalHeight = window.innerHeight;
                const deltaOffset = totalHeight - viewportHeight;

                // Apply strict positioning only for mobile breakdown parameters
                if (winWidth < 640) {
                    DOM.container.style.height = `${viewportHeight}px`;
                    // Address dynamic navigation blocks on iOS Chrome/Safari
                    if (deltaOffset > 10) {
                        DOM.inputBar.style.paddingBottom = 'max(12px, env(safe-area-inset-bottom))';
                    } else {
                        DOM.inputBar.style.paddingBottom = '12px';
                    }
                } else {
                    DOM.container.style.height = '';
                    DOM.inputBar.style.paddingBottom = '';
                }

                if (isUserNearBottom) {
                    executeScrollToBottom(false);
                }
            }

            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', Utils.debounce(synchronizeViewportLayout, 16), { passive: true });
                window.visualViewport.addEventListener('scroll', Utils.debounce(synchronizeViewportLayout, 32), { passive: true });
            }

            const containerResizeObserver = new ResizeObserver(Utils.debounce(() => {
                if (isUserNearBottom) executeScrollToBottom(false);
            }, 16));
            containerResizeObserver.observe(DOM.messagesArea);

            // --- Scroll Management Utilities ---
            function evaluateScrollPosition() {
                const { scrollTop, scrollHeight, clientHeight } = DOM.messagesArea;
                isUserNearBottom = (scrollHeight - scrollTop - clientHeight) <= SCROLL_THRESHOLD_PX;
            }

            DOM.messagesArea.addEventListener('scroll', evaluateScrollPosition, { passive: true });

            function executeScrollToBottom(isSmooth = true) {
                requestAnimationFrame(() => {
                    DOM.messagesArea.scrollTo({
                        top: DOM.messagesArea.scrollHeight,
                        behavior: isSmooth ? 'smooth' : 'auto'
                    });
                });
            }

            // --- Date Separator Interceptor Factory Engine ---
            function createDateSeparatorIfNeeded(targetTimestamp) {
                const dateObj = new Date(targetTimestamp);
                const currentDateString = dateObj.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

                if (lastRenderedDateString !== currentDateString) {
                    lastRenderedDateString = currentDateString;

                    const wrapper = document.createElement('div');
                    wrapper.className = 'text-center my-3 select-none';
                    wrapper.setAttribute('role', 'separator');

                    const label = document.createElement('span');
                    label.className = 'px-3 py-1 bg-gray-200/60 dark:bg-gray-800/60 text-[10px] font-bold text-gray-500 dark:text-gray-400 rounded-full uppercase tracking-wider';
                    label.textContent = currentDateString;

                    wrapper.appendChild(label);
                    DOM.messagesArea.appendChild(wrapper);
                }
            }

            // --- Core Message Delivery Method Packet Implementations ---
            /**
             * Primary API endpoint to dispatch or render a standard message bubble logs sequence.
             */
            function chat(message, sender = 'me', options = {}) {
                if (!message || typeof message !== 'string' || message.trim() === '') return null;

                const config = Object.assign({
                    id: Utils.generateId(),
                    time: new Date().getTime(),
                    avatar: null,
                    status: 'sent',
                    animate: true,
                    isSilent: false
                }, options);

                // Remove placeholder typing animation element blocks ahead of delivery rendering
                removeTypingIndicatorBubbleElement();

                // Check if date separation lines must precede packet injection
                createDateSeparatorIfNeeded(config.time);

                const isMe = (sender === 'me');
                const escapedValue = Utils.escapeHTML(message);
                const parsedBodyMarkdown = Utils.parseMarkdownLines(escapedValue);
                const humanReadableTime = new Date(config.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Outer Root Frame Structure Element Grid Node Setup
                const msgWrapperNode = document.createElement('div');
                msgWrapperNode.id = config.id;
                msgWrapperNode.className = `flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${config.animate ? 'animate-msg-in' : ''}`;
                msgWrapperNode.setAttribute('data-sender', sender);

                // Construct Inner Container Card Structure safely using DOM Properties
                const innerCardNode = document.createElement('div');
                innerCardNode.className = `max-w-[82%] sm:max-w-[72%] rounded-2xl px-4 py-2.5 relative shadow-xs break-words flex flex-col space-y-1 ${isMe
                    ? 'bg-emerald-500 text-white rounded-br-none font-medium'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700/60 rounded-bl-none'
                    }`;

                // Text Content Block Element Paragraph Definition
                const textPara = document.createElement('p');
                textPara.className = 'text-sm leading-relaxed';
                textPara.innerHTML = parsedBodyMarkdown; // Fully sanitized safely upstream manually handled.
                innerCardNode.appendChild(textPara);

                // Metadata block structure layout row element parameters setup
                const metaRow = document.createElement('div');
                metaRow.className = `text-[10px] self-end font-medium select-none flex items-center space-x-1 uppercase tracking-wide opacity-75 ${isMe ? 'text-emerald-50' : 'text-gray-400 dark:text-gray-500'
                    }`;

                const timeSpan = document.createElement('span');
                timeSpan.textContent = humanReadableTime;
                metaRow.appendChild(timeSpan);

                if (isMe) {
                    const statusIndicatorSpan = document.createElement('span');
                    statusIndicatorSpan.className = 'msg-status-element font-bold';
                    statusIndicatorSpan.setAttribute('data-status', config.status);
                    statusIndicatorSpan.textContent = getStatusSymbolText(config.status);
                    metaRow.appendChild(statusIndicatorSpan);
                }

                innerCardNode.appendChild(metaRow);
                msgWrapperNode.appendChild(innerCardNode);

                DOM.messagesArea.appendChild(msgWrapperNode);

                // Sound Engine Handling
                if (!config.isSilent) {
                    Utils.playSound(isMe ? DOM.sndOut : DOM.sndIn);
                }

                // Automatic Smart Scroll adjustments logic evaluation boundaries check
                if (isMe || isUserNearBottom) {
                    executeScrollToBottom(config.animate);
                }

                return config.id;
            }

            function getStatusSymbolText(status) {
                switch (status) {
                    case 'sending': return '⋯';
                    case 'sent': return '✓';
                    case 'delivered': return '✓✓';
                    case 'seen': return '✓✓';
                    case 'failed': return '⚠';
                    default: return '';
                }
            }

            // --- System Status Methods Pipeline Configuration Management ---
            function setUserStatus(status) {
                const sanitized = status ? status.toLowerCase() : '';

                // Dynamic Class Cleanup resets on state change instances execution tracks
                DOM.statusDot.className = "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 transition-all duration-300";
                DOM.chatStatus.className = "text-xs text-gray-500 dark:text-gray-400 font-medium h-4 flex items-center";

                switch (sanitized) {
                    case 'online':
                        DOM.chatStatus.textContent = 'Online';
                        DOM.chatStatus.classList.add('text-emerald-500', 'dark:text-emerald-400', 'font-semibold');
                        DOM.statusDot.classList.add('bg-emerald-500');
                        break;
                    case 'offline':
                        DOM.chatStatus.textContent = 'Offline';
                        DOM.statusDot.classList.add('bg-gray-400');
                        break;
                    case 'typing':
                        DOM.chatStatus.textContent = 'Typing…';
                        DOM.chatStatus.classList.add('text-emerald-500', 'dark:text-emerald-400', 'animate-pulse');
                        DOM.statusDot.classList.add('bg-emerald-500', 'animate-pulse');
                        setTyping(true);
                        break;
                    case 'recording':
                        DOM.chatStatus.textContent = 'Recording audio…';
                        DOM.chatStatus.classList.add('text-rose-500', 'animate-pulse');
                        DOM.statusDot.classList.add('bg-rose-500', 'animate-pulse');
                        break;
                    case 'seen':
                        DOM.chatStatus.textContent = 'Seen just now';
                        DOM.statusDot.classList.add('bg-sky-400');
                        break;
                    case 'last seen recently':
                        DOM.chatStatus.textContent = 'Last seen recently';
                        DOM.statusDot.classList.add('bg-gray-300', 'dark:bg-gray-600');
                        break;
                    default:
                        clearStatus();
                        break;
                }
            }

            function setTyping(isTyping) {
                if (isTyping) {
                    if (runningTypingBubbleNode) return; // Prevent spawning duplicate element structures

                    const wrapper = document.createElement('div');
                    wrapper.id = 'typing-indicator-bubble';
                    wrapper.className = 'flex w-full justify-start opacity-100 transition-opacity duration-150';

                    const bubble = document.createElement('div');
                    bubble.className = 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-1 shadow-xs';
                    bubble.setAttribute('aria-label', 'Sarah is typing content packet');

                    for (let i = 0; i < 3; i++) {
                        const dot = document.createElement('span');
                        dot.className = 'h-1.5 w-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce';
                        dot.style.animationDelay = `${i * 0.15}s`;
                        bubble.appendChild(dot);
                    }

                    wrapper.appendChild(bubble);
                    DOM.messagesArea.appendChild(wrapper);
                    runningTypingBubbleNode = wrapper;

                    if (isUserNearBottom) executeScrollToBottom(true);
                } else {
                    removeTypingIndicatorBubbleElement();
                }
            }

            function removeTypingIndicatorBubbleElement() {
                if (runningTypingBubbleNode) {
                    runningTypingBubbleNode.remove();
                    runningTypingBubbleNode = null;
                }
            }

            function setSeen() {
                setUserStatus('seen');
                const elements = DOM.messagesArea.querySelectorAll('.msg-status-element[data-status="sent"], .msg-status-element[data-status="delivered"]');
                elements.forEach(el => {
                    el.setAttribute('data-status', 'seen');
                    el.textContent = '✓✓';
                    el.className = 'msg-status-element font-bold text-sky-400 dark:text-sky-400';
                });
            }

            function clearStatus() {
                DOM.chatStatus.textContent = '';
                DOM.statusDot.className = "absolute bottom-0 right-0 block h-0 w-0 bg-transparent ring-transparent";
            }

            // --- Auto Growing Input Layout Engine ---
            function recalculateTextareaInputMetrics() {
                // Measure exact element boundaries and calculate the active line dimensions
                DOM.messageInput.style.height = `${INITIAL_INPUT_HEIGHT_PX}px`;
                const scrollHeightSnapshot = DOM.messageInput.scrollHeight;

                // Dynamic reading configuration adjustments inside running instance
                if (DOM.messageInput.value.trim() === '') {
                    DOM.sendButton.disabled = true;
                    return;
                }
                DOM.sendButton.disabled = false;

                const maxConfiguredBoundsPixelValue = cachedLineHeight * MAX_LINES_BOUNDS_LIMIT + 12; // safety padding offsets 
                const targetedCalculatedHeight = Math.min(scrollHeightSnapshot, maxConfiguredBoundsPixelValue);

                DOM.messageInput.style.height = `${targetedCalculatedHeight}px`;

                if (isUserNearBottom) {
                    executeScrollToBottom(false);
                }
            }

            function handleManualInputSubmission() {
                const text = DOM.messageInput.value.trim();
                if (!text) return;

                // Dispatch to core API execution engine loop
                chat(text, 'me', { animate: true, status: 'sending' });

                // Reset properties cleanly without rendering residual layout jumps
                DOM.messageInput.value = '';
                DOM.messageInput.style.height = `${INITIAL_INPUT_HEIGHT_PX}px`;
                DOM.sendButton.disabled = true;
                DOM.messageInput.focus();
            }

            DOM.messageInput.addEventListener('input', recalculateTextareaInputMetrics, { passive: true });
            DOM.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleManualInputSubmission();
                }
            });
            DOM.chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleManualInputSubmission();
            });

            // --- Focus Trap and Modal Dialog System Engineering ---
            function toggleModal(open) {
                if (open) {
                    modalPreviousFocusedElement = document.activeElement;
                    DOM.popupModal.classList.remove('hidden');
                    DOM.body.style.overflow = 'hidden'; // Lock ambient viewport scrolls

                    requestAnimationFrame(() => {
                        DOM.modalContent.classList.remove('scale-95');
                        DOM.modalContent.classList.add('scale-100');
                        DOM.modalDismissBtn.focus();
                    });

                    document.addEventListener('keydown', handleModalKeyboardTrapperLoop);
                } else {
                    DOM.modalContent.classList.remove('scale-100');
                    DOM.modalContent.classList.add('scale-95');

                    setTimeout(() => {
                        DOM.popupModal.classList.add('hidden');
                        if (!window.visualViewport || window.visualViewport.width >= 640) {
                            DOM.body.style.overflow = '';
                        }
                        if (modalPreviousFocusedElement && typeof modalPreviousFocusedElement.focus === 'function') {
                            modalPreviousFocusedElement.focus();
                        }
                    }, 150);

                    document.removeEventListener('keydown', handleModalKeyboardTrapperLoop);
                }
            }

            function handleModalKeyboardTrapperLoop(e) {
                if (e.key === 'Escape') {
                    toggleModal(false);
                    return;
                }
                if (e.key === 'Tab') {
                    const interactables = DOM.modalContent.querySelectorAll('button, [tabindex="0"], a, input, textarea');
                    const firstEl = interactables[0];
                    const lastEl = interactables[interactables.length - 1];

                    if (e.shiftKey && document.activeElement === firstEl) {
                        lastEl.focus();
                        e.preventDefault();
                    } else if (!e.shiftKey && document.activeElement === lastEl) {
                        firstEl.focus();
                        e.preventDefault();
                    }
                }
            }

            DOM.infoBtn.addEventListener('click', () => toggleModal(true));
            DOM.modalCloseIcon.addEventListener('click', () => toggleModal(false));
            DOM.modalDismissBtn.addEventListener('click', () => toggleModal(false));
            DOM.popupModal.addEventListener('click', (e) => {
                if (e.target === DOM.popupModal) toggleModal(false);
            });

            // --- Theme Handling Engines & Sync Controls ---
            function updateThemeEngine(themeMode) {
                if (themeMode === 'dark') {
                    DOM.html.classList.add('dark');
                    localStorage.setItem('chat-theme', 'dark');
                } else {
                    DOM.html.classList.remove('dark');
                    localStorage.setItem('chat-theme', 'light');
                }
            }

            DOM.darkModeToggle.addEventListener('click', () => {
                const isCurrentlyDark = DOM.html.classList.contains('dark');
                updateThemeEngine(isCurrentlyDark ? 'light' : 'dark');
            });

            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('chat-theme')) {
                    updateThemeEngine(e.matches ? 'dark' : 'light');
                }
            });

            // --- Extended Global API Operations Function Implementations ---
            function clearChat() {
                DOM.messagesArea.innerHTML = '';
                lastRenderedDateString = null;
                runningTypingBubbleNode = null;
                isUserNearBottom = true;
            }

            function loadMessages(messagePacketsArray) {
                if (!Array.isArray(messagePacketsArray)) return;

                // Capture dimensions to preserve precise relative positioning offsets
                const currentScrollHeightSnapshot = DOM.messagesArea.scrollHeight;

                messagePacketsArray.forEach(pkt => {
                    chat(pkt.message, pkt.sender || 'me', {
                        id: pkt.id,
                        time: pkt.time || new Date().getTime(),
                        status: pkt.status || 'sent',
                        animate: false,
                        isSilent: true
                    });
                });

                // Retain standard positioning indexes
                DOM.messagesArea.scrollTop = DOM.messagesArea.scrollHeight - currentScrollHeightSnapshot;
            }

            function scrollToMessage(id) {
                const targetNode = document.getElementById(id);
                if (targetNode) {
                    targetNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Flash accent highlight animation sequence safely using temporary inline configuration hooks
                    targetNode.classList.add('ring-2', 'ring-emerald-500/50', 'rounded-xl', 'transition-all');
                    setTimeout(() => {
                        targetNode.classList.remove('ring-2', 'ring-emerald-500/50');
                    }, 1200);
                }
            }

            // --- Lazy Avatar Load System ---
            function lazyLoadAvatarSetup() {
                if ('IntersectionObserver' in window) {
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const img = entry.target;
                                img.src = img.getAttribute('data-src');
                                img.onload = () => {
                                    img.classList.remove('opacity-0');
                                    DOM.avatarFallback.classList.add('hidden');
                                };
                                observer.unobserve(img);
                            }
                        });
                    });
                    observer.observe(DOM.userAvatar);
                } else {
                    // Instantly fallback operational bounds for old legacy devices fallback targets
                    DOM.userAvatar.src = DOM.userAvatar.getAttribute('data-src');
                    DOM.userAvatar.classList.remove('opacity-0');
                    DOM.avatarFallback.classList.add('hidden');
                }
            }

            // --- Initialization Mount Loop Execution Block ---
            window.addEventListener('DOMContentLoaded', () => {
                // Evaluate dynamic platform lines measurements dynamically to protect bounds computation metrics
                const dummyTextarea = document.createElement('textarea');
                dummyTextarea.rows = 1;
                dummyTextarea.className = 'absolute opacity-0 pointer-events-none text-sm font-sans';
                document.body.appendChild(dummyTextarea);
                cachedLineHeight = parseFloat(window.getComputedStyle(dummyTextarea).lineHeight) || 20;
                dummyTextarea.remove();

                // Standard setups
                lazyLoadAvatarSetup();
                setUserStatus('online');
                synchronizeViewportLayout();

                // Mount Default Sample Mock Logs to demonstrate framework viability seamlessly
                loadMessages([
                    { id: 'm1', message: 'Hello! This layout has been completely refactored with zero-innerHTML layout guards.', sender: 'you', time: Date.now() - 60000 },
                    { id: 'm2', message: 'Looks stunning! Keyboard viewport handling is now working flawlessly on iOS and Android.', sender: 'me', time: Date.now() }
                ]);

                executeScrollToBottom(false);
            });

            // --- Global Interfaces Registry Window Exports ---
            window.chat = chat;
            window.setUserStatus = setUserStatus;
            window.setTyping = setTyping;
            window.setSeen = setSeen;
            window.clearStatus = clearStatus;
            window.toggleModal = toggleModal;
            window.clearChat = clearChat;
            window.loadMessages = loadMessages;
            window.scrollToMessage = scrollToMessage;

        })();
    