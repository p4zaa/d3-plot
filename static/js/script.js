document.addEventListener('DOMContentLoaded', function() {
    let dataCache = [];
    let interval;
    const playButton = document.getElementById('playButton');
    const pauseButton = document.getElementById('pauseButton');

    fetch('/data')
        .then(response => response.json())
        .then(data => {
            dataCache = data;
            createChart(dataCache);
        });

    function createChart(data) {
        d3.select("#chart").selectAll("*").remove();

        const margin = {top: 20, right: 30, bottom: 40, left: 50};
        const width = 800 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        const svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime()
            .domain(d3.extent(data, d => new Date(d.Year, 0, 1)))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([d3.min(data, d => d.Mean) - 0.1, d3.max(data, d => d.Mean) + 0.1])
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .call(d3.axisLeft(y));

        const path = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(d => x(new Date(d.Year, 0, 1)))
                .y(d => y(d.Mean))
            );

        function addDots(filteredData) {
            svg.selectAll("circle")
                .data(filteredData)
                .join(
                    enter => enter.append("circle")
                        .attr("cx", d => x(new Date(d.Year, 0, 1)))
                        .attr("cy", d => y(d.Mean))
                        .attr("r", 3)
                        .attr("fill", "red")
                        .on("mouseover", function(event, d) {
                            d3.select(this).attr("r", 6);
                            svg.append("text")
                                .attr("id", "tooltip")
                                .attr("x", x(new Date(d.Year, 0, 1)) + 5)
                                .attr("y", y(d.Mean) - 10)
                                .text(`${d.Year}: ${d.Mean.toFixed(2)}°C`);
                        })
                        .on("mouseout", function(event, d) {
                            d3.select(this).attr("r", 3);
                            d3.select("#tooltip").remove();
                        }),
                    update => update
                        .attr("cx", d => x(new Date(d.Year, 0, 1)))
                        .attr("cy", d => y(d.Mean))
                        .attr("r", 3)
                        .attr("fill", "red"),
                    exit => exit.remove()
                );
        }

        function updateChart(filteredData) {
            const t = d3.transition().duration(500);
            path.datum(filteredData)
                .transition(t)
                .attr("d", d3.line()
                    .x(d => x(new Date(d.Year, 0, 1)))
                    .y(d => y(d.Mean))
                );
            addDots(filteredData);
        }

        window.updateChart = function() {
            const selectedYear = document.getElementById('yearRange').value;
            document.getElementById('yearRangeLabel').textContent = selectedYear;
            const filteredData = dataCache.filter(d => d.Year <= selectedYear);
            updateChart(filteredData);
        };

        playButton.addEventListener('click', function() {
            playButton.disabled = true;
            pauseButton.disabled = false;
            let currentYear = parseInt(document.getElementById('yearRange').value);

            interval = setInterval(() => {
                if (currentYear <= 2020) {
                    document.getElementById('yearRange').value = currentYear;
                    document.getElementById('yearRangeLabel').textContent = currentYear;
                    const filteredData = dataCache.filter(d => d.Year <= currentYear);
                    updateChart(filteredData);
                    currentYear++;
                } else {
                    clearInterval(interval);
                    playButton.disabled = false;
                    pauseButton.disabled = true;
                }
            }, 500);
        });

        pauseButton.addEventListener('click', function() {
            clearInterval(interval);
            playButton.disabled = false;
            pauseButton.disabled = true;
        });

        // Initial chart rendering
        updateChart(data);
    }
});
