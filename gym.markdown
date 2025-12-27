---
layout: page
title: Gym Training
permalink: /gym/
---

<link rel="stylesheet" href="{{ '/assets/gym-dashboard.css' | relative_url }}">

<div id="gym-dashboard">

  <div class="dashboard-header">
    <p class="dashboard-intro">
      Tracking my journey back to fitness. All data updated manually after each workout. Watch me evolve.
    </p>
    <div id="last-updated" class="last-updated"></div>
  </div>

  <!-- Loading State -->
  <div id="loading-state" class="loading">
    <p>⏳ Loading training data...</p>
  </div>

  <!-- Error State -->
  <div id="error-state" class="error" style="display: none;">
    <p>❌ Unable to load training data. Please try again later.</p>
  </div>

  <!-- Dashboard Content (hidden until data loads) -->
  <div id="dashboard-content" style="display: none;">

    <div class="chart-grid">

      <!-- Chart 1: Weight Progression -->
      <div class="chart-container">
        <h2>Weight Progression</h2>
        <p class="chart-description">Track strength gains over time. Select exercises to compare.</p>
        <div class="chart-controls">
          <label for="exercise-select">Exercise:</label>
          <select id="exercise-select" multiple size="5"></select>
        </div>
        <canvas id="weight-progression-chart"></canvas>
      </div>

      <!-- Chart 2: Volume Trends -->
      <div class="chart-container">
        <h2>Training Volume</h2>
        <p class="chart-description">Total volume (weight × reps × sets) by muscle group.</p>
        <div class="chart-controls">
          <label for="volume-view">View by:</label>
          <select id="volume-view">
            <option value="muscle">Muscle Group</option>
            <option value="total">Total Volume</option>
          </select>
        </div>
        <canvas id="volume-chart"></canvas>
      </div>

      <!-- Chart 3: Training Frequency Heatmap -->
      <div class="chart-container chart-wide">
        <h2>Training Frequency</h2>
        <p class="chart-description">Days trained showing intensity and muscle groups worked. Last 12 weeks.</p>
        <div id="frequency-calendar"></div>
      </div>

      <!-- Chart 4: Personal Records -->
      <div class="chart-container">
        <h2>Personal Records</h2>
        <p class="chart-description">Best lifts per exercise (max weight achieved).</p>
        <div id="pr-table"></div>
      </div>

    </div>

    <!-- Raw Data Table Section -->
    <div class="raw-data-section">
      <h2>All Workout Entries</h2>
      <p class="chart-description">Complete workout log with filtering and search capabilities.</p>

      <div class="table-controls">
        <div class="table-control-group">
          <label for="filter-exercise">Exercise:</label>
          <input type="text" id="filter-exercise" placeholder="Search exercise...">
        </div>
        <div class="table-control-group">
          <label for="filter-muscle">Muscle:</label>
          <select id="filter-muscle">
            <option value="">All Muscle Groups</option>
          </select>
        </div>
        <div class="table-control-group">
          <label for="filter-date-from">From Date:</label>
          <input type="date" id="filter-date-from">
        </div>
        <div class="table-control-group">
          <label for="filter-date-to">To Date:</label>
          <input type="date" id="filter-date-to">
        </div>
        <button class="clear-filters-btn" onclick="clearTableFilters()">Clear Filters</button>
      </div>

      <div id="raw-data-container"></div>
      <div class="table-info">
        <strong>Tip:</strong> Click on column headers to sort. Use filters above to search specific exercises or muscle groups.
      </div>
    </div>

  </div>

</div>

<!-- Load Libraries from CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@2.0.1/dist/chartjs-chart-matrix.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>

<!-- Load Dashboard Logic -->
<script src="{{ '/assets/gym-dashboard.js' | relative_url }}"></script>
