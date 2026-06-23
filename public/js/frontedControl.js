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



(function () {
    DOM.messagesArea.appendChild(`   <div id="{{config.id}}"
                class="flex w-full {{isMe ? 'justify-end' : 'justify-start'}} {{config.animate ? 'animate-msg-in' : ''}}"
                data-sender="{{sender}}">
                <div class="
            max-w-[82%] sm:max-w-[72%]
            rounded-2xl px-4 py-2.5 relative shadow-xs
            break-words flex flex-col space-y-1
            {{isMe
                ? 'bg-emerald-500 text-white rounded-br-none font-medium'
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700/60 rounded-bl-none'}}
        ">
                    <p class="text-sm leading-relaxed">
                        {{parsedBodyMarkdown}}
                    </p>
                </div>
            </div>`);

    const messages = document.getElementById("messages-area");
    const input = document.getElementById("message-input");
    const form = document.getElementById("chat-form");
    const sendBtn = document.getElementById("send-button");

    // Add message
    function addMessage(text, sender = "me") {
        if (!text.trim()) return;

        const div = document.createElement("div");
        div.className = sender === "me" ? "my-message" : "other-message";
        div.textContent = text;

        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    // Send message
    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, "me");

        input.value = "";
        sendBtn.disabled = true;
        input.style.height = "36px";
    }

    // Auto resize textarea
    input.addEventListener("input", () => {
        sendBtn.disabled = !input.value.trim();

        input.style.height = "36px";
        input.style.height = input.scrollHeight + "px";
    });

    // Enter to send
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        sendMessage();
    });

    // Status
    function setStatus(text) {
        document.getElementById("chat-status").textContent = text;
    }

    // Clear chat
    function clearChat() {
        messages.innerHTML = "";
    }

    // Export functions
    window.chat = addMessage;
    window.setStatus = setStatus;
    window.clearChat = clearChat;
})();