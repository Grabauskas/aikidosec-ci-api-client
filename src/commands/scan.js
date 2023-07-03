import check from 'check-more-types';
import { Argument, InvalidArgumentError, Option } from 'commander';
import { pollScanStatus, startScan } from '../aikidoApi.js';
import { getApiKey } from '../configuration.js';
import {
  outputError,
  outputHttpError,
  outputLog,
  startSpinner,
} from '../output.js';
import chalk from 'chalk';

async function cli(
  repoId,
  baseCommitId,
  headCommitId,
  branchName,
  options,
  command
) {
  const apiKey = getApiKey();

  if (!apiKey) {
    outputError('Please set an api key using: aikido-cli apikey <key>');
  }

  // Process command optiosn and group them into apiOptions hash
  const { apiOptions, cliOptions } = parseCliOptions(options);

  let loader;

  // Setup different scan() event handlers
  const onStart = startResult => {
    loader = startSpinner('Starting scan');
  };

  const onStartComplete = startResult => {
    loader?.succeed('Scan started');
  };

  const onScanStart = startResult => {
    loader = startSpinner('Waiting for scan to complete');
  };

  const onScanComplete = pollResult => {
    if (pollResult.gate_passed === true) {
      loader?.succeed('Scan completed, no new issues found');
    } else {
      loader?.fail('Scan completed with issues');

      if (pollResult.open_issues_found) {
        outputLog(
          chalk.gray(
            chalk.bold('Open issues found: ') + pollResult.open_issues_found
          )
        );
      }
      if (pollResult.issue_links) {
        outputLog(
          chalk.gray(
            pollResult.issue_links.map(issueLink => '- ' + issueLink).join('\n')
          )
        );
      }
      if (pollResult.diff_url) {
        outputLog(chalk.gray(`* Diff url: ${pollResult.diff_url}`));
      }

      process.exit(10);
    }
  };

  const onFail = error => {
    loader?.fail();

    if (error.response?.status && error.response?.status === 404) {
      outputError(
        'Please verify your repoId, baseCommitId, headCommitId and branchName'
      );
    } else {
      outputHttpError(error);
    }

    process.exit(1);
  };

  await scan({
    repoId,
    baseCommitId,
    headCommitId,
    branchName,
    apiOptions: apiOptions,
    pollInterval: cliOptions.pollInterval,
    onStart,
    onStartComplete,
    onStartFail: onFail,
    onScanStart,
    onScanComplete,
    onScanFail: onFail,
  });
}

export const scan = async ({
  repoId,
  baseCommitId,
  headCommitId,
  branchName,
  options = {},
  pollInterval = 5,
  onStart = startResult => null,
  onStartComplete = startResult => null,
  onStartFail = startResult => null,
  onScanStart = startResult => null,
  onScanComplete = pollResult => null,
  onScanFail = error => null,
}) => {
  onStart();
  let result = null;

  // Initialize a scan and call onStartComplete, onStartFail
  // handlers where needed
  try {
    result = await startScan({
      repo_id: repoId,
      base_commit_id: baseCommitId,
      head_commit_id: headCommitId,
      branch_name: branchName,
      ...options,
    });

    if (result.scan_id) {
      onStartComplete(result);
    } else {
      onStartFail(result);
      return;
    }
  } catch (error) {
    onStartFail(error);
    return;
  }

  onScanStart(result);
  let pollResult;

  // Poll status with a setTimeout
  const pollStatus = async () => {
    try {
      pollResult = await pollScanStatus(result.scan_id);

      // If "all_scans_completed" returns true, call the onScanComplete
      // handler, if not, re poll with `pollInterval`
      // Note that onScanComplete can return a successfull or
      // unsuccessfull scan result
      if (pollResult.all_scans_completed === false) {
        setTimeout(pollStatus, pollInterval * 1000);
      } else {
        onScanComplete(pollResult);
      }
    } catch (error) {
      onScanFail(error);
    }
  };

  // Start polling
  pollStatus();
};

