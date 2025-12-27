/* ============================================
   Gym Dashboard - Main JavaScript
   ============================================ */

// Constants
const CSV_PATH = '/assets/data/training.csv';
const MUSCLE_COLORS = {
  'Espalda': '#2a7ae2',
  'Pecho': '#5c2a9d',
  'Biceps': '#16a085',
  'Triceps': '#d35400',
  'Hombro': '#c0392b',
  'Piernas': '#27ae60'
};

// Global state
let allWorkouts = [];
let charts = {};

// ============================================
// Initialize Dashboard
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadTrainingData();
});

async function loadTrainingData() {
  try {
    const response = await fetch(CSV_PATH);
    if (!response.ok) throw new Error('Failed to load CSV');

    const csvText = await response.text();
    const parsed = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    allWorkouts = processWorkoutData(parsed.data);

    if (allWorkouts.length === 0) {
      showError('No valid training data found.');
      return;
    }

    initializeDashboard();

  } catch (error) {
    console.error('Error loading data:', error);
    showError('Unable to load training data. Please try again later.');
  }
}

// ============================================
// Data Processing
// ============================================
function processWorkoutData(rawData) {
  return rawData
    .filter(row => {
      // Validate required fields
      return row.date && row.exercise &&
        row.weight_kg !== null && row.reps > 0;
    })
    .map(row => ({
      date: new Date(row.date),
      workoutDay: row.workout_day,
      muscleGroup: row.muscle_group?.trim(),
      exercise: row.exercise?.trim(),
      setNumber: row.set_number,
      weightKg: parseFloat(row.weight_kg),
      reps: parseInt(row.reps),
      toFailure: row.to_failure === 'Yes',
      notes: row.notes || '',
      volume: parseFloat(row.weight_kg) * parseInt(row.reps)
    }))
    .filter(row => row.date <= new Date())  // No future dates
    .sort((a, b) => a.date - b.date);
}

// ============================================
// Dashboard Initialization
// ============================================
function initializeDashboard() {
  hideLoading();
  showDashboard();

  updateLastUpdatedDate();
  initWeightProgressionChart();
  initVolumeChart();
  initFrequencyCalendar();
  initPersonalRecordsTable();
  initRawDataTable();
}

function updateLastUpdatedDate() {
  const lastDate = allWorkouts[allWorkouts.length - 1].date;
  const formatted = lastDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById('last-updated').textContent =
    `Last workout: ${formatted}`;
}

// ============================================
// Chart 1: Weight Progression
// ============================================
function initWeightProgressionChart() {
  const exercises = [...new Set(allWorkouts.map(w => w.exercise))].sort();

  // Populate exercise dropdown
  const select = document.getElementById('exercise-select');
  exercises.forEach(ex => {
    const option = document.createElement('option');
    option.value = ex;
    option.textContent = ex;
    select.appendChild(option);
  });

  // Select first 3 exercises by default
  for (let i = 0; i < Math.min(3, exercises.length); i++) {
    select.options[i].selected = true;
  }

  // Event listener for selection changes
  select.addEventListener('change', updateWeightProgressionChart);

  // Initial render
  updateWeightProgressionChart();
}

function updateWeightProgressionChart() {
  const select = document.getElementById('exercise-select');
  const selectedExercises = Array.from(select.selectedOptions)
    .map(opt => opt.value);

  if (selectedExercises.length === 0) {
    return;  // No selection, keep previous chart
  }

  const data = getWeightProgressionData(selectedExercises);

  if (charts.weightProgression) {
    charts.weightProgression.destroy();
  }

  const ctx = document.getElementById('weight-progression-chart');
  charts.weightProgression = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, padding: 15 }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label;
              const weight = context.parsed.y;
              return `${label}: ${weight} kg`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Date' },
          ticks: { maxRotation: 45, minRotation: 45 }
        },
        y: {
          title: { display: true, text: 'Weight (kg)' },
          beginAtZero: false,
          ticks: {
            callback: (value) => value + ' kg'
          }
        }
      }
    }
  });
}

