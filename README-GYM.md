# Gym Training Dashboard - User Guide

Welcome to your personal gym training dashboard! This guide explains how to use and maintain your workout tracking system.

## Overview

The Gym Training Dashboard (`/gym/`) displays your workout progress with four interactive visualizations:

1. **Weight Progression** - Track how much weight you're lifting over time for each exercise
2. **Training Volume** - Monitor total volume (weight × reps × sets) by muscle group
3. **Training Frequency** - See which days you trained and muscle groups worked (calendar heatmap)
4. **Personal Records** - View your best lifts for each exercise

## Accessing Your Dashboard

Visit: `https://your-domain.com/gym/`

The dashboard loads your training data from the CSV file and displays all visualizations. It updates automatically when you refresh the page after adding new workouts.

## Adding New Workouts

### Step 1: Open the Training CSV

Open the file: `assets/data/training.csv` in a spreadsheet editor:
- Microsoft Excel
- Google Sheets
- LibreOffice Calc
- Any text editor (for advanced users)

### Step 2: Add a New Row

Add a new row at the end with your workout data. Use this format:

```csv
date,workout_day,muscle_group,exercise,set_number,weight_kg,reps,to_failure,notes
2025-01-05,4,Espalda,Remo,1,42,12,No,Felt strong
```

### Step 3: Fill in the Fields

Each field is required:

| Field | Description | Example |
|-------|-------------|---------|
| **date** | Date of workout (YYYY-MM-DD format) | 2025-01-05 |
| **workout_day** | Sequential workout number | 1, 2, 3, 4... |
| **muscle_group** | Which muscle group (Spanish) | Espalda, Pecho, Biceps, Triceps, Hombro, Piernas |
| **exercise** | Exercise name | Remo, Press Frontal, Curl Martillo |
| **set_number** | Set number for this exercise | 1, 2, 3, 4... |
| **weight_kg** | Weight in kilograms | 40, 50, 0 (for bodyweight) |
| **reps** | Number of repetitions | 12, 8, 10... |
| **to_failure** | Did you go to failure? | Yes or No |
| **notes** | Optional notes about the workout | "Felt strong", "Pain in shoulder"... |

### Muscle Groups (Spanish)

Use exactly these names to ensure consistent tracking:

- **Espalda** - Back (Remo, Pull Down, etc.)
- **Pecho** - Chest (Press Frontal, Flexiones, etc.)
- **Biceps** - Biceps (Curl Martillo, Curl Predicador, etc.)
- **Triceps** - Triceps (Katana, Extensión, etc.)
- **Hombro** - Shoulders (Press Militar, Deltoides, etc.)
- **Piernas** - Legs (Sentadilla, Gemelo, Isquiotibiales, etc.)

### Step 4: Save the File

Save the CSV file as **UTF-8 encoding** (important for Spanish characters):

**Excel**:
- File → Save As → CSV (UTF-8 with comma delimiter)

**Google Sheets**:
- File → Download → CSV

**Text Editors**:
- Make sure encoding is set to UTF-8 before saving

### Step 5: Commit to Git

```bash
cd /path/to/blogsme
git add assets/data/training.csv
git commit -m "Add workout from Jan 5"
git push origin main
```

### Step 6: Wait for GitHub Pages Build

GitHub Pages usually rebuilds within 1-2 minutes after you push. You can:
- Check build status at: https://github.com/your-username/blogsme/actions
- Refresh your dashboard page in 2-3 minutes

## Example Workout Session

Here's a complete example for a back + biceps workout:

```csv
date,workout_day,muscle_group,exercise,set_number,weight_kg,reps,to_failure,notes
2025-01-05,4,Espalda,Remo,1,40,12,No,Warm-up
2025-01-05,4,Espalda,Remo,2,42,12,No,
2025-01-05,4,Espalda,Remo,3,42,12,No,Good form
2025-01-05,4,Espalda,Pull Down,1,50,12,No,
2025-01-05,4,Espalda,Pull Down,2,50,10,Yes,Went to failure
2025-01-05,4,Biceps,Curl Martillo,1,10,12,No,
2025-01-05,4,Biceps,Curl Martillo,2,10,12,No,
2025-01-05,4,Biceps,Curl Martillo,3,10,12,Yes,
```

## Tips for Best Results

