var socket;

$(document).ready(function () {
    var name = prompt("Enter your name !!");
    if (!name) { name = "Guest User"; }

    socket = io();
    socket.emit("new_user_joined", { name: name, password: "185" });

    var container = $(".chat_container");
    var input_message = $("#message");
    var send_btn = $("#send_btn");
    var side_bar = $("#side_bar_cont");
    var menu = $("#menu");
    var audio = new Audio('ting.mp3');
    var isSideBarOpen = false;

    menu.on("click", () => {
        if (isSideBarOpen) {
            side_bar.css("left", "-300px");
            isSideBarOpen = false;
        } else {
            side_bar.css("left", "0px");
            isSideBarOpen = true;
        }
    });

    container.on("click", () => {
        if (isSideBarOpen) {
            side_bar.css("left", "-300px");
            isSideBarOpen = false;
        }
    });

    const append_user_joined = (message) => {
        var html = `<div class="message_extra">${message}</div>`;
        container.append(html);
        scrollToBottom();
    };

    const append_message = (message, position, name, hours, minutes, pm_or_am) => {
        var html = `
            <div class="message ${position}">
                <b class="user_name">
                    <span>${name}</span>
                    <span class="time_show">${hours}:${minutes} ${pm_or_am}</span>
                </b>
                <div class="text">${message}</div>
            </div>`;
        container.append(html);
        if (position == "left") { audio.play(); }
        scrollToBottom();
    };

    function scrollToBottom() {
        container.scrollTop(container[0].scrollHeight);
    }

    $("#send_cont").on("submit", (e) => {
        e.preventDefault();
        var mess = input_message.val().trim();

        if (mess != "") {
            var now = new Date();
            var hours = now.getHours();
            var minutes = ('0' + now.getMinutes()).slice(-2);
            var pm_or_am = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12;

            socket.emit("send", { mess: mess, hours: hours, minutes: minutes, pm_or_am: pm_or_am });
            append_message(mess, 'right', 'You', hours, minutes, pm_or_am);
            input_message.val("");
        }
    });

    socket.on("user_joined", (name) => {
        append_user_joined(`👋 ${name} joined the chat`);
    });

    socket.on("left", (name) => {
        $("#seen_data").html("offline");
        setTimeout(() => $("#seen_data").html("online"), 2000);
        append_user_joined(`🚪 ${name} left the chat`);
    });

    socket.on("receive", data => {
        append_message(data.message, data.position, data.name, data.hours, data.minutes, data.pm_or_am);
    });

    socket.on("type", (name) => {
        $("#seen_data").html(`${name} is typing...`);
        setTimeout(() => $("#seen_data").html("online"), 3000);
    });

    socket.on("owner", (name) => {
        alert(`Welcome Admin ${name}!`);
    });
});

function typing() {
    socket.emit("user_typeing");
}