function getWeightProgressionData(exercises) {
  const datasets = exercises.map((exercise, index) => {
    // Filter workouts for this exercise
    const exerciseWorkouts = allWorkouts.filter(w => w.exercise === exercise);

    // Group by date, get max weight per day
    const byDate = {};
    exerciseWorkouts.forEach(w => {
      const dateKey = w.date.toISOString().split('T')[0];
      if (!byDate[dateKey] || w.weightKg > byDate[dateKey]) {
        byDate[dateKey] = w.weightKg;
      }
    });

    // Convert to sorted arrays
    const dates = Object.keys(byDate).sort();
    const weights = dates.map(d => byDate[d]);

    // Get muscle group for color
    const muscleGroup = exerciseWorkouts[0].muscleGroup;
    const color = MUSCLE_COLORS[muscleGroup] || '#2a7ae2';

    return {
      label: `${exercise} (${muscleGroup})`,
      data: weights,
      borderColor: color,
      backgroundColor: color + '20',  // 20% opacity
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.1
    };
  });

  // Use dates from all workouts as labels
  const allDates = [...new Set(allWorkouts.map(w =>
    w.date.toISOString().split('T')[0]))].sort();

  return {
    labels: allDates,
    datasets: datasets
  };
}

// ============================================
// Chart 2: Volume Trends
// ============================================
function initVolumeChart() {
  const viewSelect = document.getElementById('volume-view');
  viewSelect.addEventListener('change', updateVolumeChart);
  updateVolumeChart();
}

function updateVolumeChart() {
  const viewBy = document.getElementById('volume-view').value;
  const data = getVolumeTrendData(viewBy);

  if (charts.volume) {
    charts.volume.destroy();
  }

  const ctx = document.getElementById('volume-chart');
  charts.volume = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label;
              const volume = context.parsed.y.toLocaleString();
              return `${label}: ${volume} kg`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Date' }
        },
        y: {
          title: { display: true, text: 'Volume (kg)' },
          beginAtZero: true,
          ticks: {
            callback: (value) => (value / 1000).toFixed(1) + 'k'
          }
        }
      }
    }
  });
}

function getVolumeTrendData(viewBy) {
  if (viewBy === 'muscle') {
    // Group by muscle group
    const muscleGroups = [...new Set(allWorkouts.map(w => w.muscleGroup))];

    const datasets = muscleGroups.map(muscle => {
      const muscleWorkouts = allWorkouts.filter(w => w.muscleGroup === muscle);

      // Sum volume by date
      const byDate = {};
      muscleWorkouts.forEach(w => {
        const dateKey = w.date.toISOString().split('T')[0];
        byDate[dateKey] = (byDate[dateKey] || 0) + w.volume;
      });

      const dates = Object.keys(byDate).sort();
      const volumes = dates.map(d => byDate[d]);

      return {
        label: muscle,
        data: volumes,
        borderColor: MUSCLE_COLORS[muscle],
        backgroundColor: MUSCLE_COLORS[muscle] + '40',
        fill: true,
        tension: 0.3
      };
    });

    const allDates = [...new Set(allWorkouts.map(w =>
      w.date.toISOString().split('T')[0]))].sort();

    return { labels: allDates, datasets: datasets };

  } else {
    // Total volume
    const byDate = {};
    allWorkouts.forEach(w => {
      const dateKey = w.date.toISOString().split('T')[0];
      byDate[dateKey] = (byDate[dateKey] || 0) + w.volume;
    });

    const dates = Object.keys(byDate).sort();
    const volumes = dates.map(d => byDate[d]);

    return {
      labels: dates,
      datasets: [{
        label: 'Total Volume',
        data: volumes,
        borderColor: '#2a7ae2',
        backgroundColor: '#2a7ae240',
        fill: true,
        tension: 0.3
      }]
    };
  }
}

