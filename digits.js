window.addEventListener("load", function () {
    var ws,
        b,
        rnd,
        spot,
        time,
        dps,
        xd,
        digit,
        cnt,
        random,
        id,
        lng,
        str,
        chart,
        xVal,
        yVal,
        mType,
        mColor,
        rndMenu;

    str = ["R_100", "R_10", "R_25", "R_50", "R_75", "RDBEAR", "RDBULL"];
    dps = [];
    time = [0];
    spot = [0];
    digit = [0];
    mType = "none";
    mColor = "#32cd32";
    lng = "EN";
    xVal = 0;
    yVal = 0;
    cnt = 20;

    // Define an object to store detected patterns and their counts
    var detectedPatterns = {};

    function toggleMenu(data) {
        for (var i = 0; i < rndMenu.length; i++) {
            rndMenu[i].classList.remove("menu-active");
        }
        data.classList.add("menu-active");
    }

    function clickMenu(data) {
        data.addEventListener("click", function () {
            toggleMenu(data);
            rndGet();
            resetDigits();
            clearPatterns();
        });
    }

    function toggleDigit(d, m) {
        var nameClass = document.querySelector("#digits > span:nth-child(" + d + ")").className;
        document.querySelector("#digits > span:nth-child(" + d + ")").classList.remove(nameClass);
        document.querySelector("#digits > span:nth-child(" + d + ")").classList.add("digits_moved_" + m);
    }

    function detectPattern() {
        // Ensure there are at least 5 digits to analyze
        if (digit.length < 5) {
            return;
        }

        // Check the first 4 digits
        var firstFourDigits = digit.slice(0, 4).join("");

        // Check if digit 7 is above or below 5
        var lastDigit = digit[4];
        var patternMatch = lastDigit > 5;

        // Create a pattern identifier based on the first 4 digits
        var patternIdentifier = firstFourDigits + (patternMatch ? 'A' : 'B'); // 'A' for above 5, 'B' for below 5

        // Update the count of the detected pattern
        detectedPatterns[patternIdentifier] = (detectedPatterns[patternIdentifier] || 0) + 1;

        // Find the most common pattern
        var mostCommonPattern = Object.keys(detectedPatterns).reduce(function (a, b) {
            return detectedPatterns[a] > detectedPatterns[b] ? a : b;
        });

        // Display "Open Above 5" or "Open Below 5" based on the most common pattern
        if (mostCommonPattern.charAt(4) === 'A') {
            // If the most common pattern is "above 5"
            // Signal "Open Above 5" for digit 4
            digit[3] = 4;
        } else if (mostCommonPattern.charAt(4) === 'B') {
            // If the most common pattern is "below 5"
            // Signal "Open Below 5" for digit 4
            digit[3] = 6;
        }

        // Update the span elements in the digits container
        for (var i = 0; i < digit.length; i++) {
            var spanElement = document.querySelector("#digits > span:nth-child(" + (i + 1) + ")");
            spanElement.innerHTML = digit[i];
        }
    }

    function clearPatterns() {
        detectedPatterns = {};
    }

    function resetDigits() {
        for (var i = 0; i < 5; i++) {
            var spanElement = document.querySelector("#digits > span:nth-child(" + (i + 1) + ")");
            spanElement.innerHTML = "_";
        }
    }

    for (var i = 0; i < rndMenu.length; i++) {
        clickMenu(rndMenu[i]);
    }

    function rndGet() {
        random = document.querySelector("body > div.menu > span.menu-active").title;
        switch (random) {
            case str[0]:
                rnd = "R_100";
                xd = 2;
                break;
            case str[1]:
                rnd = "R_10";
                xd = 3;
                break;
            case str[2]:
                rnd = "R_25";
                xd = 3;
                break;
            case str[3]:
                rnd = "R_50";
                xd = 4;
                break;
            case str[4]:
                rnd = "R_75";
                xd = 4;
                break;
            case str[5]:
                rnd = "RDBEAR";
                xd = 4;
                break;
            case str[6]:
                rnd = "RDBULL";
                xd = 4;
                break;
            default:
                rnd = "R";
                xd = 0;
                break;
        }
    }

    rndGet();

    ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=3738&l=" + lng);

    ws.onopen = function (evt) {
        ws.send(JSON.stringify({ ticks: rnd }));
    };

    ws.onmessage = function (msg) {
        b = JSON.parse(msg.data);

        if (b.tick) {
            document.querySelector("#loader").classList.remove("loader");

            rndGet();

            if (b.echo_req.ticks == rnd) {
                id = b.tick.id;
                ws.send(
                    JSON.stringify({
                        ticks_history: rnd,
                        end: "latest",
                        start: 1,
                        style: "ticks",
                        count: cnt + 1,
                    })
                );
            } else {
                ws.send(JSON.stringify({ forget: id }));
                ws.send(JSON.stringify({ forget_all: "ticks" }));
                ws.send(JSON.stringify({ ticks: rnd }));
            }
        }

        if (b.history) {
            if (b.echo_req.ticks_history == rnd) {
                for (var i = 0; i < cnt + 1; i++) {
                    time[i] = b.history.times[cnt - i];
                    spot[i] = b.history.prices[cnt - i];
                    spot[i] = Number(spot[i]).toFixed(xd);
                    digit[i] = spot[i].slice(-1);
                }

                for (var i = 0; i < cnt + 1; i++) {
                    xVal = new Date(time[i] * 1000);
                    yVal = parseFloat(spot[i]);

                    if (i == 0) mType = "circle";
                    else mType = "none";

                    if (yVal == Math.max.apply(null, spot)) {
                        mColor = "#29abe2";
                        mType = "circle";
                    } else if (yVal == Math.min.apply(null, spot)) {
                        mColor = "#c03";
                        mType = "circle";
                    } else {
                        mColor = "#32cd32";
                    }

                    dps.push({
                        x: xVal,
                        y: yVal,
                        markerType: mType,
                        markerColor: mColor,
                        markerBorderColor: "#ccc",
                    });
                }

                if (dps.length > cnt + 1) {
                    while (dps.length != cnt + 1) {
                        dps.shift();
                    }
                }

                chart.render();

                spot.reverse();
                digit.reverse();

                detectPattern(); // Call the function to detect and update patterns
                // Call drawPatterns() to display patterns if needed
            }
        }
    };

    chart = new CanvasJS.Chart("chartContainer", {
        animationEnabled: true,
        theme: "light2",
        title: {
            titleFontSize: 0,
            text: "",
        },
        toolTip: {
            enabled: true,
            animationEnabled: true,
            borderColor: "#ccc",
            borderThickness: 1,
            fontColor: "#000",
            content: "{y}",
        },
        axisX: {
            includeZero: false,
            titleFontSize: 0,
            labelFontSize: 0,
            gridThickness: 0,
            tickLength: 0,
            lineThickness: 1,
        },
        axisY: {
            includeZero: false,
            titleFontSize: 0,
            labelFontSize: 0,
            gridThickness: 0,
            tickLength: 0,
            lineThickness: 1,
        },
        data: [
            {
                type: "spline",
                lineColor: "#ccc",
                lineThickness: 2,
                markerType: "none",
                markerSize: 5,
                markerBorderThickness: 0,
                dataPoints: dps,
            },
        ],
    });

    // Initial load
    resetDigits();
    clearPatterns();
}, false);
