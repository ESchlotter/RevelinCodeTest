let startTime;
let end;
let hasTyped = false;
let fromHeight = $(window).height();
let originalWidth = $(window).width();
let toHeight = $(window).height();
let toWidth = $(window).width();
let uuid = $.uuid();
let rtime;
let timeout = false;

const apiUrl = 'http://localhost:10000/api';
const delta = 200;
const req = {
    url: window.location.href,
    id: uuid,
    resizeTo: {},
    resizeFrom: {},
};

$(document).ready(function () {
    $(window).resize(function() {
        rtime = new Date();
        if (timeout === false) {
            timeout = true;
            setTimeout(endResize, delta);
        }
    });

    $("input").on('paste', function () {
        req.eventType = "copyAndPaste"
        req.formId = this.id;
        req.pasted = true;
        sendData('copyandpaste');
    });

    $("input").on('copy', function () {
        req.eventType = "copyAndPaste";
        req.formId = this.id;
        req.pasted = false;
        sendData('copyandpaste');
    });

    typeInput();
    submitData();
});

function endResize() {
    if (new Date() - rtime < delta) {
        setTimeout(endResize, delta);
    } else {
        timeout = false;
        req.eventType = "resize";
        req.resizeFrom.height = fromHeight.toString();
        req.resizeFrom.width = originalWidth.toString();
        toHeight = $(window).height();
        toWidth = $(window).width();
        req.resizeTo.height = toHeight.toString();
        req.resizeTo.width = toWidth.toString();
        sendData('resize');
        fromHeight = toHeight;
        originalWidth = toWidth;
    }
}

function sendData() {
    $.ajax({
        url: apiUrl,
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify(
            {
                "websiteURL": req.url,
                "sessionId": req.id.toString(),
                "eventType": (req.eventType) ? req.eventType : null,
                "pasted": (req.eventType == 'copyAndPaste') ? req.pasted : null,
                "formId": (req.eventType == 'copyAndPaste') ? req.formId : null,
                "resizeFrom": (req.eventType == 'resize') ? {
                    "height": req.resizeFrom.height,
                    "width": req.resizeFrom.width
                } : null,
                "resizeTo": (req.eventType == 'resize') ? {
                    "height": req.resizeTo.height,
                    "width": req.resizeTo.width,
                } : null,
                "time": (req.eventType == 'timeTaken') ? req.interval : null
            }
        )
    })
        .done(function(data) {
            //Ajax request was successful.
        })
        .fail(function(xhr, status, error) {
            //Ajax request failed.
            var errorMessage = xhr.status + ': ' + xhr.statusText
            alert('Error - ' + errorMessage);
        })
}

function typeInput() {
    $("input").keypress(function (event) {
        if (!hasTyped) {
            hasTyped = true;
            startTime = new Date();
        }
    });
}

function submitData() {
    $("button").click(function () {
        if (hasTyped) {
            end = new Date();
            interval = (end - startTime) / 1000;
            req.eventType = "timeTaken";
            req.interval = interval;
            hasTyped = false;
            sendData('submit');
        }
    });
}