// ============================================
// Chart 3: Frequency Calendar
// ============================================
function initFrequencyCalendar() {
  const frequencyData = getFrequencyData();
  renderCalendar(frequencyData);
}

function getFrequencyData() {
  const byDate = {};

  allWorkouts.forEach(w => {
    const dateKey = w.date.toISOString().split('T')[0];
    if (!byDate[dateKey]) {
      byDate[dateKey] = {
        date: dateKey,
        muscleGroups: new Set(),
        totalSets: 0
      };
    }
    byDate[dateKey].muscleGroups.add(w.muscleGroup);
    byDate[dateKey].totalSets++;
  });

  return Object.values(byDate).map(day => ({
    date: day.date,
    muscleGroups: Array.from(day.muscleGroups).join(', '),
    totalSets: day.totalSets,
    level: getIntensityLevel(day.totalSets)
  }));
}

function getIntensityLevel(sets) {
  if (sets === 0) return 0;
  if (sets <= 10) return 1;
  if (sets <= 20) return 2;
  if (sets <= 30) return 3;
  return 4;
}

function renderCalendar(frequencyData) {
  const container = document.getElementById('frequency-calendar');

  // Create calendar grid
  const grid = document.createElement('div');
  grid.className = 'days-grid';

  // Get date range (last 12 weeks)
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 84);  // 12 weeks

  // Create cells for each day
  const currentDate = new Date(startDate);
  while (currentDate <= today) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const dayData = frequencyData.find(fd => fd.date === dateKey);

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.setAttribute('data-date', dateKey);

    if (dayData) {
      cell.setAttribute('data-level', dayData.level);
      cell.setAttribute('title',
        `${dateKey}: ${dayData.muscleGroups} (${dayData.totalSets} sets)`);
    } else {
      cell.setAttribute('data-level', '0');
      cell.setAttribute('title', `${dateKey}: Rest day`);
    }

    grid.appendChild(cell);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  container.innerHTML = '';
  container.appendChild(grid);

  // Add legend
  const legend = document.createElement('div');
  legend.className = 'calendar-legend';
  legend.innerHTML = `
    <span>Less</span>
    <div class="legend-scale">
      <span class="level-0"></span>
      <span class="level-1"></span>
      <span class="level-2"></span>
      <span class="level-3"></span>
      <span class="level-4"></span>
    </div>
    <span>More</span>
  `;
  container.appendChild(legend);
}

// ============================================
// Chart 4: Personal Records
// ============================================
function initPersonalRecordsTable() {
  const prData = getPersonalRecords();
  renderPRTable(prData);
}

function getPersonalRecords() {
  const byExercise = {};

  allWorkouts.forEach(w => {
    if (!byExercise[w.exercise] || w.weightKg > byExercise[w.exercise].maxWeight) {
      byExercise[w.exercise] = {
        exercise: w.exercise,
        muscleGroup: w.muscleGroup,
        maxWeight: w.weightKg,
        reps: w.reps,
        date: w.date
      };
    }
  });

  return Object.values(byExercise)
    .sort((a, b) => b.maxWeight - a.maxWeight);
}

