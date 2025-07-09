let allProblems = [];

async function loadStats() {
    const handle = document.getElementById('handle-input').value.trim();
    if (!handle) return alert('Enter a Codeforces handle');
    document.getElementById('user-handle').textContent = handle;
    document.getElementById('welcome').classList.add('hidden');

    const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
    const { result: submissions } = await res.json();

    const accepted = new Map();
    const attempts = new Map();

    submissions.forEach(({ problem, verdict }) => {
        if (!problem.contestId || !problem.index) return;
        const id = `${problem.contestId}-${problem.index}`;
        if (!attempts.has(id)) attempts.set(id, 0);
        attempts.set(id, attempts.get(id) + 1);
        if (verdict === 'OK') accepted.set(id, problem);
    });

    const solvedByRating = {};
    const all = [];
    for (let [id, prob] of attempts.entries()) {
        const problem = {
            ...submissions.find(s => `${s.problem.contestId}-${s.problem.index}` === id).problem,
            attempts: attempts.get(id),
            solved: accepted.has(id)
        };
        const rating = problem.rating || 'Unrated';
        if (!solvedByRating[rating]) solvedByRating[rating] = [];
        if (problem.solved) solvedByRating[rating].push(problem);
        all.push(problem);
    }

    allProblems = all;

    document.getElementById('total-solved').textContent = [...accepted.keys()].length;
    document.getElementById('total-attempted').textContent = attempts.size;

    drawChart(solvedByRating);
    drawRatingButtons(solvedByRating);
    document.getElementById('stats-area').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    document.getElementById('login-btn').classList.add('hidden');

}

function drawChart(data) {
    const ctx = document.getElementById('ratingChart');
    const labels = Object.keys(data).sort((a, b) => +a - +b);
    const counts = labels.map(r => data[r].length);

    if (window.chartInstance) window.chartInstance.destroy();

    window.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: '# of Solved Problems',
                data: counts,
                backgroundColor: 'rgba(59, 130, 246, 0.6)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}
function logout() {
    document.getElementById('stats-area').classList.add('hidden');
    document.getElementById('welcome').classList.remove('hidden');
    document.getElementById('handle-input').value = '';
    document.getElementById('logout-btn').classList.add('hidden');
    document.getElementById('login-btn').classList.remove('hidden');

    // Clear UI content
    document.getElementById('problem-table-body').innerHTML = '';
    document.getElementById('rating-buttons').innerHTML = '';
    document.getElementById('ratingChart').getContext('2d').clearRect(0, 0, 400, 200);
    if (window.chartInstance) window.chartInstance.destroy();
}

function drawRatingButtons(data) {
    const container = document.getElementById('rating-buttons');
    container.innerHTML = '';
    Object.keys(data).sort((a, b) => +a - +b).forEach(rating => {
        const btn = document.createElement('button');
        btn.className = 'bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200';
        btn.textContent = rating;
        btn.onclick = () => drawProblemTable(rating);
        container.appendChild(btn);
    });
}

function drawProblemTable(rating) {
    const tbody = document.getElementById('problem-table-body');
    tbody.innerHTML = '';

    const filtered = allProblems.filter(p => (p.rating || 'Unrated') == rating);

    filtered.forEach(p => {
        const row = document.createElement('tr');

        const statusBadge = `<span class="text-xs font-semibold px-2 py-1 rounded-full ${p.solved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }">${p.solved ? 'Solved' : 'Attempted'}</span>`;

        row.innerHTML = `
      <td class="border px-4 py-2 text-blue-600 underline">
        <a href="https://codeforces.com/contest/${p.contestId}/problem/${p.index}" target="_blank">${p.name}</a>
      </td>
      <td class="border px-4 py-2 text-center">${p.attempts}</td>
      <td class="border px-4 py-2 text-center">${statusBadge}</td>
    `;
        tbody.appendChild(row);
    });
}