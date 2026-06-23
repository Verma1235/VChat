var socket;

$(document).ready(function () {


    const isEmpty = (value) => {
        // null or undefined
        if (value == null) return true;

        // string
        if (typeof value === "string") {
            return value.trim().length === 0;
        }

        // number
        if (typeof value === "number") {
            return Number.isNaN(value);
        }

        // boolean
        if (typeof value === "boolean") {
            return false;
        }

        // array
        if (Array.isArray(value)) {
            return value.length === 0;
        }

        // Map or Set
        if (value instanceof Map || value instanceof Set) {
            return value.size === 0;
        }

        // Date
        if (value instanceof Date) {
            return Number.isNaN(value.getTime());
        }

        // object
        if (typeof value === "object") {
            return Object.keys(value).length === 0;
        }

        // function, symbol, bigint, etc.
        return false;
    };
    let name = "";
    let userName = localStorage.getItem('userName') || null;
    if (isEmpty(userName)) {
        name = prompt("Enter your name");
        localStorage.setItem("userName", name);

    } else {
        name = userName;
    }


    if (!name || name.trim() === "") {
        name = "Guest User";
    }

    socket = io();

    socket.emit("new_user_joined", {
        name: name,
        password: "185"
    });

    const container = $("#messages-area");
    const input = $("#message-input");
    const form = $("#chat-form");
    const sendBtn = $("#send-button");
    const status = $("#chat-status");

    const audio = new Audio("ting.mp3");

    ////////////////////////////////////////////////////
    // Scroll
    ////////////////////////////////////////////////////

    function scrollToBottom() {
        container.scrollTop(container[0].scrollHeight);
    }

    ////////////////////////////////////////////////////
    // System Message
    ////////////////////////////////////////////////////

    function appendSystemMessage(message) {
        container.append(`
            <div class="flex justify-center">
                <div class="
                    text-[11px]
                    bg-gray-200
                    dark:bg-gray-800
                    text-gray-500
                    dark:text-gray-400
                    px-4
                    py-1.5
                    rounded-full
                    font-semibold
                ">
                    ${message}
                </div>
            </div>
        `);

        scrollToBottom();
    }

    ////////////////////////////////////////////////////
    // Chat Message
    ////////////////////////////////////////////////////

    function appendMessage(
        message,
        position,
        username,
        hours,
        minutes,
        pm_or_am
    ) {
        const isMe = position === "right";

        const html = `
            <div class="flex w-full ${isMe ? "justify-end" : "justify-start"} animate-msg-in">

                <div class="
                    max-w-[80%]
                    px-4
                    py-2
                    rounded-2xl
                    shadow-sm
                    ${isMe
                ? "bg-emerald-600 text-white rounded-br-none"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-700"}
                ">

                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[11px] font-bold opacity-80">
                            ${username}
                        </span>

                        <span class="text-[10px] opacity-60">
                            ${hours}:${minutes} ${pm_or_am}
                        </span>
                    </div>

                    <div class="text-sm break-words">
                        ${message}
                    </div>

                </div>

            </div>
        `;

        container.append(html);

        if (!isMe) {
            audio.play();
        }

        scrollToBottom();
    }

    ////////////////////////////////////////////////////
    // Send Message
    ////////////////////////////////////////////////////

    form.on("submit", function (e) {
        e.preventDefault();

        const mess = input.val().trim();

        if (mess === "") return;

        let now = new Date();

        let hours = now.getHours();
        let minutes = ("0" + now.getMinutes()).slice(-2);

        let pm_or_am = hours >= 12 ? "PM" : "AM";

        hours = hours % 12 || 12;

        socket.emit("send", {
            mess,
            hours,
            minutes,
            pm_or_am
        });

        appendMessage(
            mess,
            "right",
            "You",
            hours,
            minutes,
            pm_or_am
        );

        input.val("");
        input.css("height", "36px");

        sendBtn.prop("disabled", true);

        input.focus();
    });

    ////////////////////////////////////////////////////
    // Typing Event
    ////////////////////////////////////////////////////

    input.on("input", function () {
        const value = input.val().trim();

        sendBtn.prop("disabled", value === "");

        socket.emit("user_typeing");

        this.style.height = "36px";
        this.style.height = this.scrollHeight + "px";
    });

    ////////////////////////////////////////////////////
    // User Joined
    ////////////////////////////////////////////////////

    socket.on("user_joined", function (name) {
        appendSystemMessage(`👋 ${name} joined the chat`);

        status
            .text("Online")
            .removeClass()
            .addClass(
                "text-xs text-emerald-500 font-semibold h-4 flex items-center"
            );
    });

    ////////////////////////////////////////////////////
    // User Left
    ////////////////////////////////////////////////////

    socket.on("left", function (name) {
        appendSystemMessage(`🚪 ${name} left the chat`);

        status.text("Offline");

        setTimeout(() => {
            status.text("Online");
        }, 3000);
    });

    ////////////////////////////////////////////////////
    // Receive Message
    ////////////////////////////////////////////////////

    socket.on("receive", function (data) {
        appendMessage(
            data.message,
            "left",
            data.name,
            data.hours,
            data.minutes,
            data.pm_or_am
        );
    });

    ////////////////////////////////////////////////////
    // Typing Status
    ////////////////////////////////////////////////////

    socket.on("type", function (name) {
        status.text(`${name} is typing...`);

        clearTimeout(window.typingTimeout);

        window.typingTimeout = setTimeout(() => {
            status.text("Online");
        }, 3000);
    });

    ////////////////////////////////////////////////////
    // Owner Login
    ////////////////////////////////////////////////////

    socket.on("owner", function (name) {
        alert(`Welcome Admin ${name}!`);
    });

    ////////////////////////////////////////////////////
    // Connected
    ////////////////////////////////////////////////////

    socket.on("connect", function () {
        status.text("Online");
    });

    ////////////////////////////////////////////////////
    // Disconnected
    ////////////////////////////////////////////////////

    socket.on("disconnect", function () {
        status.text("Disconnected");
    });

    ////////////////////////////////////////////////////
    // Reconnecting
    ////////////////////////////////////////////////////

    socket.io.on("reconnect_attempt", function () {
        status.text("Reconnecting...");
    });
});

function typing() {
    socket.emit("user_typeing");
}