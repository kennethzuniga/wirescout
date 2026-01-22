# GitHub Actions Scheduled Workflow Fix

## Problem
The GitHub Actions workflow was not running automatically every 5 minutes as configured in the cron schedule.

## Root Cause
According to [GitHub Actions documentation](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule), scheduled workflows are automatically disabled after 60 days of repository inactivity. To re-enable them, you need to update the workflow file with a commit to the default branch.

## Solution
This PR fixes the issue by:
1. Updating the workflow file to trigger re-enabling of the scheduled workflow
2. Adding documentation about scheduled workflow behavior
3. Fixing YAML formatting issues (spacing, trailing whitespace)

## Changes Made
- **`.github/workflows/scraper.yml`**: 
  - Added comments documenting scheduled workflow behavior
  - Fixed comment spacing per YAML best practices
  - Removed trailing whitespace
  - Made a commit to re-enable the disabled workflow

## Important Information About GitHub Actions Scheduled Workflows

### Requirements
1. **Default Branch**: Scheduled workflows ONLY run on the default branch (usually `main`)
2. **Minimum Interval**: The shortest interval is every 5 minutes (our configuration)
3. **Commit Required**: The workflow file must exist on the default branch

### Limitations and Behavior
1. **Delays Are Normal**: GitHub Actions can delay scheduled runs during periods of high load
   - High load times include the start of every hour
   - Delays of several minutes are common
   
2. **Automatic Disabling**: Scheduled workflows are disabled after 60 days of no repository activity
   - Re-enabled automatically when you update the workflow file
   
3. **No Guarantee**: GitHub Actions does not guarantee scheduled workflows will run at exact times
   - The schedule is "best effort"
   - Workflows may be skipped during extreme load

4. **Rate Limiting**: Very frequent schedules (like every 5 minutes) may experience more delays
   - Consider if every 5 minutes is necessary
   - Every 10-15 minutes might be more reliable

### On Forked Repositories
If this repository is a fork, scheduled workflows are **disabled by default** for security reasons. To enable them:
1. Go to the Actions tab in your fork
2. Click "I understand my workflows, go ahead and enable them"

## What to Expect After Merging

1. **Merge this PR to the main branch**
   - The workflow will be re-enabled automatically

2. **First scheduled run**
   - May take 5-10 minutes after merge
   - Could be delayed by GitHub Actions load

3. **Subsequent runs**
   - Should occur approximately every 5 minutes
   - Expect occasional delays during high load periods

4. **Monitoring**
   - Check the Actions tab: https://github.com/kennethzuniga/wirescout/actions
   - Look for runs with event type: `schedule`
   - Manual runs (workflow_dispatch) will show as event type: `workflow_dispatch`

## Troubleshooting

### If scheduled runs still don't appear after 30 minutes:

1. **Verify the workflow is on the main branch**
   ```bash
   git checkout main
   git pull
   cat .github/workflows/scraper.yml
   ```

2. **Check if Actions are enabled**
   - Go to Settings → Actions → General
   - Ensure "Allow all actions and reusable workflows" is selected

3. **Check for fork limitations**
   - If this is a fork, ensure scheduled workflows are enabled in the Actions tab

4. **Make another commit**
   - Sometimes making another small change to the workflow file helps
   - Try adding a comment or updating the documentation

5. **Check workflow run history**
   - Visit: https://github.com/kennethzuniga/wirescout/actions/workflows/scraper.yml
   - Look for any error messages or failed runs

### If you need to debug further:

1. **Test manual trigger**
   - Go to Actions tab
   - Select "Wirescout" workflow  
   - Click "Run workflow" button
   - If manual trigger works, the workflow itself is fine

2. **Review GitHub Actions status**
   - Check: https://www.githubstatus.com/
   - GitHub Actions may be experiencing issues

3. **Consider alternative schedules**
   - Every 5 minutes is aggressive and more prone to delays
   - Try `*/15 * * * *` (every 15 minutes) for better reliability

## References
- [GitHub Actions - Schedule event documentation](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [GitHub Actions - Workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions - Usage limits](https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration)