function renderPRTable(prData) {
  const container = document.getElementById('pr-table');
  container.innerHTML = '';

  // Group PRs by muscle group
  const grouped = {};
  prData.forEach(pr => {
    if (!grouped[pr.muscleGroup]) {
      grouped[pr.muscleGroup] = [];
    }
    grouped[pr.muscleGroup].push(pr);
  });

  // Get muscle groups in order
  const muscleOrder = ['Espalda', 'Pecho', 'Biceps', 'Triceps', 'Hombro', 'Piernas'];
  const orderedMuscles = muscleOrder.filter(m => grouped[m]);

  // Create section for each muscle group
  orderedMuscles.forEach(muscle => {
    const muscleData = grouped[muscle];

    // Create muscle group section
    const section = document.createElement('div');
    section.className = 'pr-muscle-group';

    // Create header with color dot
    const header = document.createElement('div');
    header.className = 'pr-muscle-header';
    const color = MUSCLE_COLORS[muscle];

    const colorDot = document.createElement('div');
    colorDot.className = 'pr-muscle-color-dot';
    colorDot.style.backgroundColor = color;

    const title = document.createElement('h3');
    title.textContent = muscle;

    const toggle = document.createElement('span');
    toggle.className = 'pr-muscle-toggle';
    toggle.textContent = '▼';

    header.appendChild(colorDot);
    header.appendChild(title);
    header.appendChild(toggle);

    // Create table for this muscle group
    const table = document.createElement('table');
    table.className = 'pr-muscle-table';

    table.innerHTML = `
      <thead>
        <tr>
          <th>Exercise</th>
          <th>Max Weight</th>
          <th>Reps</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    // Sort by weight descending for this muscle group
    const sortedByWeight = [...muscleData].sort((a, b) => b.maxWeight - a.maxWeight);

    sortedByWeight.forEach((pr, index) => {
      const row = document.createElement('tr');

      // Show medal only for top 3 in this muscle group
      const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : '';
      const weightDisplay = pr.maxWeight === 0 ?
        'Bodyweight' : `${pr.maxWeight} kg`;

      row.innerHTML = `
        <td data-label="Exercise">
          <span class="medal">${medal}</span>${pr.exercise}
        </td>
        <td data-label="Max Weight" class="highlight">${weightDisplay}</td>
        <td data-label="Reps">${pr.reps}</td>
        <td data-label="Date">${pr.date.toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        })}</td>
      `;

      tbody.appendChild(row);
    });

    // Add collapse/expand functionality
    header.addEventListener('click', () => {
      table.classList.toggle('hidden');
      toggle.classList.toggle('collapsed');
    });

    section.appendChild(header);
    section.appendChild(table);
    container.appendChild(section);
  });
}

// ============================================
// Raw Data Table with Filters
// ============================================
let rawDataSortColumn = 'date';
let rawDataSortOrder = 'desc';

function initRawDataTable() {
  // Populate muscle group filter dropdown
  const muscleSelect = document.getElementById('filter-muscle');
  const muscles = [...new Set(allWorkouts.map(w => w.muscleGroup))].sort();
  muscles.forEach(muscle => {
    const option = document.createElement('option');
    option.value = muscle;
    option.textContent = muscle;
    muscleSelect.appendChild(option);
  });

  // Add event listeners for filters
  document.getElementById('filter-exercise').addEventListener('input', renderRawDataTable);
  document.getElementById('filter-muscle').addEventListener('change', renderRawDataTable);
  document.getElementById('filter-date-from').addEventListener('change', renderRawDataTable);
  document.getElementById('filter-date-to').addEventListener('change', renderRawDataTable);

  // Initial render
  renderRawDataTable();
}

function getRawDataFilters() {
  const exerciseFilter = document.getElementById('filter-exercise').value.toLowerCase();
  const muscleFilter = document.getElementById('filter-muscle').value;
  const dateFromFilter = document.getElementById('filter-date-from').value;
  const dateToFilter = document.getElementById('filter-date-to').value;

  return {
    exercise: exerciseFilter,
    muscle: muscleFilter,
    dateFrom: dateFromFilter ? new Date(dateFromFilter) : null,
    dateTo: dateToFilter ? new Date(dateToFilter) : null
  };
}

function filterRawData(workouts, filters) {
  return workouts.filter(w => {
    // Exercise filter (contains search)
    if (filters.exercise && !w.exercise.toLowerCase().includes(filters.exercise)) {
      return false;
    }

    // Muscle group filter (exact match)
    if (filters.muscle && w.muscleGroup !== filters.muscle) {
      return false;
    }

    // Date range filter (from date onwards)
    if (filters.dateFrom && w.date < filters.dateFrom) {
      return false;
    }

    // Date range filter (up to date)
    if (filters.dateTo && w.date > filters.dateTo) {
      return false;
    }

    return true;
  });
}

function sortRawData(workouts, column, order) {
  const sorted = [...workouts].sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];

    // Special handling for date
    if (column === 'date') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    // Numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // String comparison
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  return sorted;
}

function renderRawDataTable() {
  const filters = getRawDataFilters();
  let filteredData = filterRawData(allWorkouts, filters);
  filteredData = sortRawData(filteredData, rawDataSortColumn, rawDataSortOrder);

  const container = document.getElementById('raw-data-container');

  const table = document.createElement('table');
  table.className = 'raw-data-table';

  // Header with clickable columns for sorting
  const headers = ['Date', 'Exercise', 'Muscle', 'Sets', 'Weight', 'Reps', 'Failure', 'Notes'];
  const headerCells = ['date', 'exercise', 'muscleGroup', 'setNumber', 'weightKg', 'reps', 'toFailure', 'notes'];

  let thead = '<thead><tr>';
  headerCells.forEach((cell, idx) => {
    const header = headers[idx];
    const sortIndicator = rawDataSortColumn === cell ?
      (rawDataSortOrder === 'asc' ? ' ↑' : ' ↓') : '';
    thead += `<th onclick="toggleRawDataSort('${cell}')" style="cursor: pointer;">
      ${header}<span class="sort-indicator">${sortIndicator}</span>
    </th>`;
  });
  thead += '</tr></thead>';
  table.innerHTML = thead;

  // Body with data rows
  const tbody = document.createElement('tbody');
  filteredData.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      <td class="exercise-name">${row.exercise}</td>
      <td class="muscle-group">${row.muscleGroup}</td>
      <td>${row.setNumber}</td>
      <td>${row.weightKg === 0 ? 'BW' : row.weightKg} kg</td>
      <td>${row.reps}</td>
      <td class="to-failure ${row.toFailure ? '' : 'no'}">${row.toFailure ? '✓' : '—'}</td>
      <td>${row.notes || '—'}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);

  // Show filter results info
  const resultsText = filteredData.length === allWorkouts.length ?
    `Showing all <strong>${filteredData.length}</strong> entries` :
    `Showing <strong>${filteredData.length}</strong> of <strong>${allWorkouts.length}</strong> entries`;

  container.innerHTML = '';
  container.appendChild(table);

  // Add results info
  const info = document.createElement('div');
  info.style.marginTop = '1em';
  info.style.fontSize = '0.9em';
  info.style.color = '#666';
  info.innerHTML = resultsText;
  container.appendChild(info);
}

function toggleRawDataSort(column) {
  if (rawDataSortColumn === column) {
    // Toggle sort order
    rawDataSortOrder = rawDataSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    // New column, default to ascending
    rawDataSortColumn = column;
    rawDataSortOrder = 'asc';
  }
  renderRawDataTable();
}

function clearTableFilters() {
  document.getElementById('filter-exercise').value = '';
  document.getElementById('filter-muscle').value = '';
  document.getElementById('filter-date-from').value = '';
  document.getElementById('filter-date-to').value = '';
  rawDataSortColumn = 'date';
  rawDataSortOrder = 'desc';
  renderRawDataTable();
}

// ============================================
// UI Helper Functions
// ============================================
function hideLoading() {
  document.getElementById('loading-state').style.display = 'none';
}

function showDashboard() {
  document.getElementById('dashboard-content').style.display = 'block';
}

function showError(message) {
  document.getElementById('loading-state').style.display = 'none';
  const errorDiv = document.getElementById('error-state');
  errorDiv.querySelector('p').textContent = '❌ ' + message;
  errorDiv.style.display = 'block';
}
