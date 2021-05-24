const core = require('@actions/core');
const github = require('@actions/github');

async function run () {
  // exit early
  if (!['pull_request_target', 'pull_request'].includes(github.context.eventName)) {
    core.setFailed('action triggered outside of a pull_request')
    process.exit(1)
  }
  
  try {
    const { repo, payload: { number } } = github.context;
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);

    const commits = await octokit.rest.pulls.listCommits({
      ...repo,
      pull_number: number,
    });
    
    console.log(...commits.data)
    core.info(`Yah`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
