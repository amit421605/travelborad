// Doughnut chart of planned expenses by category (Chart.js)
const ExpenseChart = (() => {
  const labels = ['Transport', 'Stay', 'Food', 'Activities', 'Other'];
  const colors = ['#2a7f9e', '#1f5f5b', '#e0b44c', '#7a5a8c', '#9aa8a4'];
  let chart = null;

  function ensureChart() {
    if (chart) return chart;
    const ctx = document.getElementById('expenseChart');
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: [0, 0, 0, 0, 0], backgroundColor: colors, borderColor: '#fff', borderWidth: 2 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans' } } },
          tooltip: {
            callbacks: {
              label: (item) => ` ${item.label}: \u20B9${Math.round(item.parsed).toLocaleString('en-IN')}`
            }
          }
        }
      }
    });
    return chart;
  }

  // values: array of 5 numbers in the same order as `labels`
  function update(values) {
    const c = ensureChart();
    const total = values.reduce((a, b) => a + b, 0);
    // Show a muted placeholder ring when nothing has been entered yet
    if (total === 0) {
      c.data.labels = ['No expenses yet'];
      c.data.datasets[0].data = [1];
      c.data.datasets[0].backgroundColor = ['#e6ebe8'];
      c.options.plugins.tooltip.enabled = false;
    } else {
      c.data.labels = labels;
      c.data.datasets[0].data = values;
      c.data.datasets[0].backgroundColor = colors;
      c.options.plugins.tooltip.enabled = true;
    }
    c.update();
  }

  return { update, labels };
})();