const parseCliOptions = userCliOptions => {
  const apiOptions = {},
    cliOptions = { pollInterval: 5 };

  if (userCliOptions.pullRequestTitle) {
    apiOptions.pull_request_metadata = {
      ...(apiOptions.pull_request_metadata ?? {}),
      title: userCliOptions.pullRequestTitle,
    };
  }
  if (userCliOptions.pullRequestUrl) {
    apiOptions.pull_request_metadata = {
      ...(apiOptions.pull_request_metadata ?? {}),
      url: userCliOptions.pullRequestUrl,
    };
  }
  if (userCliOptions.selfManagedScanners) {
    apiOptions.self_managed_scanners = userCliOptions.selfManagedScanners;
  }
  if (userCliOptions.failOnDependencyScan != undefined) {
    apiOptions.fail_on_dependency_scan = userCliOptions.failOnDependencyScan;
  }
  if (userCliOptions.failOnSastScan != undefined) {
    apiOptions.fail_on_sast_scan = userCliOptions.failOnSastScan;
  }
  if (userCliOptions.failOnIacScan != undefined) {
    apiOptions.fail_on_iac_scan = userCliOptions.failOnIacScan;
  }
  if (userCliOptions.minimumSeverityLevel) {
    apiOptions.minimum_severity_level = userCliOptions.minimumSeverityLevel;
  }
  if (
    userCliOptions.pollInterval &&
    (isNaN(userCliOptions.pollInterval) || userCliOptions.pollInterval <= 0)
  ) {
    outputError('Please provide a valid poll interval');
  } else if (userCliOptions.pollInterval) {
    cliOptions.pollInterval = userCliOptions.pollInterval;
  }

  return { apiOptions, cliOptions };
};

const validateCommitId = (value, prev) => {
  if (check.commitId(value) === false) {
    throw new InvalidArgumentError('Please provide a valid commit ID');
  }

  return value;
};

export const cliSetup = program =>
  program
    .command('scan')
    .addArgument(
      new Argument(
        '<repository_id>',
        'The internal GitHub/Gitlab/Bitbucket/.. repository id you want to scan.'
      ).argRequired()
    )
    .addArgument(
      new Argument(
        '<base_commit_id>',
        'The base commit of the code you want to scan (e.g. the commit where you branched from for your PR or the initial commit of your repo)'
      )
        .argRequired()
        .argParser(validateCommitId)
    )
    .addArgument(
      new Argument(
        '<head_commit_id>',
        'The latest commit you want to include in your scan (e.g. the latest commit id of your pull request)'
      )
        .argRequired()
        .argParser(validateCommitId)
    )
    .addArgument(
      new Argument('<branch_name>', 'The branch name')
        .argOptional()
        .default('main')
    )
    .option('--pull-request-title <title>', 'Your pull request title')
    .option('--pull-request-url <url>', 'Your pull request URL')
    .addOption(
      new Option(
        '--self-managed-scanners <scanners...>',
        'Set the minimum severity level. Accepted options are: LOW, MEDIUM, HIGH and CRITICAL.'
      ).choices(['checkov', 'json-sbomb'])
    )
    .option(
      '--expected-amount-json-sbombs <amount>',
      'The expected amount of json sbombs'
    )
    .addOption(
      new Option(
        '--no-fail-on-dependency-scan',
        "Don't fail when scanning depedencies..."
      )
    )
    .option(
      '--fail-on-sast-scan',
      'Let Aikido fail when new static code analysis issues have been detected...'
    )
    .option(
      '--fail-on-iac-scan',
      'Let Aikido fail when new infrastructure as code issues have been detected...'
    )
    .addOption(
      new Option(
        '--minimum-severity-level <level>',
        'Set the minimum severity level. Accepted options are: LOW, MEDIUM, HIGH and CRITICAL.'
      ).choices(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    )
    .addOption(
      new Option(
        '--poll-interval [interval]',
        'The poll interval when checking for an updated scan result'
      )
        .preset(5)
        .argParser(parseFloat)
    )
    .description('Run a scan of an Aikido repo.')
    .action(cli);

export default { cli, cliSetup, scan };