### Consistency is Key
- Use the same exercise names every time (don't mix "Remo" with "remo" or "Remar")
- Use the exact same muscle group names from the list above
- This helps the dashboard track your progress accurately

### Bodyweight Exercises
- For bodyweight exercises, use `0` for the weight_kg field
- Example: `2025-01-05,4,Pecho,Flexiones al Fallo,1,0,15,Yes`
- The dashboard will display these as "Bodyweight"

### Multiple Muscle Groups Per Day
- List each muscle group in separate rows with the same date
- This helps the frequency heatmap show which muscles you worked

### Recording Progressive Overload
- Always record the weight and reps you actually lifted
- The dashboard calculates the max weight per exercise automatically
- Track volume trends to see if your total output is increasing

### Notes Field
- Use notes to record feelings, injuries, or special circumstances
- This helps you review your training psychology and recovery
- Not required, can be left blank

## Understanding the Visualizations

### Weight Progression Chart
- **What it shows**: How much weight you're lifting for each exercise over time
- **How to use it**: Select multiple exercises from the dropdown to compare strength gains
- **What to look for**: Upward trend = getting stronger

### Training Volume Chart
- **What it shows**: Total volume (weight × reps) over time
- **Toggle options**:
  - "Muscle Group" = see each muscle group separately
  - "Total Volume" = see combined volume across all exercises
- **What to look for**: Consistent or increasing volume = good training consistency

### Training Frequency Heatmap
- **What it shows**: Which days you trained and how intense each session was
- **Color intensity**:
  - Light green = 1-10 sets (light session)
  - Medium green = 11-20 sets (normal session)
  - Dark green = 21-30 sets (intense session)
  - Black = 31+ sets (very intense)
- **Hover over cells**: Shows muscle groups trained and total sets

### Personal Records Table
- **What it shows**: Your best lift for each exercise
- **Medals**: 🥇 🥈 🥉 for your top 3 lifts
- **How to use**: Track your progress toward strength goals

## Troubleshooting

### "Unable to load training data" Error

**Problem**: Dashboard shows error message instead of charts

**Solution**:
1. Check that `assets/data/training.csv` exists
2. Verify CSV is saved as UTF-8 encoding
3. Make sure first row has headers: `date,workout_day,muscle_group,exercise,...`
4. Check browser console (F12 → Console) for error messages
5. Try a hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)

### CSV File Not Updating Dashboard

**Problem**: You added workouts but they don't appear on the dashboard

**Solution**:
1. Verify file was saved as CSV (not .xlsx or .txt)
2. Check git was pushed: `git status` should show no pending changes
3. Wait 2-3 minutes for GitHub Pages to rebuild
4. Check Actions tab: https://github.com/your-username/blogsme/actions
5. Do a hard refresh of your browser (Ctrl+Shift+R)

### Exercise Names Not Appearing in Dropdown

**Problem**: Some exercises missing from the Weight Progression dropdown

**Solution**:
1. Check spelling - must match exactly in CSV
2. Ensure no extra spaces before/after exercise name
3. Verify muscle_group field is one of the 6 approved names
4. Open browser console (F12) and check for error messages

### Charts Look Blurry or Don't Resize

**Problem**: Charts don't look good on mobile or don't resize properly

**Solution**:
1. Hard refresh page (Ctrl+Shift+R)
2. Close other tabs to free up memory
3. Try different browser (Chrome, Firefox, Safari)
4. Check browser console for JavaScript errors

## Backing Up Your Data

It's recommended to keep a backup of your training data:

```bash
# Create a backup copy locally
cp assets/data/training.csv training-backup-2025-01-05.csv

# Or download from GitHub
# Go to: https://github.com/your-username/blogsme/blob/main/assets/data/training.csv
# Click "Download raw file"
```

## Advanced: Manual CSV Editing

For power users, you can edit the CSV directly in a text editor. Format:

```
date,workout_day,muscle_group,exercise,set_number,weight_kg,reps,to_failure,notes
2025-01-05,4,Espalda,Remo,1,40,12,No,
2025-01-05,4,Espalda,Remo,2,42,12,No,
```

Important:
- No quotes needed around fields
- Use commas to separate fields
- Keep UTF-8 encoding
- Save as `.csv` (not `.txt`)

## Performance with Large Datasets

The dashboard works smoothly with up to 10,000+ rows of data. If you track workouts for many years:

- **Current data** (3 workouts): ~67 rows - instant loading
- **1 year of data** (156 workouts): ~15,600 rows - still very fast
- **Multiple years**: May benefit from filtering to recent months (future feature)

No action needed - just continue adding data and the dashboard will handle it!

## Future Improvements

Possible future enhancements for the dashboard:
- Filter by date range
- Compare month-to-month progress
- Export charts as images
- Track rest days and recovery
- Body weight tracking integration
- Goals and targets

## Support & Questions

If you encounter issues:
1. Check this guide first
2. Review browser console (F12 → Console) for error messages
3. Verify your CSV format matches examples above
4. Take a screenshot of the error and save it for reference

Happy training! 💪
